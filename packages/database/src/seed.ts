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

    // 5. Seed Official Platform Courses & Curriculum
    console.log('Seeding official CourseCity courses and curriculum...');
    const publisher = await db
      .selectFrom('publishers')
      .select('id')
      .where('slug', '=', 'coursecity-official')
      .executeTakeFirst();

    if (publisher) {
      // Course 1: Advanced Full-Stack TypeScript Architecture (Paid)
      const c1Slug = 'cloud-native-typescript-architecture';
      let c1 = await db
        .selectFrom('courses')
        .select('id')
        .where('slug', '=', c1Slug)
        .executeTakeFirst();

      if (!c1) {
        c1 = await db
          .insertInto('courses')
          .values({
            publisher_id: publisher.id,
            slug: c1Slug,
            status: 'PUBLISHED',
          })
          .returning('id')
          .executeTakeFirstOrThrow();
      }

      let v1 = await db
        .selectFrom('course_versions')
        .select('id')
        .where('course_id', '=', c1.id)
        .where('version_number', '=', 1)
        .executeTakeFirst();

      if (!v1) {
        v1 = await db
          .insertInto('course_versions')
          .values({
            course_id: c1.id,
            version_number: 1,
            title: 'Full-Stack TypeScript & Cloud-Native Architecture',
            subtitle: 'Architecting zero-compromise distributed systems with Fastify, Next.js, and PostgreSQL',
            description: 'A comprehensive production-grade engineering course exploring typed monorepos, strict distributed state machines, deterministic payment lifecycles, and resilient cloud architectures.',
            cover_image_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&q=80',
            level: 'ADVANCED',
            estimated_duration_minutes: 720,
            price_minor: 14999,
            currency: 'GHS',
            is_free: false,
            status: 'PUBLISHED',
            published_at: new Date(),
          })
          .returning('id')
          .executeTakeFirstOrThrow();

        // Update active version
        await db
          .updateTable('courses')
          .set({ active_version_id: v1.id })
          .where('id', '=', c1.id)
          .execute();

        // Module 1
        const m1 = await db
          .insertInto('course_modules')
          .values({
            course_version_id: v1.id,
            title: 'Monorepo Architecture & Contract-Driven Design',
            sort_order: 1,
          })
          .returning('id')
          .executeTakeFirstOrThrow();

        // Lesson 1.1 (Previewable)
        const l1 = await db
          .insertInto('lessons')
          .values({
            module_id: m1.id,
            title: 'Strict TypeScript & Boundary Enforcement',
            slug: 'strict-typescript-and-boundaries',
            sort_order: 1,
            estimated_read_time_minutes: 15,
            is_previewable: true,
          })
          .returning('id')
          .executeTakeFirstOrThrow();

        await db
          .insertInto('lesson_blocks')
          .values([
            {
              lesson_id: l1.id,
              block_type: 'HEADING',
              sort_order: 1,
              content_payload: JSON.stringify({ level: 1, text: 'Strict Boundary Enforcement' }),
            },
            {
              lesson_id: l1.id,
              block_type: 'PARAGRAPH',
              sort_order: 2,
              content_payload: JSON.stringify({
                text: 'In enterprise software architectures, shared contract definitions between client and server prevent boundary drift. Fastify and Next.js communicate via strongly typed OpenAPI 3.1 contracts.',
              }),
            },
            {
              lesson_id: l1.id,
              block_type: 'CODE',
              sort_order: 3,
              content_payload: JSON.stringify({
                language: 'typescript',
                code: 'export interface ProblemDetails {\n  type: string;\n  title: string;\n  status: number;\n  code: string;\n  detail: string;\n  requestId: string;\n  retryable: boolean;\n}',
              }),
            },
          ])
          .execute();

        // Lesson 1.2 (Gated / Non-previewable)
        const l2 = await db
          .insertInto('lessons')
          .values({
            module_id: m1.id,
            title: 'State Machine Modeling & Lock Ordering',
            slug: 'state-machine-modeling',
            sort_order: 2,
            estimated_read_time_minutes: 25,
            is_previewable: false,
          })
          .returning('id')
          .executeTakeFirstOrThrow();

        await db
          .insertInto('lesson_blocks')
          .values([
            {
              lesson_id: l2.id,
              block_type: 'HEADING',
              sort_order: 1,
              content_payload: JSON.stringify({ level: 1, text: 'Deterministic Row-Level Locking' }),
            },
            {
              lesson_id: l2.id,
              block_type: 'PARAGRAPH',
              sort_order: 2,
              content_payload: JSON.stringify({
                text: 'To avoid deadlocks under concurrent payment webhook callbacks, row locking must always follow a strict global topological sort: Order -> Payment -> Entitlement -> Enrollment.',
              }),
            },
          ])
          .execute();
      }

      // Course 2: Beginner Modern TypeScript (Free)
      const c2Slug = 'modern-typescript-for-beginners';
      let c2 = await db
        .selectFrom('courses')
        .select('id')
        .where('slug', '=', c2Slug)
        .executeTakeFirst();

      if (!c2) {
        c2 = await db
          .insertInto('courses')
          .values({
            publisher_id: publisher.id,
            slug: c2Slug,
            status: 'PUBLISHED',
          })
          .returning('id')
          .executeTakeFirstOrThrow();
      }

      let v2 = await db
        .selectFrom('course_versions')
        .select('id')
        .where('course_id', '=', c2.id)
        .where('version_number', '=', 1)
        .executeTakeFirst();

      if (!v2) {
        v2 = await db
          .insertInto('course_versions')
          .values({
            course_id: c2.id,
            version_number: 1,
            title: 'Modern TypeScript for Web Developers',
            subtitle: 'Master modern ECMAScript, static typing, and component design',
            description: 'Learn the foundational patterns of modern JavaScript and TypeScript development, building responsive web applications from the ground up.',
            cover_image_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&q=80',
            level: 'BEGINNER',
            estimated_duration_minutes: 240,
            price_minor: 0,
            currency: 'GHS',
            is_free: true,
            status: 'PUBLISHED',
            published_at: new Date(),
          })
          .returning('id')
          .executeTakeFirstOrThrow();

        await db
          .updateTable('courses')
          .set({ active_version_id: v2.id })
          .where('id', '=', c2.id)
          .execute();

        const m2 = await db
          .insertInto('course_modules')
          .values({
            course_version_id: v2.id,
            title: 'Type System Fundamentals',
            sort_order: 1,
          })
          .returning('id')
          .executeTakeFirstOrThrow();

        const l2_1 = await db
          .insertInto('lessons')
          .values({
            module_id: m2.id,
            title: 'Primitives and Union Types',
            slug: 'primitives-and-union-types',
            sort_order: 1,
            estimated_read_time_minutes: 10,
            is_previewable: true,
          })
          .returning('id')
          .executeTakeFirstOrThrow();

        await db
          .insertInto('lesson_blocks')
          .values([
            {
              lesson_id: l2_1.id,
              block_type: 'HEADING',
              sort_order: 1,
              content_payload: JSON.stringify({ level: 1, text: 'TypeScript Primitives' }),
            },
            {
              lesson_id: l2_1.id,
              block_type: 'PARAGRAPH',
              sort_order: 2,
              content_payload: JSON.stringify({
                text: 'TypeScript adds optional static types to JavaScript, enabling powerful autocomplete and catching runtime errors during compilation.',
              }),
            },
          ])
          .execute();
      }
    }

    console.log('✅ Seeding completed successfully!');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    throw err;
  } finally {
    await db.destroy();
  }
}

void seed();
