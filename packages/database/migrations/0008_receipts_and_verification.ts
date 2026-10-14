import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // 1. Receipt Signing Keys Registry (Public key repository for Ed25519 verification)
  await db.schema
    .createTable('receipt_signing_keys')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('key_id', 'varchar(64)', (col) => col.notNull().unique())
    .addColumn('public_key_pem', 'text', (col) => col.notNull())
    .addColumn('is_active', 'boolean', (col) => col.notNull().defaultTo(true))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('revoked_at', 'timestamptz')
    .execute();

  // 2. Receipts Table (Immutable, signed digital instruments)
  await db.schema
    .createTable('receipts')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('receipt_reference', 'varchar(64)', (col) => col.notNull().unique())
    .addColumn('order_id', 'uuid', (col) => col.notNull().references('orders.id').onDelete('restrict'))
    .addColumn('payment_id', 'uuid', (col) => col.notNull().references('payments.id').onDelete('restrict'))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('restrict'))
    .addColumn('amount_minor', 'bigint', (col) => col.notNull())
    .addColumn('currency', 'varchar(3)', (col) => col.notNull().defaultTo('GHS'))
    .addColumn('status', 'varchar(32)', (col) => col.notNull().defaultTo('GENERATING'))
    .addColumn('ed25519_signature', 'text', (col) => col.notNull())
    .addColumn('payload_hash_sha256', 'varchar(64)', (col) => col.notNull())
    .addColumn('canonical_payload', 'jsonb', (col) => col.notNull())
    .addColumn('signing_key_id', 'varchar(64)', (col) => col.notNull())
    .addColumn('issued_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('revoked_at', 'timestamptz')
    .addColumn('revocation_reason', 'text')
    .execute();

  await db.schema.createIndex('idx_receipts_order').on('receipts').column('order_id').execute();
  await db.schema.createIndex('idx_receipts_payment').on('receipts').column('payment_id').execute();
  await db.schema.createIndex('idx_receipts_user').on('receipts').column('user_id').execute();

  // 3. Receipt Lifecycle Events Table
  await db.schema
    .createTable('receipt_events')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('receipt_id', 'uuid', (col) => col.notNull().references('receipts.id').onDelete('cascade'))
    .addColumn('event_name', 'varchar(64)', (col) => col.notNull())
    .addColumn('payload', 'jsonb', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  // 4. Receipt Public Verifications Log
  await db.schema
    .createTable('receipt_verifications')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('receipt_id', 'uuid', (col) => col.references('receipts.id').onDelete('set null'))
    .addColumn('receipt_reference', 'varchar(64)', (col) => col.notNull())
    .addColumn('result', 'varchar(32)', (col) => col.notNull())
    .addColumn('ip_address', 'inet')
    .addColumn('user_agent', 'text')
    .addColumn('checked_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await db.schema.createIndex('idx_receipt_verif_ref').on('receipt_verifications').column('receipt_reference').execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('receipt_verifications').ifExists().execute();
  await db.schema.dropTable('receipt_events').ifExists().execute();
  await db.schema.dropTable('receipts').ifExists().execute();
  await db.schema.dropTable('receipt_signing_keys').ifExists().execute();
}
