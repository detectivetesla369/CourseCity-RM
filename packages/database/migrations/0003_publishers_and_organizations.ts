import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // 1. Publishers Table
  await db.schema
    .createTable('publishers')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('name', 'varchar(200)', (col) => col.notNull())
    .addColumn('slug', 'varchar(200)', (col) => col.notNull().unique())
    .addColumn('type', 'varchar(32)', (col) => col.notNull())
    .addColumn('verified', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('avatar_url', 'text')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  // 2. Instructor Profiles Table
  await db.schema
    .createTable('instructor_profiles')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('user_id', 'uuid', (col) => col.notNull().unique().references('users.id').onDelete('cascade'))
    .addColumn('headline', 'varchar(255)')
    .addColumn('bio', 'text')
    .addColumn('website_url', 'text')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  // 3. Organizations Table
  await db.schema
    .createTable('organizations')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('publisher_id', 'uuid', (col) => col.notNull().unique().references('publishers.id').onDelete('cascade'))
    .addColumn('legal_name', 'varchar(255)', (col) => col.notNull())
    .addColumn('billing_email', 'varchar(255)')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  // 4. Organization Members Table
  await db.schema
    .createTable('organization_members')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('organization_id', 'uuid', (col) => col.notNull().references('organizations.id').onDelete('cascade'))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('role', 'varchar(32)', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addUniqueConstraint('uq_organization_members', ['organization_id', 'user_id'])
    .execute();

  // 5. Publisher Members Table
  await db.schema
    .createTable('publisher_members')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('publisher_id', 'uuid', (col) => col.notNull().references('publishers.id').onDelete('cascade'))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('role', 'varchar(32)', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addUniqueConstraint('uq_publisher_members', ['publisher_id', 'user_id'])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('publisher_members').ifExists().execute();
  await db.schema.dropTable('organization_members').ifExists().execute();
  await db.schema.dropTable('organizations').ifExists().execute();
  await db.schema.dropTable('instructor_profiles').ifExists().execute();
  await db.schema.dropTable('publishers').ifExists().execute();
}
