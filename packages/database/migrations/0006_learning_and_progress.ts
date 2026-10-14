import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // 1. Enrollments Table
  await db.schema
    .createTable('enrollments')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('course_id', 'uuid', (col) => col.notNull().references('courses.id').onDelete('restrict'))
    .addColumn('course_version_id', 'uuid', (col) => col.notNull().references('course_versions.id').onDelete('restrict'))
    .addColumn('status', 'varchar(32)', (col) => col.notNull().defaultTo('ACTIVE'))
    .addColumn('completed_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addUniqueConstraint('uq_user_course_enrollment', ['user_id', 'course_id'])
    .execute();

  await db.schema.createIndex('idx_enrollments_user').on('enrollments').column('user_id').execute();

  // 2. Lesson Progress Table (Monotonic versioning)
  await db.schema
    .createTable('lesson_progress')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('enrollment_id', 'uuid', (col) => col.notNull().references('enrollments.id').onDelete('cascade'))
    .addColumn('lesson_id', 'uuid', (col) => col.notNull().references('lessons.id').onDelete('cascade'))
    .addColumn('is_completed', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('first_read_at', 'timestamptz')
    .addColumn('completed_at', 'timestamptz')
    .addColumn('progress_version', 'bigint', (col) => col.notNull().defaultTo(1))
    .addUniqueConstraint('uq_enrollment_lesson_progress', ['enrollment_id', 'lesson_id'])
    .execute();

  // 3. Course Progress Aggregate Table
  await db.schema
    .createTable('course_progress')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('enrollment_id', 'uuid', (col) => col.notNull().unique().references('enrollments.id').onDelete('cascade'))
    .addColumn('percentage', 'numeric(5, 2)', (col) => col.notNull().defaultTo(0.00))
    .addColumn('last_lesson_id', 'uuid', (col) => col.references('lessons.id').onDelete('set null'))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  // 4. Bookmarks Table
  await db.schema
    .createTable('bookmarks')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('lesson_id', 'uuid', (col) => col.notNull().references('lessons.id').onDelete('cascade'))
    .addColumn('title', 'varchar(255)')
    .addColumn('scroll_offset_percentage', 'numeric(5, 2)', (col) => col.notNull().defaultTo(0.00))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  // 5. Learner Notes Table
  await db.schema
    .createTable('learner_notes')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('lesson_id', 'uuid', (col) => col.notNull().references('lessons.id').onDelete('cascade'))
    .addColumn('content', 'text', (col) => col.notNull())
    .addColumn('anchor_position', 'varchar(255)')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  // 6. Learning Activity Timeline
  await db.schema
    .createTable('learning_activity')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('course_id', 'uuid', (col) => col.notNull().references('courses.id').onDelete('cascade'))
    .addColumn('action_type', 'varchar(64)', (col) => col.notNull())
    .addColumn('metadata', 'jsonb')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('learning_activity').ifExists().execute();
  await db.schema.dropTable('learner_notes').ifExists().execute();
  await db.schema.dropTable('bookmarks').ifExists().execute();
  await db.schema.dropTable('course_progress').ifExists().execute();
  await db.schema.dropTable('lesson_progress').ifExists().execute();
  await db.schema.dropTable('enrollments').ifExists().execute();
}
