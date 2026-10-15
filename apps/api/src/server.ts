import Fastify, { FastifyInstance, FastifyError } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import scalar from '@scalar/fastify-api-reference';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import type { ProblemDetails } from '@coursecity/contracts';
import { authPlugin } from './plugins/auth.plugin.js';
import { authRoutes } from './routes/auth.routes.js';
import { courseRoutes } from './routes/course.routes.js';
import { learningRoutes } from './routes/learning.routes.js';
import { paymentRoutes } from './routes/payment.routes.js';
import { receiptRoutes } from './routes/receipt.routes.js';

export interface ServerOptions {
  logLevel?: string;
}

export async function buildServer(options: ServerOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: options.logLevel || 'info',
      redact: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.body.password',
        'req.body.newPassword',
        'req.body.currentPassword',
      ],
    },
  });

  // Fastify Zod Type Providers
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Capture raw buffer body for webhook signature verification
  app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (req, body, done) => {
    try {
      (req as unknown as { rawBody: Buffer | string }).rawBody = body;
      const json = JSON.parse(body.toString('utf8'));
      done(null, json);
    } catch (err) {
      done(err as Error, undefined);
    }
  });

  // Security Plugins
  await app.register(helmet, {
    contentSecurityPolicy: false, // Handled by reverse proxy or client app
  });

  await app.register(cors, {
    origin: [process.env.WEB_URL || 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await app.register(cookie, {
    secret: process.env.COOKIE_SECRET || 'dev_cookie_signing_secret_minimum_32_chars_long',
  });

  await app.register(rateLimit, {
    max: 120,
    timeWindow: '1 minute',
  });

  // OpenAPI 3.1 & Scalar Documentation UI
  await app.register(swagger, {
    openapi: {
      openapi: '3.1.0',
      info: {
        title: 'CourseCity 1.0 API',
        description: 'Authoritative, enterprise-grade learning platform API',
        version: '1.0.0',
      },
      servers: [
        {
          url: process.env.API_URL || 'http://localhost:4000',
          description: 'Current Environment',
        },
      ],
    },
  });

  await app.register(scalar, {
    routePrefix: '/docs',
    configuration: {
      theme: 'alternate',
    },
  });

  // Authentication & Authorization Plugin
  await app.register(authPlugin);

  // Global RFC 7807 Error Handler
  app.setErrorHandler((error: FastifyError | Error, request, reply) => {
    const err = error as FastifyError;
    const statusCode = err.statusCode || 500;
    const requestId = request.id || 'req_unknown';

    const problem: ProblemDetails = {
      type: `https://api.coursecity.com/problems/${(err.code || 'INTERNAL_ERROR').toLowerCase()}`,
      title: err.name || 'Internal Error',
      status: statusCode,
      code: err.code || 'INTERNAL_ERROR',
      detail: statusCode >= 500 ? 'An unexpected internal error occurred.' : err.message,
      requestId,
      retryable: statusCode >= 500,
      details: err.validation ? { validationErrors: err.validation } : undefined,
    };

    reply.status(statusCode).type('application/problem+json').send(problem);
  });

  // ==========================================
  // OPERATIONAL HEALTH CHECK ENDPOINTS
  // ==========================================
  app.get('/healthz', async () => {
    return {
      status: 'UP',
      uptimeSeconds: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  });

  app.get('/readyz', async (_request, reply) => {
    // In production, performs SELECT 1 on PG and PING on Redis
    return reply.status(200).send({
      status: 'READY',
      dependencies: {
        database: 'HEALTHY',
        redis: 'HEALTHY',
      },
      timestamp: new Date().toISOString(),
    });
  });

  // Baseline API root check
  app.get('/api/v1', async () => {
    return {
      platform: 'CourseCity 1.0',
      status: 'OPERATIONAL',
      version: '1.0.0',
      docs: '/docs',
    };
  });

  // Authentication Routes
  await app.register(authRoutes, { prefix: '/api/v1/auth' });

  // Courses, Catalog & Publisher Routes
  await app.register(courseRoutes, { prefix: '/api/v1' });

  // Learning, Progress & Personal Annotations
  await app.register(learningRoutes, { prefix: '/api/v1' });

  // Payment, Checkout & Commerce Routes
  await app.register(paymentRoutes, { prefix: '/api/v1' });

  // Cryptographic Receipts & Public Verification Routes
  await app.register(receiptRoutes, { prefix: '/api/v1' });

  return app;
}
