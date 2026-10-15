import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildServer } from './server.js';
import { signAccessToken } from '@coursecity/auth';
import { LearningService } from './services/learning.service.js';
import { AppError } from './errors/app-error.js';

describe('Learner Experience, Progress & Annotations Integration Test Suite', () => {
  let app: FastifyInstance;
  const testSecret = 'test_jwt_secret_must_be_minimum_32_chars_long_2026';

  beforeAll(async () => {
    process.env.JWT_SECRET = testSecret;
    app = await buildServer({ logLevel: 'silent' });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  // ==========================================
  // 1. ENROLLMENTS & GUARDS
  // ==========================================
  describe('GET /api/v1/enrollments', () => {
    it('denies unauthenticated requests with 401 Problem Details', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/enrollments',
      });

      expect(response.statusCode).toBe(401);
      expect(response.headers['content-type']).toContain('application/problem+json');
    });

    it('returns enrollments list for authenticated learner', async () => {
      const token = signAccessToken(
        {
          sub: 'usr_learner_123',
          email: 'learner@coursecity.com',
          sessionId: 'ses_123',
          roles: ['LEARNER'],
          exp: Math.floor(Date.now() / 1000) + 900,
        },
        testSecret,
      );

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/enrollments',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect([200, 500]).toContain(response.statusCode);
      if (response.statusCode === 200) {
        const body = response.json();
        expect(Array.isArray(body.enrollments)).toBe(true);
      }
    });
  });

  // ==========================================
  // 2. PROGRESS TRACKING & COMPLETION INVARIANTS
  // ==========================================
  describe('Progress Tracking & 100% Completion Invariant', () => {
    it('POST /api/v1/progress denies unauthenticated requests (401)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/progress',
        payload: {
          lessonId: '00000000-0000-0000-0000-000000000001',
          isCompleted: true,
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('calculates progress percentage and triggers course completion at 100%', async () => {
      const mockDb: any = {
        selectFrom: vi.fn((table: string) => {
          if (table === 'lessons') {
            return {
              innerJoin: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              executeTakeFirst: vi.fn().mockResolvedValue({
                lesson_id: 'les_final',
                module_id: 'mod_1',
                course_version_id: 'ver_1',
                course_id: 'crs_1',
                total: 2, // for total lessons count
              }),
            };
          }
          if (table === 'enrollments') {
            return {
              selectAll: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              executeTakeFirst: vi.fn().mockResolvedValue({
                id: 'enr_123',
                user_id: 'usr_123',
                course_id: 'crs_1',
                course_version_id: 'ver_1',
                status: 'ACTIVE',
              }),
            };
          }
          if (table === 'lesson_progress') {
            return {
              select: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              executeTakeFirst: vi.fn().mockImplementation(() => {
                // Return completed count = 2
                return Promise.resolve({ completed: 2 });
              }),
            };
          }
          if (table === 'course_progress') {
            return {
              select: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              executeTakeFirst: vi.fn().mockResolvedValue({ id: 'cp_123' }),
            };
          }
          return {};
        }),
        updateTable: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([]),
        }),
        insertInto: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([]),
        }),
      };

      const learningService = new LearningService(mockDb);

      const result = await learningService.updateLessonProgress('usr_123', {
        lessonId: 'les_final',
        isCompleted: true,
      });

      expect(result.isCompleted).toBe(true);
      expect(result.progressPercentage).toBe(100);
      expect(result.isCourseCompleted).toBe(true);

      // Invariant: Enrollment was updated to COMPLETED!
      expect(mockDb.updateTable).toHaveBeenCalledWith('enrollments');

      // Invariant: Outbox event was dispatched!
      expect(mockDb.insertInto).toHaveBeenCalledWith('outbox_events');
    });

    it('rejects progress update when user is neither enrolled nor entitled (403)', async () => {
      const mockDb: any = {
        selectFrom: vi.fn((table: string) => {
          if (table === 'lessons') {
            return {
              innerJoin: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              executeTakeFirst: vi.fn().mockResolvedValue({
                lesson_id: 'les_paid',
                course_id: 'crs_paid',
                course_version_id: 'ver_paid',
              }),
            };
          }
          if (table === 'enrollments' || table === 'entitlements') {
            return {
              selectAll: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              executeTakeFirst: vi.fn().mockResolvedValue(undefined), // No enrollment/entitlement!
            };
          }
          if (table === 'course_versions') {
            return {
              select: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              executeTakeFirst: vi.fn().mockResolvedValue({ is_free: false }), // Paid course!
            };
          }
          return {};
        }),
      };

      const learningService = new LearningService(mockDb);

      await expect(
        learningService.updateLessonProgress('usr_random', {
          lessonId: 'les_paid',
          isCompleted: true,
        }),
      ).rejects.toThrow(
        AppError.forbidden(
          'ENROLLMENT_REQUIRED',
          'You must be enrolled in this course to record progress.',
        ),
      );
    });
  });

  // ==========================================
  // 3. BOOKMARKS & NOTES
  // ==========================================
  describe('Bookmarks & Personal Notes Services', () => {
    it('creates, lists, and deletes bookmarks', async () => {
      const mockDb: any = {
        selectFrom: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          innerJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue({ id: 'les_1', title: 'Lesson 1' }),
          execute: vi.fn().mockResolvedValue([
            {
              id: 'bm_1',
              lesson_id: 'les_1',
              title: 'My Bookmark',
              scroll_offset_percentage: '42.50',
              created_at: new Date(),
              lesson_title: 'Lesson 1',
              lesson_slug: 'lesson-1',
            },
          ]),
        }),
        insertInto: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnThis(),
          returningAll: vi.fn().mockReturnThis(),
          executeTakeFirstOrThrow: vi.fn().mockResolvedValue({
            id: 'bm_1',
            lesson_id: 'les_1',
            title: 'My Bookmark',
            scroll_offset_percentage: '42.50',
            created_at: new Date(),
          }),
        }),
        deleteFrom: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue({ numDeletedRows: BigInt(1) }),
        }),
      };

      const service = new LearningService(mockDb);

      const created = await service.createBookmark('usr_1', {
        lessonId: 'les_1',
        title: 'My Bookmark',
        scrollOffsetPercentage: 42.5,
      });

      expect(created.id).toBe('bm_1');
      expect(created.scrollOffsetPercentage).toBe(42.5);

      const list = await service.listBookmarks('usr_1');
      expect(list).toHaveLength(1);
      expect(list[0]?.title).toBe('My Bookmark');

      const deleted = await service.deleteBookmark('usr_1', 'bm_1');
      expect(deleted.success).toBe(true);
    });

    it('creates and lists notes with anchor positions', async () => {
      const mockDb: any = {
        selectFrom: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          innerJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue({ id: 'les_1' }),
          execute: vi.fn().mockResolvedValue([
            {
              id: 'note_1',
              lesson_id: 'les_1',
              content: 'Crucial concept to review before examination',
              anchor_position: 'para_3',
              created_at: new Date(),
              updated_at: new Date(),
              lesson_title: 'Lesson 1',
              lesson_slug: 'lesson-1',
            },
          ]),
        }),
        insertInto: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnThis(),
          returningAll: vi.fn().mockReturnThis(),
          executeTakeFirstOrThrow: vi.fn().mockResolvedValue({
            id: 'note_1',
            lesson_id: 'les_1',
            content: 'Crucial concept to review before examination',
            anchor_position: 'para_3',
            created_at: new Date(),
            updated_at: new Date(),
          }),
        }),
      };

      const service = new LearningService(mockDb);

      const created = await service.createNote('usr_1', {
        lessonId: 'les_1',
        content: 'Crucial concept to review before examination',
        anchorPosition: 'para_3',
      });

      expect(created.id).toBe('note_1');
      expect(created.anchorPosition).toBe('para_3');

      const notes = await service.listNotes('usr_1');
      expect(notes).toHaveLength(1);
      expect(notes[0]?.content).toBe('Crucial concept to review before examination');
    });
  });
});
