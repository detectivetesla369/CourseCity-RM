import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  signupInputSchema,
  signinInputSchema,
  verifyEmailInputSchema,
  forgotPasswordInputSchema,
  resetPasswordInputSchema,
} from '@coursecity/validation';
import { AuthService } from '../services/auth.service.js';
import { getDatabase } from '../db.js';
import { AppError } from '../errors/app-error.js';

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const db = getDatabase();
  const authService = new AuthService(db);

  const isProduction = process.env.NODE_ENV === 'production';

  // 1. SIGNUP
  server.post(
    '/signup',
    {
      schema: {
        tags: ['Authentication'],
        summary: 'Create a new learner or instructor account',
        body: signupInputSchema,
      },
    },
    async (request, reply) => {
      const result = await authService.signup(request.body);
      return reply.status(201).send({
        message: 'Account successfully registered. Please verify your email address.',
        userId: result.userId,
        email: result.email,
        verificationToken: result.verificationToken,
      });
    },
  );

  // 2. SIGNIN
  server.post(
    '/signin',
    {
      schema: {
        tags: ['Authentication'],
        summary: 'Sign in to CourseCity using email and password',
        body: signinInputSchema,
      },
    },
    async (request, reply) => {
      const clientInfo = {
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      };

      const result = await authService.signin(request.body, clientInfo);

      // Set secure HTTP-only cookies
      reply.setCookie('cc_access_token', result.accessToken, {
        path: '/',
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: result.expiresInSeconds,
      });

      reply.setCookie('cc_refresh_token', result.refreshToken, {
        path: '/',
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });

      return reply.status(200).send({
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresInSeconds: result.expiresInSeconds,
      });
    },
  );

  // 3. REFRESH TOKEN (Rotation with Reuse Detection)
  server.post(
    '/refresh',
    {
      schema: {
        tags: ['Authentication'],
        summary: 'Rotate refresh token and issue a fresh access token',
        body: z
          .object({
            refreshToken: z.string().optional(),
          })
          .optional(),
      },
    },
    async (request, reply) => {
      const token =
        request.body?.refreshToken || (request.cookies ? request.cookies.cc_refresh_token : undefined);

      if (!token) {
        throw AppError.unauthorized('MISSING_REFRESH_TOKEN', 'Refresh token is required.');
      }

      const result = await authService.refresh(token);

      reply.setCookie('cc_access_token', result.accessToken, {
        path: '/',
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: result.expiresInSeconds,
      });

      reply.setCookie('cc_refresh_token', result.refreshToken, {
        path: '/',
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60,
      });

      return reply.status(200).send(result);
    },
  );

  // 4. SIGNOUT
  server.post(
    '/signout',
    {
      schema: {
        tags: ['Authentication'],
        summary: 'Terminate active session and clear authentication cookies',
      },
    },
    async (request, reply) => {
      let sessionId: string | undefined;

      // Extract session ID if authenticated
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          await fastify.authenticate(request, reply);
          sessionId = request.user?.sessionId;
        } catch {
          // Proceed with clearing cookies even if token already expired
        }
      }

      await authService.signout(sessionId);

      reply.clearCookie('cc_access_token', { path: '/' });
      reply.clearCookie('cc_refresh_token', { path: '/' });

      return reply.status(200).send({
        success: true,
        message: 'Signed out successfully.',
      });
    },
  );

  // 5. VERIFY EMAIL
  server.post(
    '/verify-email',
    {
      schema: {
        tags: ['Authentication'],
        summary: 'Verify email using single-use verification token',
        body: verifyEmailInputSchema,
      },
    },
    async (request, reply) => {
      const result = await authService.verifyEmail(request.body.token);
      return reply.status(200).send(result);
    },
  );

  // 6. FORGOT PASSWORD
  server.post(
    '/forgot-password',
    {
      schema: {
        tags: ['Authentication'],
        summary: 'Request password reset email link',
        body: forgotPasswordInputSchema,
      },
    },
    async (request, reply) => {
      const result = await authService.forgotPassword(request.body.email);
      return reply.status(200).send(result);
    },
  );

  // 7. RESET PASSWORD
  server.post(
    '/reset-password',
    {
      schema: {
        tags: ['Authentication'],
        summary: 'Reset password using valid reset token',
        body: resetPasswordInputSchema,
      },
    },
    async (request, reply) => {
      const result = await authService.resetPassword(
        request.body.token,
        request.body.newPassword,
      );

      reply.clearCookie('cc_access_token', { path: '/' });
      reply.clearCookie('cc_refresh_token', { path: '/' });

      return reply.status(200).send(result);
    },
  );

  // 8. GET CURRENT AUTHENTICATED USER (ME)
  server.get(
    '/me',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['Authentication'],
        summary: 'Get currently authenticated user identity and profile',
      },
    },
    async (request, reply) => {
      const result = await authService.getMe(request.user!.id);
      return reply.status(200).send({ user: result });
    },
  );

  // 9. LIST SESSIONS
  server.get(
    '/sessions',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['Authentication'],
        summary: 'List active sessions for current user',
      },
    },
    async (request, reply) => {
      const sessions = await authService.listSessions(
        request.user!.id,
        request.user!.sessionId,
      );
      return reply.status(200).send({ sessions });
    },
  );

  // 10. REVOKE SPECIFIC SESSION
  server.delete(
    '/sessions/:sessionId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['Authentication'],
        summary: 'Revoke a specific session',
        params: z.object({
          sessionId: z.string().uuid(),
        }),
      },
    },
    async (request, reply) => {
      const { sessionId } = request.params as { sessionId: string };
      const isSuperAdmin = request.user!.roles.includes('SUPER_ADMIN');

      const result = await authService.revokeSession(
        request.user!.id,
        sessionId,
        isSuperAdmin,
      );
      return reply.status(200).send(result);
    },
  );
};
