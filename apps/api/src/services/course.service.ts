import { sql } from 'kysely';
import type { Kysely } from 'kysely';
import type { Database } from '@coursecity/database';
import type {
  CourseDetailDTO,
  CourseLevel,
  BlockType,
} from '@coursecity/contracts';
import type { CatalogFilterQuery } from '@coursecity/validation';
import { AppError } from '../errors/app-error.js';

export interface CreateCourseInput {
  publisherId: string;
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  coverImageUrl?: string;
  level: CourseLevel;
  estimatedDurationMinutes: number;
  priceMinor: number;
  currency?: string;
  isFree?: boolean;
}

export class CourseService {
  constructor(private readonly db: Kysely<Database>) {}

  async getCatalog(query: CatalogFilterQuery) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const offset = (page - 1) * limit;

    let dbQuery = this.db
      .selectFrom('courses')
      .innerJoin('course_versions', 'course_versions.id', 'courses.active_version_id')
      .innerJoin('publishers', 'publishers.id', 'courses.publisher_id')
      .where('courses.status', '=', 'PUBLISHED')
      .where('course_versions.status', '=', 'PUBLISHED');

    if (query.search) {
      const term = `%${query.search.trim().toLowerCase()}%`;
      dbQuery = dbQuery.where(
        sql<boolean>`(LOWER(course_versions.title) LIKE ${term} OR LOWER(course_versions.description) LIKE ${term})`,
      );
    }

    if (query.level) {
      dbQuery = dbQuery.where('course_versions.level', '=', query.level);
    }

    if (query.isFree !== undefined) {
      dbQuery = dbQuery.where('course_versions.is_free', '=', query.isFree);
    }

    // Determine sorting
    if (query.sort === 'price_asc') {
      dbQuery = dbQuery.orderBy('course_versions.price_minor', 'asc');
    } else if (query.sort === 'price_desc') {
      dbQuery = dbQuery.orderBy('course_versions.price_minor', 'desc');
    } else {
      dbQuery = dbQuery.orderBy('course_versions.published_at', 'desc');
    }

    const rows = await dbQuery
      .select([
        'courses.id as course_id',
        'courses.slug as course_slug',
        'course_versions.title as version_title',
        'course_versions.subtitle as version_subtitle',
        'course_versions.description as version_description',
        'course_versions.cover_image_url as version_cover_image_url',
        'course_versions.level as version_level',
        'course_versions.estimated_duration_minutes as version_duration',
        'course_versions.price_minor as version_price_minor',
        'course_versions.currency as version_currency',
        'course_versions.is_free as version_is_free',
        'publishers.id as publisher_id',
        'publishers.name as publisher_name',
        'publishers.slug as publisher_slug',
        'publishers.type as publisher_type',
        'publishers.verified as publisher_verified',
        'publishers.avatar_url as publisher_avatar_url',
      ])
      .limit(limit)
      .offset(offset)
      .execute();

    const courses: CourseDetailDTO[] = rows.map((r) => ({
      id: r.course_id,
      slug: r.course_slug,
      title: r.version_title,
      subtitle: r.version_subtitle || undefined,
      description: r.version_description,
      coverImageUrl: r.version_cover_image_url || undefined,
      level: r.version_level as CourseLevel,
      estimatedDurationMinutes: r.version_duration,
      priceMinor: r.version_price_minor,
      currency: r.version_currency,
      isFree: r.version_is_free,
      publisher: {
        id: r.publisher_id,
        name: r.publisher_name,
        slug: r.publisher_slug,
        type: r.publisher_type,
        verified: r.publisher_verified,
        avatarUrl: r.publisher_avatar_url || undefined,
      },
      modules: [],
    }));

