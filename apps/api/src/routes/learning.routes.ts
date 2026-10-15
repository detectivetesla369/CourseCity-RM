import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  updateProgressInputSchema,
  createBookmarkInputSchema,
  createNoteInputSchema,
} from '@coursecity/validation';
import { LearningService } from '../services/learning.service.js';
import { getDatabase } from '../db.js';

export const learningRoutes: FastifyPluginAsync = async (fastify) => {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const db = getDatabase();
  const learningService = new LearningService(db);

  // 1. GET LEARNER ENROLLMENTS
  server.get(
    '/enrollments',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['Learning & Progress'],
        summary: "Get currently authenticated learner's course enrollments and progress",
      },
    },
    async (request, reply) => {
      const enrollments = await learningService.getEnrollments(request.user!.id);
      return reply.status(200).send({ enrollments });
    },
  );

  // 2. UPDATE LESSON PROGRESS (IDEMPOTENT TOGGLE & PROGRESS PERCENTAGE RECALCULATION)
  server.post(
    '/progress',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['Learning & Progress'],
        summary: 'Record or toggle lesson completion, recalculating course progress',
        body: updateProgressInputSchema,
      },
    },
    async (request, reply) => {
      const result = await learningService.updateLessonProgress(request.user!.id, request.body);
      return reply.status(200).send(result);
    },
  );

  // 3. BOOKMARKS
  server.get(
    '/bookmarks',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['Learning & Progress'],
        summary: 'List personal bookmarks, optionally filtered by lessonId',
        querystring: z.object({
          lessonId: z.string().uuid().optional(),
        }),
      },
    },
    async (request, reply) => {
      const bookmarks = await learningService.listBookmarks(request.user!.id, request.query.lessonId);
      return reply.status(200).send({ bookmarks });
    },
  );

  server.post(
    '/bookmarks',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['Learning & Progress'],
        summary: 'Create a personal bookmark inside a lesson',
        body: createBookmarkInputSchema,
      },
    },
    async (request, reply) => {
      const bookmark = await learningService.createBookmark(request.user!.id, request.body);
      return reply.status(201).send({ bookmark });
    },
  );

  server.delete(
    '/bookmarks/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['Learning & Progress'],
        summary: 'Delete a personal bookmark',
        params: z.object({
          id: z.string().uuid(),
        }),
      },
    },
    async (request, reply) => {
      const result = await learningService.deleteBookmark(request.user!.id, request.params.id);
      return reply.status(200).send(result);
    },
  );

  // 4. LEARNER NOTES
  server.get(
    '/notes',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['Learning & Progress'],
        summary: 'List personal notes, optionally filtered by lessonId',
        querystring: z.object({
          lessonId: z.string().uuid().optional(),
        }),
      },
    },
    async (request, reply) => {
      const notes = await learningService.listNotes(request.user!.id, request.query.lessonId);
      return reply.status(200).send({ notes });
    },
  );

  server.post(
    '/notes',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['Learning & Progress'],
        summary: 'Create a personal note attached to a lesson',
        body: createNoteInputSchema,
      },
    },
    async (request, reply) => {
      const note = await learningService.createNote(request.user!.id, request.body);
      return reply.status(201).send({ note });
    },
  );

  server.delete(
    '/notes/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['Learning & Progress'],
        summary: 'Delete a personal note',
        params: z.object({
          id: z.string().uuid(),
        }),
      },
    },
    async (request, reply) => {
      const result = await learningService.deleteNote(request.user!.id, request.params.id);
      return reply.status(200).send(result);
    },
  );
};
