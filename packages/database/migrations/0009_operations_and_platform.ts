import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // 1. Idempotency Keys Table
  await db.schema
    .createTable('idempotency_keys')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('scope', 'varchar(64)', (col) => col.notNull())
    .addColumn('key', 'varchar(255)', (col) => col.notNull())
    .addColumn('actor_id', 'uuid', (col) => col.notNull())
    .addColumn('request_hash', 'varchar(64)', (col) => col.notNull())
    .addColumn('status', 'varchar(32)', (col) => col.notNull().defaultTo('PENDING'))
    .addColumn('response_status', 'integer')
    .addColumn('response_body', 'jsonb')
    .addColumn('resource_type', 'varchar(64)')
    .addColumn('resource_id', 'uuid')
    .addColumn('expires_at', 'timestamptz', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('completed_at', 'timestamptz')
    .addUniqueConstraint('uq_idempotency_scope_key_actor', ['scope', 'key', 'actor_id'])
    .execute();

  // 2. Resource Versions (Optimistic Concurrency)
  await db.schema
    .createTable('resource_versions')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('resource_type', 'varchar(64)', (col) => col.notNull())
    .addColumn('resource_id', 'uuid', (col) => col.notNull())
    .addColumn('version', 'integer', (col) => col.notNull().defaultTo(1))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addUniqueConstraint('uq_resource_type_id', ['resource_type', 'resource_id'])
    .execute();

  // 3. Outbox Events & Dead-Letter Tables
  await db.schema
    .createTable('outbox_events')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('event_name', 'varchar(64)', (col) => col.notNull())
    .addColumn('aggregate_type', 'varchar(64)', (col) => col.notNull())
    .addColumn('aggregate_id', 'uuid', (col) => col.notNull())
    .addColumn('payload', 'jsonb', (col) => col.notNull())
    .addColumn('status', 'varchar(32)', (col) => col.notNull().defaultTo('PENDING'))
    .addColumn('retry_count', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('processed_at', 'timestamptz')
    .execute();

  await db.schema
    .createIndex('idx_outbox_events_status')
    .on('outbox_events')
    .columns(['status', 'created_at'])
    .execute();

  await db.schema
    .createTable('dead_letter_events')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('original_event_id', 'uuid', (col) => col.notNull())
    .addColumn('event_name', 'varchar(64)', (col) => col.notNull())
    .addColumn('payload', 'jsonb', (col) => col.notNull())
    .addColumn('last_error', 'text', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  // 4. Notifications & Communication Logs
  await db.schema
    .createTable('notifications')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('title', 'varchar(255)', (col) => col.notNull())
    .addColumn('message', 'text', (col) => col.notNull())
    .addColumn('type', 'varchar(32)', (col) => col.notNull())
    .addColumn('is_read', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await db.schema
    .createTable('notification_preferences')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('user_id', 'uuid', (col) => col.notNull().unique().references('users.id').onDelete('cascade'))
    .addColumn('email_enabled', 'boolean', (col) => col.notNull().defaultTo(true))
    .addColumn('in_app_enabled', 'boolean', (col) => col.notNull().defaultTo(true))
    .addColumn('whatsapp_enabled', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await db.schema
    .createTable('email_events')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('user_id', 'uuid', (col) => col.references('users.id').onDelete('set null'))
    .addColumn('recipient_email', 'varchar(255)', (col) => col.notNull())
    .addColumn('template_name', 'varchar(64)', (col) => col.notNull())
    .addColumn('status', 'varchar(32)', (col) => col.notNull().defaultTo('QUEUED'))
    .addColumn('provider_message_id', 'varchar(128)')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await db.schema
    .createTable('whatsapp_events')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('user_id', 'uuid', (col) => col.references('users.id').onDelete('set null'))
    .addColumn('recipient_phone', 'varchar(32)', (col) => col.notNull())
    .addColumn('message_type', 'varchar(64)', (col) => col.notNull())
    .addColumn('status', 'varchar(32)', (col) => col.notNull().defaultTo('QUEUED'))
    .addColumn('provider_message_id', 'varchar(128)')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  // 5. Developer & API Platform Tables
  await db.schema
    .createTable('api_clients')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('client_name', 'varchar(200)', (col) => col.notNull())
    .addColumn('owner_user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await db.schema
    .createTable('api_keys')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('client_id', 'uuid', (col) => col.notNull().references('api_clients.id').onDelete('cascade'))
    .addColumn('key_id', 'varchar(64)', (col) => col.notNull().unique())
    .addColumn('key_prefix', 'varchar(16)', (col) => col.notNull())
    .addColumn('secret_hash', 'varchar(64)', (col) => col.notNull().unique())
    .addColumn('scopes', 'jsonb', (col) => col.notNull())
    .addColumn('status', 'varchar(32)', (col) => col.notNull().defaultTo('ACTIVE'))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('expires_at', 'timestamptz', (col) => col.notNull())
    .addColumn('revoked_at', 'timestamptz')
    .addColumn('last_used_at', 'timestamptz')
    .execute();

  await db.schema
    .createTable('webhook_endpoints')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('client_id', 'uuid', (col) => col.notNull().references('api_clients.id').onDelete('cascade'))
    .addColumn('target_url', 'text', (col) => col.notNull())
    .addColumn('secret_hash', 'varchar(64)', (col) => col.notNull())
    .addColumn('events', 'jsonb', (col) => col.notNull())
    .addColumn('is_active', 'boolean', (col) => col.notNull().defaultTo(true))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await db.schema
    .createTable('webhook_deliveries')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('endpoint_id', 'uuid', (col) => col.notNull().references('webhook_endpoints.id').onDelete('cascade'))
    .addColumn('event_type', 'varchar(64)', (col) => col.notNull())
    .addColumn('payload', 'jsonb', (col) => col.notNull())
    .addColumn('status', 'varchar(32)', (col) => col.notNull().defaultTo('PENDING'))
    .addColumn('attempt_count', 'integer', (col) => col.notNull().defaultTo(1))
    .addColumn('last_status_code', 'integer')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('delivered_at', 'timestamptz')
    .execute();

  // 6. Audit & Security Events
  await db.schema
    .createTable('audit_logs')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('actor_id', 'uuid', (col) => col.references('users.id').onDelete('set null'))
    .addColumn('actor_role', 'varchar(64)')
    .addColumn('resource_type', 'varchar(64)', (col) => col.notNull())
    .addColumn('resource_id', 'uuid', (col) => col.notNull())
    .addColumn('action', 'varchar(64)', (col) => col.notNull())
    .addColumn('request_id', 'varchar(64)')
    .addColumn('metadata', 'jsonb')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await db.schema
    .createTable('security_events')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('event_type', 'varchar(64)', (col) => col.notNull())
    .addColumn('severity', 'varchar(32)', (col) => col.notNull().defaultTo('INFO'))
    .addColumn('user_id', 'uuid', (col) => col.references('users.id').onDelete('set null'))
    .addColumn('ip_address', 'inet')
    .addColumn('user_agent', 'text')
    .addColumn('metadata', 'jsonb')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  // 7. System Settings & Maintenance
  await db.schema
    .createTable('system_settings')
    .addColumn('key', 'varchar(64)', (col) => col.primaryKey())
    .addColumn('value', 'jsonb', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await db.schema
    .createTable('maintenance_windows')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('title', 'varchar(255)', (col) => col.notNull())
    .addColumn('scope', 'varchar(64)', (col) => col.notNull().defaultTo('ALL'))
    .addColumn('status', 'varchar(32)', (col) => col.notNull().defaultTo('SCHEDULED'))
    .addColumn('start_time', 'timestamptz', (col) => col.notNull())
    .addColumn('end_time', 'timestamptz', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await db.schema
    .createTable('incidents')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('title', 'varchar(255)', (col) => col.notNull())
    .addColumn('status', 'varchar(32)', (col) => col.notNull().defaultTo('OPEN'))
    .addColumn('severity', 'varchar(32)', (col) => col.notNull().defaultTo('MAJOR'))
    .addColumn('description', 'text', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('resolved_at', 'timestamptz')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('incidents').ifExists().execute();
  await db.schema.dropTable('maintenance_windows').ifExists().execute();
  await db.schema.dropTable('system_settings').ifExists().execute();
  await db.schema.dropTable('security_events').ifExists().execute();
  await db.schema.dropTable('audit_logs').ifExists().execute();
  await db.schema.dropTable('webhook_deliveries').ifExists().execute();
  await db.schema.dropTable('webhook_endpoints').ifExists().execute();
  await db.schema.dropTable('api_keys').ifExists().execute();
  await db.schema.dropTable('api_clients').ifExists().execute();
  await db.schema.dropTable('whatsapp_events').ifExists().execute();
  await db.schema.dropTable('email_events').ifExists().execute();
  await db.schema.dropTable('notification_preferences').ifExists().execute();
  await db.schema.dropTable('notifications').ifExists().execute();
  await db.schema.dropTable('dead_letter_events').ifExists().execute();
  await db.schema.dropTable('outbox_events').ifExists().execute();
  await db.schema.dropTable('resource_versions').ifExists().execute();
  await db.schema.dropTable('idempotency_keys').ifExists().execute();
}