    return {
      courses,
      page,
      limit,
      total: courses.length,
    };
  }

  async getCourseBySlug(slug: string, userId?: string): Promise<CourseDetailDTO> {
    const course = await this.db
      .selectFrom('courses')
      .selectAll()
      .where('slug', '=', slug)
      .where('status', '=', 'PUBLISHED')
      .executeTakeFirst();

    if (!course || !course.active_version_id) {
      throw AppError.notFound('COURSE_NOT_FOUND', `Course '${slug}' is not published or does not exist.`);
    }

    const version = await this.db
      .selectFrom('course_versions')
      .selectAll()
      .where('id', '=', course.active_version_id)
      .executeTakeFirstOrThrow();

    const publisher = await this.db
      .selectFrom('publishers')
      .selectAll()
      .where('id', '=', course.publisher_id)
      .executeTakeFirstOrThrow();

    // Check enrollment if userId provided
    let isEnrolled = false;
    let completedLessonIds = new Set<string>();

    if (userId) {
      const enrollment = await this.db
        .selectFrom('enrollments')
        .select('id')
        .where('user_id', '=', userId)
        .where('course_id', '=', course.id)
        .where('status', '=', 'ACTIVE')
        .executeTakeFirst();

      if (enrollment) {
        isEnrolled = true;
        const progress = await this.db
          .selectFrom('lesson_progress')
          .select('lesson_id')
          .where('enrollment_id', '=', enrollment.id)
          .where('is_completed', '=', true)
          .execute();

        completedLessonIds = new Set(progress.map((p) => p.lesson_id));
      }
    }

    // Fetch modules
    const modules = await this.db
      .selectFrom('course_modules')
      .selectAll()
      .where('course_version_id', '=', version.id)
      .orderBy('sort_order', 'asc')
      .execute();

    const moduleDTOs = [];
    for (const m of modules) {
      const lessons = await this.db
        .selectFrom('lessons')
        .selectAll()
        .where('module_id', '=', m.id)
        .orderBy('sort_order', 'asc')
        .execute();

      moduleDTOs.push({
        id: m.id,
        title: m.title,
        sortOrder: m.sort_order,
        lessons: lessons.map((l) => ({
          id: l.id,
          title: l.title,
          slug: l.slug,
          sortOrder: l.sort_order,
          estimatedReadTimeMinutes: l.estimated_read_time_minutes,
          isPreviewable: l.is_previewable,
          isCompleted: completedLessonIds.has(l.id),
        })),
      });
    }

    return {
      id: course.id,
      slug: course.slug,
      title: version.title,
      subtitle: version.subtitle || undefined,
      description: version.description,
      coverImageUrl: version.cover_image_url || undefined,
      level: version.level as CourseLevel,
      estimatedDurationMinutes: version.estimated_duration_minutes,
      priceMinor: version.price_minor,
      currency: version.currency,
      isFree: version.is_free,
      isEnrolled,
      publisher: {
        id: publisher.id,
        name: publisher.name,
        slug: publisher.slug,
        type: publisher.type,
        verified: publisher.verified,
        avatarUrl: publisher.avatar_url || undefined,
      },
      modules: moduleDTOs,
    };
  }

  async getLesson(courseSlug: string, lessonSlug: string, userId?: string) {
    const course = await this.db
      .selectFrom('courses')
      .selectAll()
      .where('slug', '=', courseSlug)
      .where('status', '=', 'PUBLISHED')
      .executeTakeFirst();

    if (!course || !course.active_version_id) {
      throw AppError.notFound('COURSE_NOT_FOUND', `Course '${courseSlug}' was not found.`);
    }

    const version = await this.db
      .selectFrom('course_versions')
      .selectAll()
      .where('id', '=', course.active_version_id)
      .executeTakeFirstOrThrow();

    // Find lesson within modules of this version
    const lesson = await this.db
      .selectFrom('lessons')
      .innerJoin('course_modules', 'course_modules.id', 'lessons.module_id')
      .select([
        'lessons.id',
        'lessons.title',
        'lessons.slug',
        'lessons.sort_order',
        'lessons.estimated_read_time_minutes',
        'lessons.is_previewable',
        'course_modules.id as module_id',
        'course_modules.title as module_title',
      ])
      .where('course_modules.course_version_id', '=', version.id)
      .where('lessons.slug', '=', lessonSlug)
      .executeTakeFirst();

    if (!lesson) {
      throw AppError.notFound('LESSON_NOT_FOUND', `Lesson '${lessonSlug}' was not found in this course.`);
    }

    // ACCESS GATING INVARIANT:
    // If not previewable, user MUST be authenticated and actively entitled/enrolled
    if (!lesson.is_previewable) {
      if (!userId) {
        throw AppError.unauthorized(
          'AUTHENTICATION_REQUIRED',
          'Sign in to access this lesson.',
        );
      }

      const entitlement = await this.db
        .selectFrom('entitlements')
        .select('id')
        .where('user_id', '=', userId)
        .where('course_id', '=', course.id)
        .where('status', '=', 'ACTIVE')
        .executeTakeFirst();

      const enrollment = await this.db
        .selectFrom('enrollments')
        .select('id')
        .where('user_id', '=', userId)
        .where('course_id', '=', course.id)
        .where('status', '=', 'ACTIVE')
        .executeTakeFirst();

      if (!entitlement && !enrollment) {
        throw AppError.forbidden(
          'ENROLLMENT_REQUIRED',
          'Access to this lesson requires enrolling in or purchasing the course.',
        );
      }
    }

    // Fetch lesson blocks
    const blocks = await this.db
      .selectFrom('lesson_blocks')
      .selectAll()
      .where('lesson_id', '=', lesson.id)
      .orderBy('sort_order', 'asc')
      .execute();

    const parsedBlocks = blocks.map((b) => {
      let content = {};
      try {
        content = JSON.parse(b.content_payload);
      } catch {
        content = { raw: b.content_payload };
      }
      return {
        id: b.id,
        blockType: b.block_type as BlockType,
        sortOrder: b.sort_order,
        content,
      };
    });

    return {
      course: {
        id: course.id,
        title: version.title,
        slug: course.slug,
      },
      module: {
        id: lesson.module_id,
        title: lesson.module_title,
      },
      lesson: {
        id: lesson.id,
        title: lesson.title,
        slug: lesson.slug,
        sortOrder: lesson.sort_order,
        estimatedReadTimeMinutes: lesson.estimated_read_time_minutes,
        isPreviewable: lesson.is_previewable,
      },
      blocks: parsedBlocks,
    };
  }

  async createCourse(input: CreateCourseInput) {
    const slug = input.slug.toLowerCase().trim();

    // Check unique course slug
    const existing = await this.db
      .selectFrom('courses')
      .select('id')
      .where('slug', '=', slug)
      .executeTakeFirst();

    if (existing) {
      throw AppError.conflict('SLUG_ALREADY_EXISTS', `Course slug '${slug}' is already taken.`);
    }

    // Insert course
    const course = await this.db
      .insertInto('courses')
      .values({
        publisher_id: input.publisherId,
        slug,
        status: 'DRAFT',
      })
      .returning(['id', 'slug'])
      .executeTakeFirstOrThrow();

    // Insert initial version (Draft v1)
    const version = await this.db
      .insertInto('course_versions')
      .values({
        course_id: course.id,
        version_number: 1,
        title: input.title.trim(),
        subtitle: input.subtitle?.trim() || null,
        description: input.description.trim(),
        cover_image_url: input.coverImageUrl || null,
        level: input.level,
        estimated_duration_minutes: input.estimatedDurationMinutes,
        price_minor: input.priceMinor,
        currency: input.currency || 'GHS',
        is_free: input.isFree ?? input.priceMinor === 0,
        status: 'DRAFT',
      })
      .returning(['id', 'version_number'])
      .executeTakeFirstOrThrow();

    return {
      courseId: course.id,
      versionId: version.id,
      slug: course.slug,
      versionNumber: version.version_number,
    };
  }

  async publishCourseVersion(courseId: string, versionId: string) {
    const version = await this.db
      .selectFrom('course_versions')
      .selectAll()
      .where('id', '=', versionId)
      .where('course_id', '=', courseId)
      .executeTakeFirst();

    if (!version) {
      throw AppError.notFound('VERSION_NOT_FOUND', 'Course version not found.');
    }

    // Transition version to PUBLISHED
    await this.db
      .updateTable('course_versions')
      .set({
        status: 'PUBLISHED',
        published_at: new Date(),
      })
      .where('id', '=', versionId)
      .execute();

    // Set course active version and mark course PUBLISHED
    await this.db
      .updateTable('courses')
      .set({
        status: 'PUBLISHED',
        active_version_id: versionId,
        updated_at: new Date(),
      })
      .where('id', '=', courseId)
      .execute();

    return {
      courseId,
      versionId,
      status: 'PUBLISHED',
    };
  }
}
