import { sql } from 'kysely';
import type { Kysely } from 'kysely';
import type { Database } from '@coursecity/database';
import type { EnrollmentDTO, EnrollmentStatus } from '@coursecity/contracts';
import type {
  UpdateProgressInput,
  CreateBookmarkInput,
  CreateNoteInput,
} from '@coursecity/validation';
import { AppError } from '../errors/app-error.js';

export class LearningService {
  constructor(private readonly db: Kysely<Database>) {}

  async getEnrollments(userId: string): Promise<EnrollmentDTO[]> {
    const rows = await this.db
      .selectFrom('enrollments')
      .innerJoin('courses', 'courses.id', 'enrollments.course_id')
      .innerJoin('course_versions', 'course_versions.id', 'enrollments.course_version_id')
      .leftJoin('course_progress', 'course_progress.enrollment_id', 'enrollments.id')
      .select([
        'enrollments.id',
        'enrollments.course_id',
        'enrollments.status',
        'enrollments.completed_at',
        'enrollments.created_at',
        'courses.slug as course_slug',
        'course_versions.title as course_title',
        'course_progress.percentage as progress_percentage',
      ])
      .where('enrollments.user_id', '=', userId)
      .orderBy('enrollments.created_at', 'desc')
      .execute();

    return rows.map((r) => ({
      id: r.id,
      courseId: r.course_id,
      courseTitle: r.course_title,
      courseSlug: r.course_slug,
      status: r.status as EnrollmentStatus,
      completedAt: r.completed_at ? r.completed_at.toISOString() : undefined,
      progressPercentage: r.progress_percentage ? Number(r.progress_percentage) : 0,
      enrolledAt: r.created_at.toISOString(),
    }));
  }

