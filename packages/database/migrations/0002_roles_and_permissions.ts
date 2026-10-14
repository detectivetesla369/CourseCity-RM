import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // 1. Roles Table
  await db.schema
    .createTable('roles')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('name', 'varchar(64)', (col) => col.notNull().unique())
    .addColumn('description', 'text')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  // 2. Permissions Table
  await db.schema
    .createTable('permissions')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('name', 'varchar(64)', (col) => col.notNull().unique())
    .addColumn('description', 'text')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  // 3. Role Permissions Join Table
  await db.schema
    .createTable('role_permissions')
    .addColumn('role_id', 'uuid', (col) => col.notNull().references('roles.id').onDelete('cascade'))
    .addColumn('permission_id', 'uuid', (col) => col.notNull().references('permissions.id').onDelete('cascade'))
    .addPrimaryKeyConstraint('pk_role_permissions', ['role_id', 'permission_id'])
    .execute();

  // 4. User Roles Assignment Table (Resource Scoped)
  await db.schema
    .createTable('user_roles')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('role_id', 'uuid', (col) => col.notNull().references('roles.id').onDelete('cascade'))
    .addColumn('scope_resource_type', 'varchar(64)')
    .addColumn('scope_resource_id', 'uuid')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await db.schema
    .createIndex('idx_user_roles_lookup')
    .on('user_roles')
    .columns(['user_id', 'role_id', 'scope_resource_id'])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('user_roles').ifExists().execute();
  await db.schema.dropTable('role_permissions').ifExists().execute();
  await db.schema.dropTable('permissions').ifExists().execute();
  await db.schema.dropTable('roles').ifExists().execute();
}
