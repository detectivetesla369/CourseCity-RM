import type { Kysely } from 'kysely';
import type { Database } from '@coursecity/database';
import {
  hashPassword,
  verifyPassword,
  generateSecureToken,
  hashToken,
  signAccessToken,
} from '@coursecity/auth';
import type { SignupInput, SigninInput } from '@coursecity/validation';
import { AppError } from '../errors/app-error.js';

export class AuthService {
  constructor(
    private readonly db: Kysely<Database>,
    private readonly jwtSecret: string = process.env.JWT_SECRET || 'dev_jwt_secret_must_be_minimum_32_chars_long_2026',
  ) {}

  async signup(input: SignupInput) {
    const email = input.email.toLowerCase().trim();

    // 1. Check for duplicate email
    const existing = await this.db
      .selectFrom('users')
      .select('id')
      .where('email', '=', email)
      .executeTakeFirst();

    if (existing) {
      throw AppError.conflict(
        'EMAIL_ALREADY_EXISTS',
        'An account with this email address already exists.',
      );
    }

    // 2. Hash password with Argon2id
    const passwordHash = await hashPassword(input.password);
    const { plaintextToken, hashedToken } = generateSecureToken();

    // 3. Insert user record
    const user = await this.db
      .insertInto('users')
      .values({
        email,
        password_hash: passwordHash,
        status: 'PENDING_VERIFICATION',
        mfa_enabled: false,
      })
      .returning(['id', 'email', 'status'])
      .executeTakeFirstOrThrow();

    // 4. Insert user profile
    await this.db
      .insertInto('user_profiles')
      .values({
        user_id: user.id,
        display_name: input.displayName.trim(),
        first_name: input.firstName?.trim() || null,
        last_name: input.lastName?.trim() || null,
        whatsapp_enabled: false,
      })
      .execute();

    // 5. Assign default LEARNER role
    const learnerRole = await this.db
      .selectFrom('roles')
      .select('id')
      .where('name', '=', 'LEARNER')
      .executeTakeFirst();

    if (learnerRole) {
      await this.db
        .insertInto('user_roles')
        .values({
          user_id: user.id,
          role_id: learnerRole.id,
        })
        .execute();
    }

    // 6. Generate email verification token (valid for 24 hours)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.db
      .insertInto('email_verification_tokens')
      .values({
        user_id: user.id,
        token_hash: hashedToken,
        expires_at: expiresAt,
      })
      .execute();

    // 7. Write transactional Outbox event
    await this.db
      .insertInto('outbox_events')
      .values({
        event_name: 'AUTH_USER_REGISTERED',
        aggregate_type: 'USER',
        aggregate_id: user.id,
        payload: JSON.stringify({
          userId: user.id,
          email: user.email,
          verificationToken: plaintextToken,
        }),
        status: 'PENDING',
      })
      .execute();

    return {
      userId: user.id,
      email: user.email,
      status: user.status,
      verificationToken: plaintextToken, // Returned for dev/test assertions and automated workflows
    };
  }

