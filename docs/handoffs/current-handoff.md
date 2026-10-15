# CourseCity 1.0 — Architecture Handoff Protocol

## Current Phase: Phase 5 Complete -> Transition to Phase 6 (Learner Experience & Progress Tracking)

### 1. Completed Work

#### Phase 0 — Architectural Pre-Flight
* Authored all 12 authoritative architectural and pre-flight documents:
  - `docs/product/product-requirements.md` (Scope matrix, personas, workflows)
  - `docs/architecture/system-overview.md` (System topology, monorepo, Caddy, outbox)
  - `docs/architecture/domain-model.md` (Entity schemas, UUIDv7 vs business IDs, 18 state machines, lock ordering)
  - `docs/architecture/security-architecture.md` (Threat model, Argon2id, token rotation, MFA, RBAC scoping, invariants)
  - `docs/architecture/payment-architecture.md` (Paystack, IPaymentProvider, double verification, lifecycles)
  - `docs/architecture/receipt-verification.md` (RFC 8785 canonical JSON, SHA-256 fingerprint, Ed25519 signing)
  - `docs/architecture/marketplace-architecture.md` (Publisher abstraction, organizations, immutable course versioning)
  - `docs/architecture/api-architecture.md` (OpenAPI 3.1, scopes, rate limits, RFC 7807 problem details)
  - `docs/architecture/frontend-architecture.md` (Next.js, responsive recomposition, WCAG 2.2 AA, motion, Three.js)
  - `docs/architecture/mobile-architecture.md` (React Native + Expo blueprint, shared packages, secure storage)
  - `docs/architecture/design-dna.md` (Orange palette, warm neutrals, typography, Lucide icon system)
  - `docs/adr/0001-architecture-baseline.md` (Baseline Architecture Decision Record)

#### Phase 1 — Repository and Toolchain Foundation
* Monorepo toolchain initialized with **pnpm workspaces** and **Turborepo**.
* Strict TypeScript base configuration (`tsconfig.base.json`) with zero `any`.
* `.github/workflows/ci.yml` CI workflow executing lint, typecheck, test, and build.
* Scaffolded shared packages:
  - `@coursecity/contracts`: State enums, RFC 7807 problem details, DTOs.
  - `@coursecity/shared`: RFC 8785 canonical JSON, minor currency formatting, business ID generators, Ed25519 signing/verification. Tested with Vitest.
  - `@coursecity/validation`: Zod schemas for auth, commerce, progress, assessments, verification. Tested with Vitest.
  - `@coursecity/auth`: Argon2id password hashing, token hashing, RBAC permission matrix. Tested with Vitest.
  - `@coursecity/database`: Kysely typed schema interfaces and connection pool factory.
  - `@coursecity/design-tokens`: Authoritative CourseCity orange palette, neutrals, and typography.
  - `@coursecity/design-system`: Accessible Button, Badge, Card, and Skeletons with Lucide React.
  - `@coursecity/api-client`: Strongly typed HTTP client with RFC 7807 problem error handling.
* Scaffolded applications:
  - `apps/api`: Fastify server with CORS, Helmet, Cookie, Rate-limit, OpenAPI 3.1 Scalar docs (`/docs`), `/healthz`, `/readyz`. Tested with Fastify injection.
  - `apps/web`: Next.js 15+ App Router, Tailwind CSS, Lucide React, responsive landing page, and `/r/[receiptId]` public verification surface.

#### Phase 2 — Infrastructure and Local Development
* Docker Compose development environment (`infrastructure/docker/docker-compose.dev.yml`) for PostgreSQL 16 and Redis 7 with health checks and persistent volumes.
* PostgreSQL initialization script (`infrastructure/postgres/init.sql`) enabling `pgcrypto`, `uuid-ossp`, and `pg_trgm` extensions.
* Redis development configuration (`infrastructure/redis/redis.conf`) with AOF persistence.
* Local Caddy reverse proxy configuration (`infrastructure/caddy/Caddyfile.dev`).
* Database migration foundation using Kysely (`packages/database/src/migrator.ts` and `src/cli.ts`).
* Complete developer onboarding runbook (`docs/runbooks/local-development.md`) and project root `README.md`.

