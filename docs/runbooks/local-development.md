# CourseCity 1.0 — Local Developer Setup & Operations Runbook

## 1. Prerequisites
Ensure the following tools are installed on your workstation:
* **Node.js**: v22.18.0 LTS or higher (`node -v`)
* **pnpm**: v12.8.1 or higher (`pnpm -v`)
* **Docker & Docker Compose**: For local PostgreSQL and Redis dependencies
* **Git**: For version control

---

## 2. Initial Setup

### 2.1 Clone and Install Dependencies
```bash
git clone <repository_url> coursecity
cd coursecity

# Install workspace dependencies
pnpm install
```

### 2.2 Configure Environment Variables
Copy the template `.env.example` file:
```bash
cp .env.example .env
```
Default credentials are pre-configured for local Docker development:
* Database: `postgresql://coursecity_user:coursecity_dev_pass@localhost:5432/coursecity_dev`
* Redis: `redis://localhost:6379`
* Web URL: `http://localhost:3000`
* API URL: `http://localhost:4000`

---

## 3. Starting Local Infrastructure

Start the isolated PostgreSQL 16 and Redis 7 containers:
```bash
docker compose -f infrastructure/docker/docker-compose.dev.yml up -d
```

Verify service health:
```bash
docker compose -f infrastructure/docker/docker-compose.dev.yml ps
```
Both containers will report `healthy` within 5-10 seconds.

---

## 4. Database Migrations

Apply the latest database migrations:
```bash
pnpm --filter @coursecity/database run migrate:latest
```

To rollback the most recent migration batch:
```bash
pnpm --filter @coursecity/database run migrate:down
```

---

## 5. Running Applications in Development Mode

Run all workspace applications in parallel with live reload via Turborepo:
```bash
pnpm dev
```
* **Web Client**: [http://localhost:3000](http://localhost:3000)
* **Authoritative API**: [http://localhost:4000](http://localhost:4000)
* **Interactive OpenAPI (Scalar)**: [http://localhost:4000/docs](http://localhost:4000/docs)
* **Process Liveness**: [http://localhost:4000/healthz](http://localhost:4000/healthz)
* **Dependency Readiness**: [http://localhost:4000/readyz](http://localhost:4000/readyz)

---

## 6. Testing, Typechecking & Code Quality

Execute the verification pipeline before submitting code:
```bash
# Static type analysis across strict TypeScript configuration
pnpm run typecheck

# Unit and integration test suites
pnpm run test

# Code formatting
pnpm run format

# Production build verification
pnpm run build
```
