import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // 1. Quizzes & Assessments Table
  await db.schema
    .createTable('assessments')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('module_id', 'uuid', (col) => col.notNull().references('course_modules.id').onDelete('cascade'))
    .addColumn('title', 'varchar(255)', (col) => col.notNull())
    .addColumn('type', 'varchar(32)', (col) => col.notNull().defaultTo('QUIZ'))
    .addColumn('passing_score', 'numeric(5, 2)', (col) => col.notNull().defaultTo(70.00))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  // 2. Questions & Options Tables
  await db.schema
    .createTable('assessment_questions')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('assessment_id', 'uuid', (col) => col.notNull().references('assessments.id').onDelete('cascade'))
    .addColumn('question_text', 'text', (col) => col.notNull())
    .addColumn('question_type', 'varchar(32)', (col) => col.notNull().defaultTo('SINGLE_CHOICE'))
    .addColumn('points', 'numeric(5, 2)', (col) => col.notNull().defaultTo(1.00))
    .addColumn('sort_order', 'integer', (col) => col.notNull().defaultTo(1))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await db.schema
    .createTable('question_options')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('question_id', 'uuid', (col) => col.notNull().references('assessment_questions.id').onDelete('cascade'))
    .addColumn('option_text', 'text', (col) => col.notNull())
    .addColumn('is_correct', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('sort_order', 'integer', (col) => col.notNull().defaultTo(1))
    .execute();

  // 3. Assessment Attempts Table
  await db.schema
    .createTable('assessment_attempts')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('assessment_id', 'uuid', (col) => col.notNull().references('assessments.id').onDelete('cascade'))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('attempt_number', 'integer', (col) => col.notNull().defaultTo(1))
    .addColumn('status', 'varchar(32)', (col) => col.notNull().defaultTo('NOT_STARTED'))
    .addColumn('score', 'numeric(5, 2)')
    .addColumn('max_score', 'numeric(5, 2)')
    .addColumn('started_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('submitted_at', 'timestamptz')
    .execute();

  // 4. Assignments & Submissions Tables
  await db.schema
    .createTable('assignments')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('module_id', 'uuid', (col) => col.notNull().references('course_modules.id').onDelete('cascade'))
    .addColumn('title', 'varchar(255)', (col) => col.notNull())
    .addColumn('prompt', 'text', (col) => col.notNull())
    .addColumn('max_score', 'numeric(5, 2)', (col) => col.notNull().defaultTo(100.00))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await db.schema
    .createTable('assignment_submissions')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('assignment_id', 'uuid', (col) => col.notNull().references('assignments.id').onDelete('cascade'))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('status', 'varchar(32)', (col) => col.notNull().defaultTo('DRAFT'))
    .addColumn('text_payload', 'text')
    .addColumn('attachment_url', 'text')
    .addColumn('score', 'numeric(5, 2)')
    .addColumn('instructor_feedback', 'text')
    .addColumn('submitted_at', 'timestamptz')
    .addColumn('graded_at', 'timestamptz')
    .execute();

  // 5. Examinations & Timed Attempts Tables (Server-enforced deadline)
  await db.schema
    .createTable('examinations')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('course_version_id', 'uuid', (col) => col.notNull().references('course_versions.id').onDelete('cascade'))
    .addColumn('title', 'varchar(255)', (col) => col.notNull())
    .addColumn('duration_minutes', 'integer', (col) => col.notNull().defaultTo(60))
    .addColumn('passing_percentage', 'numeric(5, 2)', (col) => col.notNull().defaultTo(70.00))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await db.schema
    .createTable('examination_attempts')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('examination_id', 'uuid', (col) => col.notNull().references('examinations.id').onDelete('cascade'))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('status', 'varchar(32)', (col) => col.notNull().defaultTo('SCHEDULED'))
    .addColumn('score', 'numeric(5, 2)')
    .addColumn('started_at', 'timestamptz')
    .addColumn('expires_at', 'timestamptz')
    .addColumn('submitted_at', 'timestamptz')
    .execute();

  // 6. Gradebook Consolidation Table
  await db.schema
    .createTable('gradebook_entries')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('enrollment_id', 'uuid', (col) => col.notNull().references('enrollments.id').onDelete('cascade'))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('assessment_type', 'varchar(32)', (col) => col.notNull())
    .addColumn('assessment_id', 'uuid', (col) => col.notNull())
    .addColumn('score', 'numeric(5, 2)', (col) => col.notNull())
    .addColumn('max_score', 'numeric(5, 2)', (col) => col.notNull())
    .addColumn('recorded_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  // 7. Certificates Table (Cryptographically Verifiable)
  await db.schema
    .createTable('certificates')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('certificate_reference', 'varchar(64)', (col) => col.notNull().unique())
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('restrict'))
    .addColumn('course_id', 'uuid', (col) => col.notNull().references('courses.id').onDelete('restrict'))
    .addColumn('course_version_id', 'uuid', (col) => col.notNull().references('course_versions.id').onDelete('restrict'))
    .addColumn('enrollment_id', 'uuid', (col) => col.notNull().references('enrollments.id').onDelete('restrict'))
    .addColumn('recipient_name', 'varchar(200)', (col) => col.notNull())
    .addColumn('course_title', 'varchar(255)', (col) => col.notNull())
    .addColumn('final_grade', 'numeric(5, 2)')
    .addColumn('status', 'varchar(32)', (col) => col.notNull().defaultTo('ISSUED'))
    .addColumn('ed25519_signature', 'text', (col) => col.notNull())
    .addColumn('payload_hash', 'varchar(64)', (col) => col.notNull())
    .addColumn('issued_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('revoked_at', 'timestamptz')
    .addColumn('revocation_reason', 'text')
    .execute();

  await db.schema
    .createTable('certificate_events')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('certificate_id', 'uuid', (col) => col.notNull().references('certificates.id').onDelete('cascade'))
    .addColumn('event_name', 'varchar(64)', (col) => col.notNull())
    .addColumn('payload', 'jsonb', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('certificate_events').ifExists().execute();
  await db.schema.dropTable('certificates').ifExists().execute();
  await db.schema.dropTable('gradebook_entries').ifExists().execute();
  await db.schema.dropTable('examination_attempts').ifExists().execute();
  await db.schema.dropTable('examinations').ifExists().execute();
  await db.schema.dropTable('assignment_submissions').ifExists().execute();
  await db.schema.dropTable('assignments').ifExists().execute();
  await db.schema.dropTable('assessment_attempts').ifExists().execute();
  await db.schema.dropTable('question_options').ifExists().execute();
  await db.schema.dropTable('assessment_questions').ifExists().execute();
  await db.schema.dropTable('assessments').ifExists().execute();
}