  async updateLessonProgress(userId: string, input: UpdateProgressInput) {
    // 1. Resolve lesson, module, version, and course
    const lessonInfo = await this.db
      .selectFrom('lessons')
      .innerJoin('course_modules', 'course_modules.id', 'lessons.module_id')
      .innerJoin('course_versions', 'course_versions.id', 'course_modules.course_version_id')
      .select([
        'lessons.id as lesson_id',
        'course_modules.id as module_id',
        'course_modules.course_version_id',
        'course_versions.course_id',
      ])
      .where('lessons.id', '=', input.lessonId)
      .executeTakeFirst();

    if (!lessonInfo) {
      throw AppError.notFound('LESSON_NOT_FOUND', 'Lesson does not exist.');
    }

    // 2. Fetch or initialize enrollment
    let enrollment = await this.db
      .selectFrom('enrollments')
      .selectAll()
      .where('user_id', '=', userId)
      .where('course_id', '=', lessonInfo.course_id)
      .executeTakeFirst();

    if (!enrollment) {
      // Check if user has entitlement or course is free
      const entitlement = await this.db
        .selectFrom('entitlements')
        .select('id')
        .where('user_id', '=', userId)
        .where('course_id', '=', lessonInfo.course_id)
        .where('status', '=', 'ACTIVE')
        .executeTakeFirst();

      const version = await this.db
        .selectFrom('course_versions')
        .select('is_free')
        .where('id', '=', lessonInfo.course_version_id)
        .executeTakeFirst();

      if (entitlement || version?.is_free) {
        enrollment = await this.db
          .insertInto('enrollments')
          .values({
            user_id: userId,
            course_id: lessonInfo.course_id,
            course_version_id: lessonInfo.course_version_id,
            status: 'ACTIVE',
          })
          .returningAll()
          .executeTakeFirstOrThrow();
      } else {
        throw AppError.forbidden(
          'ENROLLMENT_REQUIRED',
          'You must be enrolled in this course to record progress.',
        );
      }
    }

    // 3. Upsert lesson progress
    const existingProgress = await this.db
      .selectFrom('lesson_progress')
      .select(['id', 'progress_version', 'is_completed'])
      .where('enrollment_id', '=', enrollment.id)
      .where('lesson_id', '=', input.lessonId)
      .executeTakeFirst();

    const now = new Date();

    if (existingProgress) {
      await this.db
        .updateTable('lesson_progress')
        .set({
          is_completed: input.isCompleted,
          completed_at: input.isCompleted ? now : null,
          progress_version: existingProgress.progress_version + 1,
        })
        .where('id', '=', existingProgress.id)
        .execute();
    } else {
      await this.db
        .insertInto('lesson_progress')
        .values({
          enrollment_id: enrollment.id,
          lesson_id: input.lessonId,
          is_completed: input.isCompleted,
          first_read_at: now,
          completed_at: input.isCompleted ? now : null,
          progress_version: 1,
        })
        .execute();
    }

    // 4. Recalculate Course Progress Percentage
    const totalLessonsResult = await this.db
      .selectFrom('lessons')
      .innerJoin('course_modules', 'course_modules.id', 'lessons.module_id')
      .select(sql<number>`count(lessons.id)`.as('total'))
      .where('course_modules.course_version_id', '=', enrollment.course_version_id)
      .executeTakeFirst();

    const completedLessonsResult = await this.db
      .selectFrom('lesson_progress')
      .select(sql<number>`count(id)`.as('completed'))
      .where('enrollment_id', '=', enrollment.id)
      .where('is_completed', '=', true)
      .executeTakeFirst();

    const total = Number(totalLessonsResult?.total || 0);
    const completed = Number(completedLessonsResult?.completed || 0);
    const percentage = total > 0 ? Math.min(100, Math.round((completed / total) * 10000) / 100) : 0;

    // Upsert course_progress aggregate
    const existingCourseProgress = await this.db
      .selectFrom('course_progress')
      .select('id')
      .where('enrollment_id', '=', enrollment.id)
      .executeTakeFirst();

    if (existingCourseProgress) {
      await this.db
        .updateTable('course_progress')
        .set({
          percentage,
          last_lesson_id: input.lessonId,
          updated_at: now,
        })
        .where('id', '=', existingCourseProgress.id)
        .execute();
    } else {
      await this.db
        .insertInto('course_progress')
        .values({
          enrollment_id: enrollment.id,
          percentage,
          last_lesson_id: input.lessonId,
        })
        .execute();
    }

    // 5. Course Completion Trigger
    if (percentage >= 100 && enrollment.status === 'ACTIVE') {
      await this.db
        .updateTable('enrollments')
        .set({
          status: 'COMPLETED',
          completed_at: now,
        })
        .where('id', '=', enrollment.id)
        .execute();

      await this.db
        .insertInto('outbox_events')
        .values({
          event_name: 'LEARNING_COURSE_COMPLETED',
          aggregate_type: 'ENROLLMENT',
          aggregate_id: enrollment.id,
          payload: JSON.stringify({
            userId,
            courseId: lessonInfo.course_id,
            enrollmentId: enrollment.id,
            completedAt: now.toISOString(),
          }),
          status: 'PENDING',
        })
        .execute();
    } else if (percentage < 100 && enrollment.status === 'COMPLETED') {
      await this.db
        .updateTable('enrollments')
        .set({
          status: 'ACTIVE',
          completed_at: null,
        })
        .where('id', '=', enrollment.id)
        .execute();
    }

    // 6. Record activity audit log
    await this.db
      .insertInto('learning_activity')
      .values({
        user_id: userId,
        course_id: lessonInfo.course_id,
        action_type: input.isCompleted ? 'LESSON_COMPLETED' : 'LESSON_UNCOMPLETED',
        metadata: JSON.stringify({ lessonId: input.lessonId, percentage }),
      })
      .execute();

    return {
      lessonId: input.lessonId,
      isCompleted: input.isCompleted,
      progressPercentage: percentage,
      isCourseCompleted: percentage >= 100,
    };
  }