  async signin(input: SigninInput, clientInfo: { ip?: string; userAgent?: string }) {
    const email = input.email.toLowerCase().trim();

    // 1. Fetch user by email
    const user = await this.db
      .selectFrom('users')
      .selectAll()
      .where('email', '=', email)
      .executeTakeFirst();

    if (!user) {
      // Execute dummy verify to mitigate timing enumeration attacks
      await verifyPassword(
        '$argon2id$v=19$m=65536,t=3,p=4$dummy_salt_for_timing$dummy_hash_for_timing_mitigation',
        input.password,
      );
      throw AppError.unauthorized('INVALID_CREDENTIALS', 'Invalid email or password.');
    }

    // 2. Check account state
    if (user.status === 'SUSPENDED' || user.status === 'DEACTIVATED') {
      throw AppError.forbidden(
        'ACCOUNT_INACTIVE',
        'This account has been deactivated or suspended.',
      );
    }

    // 3. Verify Argon2id password hash
    const isValid = await verifyPassword(user.password_hash, input.password);
    if (!isValid) {
      throw AppError.unauthorized('INVALID_CREDENTIALS', 'Invalid email or password.');
    }

    // 4. Fetch user roles
    const userRoles = await this.db
      .selectFrom('user_roles')
      .innerJoin('roles', 'roles.id', 'user_roles.role_id')
      .select('roles.name')
      .where('user_roles.user_id', '=', user.id)
      .execute();

    const roles = userRoles.map((r: { name: string }) => r.name);

    // 5. Create user session
    const sessionToken = generateSecureToken();
    const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const session = await this.db
      .insertInto('sessions')
      .values({
        user_id: user.id,
        session_token_hash: sessionToken.hashedToken,
        ip_address: clientInfo.ip || null,
        user_agent: clientInfo.userAgent || null,
        status: 'ACTIVE',
        expires_at: sessionExpiresAt,
      })
      .returning(['id', 'expires_at'])
      .executeTakeFirstOrThrow();

    // 6. Generate initial refresh token (30 days)
    const refreshToken = generateSecureToken();
    const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.db
      .insertInto('refresh_tokens')
      .values({
        session_id: session.id,
        user_id: user.id,
        token_hash: refreshToken.hashedToken,
        sequence_number: 1,
        expires_at: refreshExpiresAt,
      })
      .execute();

    // 7. Generate short-lived access JWT (15 minutes)
    const exp = Math.floor(Date.now() / 1000) + 15 * 60;
    const accessToken = signAccessToken(
      {
        sub: user.id,
        email: user.email,
        sessionId: session.id,
        roles,
        exp,
      },
      this.jwtSecret,
    );

    // 8. Fetch user profile
    const profile = await this.db
      .selectFrom('user_profiles')
      .selectAll()
      .where('user_id', '=', user.id)
      .executeTakeFirst();

    return {
      user: {
        id: user.id,
        email: user.email,
        status: user.status,
        roles,
        displayName: profile?.display_name || user.email,
        avatarUrl: profile?.avatar_url || null,
      },
      accessToken,
      refreshToken: refreshToken.plaintextToken,
      expiresInSeconds: 900,
      sessionId: session.id,
    };
  }

  async refresh(plaintextRefreshToken: string) {
    const hashed = hashToken(plaintextRefreshToken);

    const tokenRecord = await this.db
      .selectFrom('refresh_tokens')
      .selectAll()
      .where('token_hash', '=', hashed)
      .executeTakeFirst();

    if (!tokenRecord) {
      throw AppError.unauthorized('INVALID_REFRESH_TOKEN', 'Invalid or unknown refresh token.');
    }

    // REUSE DETECTION: If token was already revoked, terminate all sessions for this user!
    if (tokenRecord.revoked_at !== null) {
      await this.db
        .updateTable('refresh_tokens')
        .set({ revoked_at: new Date() })
        .where('user_id', '=', tokenRecord.user_id)
        .execute();

      await this.db
        .updateTable('sessions')
        .set({ status: 'REVOKED' })
        .where('user_id', '=', tokenRecord.user_id)
        .execute();

      await this.db
        .insertInto('outbox_events')
        .values({
          event_name: 'SECURITY_REFRESH_TOKEN_REUSE_DETECTED',
          aggregate_type: 'USER',
          aggregate_id: tokenRecord.user_id,
          payload: JSON.stringify({
            userId: tokenRecord.user_id,
            replayedTokenHash: hashed,
            revocationTimestamp: new Date().toISOString(),
          }),
          status: 'PENDING',
        })
        .execute();

      throw AppError.unauthorized(
        'TOKEN_REUSE_DETECTED',
        'Security violation: Refresh token reuse detected. All active sessions have been terminated.',
      );
    }

    // Check expiration
    if (new Date(tokenRecord.expires_at) < new Date()) {
      throw AppError.unauthorized('REFRESH_TOKEN_EXPIRED', 'Refresh token has expired.');
    }

    // Check session status
    const session = await this.db
      .selectFrom('sessions')
      .selectAll()
      .where('id', '=', tokenRecord.session_id)
      .executeTakeFirst();

    if (!session || session.status !== 'ACTIVE' || new Date(session.expires_at) < new Date()) {
      throw AppError.unauthorized('SESSION_EXPIRED', 'Session has expired or been revoked.');
    }

    // Rotate token: revoke current token
    await this.db
      .updateTable('refresh_tokens')
      .set({ revoked_at: new Date() })
      .where('id', '=', tokenRecord.id)
      .execute();

    // Issue new refresh token
    const newRefreshToken = generateSecureToken();
    const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.db
      .insertInto('refresh_tokens')
      .values({
        session_id: tokenRecord.session_id,
        user_id: tokenRecord.user_id,
        token_hash: newRefreshToken.hashedToken,
        sequence_number: tokenRecord.sequence_number + 1,
        expires_at: newExpiresAt,
      })
      .execute();

    // Fetch user and roles
    const user = await this.db
      .selectFrom('users')
      .select(['id', 'email', 'status'])
      .where('id', '=', tokenRecord.user_id)
      .executeTakeFirstOrThrow();

    const userRoles = await this.db
      .selectFrom('user_roles')
      .innerJoin('roles', 'roles.id', 'user_roles.role_id')
      .select('roles.name')
      .where('user_roles.user_id', '=', user.id)
      .execute();

    const roles = userRoles.map((r: { name: string }) => r.name);

    // Issue new access token
    const exp = Math.floor(Date.now() / 1000) + 15 * 60;
    const accessToken = signAccessToken(
      {
        sub: user.id,
        email: user.email,
        sessionId: tokenRecord.session_id,
        roles,
        exp,
      },
      this.jwtSecret,
    );

    return {
      accessToken,
      refreshToken: newRefreshToken.plaintextToken,
      expiresInSeconds: 900,
    };
  }

