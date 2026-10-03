# CourseCity 1.0 — API Architecture & Standards

## 1. API Design Baseline & Protocols

- **Base URL**: `https://api.coursecity.com/api/v1`
- **Specification**: Strictly defined using **OpenAPI 3.1** generated from Fastify Zod type providers.
- **Documentation UI**: **Scalar** interactive API reference rendered at `/docs`.
- **Data Format**: `application/json; charset=utf-8`.
- **Idempotency**: All state-changing write operations (`POST`, `PUT`) accept an optional or required `Idempotency-Key: <UUID>` header.

---

## 2. Resource Group Hierarchy

```text
/api/v1
  ├── /auth            # Registration, sign-in, session rotation, verification, password reset
  ├── /users           # User profile management, security settings, preferences
  ├── /catalog         # Public searchable catalogue, categories, featured courses
  ├── /courses         # Course details, curriculum outline, versions, previews
  ├── /publishers      # Public publisher profiles and verified instructor biographies
  ├── /enrollments     # Learner course enrollments and entitlement verification
  ├── /progress        # Monotonic lesson and course progress updates
  ├── /bookmarks       # Learner lesson bookmarks and reading anchors
  ├── /notes           # Private learner markdown notes
  ├── /assessments     # Quizzes, question pools, attempt submissions, automated scoring
  ├── /assignments     # Student assignment uploads, drafting, and instructor grading
  ├── /examinations    # Timed formal exams with server-enforced countdown deadlines
  ├── /grades          # Learner gradebook views and academic transcripts
  ├── /certificates    # Publicly verifiable certificate lookups and downloads
  ├── /orders          # Order checkout, price calculation, and order history
  ├── /payments        # Payment initialization, status polling, and verification
  ├── /refunds         # Authorized refund processing and audit tracking
  ├── /receipts        # Cryptographically signed receipts and public verification
  ├── /notifications   # In-app notifications and notification preferences
  ├── /developer       # API key management, usage analytics, webhook configuration
  ├── /webhooks        # Inbound provider webhook listeners (Paystack, etc.)
  └── /admin           # Operational platform administration (RBAC & scoped access)
```

---

## 3. API Authentication & Token Models

### 3.1 User Authentication (Session / Bearer JWT)

- Web client uses `HttpOnly`, `Secure` cookies for sessions and refresh tokens.
- Mobile and API clients pass short-lived access tokens via `Authorization: Bearer <token>`.

### 3.2 Developer Server-to-Server Authentication (`X-API-Key`)

- Third-party applications authenticate using scoped API keys in the header:
  `X-API-Key: cc_live_9f8a2b3c4d5e...`
- Database storage in `api_keys`:
  - `key_id`: Public identifier (e.g. `key_01j7abc`)
  - `key_prefix`: Visible prefix for logging and identification (e.g. `cc_live_9f8a`)
  - `secret_hash`: SHA-256 hash of the complete secret key
  - `scopes`: JSON array of approved permission strings
  - `expires_at`, `revoked_at`, `last_used_at`
- Full key secrets are shown **exactly once** upon creation and can never be retrieved again.

---

## 4. Frozen API Scopes

Scopes follow the principle of least privilege:

```text
Public Catalog Scopes:
  - catalog:read
  - courses:read
  - categories:read
  - publishers:read

Learner Scopes:
  - profile:read, profile:write
  - enrollments:read
  - progress:read, progress:write
  - bookmarks:read, bookmarks:write
  - notes:read, notes:write
  - assessments:read, assessments:attempt
  - assignments:read, assignments:submit
  - examinations:read, examinations:attempt
  - grades:read
  - certificates:read
  - receipts:read, receipts:verify
  - orders:read, payments:read

Commerce Creation:
  - orders:create

Publisher Scopes:
  - publisher:read
  - courses:manage, content:manage, assessments:manage
  - learners:read, analytics:read

Restricted Finance Scopes (Elevated Privileges Only):
  - finance:read
  - refunds:create
  - payouts:read
```

---

## 5. Rate Limiting & Input Bounds Policy

Enforced at the Fastify layer using Redis-backed token buckets:

| Request Category                 | Rate Limit           | Scope / Bucket Key     |
| :------------------------------- | :------------------- | :--------------------- |
| **Public Unauthenticated**       | 60 req / min         | Client IP              |
| **Authenticated Learner**        | 120 req / min        | User ID                |
| **Developer API Key**            | 300 req / min        | API Key ID             |
| **Course Catalog Search**        | 30 req / min         | Client IP or Client ID |
| **Auth Endpoints (Login/Reset)** | 10 attempts / 15 min | Normalized Email + IP  |
| **Payment Initiation**           | 10 attempts / min    | User ID                |
| **Refund Execution**             | 5 req / min          | Authorized Admin ID    |

### Transport & Query Limits

- **Maximum JSON Request Body**: 1 MB
- **Default Pagination**: 20 items per page
- **Maximum Page Size**: 100 items per page
- **Maximum Search Query String**: 128 characters
- **Batch Operation Size**: 100 items maximum

---

## 6. Standardized Machine-Readable Error Model (RFC 7807)

All API error responses adhere to the `application/problem+json` standard:

```json
{
  "type": "https://api.coursecity.com/problems/course-access-denied",
  "title": "Course access denied",
  "status": 403,
  "code": "COURSE_ACCESS_DENIED",
  "detail": "You do not have active entitlement or enrollment for this course.",
  "requestId": "req_01j7abc123456789",
  "retryable": false,
  "details": {
    "courseId": "01924b12-9876-7123-8abc-123456789abc",
    "requiredEntitlement": "PURCHASE"
  }
}
```

### Prohibited In Error Payloads

- Raw database exceptions or SQL queries.
- Stack traces or Node.js internal modules.
- Password verification details or account existence hints.
- Internal infrastructure network addresses.

---

## 7. Outbound Webhook Architecture

CourseCity dispatches signed webhooks for third-party developer integrations:

### Supported Outbound Events

- `payment.verified`, `payment.failed`
- `order.paid`, `refund.created`
- `entitlement.activated`, `enrollment.created`
- `course.published`, `assessment.completed`
- `certificate.issued`, `receipt.issued`

### Security & Delivery Invariants

- **Signature Header**: `CourseCity-Signature: t=1790947200,v1=abcdef...` computed via `HMAC-SHA256(timestamp + "." + payload, webhookSecret)`.
- **Replay Protection**: Webhook consumers reject events with timestamps older than 5 minutes.
- **Retry Strategy**: Bounded exponential backoff with jitter (5 retries over 24 hours).
- **Dead-Letter Handling**: Permanent delivery failures move to `dead_letter_events` for manual retry.
