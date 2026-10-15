import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { verifyAccessToken, hasAnyPermission, AccessTokenPayload } from '@coursecity/auth';
import { AppError } from '../errors/app-error.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  sessionId: string;
  roles: string[];
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requirePermission: (permission: string) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

const authPluginImpl: FastifyPluginAsync = async (fastify) => {
  const jwtSecret =
    process.env.JWT_SECRET || 'dev_jwt_secret_must_be_minimum_32_chars_long_2026';

  fastify.decorate(
    'authenticate',
    async (request: FastifyRequest, _reply: FastifyReply) => {
      let token: string | undefined;

      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
      } else if (request.cookies && request.cookies.cc_access_token) {
        token = request.cookies.cc_access_token;
      }

      if (!token) {
        throw AppError.unauthorized(
          'UNAUTHORIZED',
          'Authentication is required to access this resource.',
        );
      }

      try {
        const payload: AccessTokenPayload = verifyAccessToken(token, jwtSecret);
        request.user = {
          id: payload.sub,
          email: payload.email,
          sessionId: payload.sessionId,
          roles: payload.roles,
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Invalid token';
        if (msg === 'Token expired') {
          throw AppError.unauthorized('TOKEN_EXPIRED', 'Access token has expired.');
        }
        throw AppError.unauthorized('INVALID_TOKEN', 'Access token is invalid or malformed.');
      }
    },
  );

  fastify.decorate(
    'requirePermission',
    (permission: string) => {
      return async (request: FastifyRequest, reply: FastifyReply) => {
        // Ensure user is authenticated first
        if (!request.user) {
          await (fastify as unknown as { authenticate: (req: FastifyRequest, rep: FastifyReply) => Promise<void> }).authenticate(request, reply);
        }

        const user = request.user!;
        const allowed = hasAnyPermission(user.roles, permission);
        if (!allowed) {
          throw AppError.forbidden(
            'FORBIDDEN',
            `Insufficient permissions. Required permission: '${permission}'.`,
          );
        }
      };
    },
  );
};

export const authPlugin = fp(authPluginImpl, {
  name: 'coursecity-auth-plugin',
});