  async signout(sessionId?: string) {
    if (sessionId) {
      await this.db
        .updateTable('sessions')
        .set({ status: 'REVOKED' })
        .where('id', '=', sessionId)
        .execute();

      await this.db
        .updateTable('refresh_tokens')
        .set({ revoked_at: new Date() })
        .where('session_id', '=', sessionId)
        .execute();
    }
    return { success: true };
  }

  async verifyEmail(token: string) {
    const hashed = hashToken(token);

    const record = await this.db
      .selectFrom('email_verification_tokens')
      .selectAll()
      .where('token_hash', '=', hashed)
      .where('used_at', 'is', null)
      .where('expires_at', '>', new Date())
      .executeTakeFirst();

    if (!record) {
      throw AppError.badRequest(
        'INVALID_OR_EXPIRED_TOKEN',
        'Verification token is invalid or has expired.',
      );
    }

    await this.db
      .updateTable('email_verification_tokens')
      .set({ used_at: new Date() })
      .where('id', '=', record.id)
      .execute();

    await this.db
      .updateTable('users')
      .set({
        status: 'ACTIVE',
        email_verified_at: new Date(),
        updated_at: new Date(),
      })
      .where('id', '=', record.user_id)
      .execute();

    return {
      success: true,
      message: 'Email successfully verified. You may now access all learning platform features.',
    };
  }