  // ==========================================
  // BOOKMARK MANAGEMENT
  // ==========================================
  async listBookmarks(userId: string, lessonId?: string) {
    let query = this.db
      .selectFrom('bookmarks')
      .innerJoin('lessons', 'lessons.id', 'bookmarks.lesson_id')
      .select([
        'bookmarks.id',
        'bookmarks.lesson_id',
        'bookmarks.title',
        'bookmarks.scroll_offset_percentage',
        'bookmarks.created_at',
        'lessons.title as lesson_title',
        'lessons.slug as lesson_slug',
      ])
      .where('bookmarks.user_id', '=', userId);

    if (lessonId) {
      query = query.where('bookmarks.lesson_id', '=', lessonId);
    }

    const rows = await query.orderBy('bookmarks.created_at', 'desc').execute();

    return rows.map((r) => ({
      id: r.id,
      lessonId: r.lesson_id,
      lessonTitle: r.lesson_title,
      lessonSlug: r.lesson_slug,
      title: r.title || r.lesson_title,
      scrollOffsetPercentage: Number(r.scroll_offset_percentage),
      createdAt: r.created_at.toISOString(),
    }));
  }

  async createBookmark(userId: string, input: CreateBookmarkInput) {
    const lesson = await this.db
      .selectFrom('lessons')
      .select(['id', 'title'])
      .where('id', '=', input.lessonId)
      .executeTakeFirst();

    if (!lesson) {
      throw AppError.notFound('LESSON_NOT_FOUND', 'Lesson does not exist.');
    }

    const bookmark = await this.db
      .insertInto('bookmarks')
      .values({
        user_id: userId,
        lesson_id: input.lessonId,
        title: input.title || lesson.title,
        scroll_offset_percentage: input.scrollOffsetPercentage || 0,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return {
      id: bookmark.id,
      lessonId: bookmark.lesson_id,
      title: bookmark.title,
      scrollOffsetPercentage: Number(bookmark.scroll_offset_percentage),
      createdAt: bookmark.created_at.toISOString(),
    };
  }

  async deleteBookmark(userId: string, bookmarkId: string) {
    const result = await this.db
      .deleteFrom('bookmarks')
      .where('id', '=', bookmarkId)
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (Number(result.numDeletedRows) === 0) {
      throw AppError.notFound('BOOKMARK_NOT_FOUND', 'Bookmark not found.');
    }

    return { success: true };
  }

  // ==========================================
  // LEARNER NOTES MANAGEMENT
  // ==========================================
  async listNotes(userId: string, lessonId?: string) {
    let query = this.db
      .selectFrom('learner_notes')
      .innerJoin('lessons', 'lessons.id', 'learner_notes.lesson_id')
      .select([
        'learner_notes.id',
        'learner_notes.lesson_id',
        'learner_notes.content',
        'learner_notes.anchor_position',
        'learner_notes.created_at',
        'learner_notes.updated_at',
        'lessons.title as lesson_title',
        'lessons.slug as lesson_slug',
      ])
      .where('learner_notes.user_id', '=', userId);

    if (lessonId) {
      query = query.where('learner_notes.lesson_id', '=', lessonId);
    }

    const rows = await query.orderBy('learner_notes.updated_at', 'desc').execute();

    return rows.map((r) => ({
      id: r.id,
      lessonId: r.lesson_id,
      lessonTitle: r.lesson_title,
      lessonSlug: r.lesson_slug,
      content: r.content,
      anchorPosition: r.anchor_position || undefined,
      createdAt: r.created_at.toISOString(),
      updatedAt: r.updated_at.toISOString(),
    }));
  }

  async createNote(userId: string, input: CreateNoteInput) {
    const lesson = await this.db
      .selectFrom('lessons')
      .select('id')
      .where('id', '=', input.lessonId)
      .executeTakeFirst();

    if (!lesson) {
      throw AppError.notFound('LESSON_NOT_FOUND', 'Lesson does not exist.');
    }

    const note = await this.db
      .insertInto('learner_notes')
      .values({
        user_id: userId,
        lesson_id: input.lessonId,
        content: input.content.trim(),
        anchor_position: input.anchorPosition || null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return {
      id: note.id,
      lessonId: note.lesson_id,
      content: note.content,
      anchorPosition: note.anchor_position || undefined,
      createdAt: note.created_at.toISOString(),
      updatedAt: note.updated_at.toISOString(),
    };
  }

  async deleteNote(userId: string, noteId: string) {
    const result = await this.db
      .deleteFrom('learner_notes')
      .where('id', '=', noteId)
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (Number(result.numDeletedRows) === 0) {
      throw AppError.notFound('NOTE_NOT_FOUND', 'Note not found.');
    }

    return { success: true };
  }
}
