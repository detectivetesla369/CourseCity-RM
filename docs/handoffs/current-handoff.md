# CourseCity 1.0 — Architecture Handoff Protocol

## Current Phase: Phase 0 Complete -> Transition to Phase 1

### 1. Completed Work (Phase 0 — Architectural Pre-Flight)

- Analyzed CourseCity 1.0 Master Systems Architecture and Master V2 Frozen Amendment.
- Initialized local Git repository (`git init`).
- Verified Node.js v22.18.0 (LTS) environment and verified `pnpm` 12.8.1.
- Authored 12 authoritative Phase 0 specification documents:
  - `docs/product/product-requirements.md`: Complete scope matrix (V1 active vs V2 planned vs future deferred), learner journey, personas, non-functional requirements.
  - `docs/architecture/system-overview.md`: High-level topology, Docker container layout, network trust boundaries, outbox pattern, observability.
  - `docs/architecture/domain-model.md`: Full entity schema descriptions, UUIDv7 vs business references (`CC-ORD-...`, etc.), all 18 frozen lifecycle state machines, and concurrency/lock order rules.
  - `docs/architecture/security-architecture.md`: Threat model, Argon2id, rotating refresh tokens with reuse detection, MFA, RBAC with publisher scoping, and 15 non-negotiable security invariants.
  - `docs/architecture/payment-architecture.md`: Paystack integration, `IPaymentProvider`, two-way verification, decoupled state machines, minor unit math, and idempotency.
  - `docs/architecture/receipt-verification.md`: Cryptographic Ed25519 digital receipts, RFC 8785 canonical JSON, public verification surface, and privacy protection.
  - `docs/architecture/marketplace-architecture.md`: Multi-publisher model (`PLATFORM`, `INSTRUCTOR`, `ORGANIZATION`), tenant isolation, immutable course versioning, and atomic content blocks.
  - `docs/architecture/api-architecture.md`: OpenAPI 3.1, resource groups, API key hashing, frozen scopes, token bucket rate limits, RFC 7807 problem details, and outbound HMAC webhooks.
  - `docs/architecture/frontend-architecture.md`: Next.js 15+ App Router, mobile-first recomposition, WCAG 2.2 AA states, motion choreography, Three.js digital textbook metaphor, and reader engine.
  - `docs/architecture/mobile-architecture.md`: React Native + Expo client blueprint, shared contracts and API client, secure hardware storage, and offline sync roadmap.
  - `docs/architecture/design-dna.md`: CourseCity orange palette (`#F97316`), warm neutrals, semantic pastels, typography, Lucide icon system, and visual storytelling modes.
  - `docs/adr/0001-architecture-baseline.md`: Authoritative baseline Architecture Decision Record.

### 2. Files Changed / Created

- `docs/product/product-requirements.md`
- `docs/architecture/system-overview.md`
- `docs/architecture/domain-model.md`
- `docs/architecture/security-architecture.md`
- `docs/architecture/payment-architecture.md`
- `docs/architecture/receipt-verification.md`
- `docs/architecture/marketplace-architecture.md`
- `docs/architecture/api-architecture.md`
- `docs/architecture/frontend-architecture.md`
- `docs/architecture/mobile-architecture.md`
- `docs/architecture/design-dna.md`
- `docs/adr/0001-architecture-baseline.md`
- `docs/handoffs/current-handoff.md`

### 3. Database Migrations

None in Phase 0 (Pre-Flight Documentation phase). Schema designed and fully specified for Phase 3.

### 4. API Changes

OpenAPI 3.1 contracts and RFC 7807 error shapes fully specified.

### 5. Known Defects / Blockers

None.

### 6. Tests Run & Verification

All Phase 0 exit criteria verified:

- Complete architectural pre-flight documents created.
- Zero contradictory requirements exist.
- V1 vs V2 scope matrix is explicit and unambiguous.

### 7. Next Exact Task: Phase 1 — Repository and Toolchain Foundation

- Scaffold root `package.json`, `pnpm-workspace.yaml`, and `turbo.json`.
- Scaffold `apps/web`, `apps/api`.
- Scaffold shared packages:
  - `packages/contracts`
  - `packages/api-client`
  - `packages/validation`
  - `packages/database`
  - `packages/auth`
  - `packages/design-tokens`
  - `packages/design-system`
  - `packages/shared`
- Configure strict TypeScript (`tsconfig.base.json`), ESLint, Prettier.
- Configure GitHub Actions CI workflow (`.github/workflows/ci.yml`).
- Run workspace install, build, and typecheck to verify exit criteria for Phase 1.
