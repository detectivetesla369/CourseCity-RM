# ADR 0001: Architecture Baseline & V2 Frozen Amendments

## Status

**ACCEPTED / FROZEN — V2**

## Date

2026-10-03

## Context

CourseCity 1.0 is an enterprise-grade, API-first learning platform and future multi-publisher marketplace. The platform must initially deliver a comprehensive ebook/tutorial learning experience, with immediate architectural readiness for video courses, organizations, third-party publishers, and mobile clients.

Crucially, the system must prevent common critical design flaws:

- Client-controlled authorization or entitlement where the browser determines course ownership.
- Race conditions and duplicate payments caused by simultaneous webhooks or network retries.
- Visual-only receipt "anti-counterfeit" claims that are trivial to forge.
- Cross-tenant authorization leaks where instructors in Organization A gain access to Organization B.
- Database deadlocks caused by inconsistent lock acquisition orders.

## Decisions

### 1. Monorepo & Toolchain

- **Workspace Engine**: `pnpm` workspaces combined with `Turborepo`.
- **Structure**: `apps/web` (Next.js), `apps/api` (Fastify), future `apps/mobile` (Expo), alongside isolated packages (`@coursecity/contracts`, `@coursecity/api-client`, `@coursecity/validation`, `@coursecity/database`, `@coursecity/auth`, `@coursecity/design-tokens`, `@coursecity/design-system`, `@coursecity/shared`).

### 2. Backend & API Core

- **Authoritative API**: Node.js LTS with **Fastify** and TypeScript.
- **Specification**: **OpenAPI 3.1** generated via Fastify Zod type provider, rendered with **Scalar**.
- **Error Envelope**: Standardized **RFC 7807** `application/problem+json` response format.

### 3. Database & Typed Data Access

- **Engine**: **PostgreSQL 16** as the sole source of durable application state.
- **Query Builder**: **Kysely** for zero-overhead, strictly typed SQL queries.
- **Migrations**: Explicit, forward/backward reversible migrations executed via Kysely migration CLI.
- **Primary Keys**: **UUIDv7** internally; structured prefixed business identifiers (`CC-ORD-...`, `CC-PAY-...`, `CC-RCP-...`, `CC-CERT-...`) for human-facing references.

### 4. Cache, Queues & Outbox Pattern

- **Engine**: **Redis 7** for ephemeral caching, distributed rate limiting, and BullMQ queues.
- **Asynchronous Outbox**: State changes commit to PostgreSQL alongside `outbox_events`. BullMQ workers consume outbox events to generate receipts, dispatch transactional emails, and send WhatsApp alerts.

### 5. Multi-Publisher Domain Model

- Courses are owned by a `Publisher` (`PLATFORM`, `INSTRUCTOR`, `ORGANIZATION`), never directly by `course.user_id`.
- Organization members are scoped strictly to their organization's tenant boundaries.
- Published course versions are immutable to preserve learner certification and transcript validity.

### 6. Commerce, Payments & Idempotency

- **Minor Currency Units**: Stored as 64-bit integer minor units (pesewas/cents).
- **Provider Abstraction**: All payments interface via `IPaymentProvider` (initial provider: Paystack).
- **Double Verification**: Payments require both HMAC webhook validation and independent outbound API verification (`GET /transaction/verify/:reference`).
- **Deterministic Locking**: Order of locks is strictly `Order -> Payment -> Entitlement -> Enrollment`.
- **Zero Network Calls in DB Transactions**: External API requests are executed outside database transactions.
- **Idempotency**: All payment transactions require an `idempotency_keys` record with 72-hour TTL.

### 7. Cryptographic Receipts & Certificates

- Receipts and certificates are digitally signed using **Ed25519** over an **RFC 8785 canonical JSON** payload hash (SHA-256).
- Authenticity is verified mathematically at `verify.coursecity.com/r/:receiptId`. Visual watermarks and QR codes are secondary conveniences.

### 8. Frontend & Design System

- **Framework**: Next.js 15+ App Router, React 19, TypeScript.
- **Styling & Tokens**: Tailwind CSS with custom properties mapped to `@coursecity/design-tokens`.
- **Icon System**: Lucide React with standard 2px stroke, outline styling, and minimum 44x44px touch targets.
- **Motion & 3D**: CSS transitions for micro-interactions; GSAP + ScrollTrigger for editorial reveals; Three.js / React Three Fiber for the open digital textbook metaphor. Full support for `prefers-reduced-motion`.

## Alternatives Considered

1. **Fullstack Next.js API Routes**: Rejected. Couplings client and backend lifecycles, makes future mobile integration and third-party developer platforms cumbersome, and blurs network trust boundaries.
2. **Prisma ORM**: Rejected. Heavy query engine overhead, unpredictable generated SQL, and lack of fine-grained lock control (`FOR UPDATE`). Kysely provides compile-time type safety with transparent, high-performance SQL.
3. **Visual Watermarks as Primary Receipt Defense**: Rejected. Visual techniques can be replicated in graphic design software; only server-verified Ed25519 asymmetric cryptography guarantees anti-counterfeiting.

## Consequences & Impact

- **Security**: Bank-grade security posture with Argon2id, token rotation, TOTP MFA, fine-grained RBAC, and network isolation.
- **Performance**: Sub-15ms database transactions, lean payload sizes, and responsive mobile-first UI.
- **Maintainability**: Clear architectural separation between presentation and authoritative domain logic.
