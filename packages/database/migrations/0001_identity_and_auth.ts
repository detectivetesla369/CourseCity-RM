import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // 1. Users Table
  await db.schema
    .createTable('users')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('email', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('password_hash', 'text', (col) => col.notNull())
    .addColumn('status', 'varchar(32)', (col) => col.notNull().defaultTo('PENDING_VERIFICATION'))
    .addColumn('email_verified_at', 'timestamptz')
    .addColumn('mfa_enabled', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('mfa_secret_encrypted', 'text')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  // 2. User Profiles Table
  await db.schema
    .createTable('user_profiles')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('user_id', 'uuid', (col) => col.notNull().unique().references('users.id').onDelete('cascade'))
    .addColumn('first_name', 'varchar(100)')
    .addColumn('last_name', 'varchar(100)')
    .addColumn('display_name', 'varchar(100)', (col) => col.notNull())
    .addColumn('avatar_url', 'text')
    .addColumn('bio', 'text')
    .addColumn('phone_number', 'varchar(32)')
    .addColumn('whatsapp_enabled', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  // 3. Sessions Table
  await db.schema
    .createTable('sessions')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('session_token_hash', 'varchar(64)', (col) => col.notNull().unique())
    .addColumn('ip_address', 'inet')
    .addColumn('user_agent', 'text')
    .addColumn('status', 'varchar(32)', (col) => col.notNull().defaultTo('ACTIVE'))
    .addColumn('last_activity_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('expires_at', 'timestamptz', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await db.schema
    .createIndex('idx_sessions_user_status')
    .on('sessions')
    .columns(['user_id', 'status'])
    .execute();

  // 4. Refresh Tokens Table
  await db.schema
    .createTable('refresh_tokens')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('session_id', 'uuid', (col) => col.notNull().references('sessions.id').onDelete('cascade'))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('token_hash', 'varchar(64)', (col) => col.notNull().unique())
    .addColumn('sequence_number', 'integer', (col) => col.notNull().defaultTo(1))
    .addColumn('revoked_at', 'timestamptz')
    .addColumn('expires_at', 'timestamptz', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await db.schema
    .createIndex('idx_refresh_tokens_session')
    .on('refresh_tokens')
    .columns(['session_id', 'token_hash'])
    .execute();

  // 5. Email Verification Tokens Table
  await db.schema
    .createTable('email_verification_tokens')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('token_hash', 'varchar(64)', (col) => col.notNull().unique())
    .addColumn('expires_at', 'timestamptz', (col) => col.notNull())
    .addColumn('used_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  // 6. Password Reset Tokens Table
  await db.schema
    .createTable('password_reset_tokens')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('token_hash', 'varchar(64)', (col) => col.notNull().unique())
    .addColumn('expires_at', 'timestamptz', (col) => col.notNull())
    .addColumn('used_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('password_reset_tokens').ifExists().execute();
  await db.schema.dropTable('email_verification_tokens').ifExists().execute();
  await db.schema.dropTable('refresh_tokens').ifExists().execute();
  await db.schema.dropTable('sessions').ifExists().execute();
  await db.schema.dropTable('user_profiles').ifExists().execute();
  await db.schema.dropTable('users').ifExists().execute();
}
