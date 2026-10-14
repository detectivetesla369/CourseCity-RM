import dotenv from 'dotenv';
dotenv.config();

import { createDatabase } from './index.js';
import { hashPassword, ROLE_PERMISSIONS } from '@coursecity/auth';

async function seed() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://coursecity_user:coursecity_dev_pass@localhost:5432/coursecity_dev';

  const db = createDatabase(connectionString);
  console.log('🌱 Starting CourseCity database seeding...');

  try {
    // 1. Seed Roles & Permissions
    console.log('Seeding roles and permissions...');
    for (const [roleName, permissions] of Object.entries(ROLE_PERMISSIONS)) {
      const role = await db
        .insertInto('roles')
        .values({
          name: roleName,
          description: `${roleName} platform role`,
        })
        .onConflict((oc) => oc.column('name').doNothing())
        .returning('id')
        .executeTakeFirst();

      for (const permName of permissions as string[]) {
        await db
          .insertInto('permissions')
          .values({
            name: permName,
            description: `Permission ${permName}`,
          })
          .onConflict((oc) => oc.column('name').doNothing())
          .execute();

        if (role) {
          const perm = await db
            .selectFrom('permissions')
            .select('id')
            .where('name', '=', permName)
            .executeTakeFirst();

          if (perm) {
            await db
              .insertInto('role_permissions')
              .values({
                role_id: role.id,
                permission_id: perm.id,
              })
              .onConflict((oc) => oc.doNothing())
              .execute();
          }
        }
      }
    }

    // 2. Seed Platform Publisher
    console.log('Seeding CourseCity official platform publisher...');
    await db
      .insertInto('publishers')
      .values({
        name: 'CourseCity Official',
        slug: 'coursecity-official',
        type: 'PLATFORM',
        verified: true,
      })
      .onConflict((oc) => oc.column('slug').doNothing())
      .execute();

    // 3. Seed Users (SuperAdmin & Demo Learner)
    console.log('Seeding initial platform users...');
    const passwordHash = await hashPassword('CourseCity2026!Master');

    const superAdmin = await db
      .insertInto('users')
      .values({
        email: 'superadmin@coursecity.com',
        password_hash: passwordHash,
        status: 'ACTIVE',
        email_verified_at: new Date(),
        mfa_enabled: true,
      })
      .onConflict((oc) => oc.column('email').doNothing())
      .returning('id')
      .executeTakeFirst();

    if (superAdmin) {
      await db
        .insertInto('user_profiles')
        .values({
          user_id: superAdmin.id,
          display_name: 'SuperAdmin Operator',
          first_name: 'CourseCity',
          last_name: 'Governance',
          whatsapp_enabled: false,
        })
        .onConflict((oc) => oc.column('user_id').doNothing())
        .execute();

      const superAdminRole = await db
        .selectFrom('roles')
        .select('id')
        .where('name', '=', 'SUPER_ADMIN')
        .executeTakeFirst();

      if (superAdminRole) {
        await db
          .insertInto('user_roles')
          .values({
            user_id: superAdmin.id,
            role_id: superAdminRole.id,
          })
          .onConflict((oc) => oc.doNothing())
          .execute();
      }
    }

    const learner = await db
      .insertInto('users')
      .values({
        email: 'learner@coursecity.com',
        password_hash: passwordHash,
        status: 'ACTIVE',
        email_verified_at: new Date(),
        mfa_enabled: false,
      })
      .onConflict((oc) => oc.column('email').doNothing())
      .returning('id')
      .executeTakeFirst();

    if (learner) {
      await db
        .insertInto('user_profiles')
        .values({
          user_id: learner.id,
          display_name: 'Kwame Mensah',
          first_name: 'Kwame',
          last_name: 'Mensah',
          whatsapp_enabled: false,
        })
        .onConflict((oc) => oc.column('user_id').doNothing())
        .execute();

      const learnerRole = await db
        .selectFrom('roles')
        .select('id')
        .where('name', '=', 'LEARNER')
        .executeTakeFirst();

      if (learnerRole) {
        await db
          .insertInto('user_roles')
          .values({
            user_id: learner.id,
            role_id: learnerRole.id,
          })
          .onConflict((oc) => oc.doNothing())
          .execute();
      }
    }

    // 4. Seed Ed25519 Public Verification Key
    console.log('Seeding receipt verification keys...');
    await db
      .insertInto('receipt_signing_keys')
      .values({
        key_id: 'cc_ed25519_2026_v1',
        public_key_pem: 'MCowBQYDK2VwAyEAGb5r8XwVv7h1gX0b6Y8a2b3c4d5e6f7a8b9c0d1e2f3=',
        is_active: true,
      })
      .onConflict((oc) => oc.column('key_id').doNothing())
      .execute();

    console.log('✅ Seeding completed successfully!');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    throw err;
  } finally {
    await db.destroy();
  }
}

void seed();