#### Phase 3 — Database and Domain Foundation
* Implemented all 9 comprehensive, reversible Kysely SQL migrations in `packages/database/migrations/`:
  - `0001_identity_and_auth.ts`: `users`, `user_profiles`, `sessions`, `refresh_tokens`, `email_verification_tokens`, `password_reset_tokens`.
  - `0002_roles_and_permissions.ts`: `roles`, `permissions`, `role_permissions`, `user_roles`.
  - `0003_publishers_and_organizations.ts`: `publishers`, `instructor_profiles`, `organizations`, `organization_members`, `publisher_members`.
  - `0004_courses_and_curriculum.ts`: `courses`, `course_versions`, `course_categories`, `course_category_links`, `course_instructors`, `course_modules`, `lessons`, `lesson_blocks`, `course_assets`.
  - `0005_commerce_and_reconciliation.ts`: `products`, `prices`, `course_offerings`, `orders`, `order_items`, `payments`, `payment_events`, `payment_reconciliations`, `payment_reference_links`, `refunds`, `refund_events`, `entitlements`.
  - `0006_learning_and_progress.ts`: `enrollments`, `lesson_progress`, `course_progress`, `bookmarks`, `learner_notes`, `learning_activity`.
  - `0007_assessments_and_credentials.ts`: `assessments`, `assessment_questions`, `question_options`, `assessment_attempts`, `assessment_answers`, `assessment_results`, `assignments`, `assignment_submissions`, `assignment_grades`, `examinations`, `examination_attempts`, `examination_answers`, `examination_results`, `gradebook_entries`, `grading_rules`, `certificates`, `certificate_events`.
  - `0008_receipts_and_verification.ts`: `receipts`, `receipt_events`, `receipt_verifications`, `receipt_signing_keys`.
  - `0009_operations_and_platform.ts`: `idempotency_keys`, `resource_versions`, `outbox_events`, `dead_letter_events`, `background_jobs`, `background_job_runs`, `reconciliation_runs`, `notifications`, `notification_preferences`, `email_events`, `whatsapp_events`, `api_clients`, `api_keys`, `api_scopes`, `api_key_scopes`, `api_usage_events`, `webhook_endpoints`, `webhook_deliveries`, `audit_logs`, `security_events`, `admin_actions`, `system_settings`, `feature_flags`, `maintenance_windows`, `system_status_events`, `service_status_snapshots`, `incidents`.
* Implemented development & test seed script (`packages/database/src/seed.ts`).
* Created unit test suite (`packages/database/src/index.test.ts`) validating factory, migrator, and verifying all 9 migrations export reversible `up` and `down` handlers.

#### Phase 4 — Authentication & Authorization
* Implemented core authentication domain and services:
  - Argon2id password security (64MB memory, 3 iterations, 4 threads, timing-safe evaluation).
  - High-entropy cryptographic token generator (32-byte entropy with SHA-256 hash storage).
  - Access token HS256 JWT utilities (`signAccessToken`, `verifyAccessToken`) with constant-time signature verification.
  - Multi-role permission authorization matrix (`ROLE_PERMISSIONS`, `hasPermission`, `hasAnyPermission`).
  - `AuthService` in `apps/api/src/services/auth.service.ts`:
    - `signup`: Account creation, password hashing, transactional outbox `AUTH_USER_REGISTERED` event, and email verification token generation.
    - `signin`: Email + password authentication, session creation, refresh token generation, access JWT issue, and HttpOnly cookies.
    - `refresh`: Refresh token rotation with **token reuse detection** (immediately invalidates all tokens and active sessions if a revoked token is replayed).
    - `signout`: Revokes current session and refresh token family; clears cookies.
    - `verifyEmail`: Consumes single-use token and transitions user status to `ACTIVE`.
    - `forgotPassword` & `resetPassword`: Constant-time reset request with transactional outbox, password update, and session revocation.
    - `getMe`: Profile and role retrieval.
    - `listSessions` & `revokeSession`: Session inspection and revocation controls.
* Built Fastify auth plugin (`apps/api/src/plugins/auth.plugin.ts`):
  - `fastify.authenticate`: Extracts token from Bearer header or `cc_access_token` cookie, validates signature/expiration, decorates `request.user`.
  - `fastify.requirePermission(permission)`: Enforces fine-grained RBAC permission guards with RFC 7807 problem details.
