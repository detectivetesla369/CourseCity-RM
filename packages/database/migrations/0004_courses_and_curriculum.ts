import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // 1. Courses Table
  await db.schema
    .createTable('courses')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('publisher_id', 'uuid', (col) => col.notNull().references('publishers.id').onDelete('cascade'))
    .addColumn('slug', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('status', 'varchar(32)', (col) => col.notNull().defaultTo('DRAFT'))
    .addColumn('active_version_id', 'uuid')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await db.schema.createIndex('idx_courses_status').on('courses').column('status').execute();

  // 2. Course Versions Table (Immutable when published)
  await db.schema
    .createTable('course_versions')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('course_id', 'uuid', (col) => col.notNull().references('courses.id').onDelete('cascade'))
    .addColumn('version_number', 'integer', (col) => col.notNull().defaultTo(1))
    .addColumn('title', 'varchar(255)', (col) => col.notNull())
    .addColumn('subtitle', 'text')
    .addColumn('description', 'text', (col) => col.notNull())
    .addColumn('cover_image_url', 'text')
    .addColumn('level', 'varchar(32)', (col) => col.notNull().defaultTo('ALL_LEVELS'))
    .addColumn('estimated_duration_minutes', 'integer', (col) => col.notNull().defaultTo(60))
    .addColumn('price_minor', 'bigint', (col) => col.notNull().defaultTo(0))
    .addColumn('currency', 'varchar(3)', (col) => col.notNull().defaultTo('GHS'))
    .addColumn('is_free', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('status', 'varchar(32)', (col) => col.notNull().defaultTo('DRAFT'))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('published_at', 'timestamptz')
    .addUniqueConstraint('uq_course_version_num', ['course_id', 'version_number'])
    .execute();

  // 3. Categories and Category Links
  await db.schema
    .createTable('course_categories')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('name', 'varchar(100)', (col) => col.notNull().unique())
    .addColumn('slug', 'varchar(100)', (col) => col.notNull().unique())
    .addColumn('description', 'text')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await db.schema
    .createTable('course_category_links')
    .addColumn('course_id', 'uuid', (col) => col.notNull().references('courses.id').onDelete('cascade'))
    .addColumn('category_id', 'uuid', (col) => col.notNull().references('course_categories.id').onDelete('cascade'))
    .addPrimaryKeyConstraint('pk_course_category_links', ['course_id', 'category_id'])
    .execute();

  // 4. Course Instructors Table
  await db.schema
    .createTable('course_instructors')
    .addColumn('course_id', 'uuid', (col) => col.notNull().references('courses.id').onDelete('cascade'))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('is_primary', 'boolean', (col) => col.notNull().defaultTo(false))
    .addPrimaryKeyConstraint('pk_course_instructors', ['course_id', 'user_id'])
    .execute();

  // 5. Course Modules Table
  await db.schema
    .createTable('course_modules')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('course_version_id', 'uuid', (col) => col.notNull().references('course_versions.id').onDelete('cascade'))
    .addColumn('title', 'varchar(255)', (col) => col.notNull())
    .addColumn('sort_order', 'integer', (col) => col.notNull().defaultTo(1))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await db.schema
    .createIndex('idx_course_modules_order')
    .on('course_modules')
    .columns(['course_version_id', 'sort_order'])
    .execute();

  // 6. Lessons Table
  await db.schema
    .createTable('lessons')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('module_id', 'uuid', (col) => col.notNull().references('course_modules.id').onDelete('cascade'))
    .addColumn('title', 'varchar(255)', (col) => col.notNull())
    .addColumn('slug', 'varchar(255)', (col) => col.notNull())
    .addColumn('sort_order', 'integer', (col) => col.notNull().defaultTo(1))
    .addColumn('estimated_read_time_minutes', 'integer', (col) => col.notNull().defaultTo(5))
    .addColumn('is_previewable', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addUniqueConstraint('uq_lesson_module_slug', ['module_id', 'slug'])
    .execute();

  await db.schema
    .createIndex('idx_lessons_order')
    .on('lessons')
    .columns(['module_id', 'sort_order'])
    .execute();

  // 7. Lesson Content Blocks Table (Atomic typed blocks)
  await db.schema
    .createTable('lesson_blocks')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('lesson_id', 'uuid', (col) => col.notNull().references('lessons.id').onDelete('cascade'))
    .addColumn('block_type', 'varchar(32)', (col) => col.notNull())
    .addColumn('sort_order', 'integer', (col) => col.notNull().defaultTo(1))
    .addColumn('content_payload', 'jsonb', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await db.schema
    .createIndex('idx_lesson_blocks_order')
    .on('lesson_blocks')
    .columns(['lesson_id', 'sort_order'])
    .execute();

  // 8. Course Assets Table
  await db.schema
    .createTable('course_assets')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('course_id', 'uuid', (col) => col.notNull().references('courses.id').onDelete('cascade'))
    .addColumn('title', 'varchar(255)', (col) => col.notNull())
    .addColumn('asset_url', 'text', (col) => col.notNull())
    .addColumn('mime_type', 'varchar(100)', (col) => col.notNull())
    .addColumn('size_bytes', 'bigint', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('course_assets').ifExists().execute();
  await db.schema.dropTable('lesson_blocks').ifExists().execute();
  await db.schema.dropTable('lessons').ifExists().execute();
  await db.schema.dropTable('course_modules').ifExists().execute();
  await db.schema.dropTable('course_instructors').ifExists().execute();
  await db.schema.dropTable('course_category_links').ifExists().execute();
  await db.schema.dropTable('course_categories').ifExists().execute();
  await db.schema.dropTable('course_versions').ifExists().execute();
  await db.schema.dropTable('courses').ifExists().execute();
}
