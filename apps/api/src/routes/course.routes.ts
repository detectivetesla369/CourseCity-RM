import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { catalogFilterQuerySchema } from '@coursecity/validation';
import { CourseService } from '../services/course.service.js';
import { getDatabase } from '../db.js';

export const courseRoutes: FastifyPluginAsync = async (fastify) => {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const db = getDatabase();
  const courseService = new CourseService(db);

  // 1. PUBLIC CATALOG DISCOVERY & SEARCH
  server.get(
    '/catalog',
    {
      schema: {
        tags: ['Courses & Catalog'],
        summary: 'Discover, search, and filter published courses',
        querystring: catalogFilterQuerySchema,
      },
    },
    async (request, reply) => {
      const result = await courseService.getCatalog(request.query);
      return reply.status(200).send(result);
    },
  );

  // 2. PUBLIC COURSE DETAIL & OUTLINE
  server.get(
    '/courses/:slug',
    {
      schema: {
        tags: ['Courses & Catalog'],
        summary: 'Get course detail, syllabus, and module outline by slug',
        params: z.object({
          slug: z.string().min(1),
        }),
      },
    },
    async (request, reply) => {
      const { slug } = request.params;

      // Extract user ID if token provided
      let userId: string | undefined;
      const authHeader = request.headers.authorization;
      if ((authHeader && authHeader.startsWith('Bearer ')) || request.cookies.cc_access_token) {
        try {
          await fastify.authenticate(request, reply);
          userId = request.user?.id;
        } catch {
          // Unauthenticated browsing is valid for catalog detail
        }
      }

      const course = await courseService.getCourseBySlug(slug, userId);
      return reply.status(200).send({ course });
    },
  );

  // 3. LESSON READER (WITH ACCESS/ENTITLEMENT GATING)
  server.get(
    '/courses/:slug/lessons/:lessonSlug',
    {
      schema: {
        tags: ['Courses & Catalog'],
        summary: 'Read lesson content and curriculum blocks (gated by preview or enrollment)',
        params: z.object({
          slug: z.string().min(1),
          lessonSlug: z.string().min(1),
        }),
      },
    },
    async (request, reply) => {
      const { slug, lessonSlug } = request.params;

      // Attempt authentication
      let userId: string | undefined;
      const authHeader = request.headers.authorization;
      if ((authHeader && authHeader.startsWith('Bearer ')) || request.cookies.cc_access_token) {
        try {
          await fastify.authenticate(request, reply);
          userId = request.user?.id;
        } catch {
          // User is unauthenticated; getLesson will check if lesson isPreviewable
        }
      }

      const content = await courseService.getLesson(slug, lessonSlug, userId);
      return reply.status(200).send(content);
    },
  );

  // 4. PUBLISHER: CREATE COURSE DRAFT
  server.post(
    '/publisher/courses',
    {
      preHandler: [fastify.requirePermission('courses:create')],
      schema: {
        tags: ['Publisher Management'],
        summary: 'Create a new course draft and initial version',
        body: z.object({
          publisherId: z.string().uuid(),
          slug: z.string().min(2).max(128).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
          title: z.string().min(3).max(255),
          subtitle: z.string().max(255).optional(),
          description: z.string().min(10),
          coverImageUrl: z.string().url().optional(),
          level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS']),
          estimatedDurationMinutes: z.number().int().min(1),
          priceMinor: z.number().int().min(0),
          currency: z.string().length(3).default('GHS'),
          isFree: z.boolean().optional(),
        }),
      },
    },
    async (request, reply) => {
      const result = await courseService.createCourse(request.body);
      return reply.status(201).send(result);
    },
  );

  // 5. PUBLISHER: PUBLISH COURSE VERSION
  server.post(
    '/publisher/courses/:courseId/publish',
    {
      preHandler: [fastify.requirePermission('courses:publish')],
      schema: {
        tags: ['Publisher Management'],
        summary: 'Publish a course version and make it visible in the catalog',
        params: z.object({
          courseId: z.string().uuid(),
        }),
        body: z.object({
          versionId: z.string().uuid(),
        }),
      },
    },
    async (request, reply) => {
      const { courseId } = request.params;
      const { versionId } = request.body;

      const result = await courseService.publishCourseVersion(courseId, versionId);
      return reply.status(200).send(result);
    },
  );
};
