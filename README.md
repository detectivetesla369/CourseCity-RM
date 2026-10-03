# CourseCity 1.0

> Enterprise-grade, API-first learning platform and future multi-publisher marketplace.

## Architecture & Mission
CourseCity is designed around an authoritative API core delivering distraction-free ebook and tutorial-based courses, server-verified assessments, and cryptographically verifiable digital receipts and certificates.

* **Authoritative Core**: Node.js 22 LTS, Fastify, OpenAPI 3.1, Zod, Scalar.
* **Source of Truth**: PostgreSQL 16 with Kysely typed query builder and migrations.
* **Cache & Queues**: Redis 7, BullMQ, and Transactional Outbox pattern.
* **Web Client**: Next.js 15+ App Router, React 19, Tailwind CSS, Radix UI, Lucide React.
* **Security & Cryptography**: Argon2id password hashing, rotating refresh tokens with reuse detection, TOTP MFA, Ed25519 digital signatures.

## Repository Layout
```text
coursecity/
├── apps/
│   ├── web/                    # Next.js web client
│   └── api/                    # Fastify API service
├── packages/
│   ├── contracts/              # Shared TypeScript DTOs & RFC 7807 error models
│   ├── validation/             # Shared Zod validation schemas
│   ├── database/               # Kysely schema definitions & migration runner
│   ├── auth/                   # Argon2id, token hashing, and RBAC permissions
│   ├── api-client/             # Typed API client library
│   ├── design-tokens/          # CourseCity orange palette & typography tokens
│   ├── design-system/          # Accessible UI component library
│   └── shared/                 # Canonical JSON (RFC 8785) & Ed25519 crypto helpers
├── infrastructure/
│   ├── docker/                 # Docker Compose configurations
│   ├── postgres/               # PostgreSQL initialization scripts
│   ├── redis/                  # Redis persistence configuration
│   └── caddy/                  # Reverse proxy configurations
└── docs/                       # Authoritative architecture and operational runbooks
```

## Quickstart

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

### 3. Start Local PostgreSQL & Redis
```bash
docker compose -f infrastructure/docker/docker-compose.dev.yml up -d
```

### 4. Run Development Servers
```bash
pnpm dev
```
* Web App: [http://localhost:3000](http://localhost:3000)
* Authoritative API: [http://localhost:4000](http://localhost:4000)
* Interactive Documentation: [http://localhost:4000/docs](http://localhost:4000/docs)

### 5. Quality Verification
```bash
pnpm run typecheck
pnpm run test
pnpm run build
```

See [docs/runbooks/local-development.md](docs/runbooks/local-development.md) for comprehensive operational procedures.
