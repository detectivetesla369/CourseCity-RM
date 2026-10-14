import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // 1. Products & Prices
  await db.schema
    .createTable('products')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('title', 'varchar(255)', (col) => col.notNull())
    .addColumn('course_id', 'uuid', (col) => col.references('courses.id').onDelete('cascade'))
    .addColumn('active', 'boolean', (col) => col.notNull().defaultTo(true))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await db.schema
    .createTable('prices')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('product_id', 'uuid', (col) => col.notNull().references('products.id').onDelete('cascade'))
    .addColumn('amount_minor', 'bigint', (col) => col.notNull())
    .addColumn('currency', 'varchar(3)', (col) => col.notNull().defaultTo('GHS'))
    .addColumn('active', 'boolean', (col) => col.notNull().defaultTo(true))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  // 2. Orders Table
  await db.schema
    .createTable('orders')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('order_reference', 'varchar(64)', (col) => col.notNull().unique())
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('restrict'))
    .addColumn('status', 'varchar(32)', (col) => col.notNull().defaultTo('CREATED'))
    .addColumn('total_amount_minor', 'bigint', (col) => col.notNull())
    .addColumn('currency', 'varchar(3)', (col) => col.notNull().defaultTo('GHS'))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await db.schema.createIndex('idx_orders_user').on('orders').column('user_id').execute();

  // 3. Order Items Table
  await db.schema
    .createTable('order_items')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('order_id', 'uuid', (col) => col.notNull().references('orders.id').onDelete('cascade'))
    .addColumn('course_id', 'uuid', (col) => col.notNull().references('courses.id').onDelete('restrict'))
    .addColumn('title', 'varchar(255)', (col) => col.notNull())
    .addColumn('amount_minor', 'bigint', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  // 4. Payments Table
  await db.schema
    .createTable('payments')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('payment_reference', 'varchar(64)', (col) => col.notNull().unique())
    .addColumn('order_id', 'uuid', (col) => col.notNull().references('orders.id').onDelete('restrict'))
    .addColumn('provider', 'varchar(32)', (col) => col.notNull().defaultTo('PAYSTACK'))
    .addColumn('provider_reference', 'varchar(128)', (col) => col.notNull())
    .addColumn('provider_transaction_id', 'varchar(128)', (col) => col.unique())
    .addColumn('amount_minor', 'bigint', (col) => col.notNull())
    .addColumn('currency', 'varchar(3)', (col) => col.notNull().defaultTo('GHS'))
    .addColumn('status', 'varchar(32)', (col) => col.notNull().defaultTo('INITIATED'))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await db.schema.createIndex('idx_payments_order').on('payments').column('order_id').execute();
  await db.schema.createIndex('idx_payments_prov_ref').on('payments').column('provider_reference').execute();

  // 5. Payment Events & Reconciliations
  await db.schema
    .createTable('payment_events')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('payment_id', 'uuid', (col) => col.references('payments.id').onDelete('set null'))
    .addColumn('event_type', 'varchar(64)', (col) => col.notNull())
    .addColumn('payload', 'jsonb', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await db.schema
    .createTable('payment_reconciliations')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('payment_id', 'uuid', (col) => col.references('payments.id').onDelete('set null'))
    .addColumn('provider_reference', 'varchar(128)', (col) => col.notNull())
    .addColumn('expected_amount_minor', 'bigint', (col) => col.notNull())
    .addColumn('provider_amount_minor', 'bigint')
    .addColumn('status', 'varchar(32)', (col) => col.notNull().defaultTo('UNRECONCILED'))
    .addColumn('notes', 'text')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  // 6. Refunds & Refund Events
  await db.schema
    .createTable('refunds')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('payment_id', 'uuid', (col) => col.notNull().references('payments.id').onDelete('restrict'))
    .addColumn('order_id', 'uuid', (col) => col.notNull().references('orders.id').onDelete('restrict'))
    .addColumn('actor_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('restrict'))
    .addColumn('amount_minor', 'bigint', (col) => col.notNull())
    .addColumn('reason', 'text', (col) => col.notNull())
    .addColumn('status', 'varchar(32)', (col) => col.notNull().defaultTo('PENDING'))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('completed_at', 'timestamptz')
    .execute();

  await db.schema
    .createTable('refund_events')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('refund_id', 'uuid', (col) => col.notNull().references('refunds.id').onDelete('cascade'))
    .addColumn('event_name', 'varchar(64)', (col) => col.notNull())
    .addColumn('payload', 'jsonb', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  // 7. Entitlements Table (Course Access Authorization)
  await db.schema
    .createTable('entitlements')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('course_id', 'uuid', (col) => col.notNull().references('courses.id').onDelete('cascade'))
    .addColumn('source_type', 'varchar(32)', (col) => col.notNull().defaultTo('PURCHASE'))
    .addColumn('status', 'varchar(32)', (col) => col.notNull().defaultTo('ACTIVE'))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('expires_at', 'timestamptz')
    .addUniqueConstraint('uq_user_course_entitlement', ['user_id', 'course_id'])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('entitlements').ifExists().execute();
  await db.schema.dropTable('refund_events').ifExists().execute();
  await db.schema.dropTable('refunds').ifExists().execute();
  await db.schema.dropTable('payment_reconciliations').ifExists().execute();
  await db.schema.dropTable('payment_events').ifExists().execute();
  await db.schema.dropTable('payments').ifExists().execute();
  await db.schema.dropTable('order_items').ifExists().execute();
  await db.schema.dropTable('orders').ifExists().execute();
  await db.schema.dropTable('prices').ifExists().execute();
  await db.schema.dropTable('products').ifExists().execute();
}