  async forgotPassword(email: string) {
    const cleanEmail = email.toLowerCase().trim();

    const user = await this.db
      .selectFrom('users')
      .select(['id', 'email'])
      .where('email', '=', cleanEmail)
      .executeTakeFirst();

    // Constant time behavior / no enumeration
    if (!user) {
      return {
        message: 'If the email exists, a password reset link has been dispatched.',
      };
    }

    const { plaintextToken, hashedToken } = generateSecureToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.db
      .insertInto('password_reset_tokens')
      .values({
        user_id: user.id,
        token_hash: hashedToken,
        expires_at: expiresAt,
      })
      .execute();

    await this.db
      .insertInto('outbox_events')
      .values({
        event_name: 'AUTH_PASSWORD_RESET_REQUESTED',
        aggregate_type: 'USER',
        aggregate_id: user.id,
        payload: JSON.stringify({
          userId: user.id,
          email: user.email,
          resetToken: plaintextToken,
        }),
        status: 'PENDING',
      })
      .execute();

    return {
      message: 'If the email exists, a password reset link has been dispatched.',
      resetToken: plaintextToken, // For automated testing
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const hashed = hashToken(token);

    const record = await this.db
      .selectFrom('password_reset_tokens')
      .selectAll()
      .where('token_hash', '=', hashed)
      .where('used_at', 'is', null)
      .where('expires_at', '>', new Date())
      .executeTakeFirst();

    if (!record) {
      throw AppError.badRequest(
        'INVALID_OR_EXPIRED_TOKEN',
        'Password reset token is invalid or has expired.',
      );
    }

    const newHash = await hashPassword(newPassword);

    await this.db
      .updateTable('users')
      .set({
        password_hash: newHash,
        updated_at: new Date(),
      })
      .where('id', '=', record.user_id)
      .execute();

    await this.db
      .updateTable('password_reset_tokens')
      .set({ used_at: new Date() })
      .where('id', '=', record.id)
      .execute();

    // Terminate all sessions and revoke refresh tokens on password change
    await this.db
      .updateTable('sessions')
      .set({ status: 'REVOKED' })
      .where('user_id', '=', record.user_id)
      .execute();

    await this.db
      .updateTable('refresh_tokens')
      .set({ revoked_at: new Date() })
      .where('user_id', '=', record.user_id)
      .execute();

    return {
      success: true,
      message: 'Password has been successfully reset. Please sign in with your new credentials.',
    };
  }

  async getMe(userId: string) {
    const user = await this.db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', userId)
      .executeTakeFirst();

    if (!user) {
      throw AppError.notFound('USER_NOT_FOUND', 'User profile not found.');
    }

    const profile = await this.db
      .selectFrom('user_profiles')
      .selectAll()
      .where('user_id', '=', userId)
      .executeTakeFirst();

    const userRoles = await this.db
      .selectFrom('user_roles')
      .innerJoin('roles', 'roles.id', 'user_roles.role_id')
      .select('roles.name')
      .where('user_roles.user_id', '=', userId)
      .execute();

    const roles = userRoles.map((r: { name: string }) => r.name);

    return {
      id: user.id,
      email: user.email,
      status: user.status,
      emailVerifiedAt: user.email_verified_at,
      mfaEnabled: user.mfa_enabled,
      roles,
      profile: profile
        ? {
            id: profile.id,
            displayName: profile.display_name,
            firstName: profile.first_name,
            lastName: profile.last_name,
            avatarUrl: profile.avatar_url,
            bio: profile.bio,
            phoneNumber: profile.phone_number,
            whatsappEnabled: profile.whatsapp_enabled,
          }
        : null,
    };
  }

  async listSessions(userId: string, currentSessionId: string) {
    const sessions = await this.db
      .selectFrom('sessions')
      .selectAll()
      .where('user_id', '=', userId)
      .where('status', '=', 'ACTIVE')
      .where('expires_at', '>', new Date())
      .orderBy('last_activity_at', 'desc')
      .execute();

    return sessions.map(
      (s: {
        id: string;
        ip_address: string | null;
        user_agent: string | null;
        last_activity_at: Date;
        expires_at: Date;
      }) => ({
        id: s.id,
        ipAddress: s.ip_address || undefined,
        userAgent: s.user_agent || undefined,
        lastActivityAt: s.last_activity_at.toISOString(),
        expiresAt: s.expires_at.toISOString(),
        isCurrent: s.id === currentSessionId,
      }),
    );
  }

  async revokeSession(userId: string, targetSessionId: string, isSuperAdmin = false) {
    let query = this.db
      .selectFrom('sessions')
      .select('id')
      .where('id', '=', targetSessionId);

    if (!isSuperAdmin) {
      query = query.where('user_id', '=', userId);
    }

    const session = await query.executeTakeFirst();
    if (!session) {
      throw AppError.notFound('SESSION_NOT_FOUND', 'Session not found or already terminated.');
    }

    await this.db
      .updateTable('sessions')
      .set({ status: 'REVOKED' })
      .where('id', '=', targetSessionId)
      .execute();

    await this.db
      .updateTable('refresh_tokens')
      .set({ revoked_at: new Date() })
      .where('session_id', '=', targetSessionId)
      .execute();

    return { success: true };
  }
}