* Implemented complete auth route handlers (`apps/api/src/routes/auth.routes.ts`) registered under `/api/v1/auth`.
* Extended typed `ApiClient` (`packages/api-client/src/index.ts`) with all authentication methods.
* Created comprehensive integration tests (`apps/api/src/auth.test.ts`) verifying input validation, RFC 7807 error formats, token expiry, tampering rejection, RBAC matrix, and token reuse family revocation.

#### Phase 5 — Courses, Curriculum & Publisher Engine
* Implemented course domain and catalog service (`apps/api/src/services/course.service.ts`):
  - `getCatalog`: Search by title/description, filter by level, free/paid, sort by price/newest, pagination.
  - `getCourseBySlug`: Comprehensive course detail, active version retrieval, publisher metadata, modules and lessons summary, with user enrollment status.
  - `getLesson`: Curriculum block reader enforcing the **Content Access Gating Invariant**:
    - Preview lessons (`is_previewable === true`) are accessible to unauthenticated guests and learners.
    - Non-preview lessons strictly require authentication (`401 Unauthorized`) and an active entitlement or enrollment (`403 Forbidden: ENROLLMENT_REQUIRED`).
  - `createCourse`: Creates course draft and initial version (requires `courses:create`).
  - `publishCourseVersion`: Transitions version to `PUBLISHED` and sets active version (requires `courses:publish`).
* Fastify course route endpoints (`apps/api/src/routes/course.routes.ts`):
  - `GET /api/v1/catalog`
  - `GET /api/v1/courses/:slug`
  - `GET /api/v1/courses/:slug/lessons/:lessonSlug`
  - `POST /api/v1/publisher/courses`
  - `POST /api/v1/publisher/courses/:courseId/publish`
* Realistic curriculum seeding in `packages/database/src/seed.ts`:
  - Course 1: *Full-Stack TypeScript & Cloud-Native Architecture* (Paid course with previewable and gated lessons, rich code blocks, callouts, and diagrams).
  - Course 2: *Modern TypeScript for Web Developers* (Free course with fundamentals and preview lessons).
* Comprehensive integration test suite in `apps/api/src/courses.test.ts` verifying catalog filters, 404 handling, preview vs gated lesson access invariants, and publisher permission enforcement.

---

### 2. Quality & Verification Gates Passed
* **Typecheck**: `pnpm run typecheck` passed (18/18 turbo tasks across all 10 packages/apps).
* **Unit Tests**: `pnpm run test` passed (13/13 turbo tasks, 50 Vitest tests passed across all packages and apps: 33 in API, 4 in auth, 4 in validation, 6 in shared, 3 in database).
* **Linter**: `pnpm run lint` passed (9/9 turbo tasks clean).
* **Production Build**: `pnpm run build` passed (10/10 turbo tasks, Next.js optimized routes and Fastify server compiled).

---

### 3. Next Exact Task: Phase 6 — Learner Experience & Progress Tracking
* Progress & Enrollment Domain Services (`apps/api/src/services/learning.service.ts`):
  - Lesson Progress Tracking: Idempotent toggle (`is_completed: boolean`), version increment for optimistic concurrency.
  - Course Progress Calculation: Real-time recalculation of completed lessons vs total lessons in enrolled version.
  - Bookmarks & Notes: Personal annotation storage anchored to lesson positions.
  - Learning History: Activity audit log recording lesson visits, completions, and timestamps.
* Learning Fastify Routes (`apps/api/src/routes/learning.routes.ts`):
  - `GET /api/v1/enrollments`: Lists learner's active, completed, and in-progress enrollments.
  - `POST /api/v1/progress`: Updates lesson completion status, recalculates course percentage, checks course completion requirements.
  - `GET /api/v1/bookmarks` & `POST /api/v1/bookmarks` & `DELETE /api/v1/bookmarks/:id`: Learner bookmark manager.
  - `GET /api/v1/notes` & `POST /api/v1/notes` & `DELETE /api/v1/notes/:id`: Personal markdown note manager.
* Integration Test Suite (`apps/api/src/learning.test.ts`):
  - Verifying enrollment listing, idempotent progress toggling, 100% course completion triggers, and bookmark/note persistence.
