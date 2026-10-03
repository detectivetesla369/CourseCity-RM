# COURSE CITY 1.0 — MASTER ARCHITECTURE V2 FROZEN AMENDMENT

## Architecture status

**STATUS: FROZEN — V2**

This amendment is now part of the authoritative CourseCity 1.0 master architecture. It supersedes and overrides any earlier statement in this document where there is a conflict.

No implementation prompt may weaken, omit or silently reinterpret these requirements. Any future change must be recorded as an Architecture Decision Record (ADR), with the affected scope, security impact, data impact, migration impact and reason for the change documented before implementation.

This amendment specifically strengthens the architecture around:

- race-condition prevention
- database concurrency and deadlock handling
- validation and input safety
- idempotency
- API scopes and limits
- payment references and reconciliation
- error handling
- entity and process lifecycles
- inbound and outbound webhooks
- maintenance/status operations
- Lucide icon consistency and accessibility
- operational safety and failure recovery

---

# A. FROZEN PRODUCT BOUNDARY

## A.1 Exact V1 learner capability

CourseCity 1.0 must provide the following learner features and no artificial Premium/Pro restrictions:

1. Account registration
2. Email verification
3. Sign in/sign out
4. Forgot/reset password
5. Session management
6. Profile management
7. Course catalogue
8. Course search
9. Category browsing
10. Filtering and sorting
11. Course preview/detail pages
12. Free-course access
13. Paid individual-course purchase
14. Payment confirmation
15. Order history
16. Payment history appropriate to the learner
17. Receipt generation and email delivery
18. Receipt verification
19. Course enrollment
20. Ebook/tutorial learning experience
21. Module and lesson navigation
22. Lesson completion
23. Course progress
24. Bookmarks
25. Personal notes
26. Learning history
27. Quizzes
28. Quiz attempts and results
29. Assignments
30. Assignment submission and grading
31. Examinations
32. Examination attempts and results
33. Grade/result viewing
34. Course completion evaluation
35. Certificate issuance where completion rules are met
36. Certificate verification
37. In-app notifications
38. Security/account notifications

The following are architecture-ready but explicitly outside active V1:

- Premium subscriptions
- Pro subscriptions
- video lessons
- live teaching
- instructor payouts
- affiliate systems
- reviews/ratings
- forums/community
- AI tutor
- gamification
- enterprise LMS features
- production mobile application
- mobile offline course storage

---

# B. FROZEN MARKETPLACE / PUBLISHER MODEL

## B.1 Publisher types

A `publisher` is the ownership and commercial identity attached to a course. A course must not use a simple `created_by_user_id` as its ownership model.

Publisher types:

```text
PLATFORM
INSTRUCTOR
ORGANIZATION
```

### PLATFORM

CourseCity-owned courses.

### INSTRUCTOR

An individual instructor or educator approved by CourseCity.

### ORGANIZATION

A school, company, institution, training provider or other legal/business entity.

## B.2 Publisher relationships

An organization may have multiple members.

Supported organization/publisher responsibilities include:

```text
OWNER
ADMIN
INSTRUCTOR
CONTENT_EDITOR
FINANCE_MEMBER
ANALYTICS_MEMBER
```

Access is always restricted to the publisher/organization to which the member belongs.

Global role equality must never imply cross-organization access.

## B.3 Course ownership

```text
Publisher
  -> Course
      -> CourseVersion
          -> Modules
              -> Lessons
                  -> LessonBlocks
```

A course may have multiple instructors through `course_instructors`.

Course publishing must use explicit states and must not make drafts publicly accessible.

## B.4 Course lifecycle

```text
DRAFT
  -> IN_REVIEW
  -> APPROVED
  -> PUBLISHED
  -> UNPUBLISHED
  -> ARCHIVED
  -> SUSPENDED
```

Not every transition is available to every role.

Example:

- publisher creates/edits DRAFT
- authorized reviewer may move IN_REVIEW -> APPROVED
- authorized publisher/admin moves APPROVED -> PUBLISHED
- platform administration may SUSPEND
- archived courses remain historically referencable where necessary but are not newly purchasable unless explicitly restored

---

# C. FROZEN DATABASE EXPANSIONS

In addition to the existing domain entities in the original architecture, the following are now explicitly required where applicable:

## Commerce and reconciliation

```text
payment_reconciliations
payment_reference_links
refund_events
```

## Idempotency and concurrency

```text
idempotency_keys
resource_versions
```

A separate persistent lock table is not the default concurrency mechanism. PostgreSQL row locks, constraints, transaction isolation and short-lived advisory locks are preferred where justified.

## Webhooks and event delivery

```text
webhook_events
webhook_delivery_attempts
dead_letter_events
```

## Maintenance/status

```text
maintenance_windows
system_status_events
service_status_snapshots
incidents
```

## Operational reliability

```text
background_job_runs
reconciliation_runs
```

Existing `outbox_events`, `background_jobs`, `audit_logs` and `security_events` remain part of the architecture.

All new tables require normal ownership, timestamps, retention rules, indexes and foreign-key decisions as appropriate.

---

# D. FROZEN IDENTIFIER AND REFERENCE MODEL

CourseCity must distinguish internal database identifiers from business references.

At minimum:

```text
Internal record ID
CourseCity Order Reference
CourseCity Payment Reference
Provider Payment Reference
Provider Transaction ID
Provider Webhook Event ID
Receipt ID
Certificate ID
API Client ID
API Key ID
Idempotency Key
Webhook Delivery ID
```

Example formats are illustrative only:

```text
CC-ORD-...
CC-PAY-...
CC-RCP-...
CC-CERT-...
```

These references must not be used interchangeably.

## D.1 Payment reference rules

A successful payment record must be traceable across:

```text
CourseCity Order
      <->
CourseCity Payment
      <->
Provider Reference
      <->
Provider Transaction ID
      <->
Provider Webhook Event
      <->
Receipt
      <->
Entitlement
      <->
Enrollment
```

Where the provider supports a unique transaction reference, store it with a database uniqueness constraint where the provider's semantics allow it.

A webhook event ID must be deduplicated.

A CourseCity order may not be finalized twice.

A receipt may not be issued twice for the same finalized payment unless an explicitly versioned replacement/reissue workflow exists.

---

# E. FROZEN LIFECYCLE STATE MACHINES

Every important business process must have an explicit lifecycle and permitted transitions.

## E.1 User account

```text
PENDING_VERIFICATION
ACTIVE
SUSPENDED
DEACTIVATED
```

## E.2 Session

```text
ACTIVE
REVOKED
EXPIRED
REPLACED
```

## E.3 Course

```text
DRAFT
IN_REVIEW
APPROVED
PUBLISHED
UNPUBLISHED
ARCHIVED
SUSPENDED
```

## E.4 Course version

```text
DRAFT
READY_FOR_REVIEW
PUBLISHED
SUPERSEDED
ARCHIVED
```

## E.5 Order

```text
CREATED
PENDING_PAYMENT
PAID
CANCELLED
REFUND_PENDING
REFUNDED
PAYMENT_FAILED
```

## E.6 Payment

```text
INITIATED
PENDING
VERIFIED
FAILED
CANCEL_PENDING
REFUND_PENDING
REFUNDED
RECONCILIATION_REQUIRED
```

## E.7 Payment reconciliation

```text
UNRECONCILED
MATCHED
RECONCILED
MISMATCH
REQUIRES_REVIEW
RESOLVED
```

## E.8 Entitlement

```text
PENDING
ACTIVE
SUSPENDED
REVOKED
EXPIRED
```

## E.9 Enrollment

```text
PENDING
ACTIVE
COMPLETED
SUSPENDED
CANCELLED
```

## E.10 Assessment attempt

```text
NOT_STARTED
IN_PROGRESS
SUBMITTED
GRADING
GRADED
VOIDED
EXPIRED
```

## E.11 Assignment submission

```text
DRAFT
SUBMITTED
UNDER_REVIEW
GRADED
RETURNED
LATE
CANCELLED
```

## E.12 Examination attempt

```text
SCHEDULED
IN_PROGRESS
SUBMITTED
TIMED_OUT
UNDER_REVIEW
GRADED
VOIDED
```

## E.13 Receipt

```text
GENERATING
ISSUED
DELIVERED
VERIFIED
REVOKED
SUPERSEDED
```

## E.14 Certificate

```text
PENDING
ISSUED
VERIFIED
REVOKED
SUPERSEDED
```

## E.15 API key

```text
ACTIVE
EXPIRING
EXPIRED
REVOKED
```

## E.16 Webhook delivery

```text
PENDING
PROCESSING
DELIVERED
RETRYING
FAILED
DEAD_LETTER
DISABLED
```

## E.17 Background job

```text
QUEUED
RUNNING
SUCCEEDED
RETRYING
FAILED
CANCELLED
DEAD_LETTER
```

## E.18 Incident

```text
OPEN
INVESTIGATING
MITIGATING
MONITORING
RESOLVED
CLOSED
```

State changes must be validated server-side. Clients must never submit arbitrary status values to bypass transition rules.

Every important state transition should be auditable.

---

# F. FROZEN INPUT AND DATA VALIDATION MODEL

Validation exists at multiple layers.

```text
Transport validation
      ->
Application/domain validation
      ->
Authorization
      ->
Database constraints
```

All external input must be treated as untrusted.

Required practices:

- Zod schemas for request validation
- strict request body schemas
- explicit allowed fields
- protection against mass assignment
- length limits
- numeric bounds
- enum/status validation
- pagination limits
- filter validation
- sort-field allowlists
- search-length limits
- file-size limits
- file-type/content validation
- safe URL validation
- email normalization/validation
- Unicode-aware text handling
- HTML sanitization for rich content where HTML is permitted
- parameterized database queries
- output escaping/encoding at rendering boundaries

The database must still enforce critical invariants using:

- NOT NULL constraints
- UNIQUE constraints
- CHECK constraints
- FOREIGN KEY constraints
- suitable indexes

Application validation must never be treated as a replacement for database constraints.

---

# G. FROZEN CONCURRENCY / RACE-CONDITION PROTECTION

CourseCity must be designed to remain correct when multiple requests attempt to modify the same resource simultaneously.

## G.1 General rule

Use the database as the final authority for state consistency.

Do not rely on:

```text
if (!exists) create
```

without a unique constraint or transaction-safe approach.

## G.2 Required techniques

Use where appropriate:

- unique database constraints
- transactions
- row-level locks
- `SELECT ... FOR UPDATE` for short critical sections
- optimistic version checks for concurrent edits
- conditional updates
- idempotency keys
- atomic SQL operations
- outbox pattern
- queue deduplication

## G.3 Payment/order finalization

Payment finalization must be safe when:

- browser callback and webhook arrive close together
- duplicate webhooks arrive
- webhook retry occurs
- reconciliation job runs at the same time
- an administrator manually reviews the transaction

Only one authoritative finalization path may create the final entitlement/enrollment chain.

Use database uniqueness and transaction boundaries as the final protection against duplicates.

## G.4 Progress updates

Progress writes must not allow stale devices or concurrent tabs to move progress backward unexpectedly.

Where appropriate, use version numbers or monotonic progress rules.

Example:

```text
new progress < stored progress
```

must not overwrite newer progress unless an explicit correction flow exists.

---

# H. FROZEN DEADLOCK / TRANSACTION RULES

## H.1 Do not hold database transactions open across network calls

Never perform these inside a database transaction unless there is a documented, exceptional reason:

- Paystack API calls
- email provider calls
- WhatsApp provider calls
- object storage calls
- third-party HTTP requests

The pattern should be:

```text
short database transaction
        -> commit
        -> queue external work
```

## H.2 Consistent lock ordering

When a workflow must lock multiple rows, it must use a deterministic order.

Example:

```text
Order
then Payment
then Entitlement
then Enrollment
```

Do not allow one code path to lock them in a different order.

## H.3 Deadlock handling

If PostgreSQL reports a serialization/deadlock failure:

- retry only when the transaction is known to be safe to retry
- use bounded exponential backoff with jitter
- limit retry count
- generate telemetry
- do not blindly retry all database failures

## H.4 Transaction size

Transactions should be short and focused.

Do not perform large report generation, rendering, email generation or file processing inside the same transaction as financial state mutation.

---

# I. FROZEN IDEMPOTENCY MODEL

Idempotency is required for operations where a retry can create duplicate financial, entitlement or externally visible effects.

Create an `idempotency_keys` table with, at minimum, conceptual fields:

```text
id
scope
key
actor_id / client_id
request_hash
status
response_status
response_body_reference
resource_type
resource_id
expires_at
created_at
completed_at
```

A uniqueness rule must apply to the appropriate combination of actor/client + scope + key.

## I.1 Request behavior

First request:

```text
no key found
 -> execute safely
 -> store result
```

Retry with same key and same request:

```text
return previously stored result where safe
```

Retry with same key but different request payload:

```text
409 IDEMPOTENCY_KEY_REUSED
```

Concurrent requests using the same key must not create duplicate resources.

## I.2 Idempotency TTL

General idempotency records should remain available for at least 24 hours.

Payment/refund-related idempotency records should use a longer configurable retention period, with a default target of at least 72 hours.

Financial/event deduplication records may require longer retention according to reconciliation requirements.

---

# J. FROZEN API SCOPES AND LIMITS

API scope names must be explicit and least-privilege.

## J.1 Public catalog scopes

```text
catalog:read
courses:read
categories:read
publishers:read
```

## J.2 Learner scopes

```text
profile:read
profile:write
enrollments:read
progress:read
progress:write
bookmarks:read
bookmarks:write
notes:read
notes:write
assessments:read
assessments:attempt
assignments:read
assignments:submit
examinations:read
examinations:attempt
grades:read
certificates:read
receipts:read
receipts:verify
orders:read
payments:read
```

## J.3 Commerce creation scope

```text
orders:create
```

Payment initiation and finalization still require server-side authorization and validation. Scope presence alone is not sufficient.

## J.4 Publisher scopes

```text
publisher:read
courses:manage
content:manage
assessments:manage
learners:read
analytics:read
```

## J.5 Restricted finance scopes

```text
finance:read
refunds:create
payouts:read
```

`payouts:read` remains reserved for future marketplace operations.

## J.6 API rate limits — initial policy

These are configurable starting policies, not permanent guarantees:

```text
Public unauthenticated API:
  60 requests/minute/IP

Authenticated learner API:
  120 requests/minute/user

Developer API key:
  300 requests/minute/key

Search/catalog endpoints:
  30 requests/minute/IP or client, as appropriate

Authentication endpoints:
  10 sensitive attempts/15 minutes/account+IP combination, with progressive controls

Payment initiation:
  10 attempts/minute/user, subject to business rules

Refund creation:
  5 requests/minute/authorized actor
```

Limits must be configurable by policy, role and client.

Rate-limit responses must include `Retry-After` when appropriate and a safe limit indicator.

Do not use rate limiting as the only security control.

## J.7 Request and pagination limits

Starting defaults:

```text
JSON request body: 1 MB maximum
Standard page size: 20
Maximum page size: 100
Search query: 128 characters
Bulk request: 100 items unless an endpoint defines a justified lower limit
```

Large exports must be asynchronous.

File uploads should use direct object storage upload workflows where appropriate rather than large API request bodies.

All endpoint limits must be documented in OpenAPI.

---

# K. FROZEN API ERROR MODEL

All API errors must use a consistent machine-readable structure.

Preferred shape:

```json
{
  "type": "https://api.coursecity.com/problems/course-access-denied",
  "title": "Course access denied",
  "status": 403,
  "code": "COURSE_ACCESS_DENIED",
  "detail": "You do not have access to this course.",
  "requestId": "...",
  "retryable": false,
  "details": {}
}
```

Content type should be compatible with `application/problem+json` where appropriate.

Rules:

- never expose stack traces to clients
- never expose SQL errors
- never expose secrets
- do not disclose whether another user's private account exists
- do not reveal password/account enumeration information
- keep `code` stable for client integration
- use suitable HTTP status codes
- distinguish retryable from non-retryable failures
- log detailed internal diagnostic information server-side

Important error codes should be documented.

Examples:

```text
VALIDATION_ERROR
AUTHENTICATION_REQUIRED
AUTHENTICATION_FAILED
FORBIDDEN
RESOURCE_NOT_FOUND
RESOURCE_STATE_CONFLICT
IDEMPOTENCY_KEY_REUSED
RATE_LIMITED
PAYMENT_REFERENCE_INVALID
PAYMENT_VERIFICATION_FAILED
PAYMENT_ALREADY_FINALIZED
ENTITLEMENT_NOT_ACTIVE
RECEIPT_NOT_VERIFIED
RECEIPT_REVOKED
WEBHOOK_SIGNATURE_INVALID
MAINTENANCE_MODE
CONCURRENCY_CONFLICT
DEPENDENCY_UNAVAILABLE
```

---

# L. FROZEN WEBHOOK ARCHITECTURE

There are two webhook categories:

1. inbound provider webhooks
2. outbound CourseCity webhooks for approved developer integrations

## L.1 Inbound provider webhooks

For payments and other providers:

1. receive request
2. validate content type/size
3. verify provider signature according to official provider instructions
4. record event identity
5. reject duplicate events safely
6. persist sufficient event metadata
7. acknowledge safely
8. process through a controlled worker where appropriate
9. finalize state through idempotent transaction logic

Do not trust a webhook merely because it comes from a known URL.

## L.2 Outbound CourseCity webhooks

Support at minimum:

```text
payment.verified
payment.failed
order.paid
refund.created
entitlement.activated
enrollment.created
course.published
assessment.completed
certificate.issued
receipt.issued
```

Delivery fields include:

```text
event_id
webhook_id
event_type
version
created_at
attempt_number
```

Use HMAC signing.

Include a timestamp in the signed material.

Reject/retry according to timestamp tolerance and delivery policy.

## L.3 Retry policy

Use bounded exponential backoff with jitter.

After the maximum retry policy is exhausted:

```text
FAILED -> DEAD_LETTER
```

Dead-letter events must remain inspectable and replayable by authorized administrators.

---

# M. FROZEN OUTBOX AND EVENT MODEL

Critical database state changes that require asynchronous side effects must use an outbox pattern.

Example:

```text
Database transaction
  -> update payment
  -> create entitlement
  -> create enrollment
  -> insert outbox event
  -> commit

Worker
  -> read outbox
  -> generate receipt
  -> send email
  -> notify WhatsApp
  -> record results
```

This prevents the system from committing a payment while losing the event needed to issue the receipt.

Outbox records must have delivery state and retry behavior.

---

# N. FROZEN MAINTENANCE AND SYSTEM STATUS MODEL

Maintenance must be a first-class feature rather than an emergency code edit.

## N.1 System status states

```text
OPERATIONAL
DEGRADED
MAINTENANCE
READ_ONLY
DISABLED
INCIDENT
```

## N.2 Component status

Track status independently for important dependencies:

```text
WEB
API
DATABASE
REDIS
PAYMENTS
EMAIL
WHATSAPP
STORAGE
BACKGROUND_JOBS
```

The application should be able to report when a dependency is unavailable without incorrectly claiming the whole platform is down.

## N.3 Maintenance scopes

Maintenance may apply to:

- entire platform
- public website
- learner writes
- checkout/payment
- publishing
- admin
- developer API
- selected services

## N.4 Maintenance behavior

If payment services are unavailable:

- do not pretend payment succeeded
- clearly explain that checkout is temporarily unavailable
- preserve existing learner access

If a read-only mode is active:

- reading public/authorized content may continue where safe
- writes are rejected with a documented maintenance/read-only error
- cached public information may remain available if safe

Maintenance state must be enforced server-side.

---

# O. FROZEN STATUS / AVAILABILITY SURFACE

Provide a status endpoint or status surface suitable for operations, with information that is safe to expose publicly.

Internally, health/readiness endpoints may expose more dependency detail to trusted infrastructure only.

Public status information must not expose:

- database credentials
- internal network addresses
- stack traces
- secrets
- sensitive infrastructure topology

Maintenance windows must be schedulable, auditable and reversible.

---

# P. FROZEN AUDIT / TRACEABILITY RULES

Every financially or security-sensitive action must be traceable through a request chain.

At minimum, propagate:

```text
requestId
actorId where applicable
clientId/API key ID where applicable
resourceId
operation
```

Payment-related records should be cross-referenceable by:

```text
order reference
payment reference
provider reference
provider transaction ID
webhook event ID
receipt ID
```

Never require an administrator to search manually through unstructured logs to prove whether a payment was processed.

---

# Q. FROZEN DATA RETENTION / DELETION PRINCIPLES

Retention must be defined per data category.

Examples:

- authentication tokens: short-lived
- idempotency records: bounded retention
- financial/payment records: longer retention according to applicable business/legal requirements
- audit/security events: defined retention policy
- temporary uploads: automatic cleanup
- webhook deliveries: enough history for troubleshooting/replay policy

User deletion/anonymization must not destroy records that legally/business-wise must remain for accounting, fraud, audit or transaction traceability. Use appropriate anonymization/reference strategies instead.

The exact retention schedule must be documented with legal/accounting input where required.

---

# R. FROZEN LUCIDE ICON SYSTEM

CourseCity uses Lucide Icons as the standard icon library.

Icons should visually resemble the supplied example:

- outline/stroke based
- `fill="none"`
- `stroke="currentColor"`
- rounded line caps
- rounded line joins
- approximately 2px stroke by default
- simple, clear geometry
- consistent visual weight

Typical rendered sizes:

```text
16px — dense metadata
18px — compact controls
20px — standard UI
24px — primary UI/icon buttons
```

The default behavior should be equivalent to Lucide's SVG structure, for example conceptually:

```html
<svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
></svg>
```

Use the Lucide React component rather than manually copying SVG markup for standard icons.

Example:

```tsx
<ShieldCheck className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
```

For interactive icons, the accessible name belongs on the button/control when visible text is absent.

Decorative icons should use `aria-hidden="true"`.

Do not use emojis as substitutes for interface icons.

Do not mix several unrelated icon libraries.

Do not manually draw a custom SVG when an appropriate Lucide icon exists.

Custom brand icons may be introduced only when documented as deliberate brand assets.

Icon behavior must remain responsive and touch-friendly. The visible icon may be 20-24px while the interactive touch target should normally be approximately 44x44 CSS pixels or better.

---

# S. FROZEN HIGH-RISK INVARIANTS

The following are absolute rules:

1. A frontend cannot mark a payment successful.
2. A frontend cannot grant an entitlement.
3. A frontend cannot mark a certificate as issued.
4. A frontend cannot change an administrative role.
5. A frontend cannot bypass a publisher boundary.
6. A fake receipt cannot be considered authentic because it visually matches CourseCity.
7. A webhook cannot be processed twice into two financial outcomes.
8. A retry cannot create duplicate order/payment/entitlement/receipt side effects.
9. A stale concurrent update cannot silently overwrite newer protected state.
10. Database transactions cannot remain open while waiting on third-party HTTP calls.
11. Redis is never the sole source of truth for durable financial state.
12. PostgreSQL/transaction constraints are the final authority for critical invariants.
13. Maintenance mode cannot be bypassed by calling the API directly.
14. API scope alone cannot grant access outside resource ownership/entitlement.
15. Provider reference, CourseCity reference, receipt ID and webhook event ID must not be conflated.

---

# T. FROZEN IMPLEMENTATION ORDER

Before implementation prompts are written, coding agents must work from the following order:

```text
Architecture
  -> Data model
  -> State machines
  -> Security boundaries
  -> API contracts
  -> Idempotency/concurrency rules
  -> Payment/reconciliation rules
  -> Webhook/outbox rules
  -> UI/design system
  -> Feature implementation
  -> Testing
  -> Production hardening
```

Do not begin with the landing page and retrofit security later.

Do not implement payment flow before defining order/payment/entitlement lifecycles.

Do not implement publisher functionality before defining scope and resource ownership.

Do not expose an API before defining authentication, scopes, validation, limits and error behavior.

---

# U. ARCHITECTURE CHANGE CONTROL

This V2 frozen architecture is the authoritative baseline for the next implementation prompt.

Any requested future change must answer:

1. What requirement changed?
2. Why can the current architecture not satisfy it?
3. What tables/data are affected?
4. What security boundaries are affected?
5. What API contracts are affected?
6. What migrations are required?
7. What backward compatibility concerns exist?
8. What operational risks are introduced?
9. What testing must change?

Only after this is recorded in an ADR may the implementation prompt be changed.

---

# COURSE CITY 1.0 — MASTER SYSTEMS ARCHITECTURE, IMPLEMENTATION AND DELIVERY PROMPT

## Target coding agents

This master prompt is intended to be used with Claude Opus 5.5 and Gemini 3.8 Flash as autonomous coding agents working in the CourseCity repository.

Use the model-specific operating instructions near the end of this document to divide work between architectural review, security review, implementation, refactoring, testing and verification.

---

# 0. MISSION

You are building **CourseCity 1.0**, a production-grade, API-first learning platform and future multi-publisher course marketplace.

CourseCity must initially provide a complete learner experience around ebook/tutorial-based courses. Video courses will be added later without replacing the learning architecture. The platform must eventually support individual instructors and organizations publishing and selling courses through CourseCity.

The first client is a responsive Next.js web application. A React Native + Expo mobile application is a planned future client of the same API and shared contracts.

The system must be designed around the following principle:

> The web application, mobile application and future third-party applications are clients of CourseCity. The CourseCity API and domain services are authoritative for authentication, authorization, payments, entitlements, learning access, grading, receipts, certificates and marketplace data.

Do not implement a frontend-controlled architecture where the browser decides whether a user owns content, has paid, is Premium, is an administrator, or is entitled to a resource.

---

# 1. NON-NEGOTIABLE ENGINEERING PRINCIPLES

1. Security is a first-class architectural concern, not a final checklist.
2. Mobile-first responsive design is mandatory.
3. All functionality must work across phones, tablets, laptops, desktops and large displays.
4. The API is versioned and documented with OpenAPI 3.1.
5. PostgreSQL is the source of truth for durable application state.
6. Redis is used for cache, ephemeral state, rate limits and job coordination where appropriate.
7. Background jobs must use BullMQ or an equivalent Redis-backed queue.
8. Payment confirmation must come from verified payment-provider events, not the browser redirect.
9. Receipt authenticity must be cryptographic and server-verifiable. Visual anti-counterfeit elements are secondary.
10. OpenClaw or any other automation agent may orchestrate notifications, but it can never be authoritative for payment or receipt authenticity.
11. API keys are hashed at rest and scoped.
12. Privileged users use MFA and stronger session controls.
13. Sensitive actions are auditable.
14. No secrets in source code, frontend bundles, logs, Git history or database plaintext fields unless explicitly designed for secret storage.
15. Do not make up external-provider request/response formats. Read official provider documentation or clearly isolate unknown integrations behind interfaces.
16. Do not claim a task is complete unless the relevant tests/build/lint/typecheck/security checks were actually run.
17. Never silently change the frozen architecture. Any required architectural change must be written as an ADR and explicitly surfaced before implementation proceeds.
18. Prefer simple, explicit, maintainable systems over clever abstractions.
19. Do not build unnecessary V1 functionality merely because the architecture supports it.
20. Keep the codebase suitable for future migration from one infrastructure provider to another.

---

# 2. PRODUCT DEFINITION

## 2.1 CourseCity V1 learner experience

V1 is intentionally a complete first-generation learning platform without artificial Premium/Pro restrictions.

A normal registered learner may:

- create an account
- verify email
- sign in/out
- reset a forgotten password
- manage profile and sessions
- browse the course catalogue
- search courses
- filter and sort courses
- open course detail pages
- preview courses
- purchase paid courses
- receive a payment confirmation
- receive a CourseCity receipt by email
- receive a notification that the receipt was sent
- access a purchased/enrolled course after server-side payment verification
- read ebook/tutorial lessons
- navigate modules and lessons
- track lesson progress
- track course progress
- bookmark content
- create personal notes
- view learning history
- take quizzes
- submit assignments
- take examinations
- receive grades/results
- complete a course
- receive a verifiable certificate where the configured completion requirements are satisfied
- verify receipts and certificates publicly

## 2.2 Explicitly deferred from the active V1 product scope

Do not implement these as active V1 requirements unless specifically instructed later:

- Premium subscription billing
- Pro subscription billing
- video lessons
- live classes
- instructor payouts
- affiliate systems
- reviews/ratings
- community forums
- AI tutor
- gamification
- enterprise LMS features
- native mobile app production release
- offline mobile course storage

The architecture must remain ready for these capabilities.

---

# 3. COMMERCIAL MODEL

V1 supports:

- free courses
- paid individual courses

The intended payment flow is:

```text
Learner
  -> CourseCity creates Order
  -> Payment initialized
  -> Paystack checkout
  -> Payment provider webhook
  -> CourseCity verifies transaction independently
  -> Payment = VERIFIED
  -> Order = PAID
  -> Entitlement = ACTIVE
  -> Enrollment = CREATED
  -> Receipt = ISSUED
  -> Receipt email sent
  -> In-app notification created
  -> optional WhatsApp operational notification
```

Do not grant course access solely because a client reports `success=true`.

The browser callback is a UX signal only. The backend must independently verify the transaction with the payment provider according to the current official Paystack documentation.

Premium and Pro must be represented architecturally through plans, features, access policies and entitlements, but must not artificially restrict V1's normal learner experience.

---

# 4. MULTI-PUBLISHER / MARKETPLACE ARCHITECTURE

CourseCity will eventually allow:

1. CourseCity itself to publish courses.
2. Individual instructors to publish courses.
3. Organizations/institutions to publish courses.

Do not model course ownership as simply `course.user_id`.

Use a publisher abstraction.

Conceptually:

```text
Publisher
  |- CourseCity platform publisher
  |- Individual instructor publisher
  |- Organization publisher

Course
  -> Publisher
  -> one or more instructors
  -> one or more categories
  -> one active/published version
  -> modules
  -> lessons
  -> resources
  -> assessments
```

Organizations may contain members such as:

- Owner
- Organization Admin
- Instructor
- Content Editor
- Finance Member
- Analytics Member

Permissions must be scoped to the appropriate publisher/organization.

An instructor in Organization A must never gain access to Organization B merely because they have the same global role name.

Future marketplace settlement can add:

- seller accounts
- commission rules
- platform fees
- seller balances
- payout schedules
- payouts
- tax records

but those are not active V1 requirements.

---

# 5. FROZEN TECHNOLOGY STACK

Use the following architectural stack. Check current stable package versions at implementation time from official package documentation, but do not substitute technologies without an ADR.

## Web

- Next.js
- React
- TypeScript
- Tailwind CSS
- CSS variables/design tokens
- Lucide React
- Radix-based accessible primitives where appropriate

## Backend

- Node.js LTS
- Fastify
- TypeScript
- Zod schemas with Fastify integration
- OpenAPI 3.1

## Database

- PostgreSQL
- Kysely for typed SQL/data access
- Kysely migrations or another explicit migration framework approved in an ADR

Do not use uncontrolled ad-hoc SQL migrations in production.

## Cache and jobs

- Redis
- BullMQ

## API documentation

- OpenAPI 3.1
- Scalar or equivalent developer-facing documentation UI

## Payments

- Paystack initially
- provider implementation behind `IPaymentProvider`

## Storage

- S3-compatible object storage
- Cloudflare R2 or equivalent is preferred for media/assets

## Email

- Transactional email provider behind `IEmailProvider`

## WhatsApp

- Official WhatsApp Business API/provider behind `IWhatsAppProvider`

## Web animation

- GSAP
- ScrollTrigger

## 3D

- Three.js
- React Three Fiber
- Drei
- GLB/glTF assets

## Deployment

- Docker
- Docker Compose where appropriate
- Hostinger KVM 2 initially
- Caddy as reverse proxy
- Cloudflare for DNS/CDN/WAF/TLS

## Testing

- Vitest
- API integration tests
- Playwright
- accessibility checks where practical

## Observability

- Sentry or equivalent error tracking
- structured logs using Pino or equivalent
- health and readiness endpoints
- uptime monitoring

## CI/CD

- GitHub Actions

## Future mobile

- React Native
- Expo
- Expo Router
- TypeScript

---

# 6. MONOREPO STRUCTURE

Create and maintain the following structure unless an ADR approves a deliberate change:

```text
coursecity/
├── apps/
│   ├── web/
│   ├── api/
│   └── mobile/                         # future client; scaffold only when the mobile phase begins
│
├── packages/
│   ├── contracts/                      # API/domain DTOs and shared contracts
│   ├── api-client/                     # typed client used by web/mobile
│   ├── validation/                     # shared Zod schemas
│   ├── database/                       # DB types/helpers where appropriate
│   ├── auth/                           # shared auth-related types/helpers
│   ├── design-system/
│   ├── design-tokens/
│   └── shared/
│
├── infrastructure/
│   ├── docker/
│   ├── caddy/
│   ├── postgres/
│   ├── redis/
│   └── monitoring/
│
├── docs/
│   ├── architecture/
│   ├── adr/
│   ├── api/
│   ├── security/
│   ├── product/
│   └── runbooks/
│
├── scripts/
├── .github/
│   └── workflows/
│
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

Use pnpm workspaces and Turborepo unless an ADR demonstrates a concrete reason not to.

---

# 7. DATABASE DOMAIN MODEL

The following entities are the architectural baseline.

## Identity

```text
users
user_profiles
sessions
refresh_tokens
email_verification_tokens
password_reset_tokens
```

## Roles and permissions

```text
roles
permissions
role_permissions
user_roles
```

## Publishers

```text
publishers
instructor_profiles
organizations
organization_members
publisher_members
```

## Courses

```text
courses
course_versions
course_categories
course_category_links
course_instructors
course_modules
lessons
lesson_blocks
course_assets
```

## Commerce

```text
products
prices
course_offerings
orders
order_items
payments
payment_events
refunds
entitlements
```

## Learning

```text
enrollments
lesson_progress
course_progress
bookmarks
learner_notes
learning_activity
```

## Assessments

```text
assessments
assessment_questions
question_options
assessment_attempts
assessment_answers
assessment_results
assignments
assignment_submissions
assignment_grades
examinations
examination_attempts
examination_answers
examination_results
gradebook_entries
grading_rules
```

## Credentials

```text
certificates
certificate_events
```

## Receipts

```text
receipts
receipt_events
receipt_verifications
receipt_signing_keys
```

## API platform

```text
api_clients
api_keys
api_scopes
api_key_scopes
api_usage_events
webhook_endpoints
webhook_deliveries
```

## Notifications

```text
notifications
notification_preferences
email_events
whatsapp_events
```

## Security/audit

```text
audit_logs
security_events
admin_actions
```

## Platform operations

```text
system_settings
feature_flags
outbox_events
background_jobs
```

Use UUIDv7 internally where practical for public-facing distributed IDs. Do not expose sequential database IDs unnecessarily.

Human-friendly business identifiers should be separate from internal IDs.

---

# 8. COURSE DATA MODEL RULES

Courses must be versionable.

Conceptual structure:

```text
Publisher
  -> Course
      -> CourseVersion
          -> Module
              -> Lesson
                  -> ContentBlocks
```

A course must not store the complete curriculum as a single unstructured HTML field.

Lesson content blocks should support at least:

- heading
- paragraph
- image
- code
- table
- callout
- quote
- diagram
- formula
- resource
- exercise

The architecture must later accommodate:

- video block
- audio block
- interactive block
- quiz block
- assignment block

Published course versions must be immutable enough to preserve learning history. A learner's completion record must reference the relevant course version.

---

# 9. AUTHENTICATION AND SESSION ARCHITECTURE

Implement:

```text
POST /api/v1/auth/signup
POST /api/v1/auth/signin
POST /api/v1/auth/signout
POST /api/v1/auth/refresh
POST /api/v1/auth/verify-email
POST /api/v1/auth/resend-verification
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
GET  /api/v1/auth/me
GET  /api/v1/auth/sessions
DELETE /api/v1/auth/sessions/:id
POST /api/v1/auth/change-password
```

Use Argon2id for password hashing.

Use:

- short-lived access credentials
- rotating refresh tokens
- server-side refresh-session records
- refresh token hashing at rest
- refresh-token reuse detection
- session revocation
- secure HttpOnly cookies for the web where appropriate
- Secure cookies
- appropriate SameSite policy
- secure device storage for mobile in the future

Do not put long-lived authentication secrets in localStorage.

For browser cookie-authenticated state-changing requests, implement appropriate CSRF protection.

For privileged accounts, require MFA before privileged actions.

Password reset:

- token is random and high entropy
- store only a hash
- single use
- short expiration
- invalidate after password change
- invalidate/rotate sessions after password reset as appropriate

Email verification tokens follow the same principles.

---

# 10. AUTHORIZATION MODEL

CourseCity uses RBAC + fine-grained permissions + resource scoping.

Do not use role names as the only security check.

Example permission format:

```text
courses.read
courses.create
courses.update
courses.delete
courses.publish

users.read
users.manage
users.suspend

payments.read
refunds.create

finance.read

staff.invite
staff.remove

roles.manage
permissions.manage

api.clients.manage
api.keys.manage

receipts.verify
receipts.revoke
```

Authorization must also evaluate resource ownership/scope where applicable.

Example:

```text
Instructor A
  -> course.create
  -> course.update

BUT
  -> only for courses belonging to Publisher A
```

SuperAdmin may be globally scoped.

Admin permissions should be operational and limited relative to SuperAdmin.

Finance administrators may issue refunds, but every refund must record:

- actor
- order/payment
- amount
- reason
- timestamp
- provider result
- audit metadata

---

# 11. ROLE BASELINE

## Learner

Can:

- access public catalogue
- manage own account
- access entitled/enrolled learning resources
- attempt allowed assessments
- submit assignments
- view own results
- view own receipts/certificates

## Instructor

Can manage courses/content/assessments within assigned publisher scope.

## Organization Member roles

Organization Owner, Organization Admin, Instructor, Content Editor, Finance Member, Analytics Member.

## Admin

Operational platform role.

## Finance Admin

Financial operational role.

## SuperAdmin

Highest platform role with system-wide authorization.

Never make SuperAdmin a frontend-only concept.

---

# 12. ENTITLEMENT MODEL

Never gate protected learning content solely in React.

The server must resolve:

```text
Authentication
  -> User
  -> Entitlement
  -> Enrollment
  -> Course access
  -> Lesson access
```

V1 entitlement sources may include:

- verified purchase
- free course enrollment
- administrator-approved access

Future entitlement sources can include:

- Premium subscription
- Pro subscription
- organization enrollment
- promotion/coupon
- instructor-issued access

Create a dedicated entitlement/access-policy abstraction so Premium/Pro can be added later without scattering plan checks throughout the codebase.

---

# 13. PAYMENT ARCHITECTURE

Define:

```text
IPaymentProvider
```

Paystack is the first implementation.

Payment lifecycle:

```text
INITIATED
PENDING
VERIFIED
FAILED
REFUNDED
```

Order lifecycle:

```text
CREATED
PENDING_PAYMENT
PAID
CANCELLED
REFUNDED
```

Entitlement lifecycle:

```text
PENDING
ACTIVE
SUSPENDED
REVOKED
EXPIRED
```

Do not collapse all three lifecycles into one status enum.

Payment verification must validate at minimum, subject to official provider requirements:

- provider reference
- transaction identity
- expected amount
- expected currency
- correct customer/order mapping
- successful provider status
- webhook authenticity
- idempotency/replay protection

Use the provider's official webhook signature verification method.

Persist provider events sufficiently for reconciliation/audit.

---

# 14. RECEIPT SYSTEM

CourseCity receipts are cryptographically verifiable digital records.

A receipt contains:

- CourseCity identity
- Receipt ID
- Order ID
- Payment ID
- issue date/time
- purchased item(s)
- amount
- currency
- customer reference
- publisher information where appropriate
- receipt version
- verification URL
- QR code
- receipt fingerprint
- integrity/signature metadata as appropriate

Receipt generation flow:

```text
Verified payment
  -> canonical receipt payload
  -> payload hash
  -> Ed25519 signature
  -> immutable receipt record
  -> PDF/document representation
  -> email
  -> notification
  -> optional WhatsApp operational event
```

The private signing key must never be embedded in the frontend, receipt, PDF generator, repository or ordinary database fields.

Use a proper secret/key-management approach. If a full HSM/KMS is unavailable on the initial VPS deployment, isolate the signing key in an encrypted secrets mechanism and design a migration path to managed KMS/HSM.

Receipt IDs should be unique, non-guessable and human-verifiable.

---

# 15. RECEIPT VERIFICATION SERVICE

Create a public verification surface:

```text
https://verify.coursecity.com/r/:receiptId
```

Also provide an API equivalent.

Verification checks:

```text
receipt exists
payment exists
payment is verified
order matches
receipt payload matches stored canonical form
signature validates
receipt not revoked
```

Possible results:

```text
VERIFIED
NOT_FOUND
INVALID
TAMPERED
REVOKED
```

The verification UI must not expose sensitive customer information unnecessarily.

A fake PDF that visually resembles CourseCity must fail server verification.

Visual anti-counterfeit features are supplementary only:

- unique watermark
- microtext
- CourseCity security pattern
- unique fingerprint
- QR verification
- receipt-specific identifiers
- signature marker

Do not make claims that visual techniques can make a receipt impossible to counterfeit.

---

# 16. RECEIPT EMAIL AND WHATSAPP FLOW

After payment confirmation:

1. Verify transaction.
2. Finalize order.
3. Create entitlement.
4. Create enrollment.
5. Generate receipt.
6. Store receipt metadata and cryptographic signature.
7. Queue receipt email.
8. Create in-app notification.
9. Queue optional WhatsApp notification.

The user should receive an explicit notification similar to:

> Payment confirmed. Your CourseCity receipt has been sent to your email.

The WhatsApp integration must be behind:

```text
IWhatsAppProvider
```

Do not hard-code OpenClaw or a single vendor into business logic.

If OpenClaw is later introduced, it should consume CourseCity events and execute operational automation; it must not become the payment/receipt authority.

---

# 17. CERTIFICATE SYSTEM

Certificate records must be independently verifiable.

Certificate data should include:

- certificate ID
- learner identity/reference
- course
- publisher
- course version
- completion date
- result/grade where applicable
- issue date
- certificate version
- verification URL
- cryptographic signature
- revocation state

Public verification:

```text
https://verify.coursecity.com/certificate/:certificateId
```

Certificates should be issued only after the configured course completion rules are actually met.

Do not allow the frontend to directly mark a course complete to bypass server-side rules.

---

# 18. ASSESSMENT SYSTEM

V1 supports:

- quizzes
- question banks
- assessment attempts
- automatic grading
- assignments
- assignment submissions
- manual grading
- examinations
- examination attempts
- result calculation
- gradebook records
- grading rules

Assessment questions may initially support:

- single-choice
- multiple-choice
- true/false
- short-answer where manual grading is required

Design the question/answer schema so additional question types can be added without destructive migrations.

Assessment attempts must track:

- attempt number
- start/end times
- status
- submitted time
- answers
- grading status
- score
- maximum score
- grade

For timed examinations, enforce timing server-side as much as reasonably possible.

Never trust the browser clock for authoritative exam timing.

---

# 19. API ARCHITECTURE

Base URL:

```text
https://api.coursecity.com/api/v1
```

Initial resource groups:

```text
/auth
/users
/catalog
/courses
/publishers
/enrollments
/progress
/bookmarks
/notes
/assessments
/assignments
/examinations
/grades
/certificates
/orders
/payments
/refunds
/receipts
/notifications
/developer
/webhooks
/admin
```

Use RESTful conventions.

Use consistent:

- pagination
- filtering
- sorting
- error envelopes
- request IDs
- timestamps
- version headers where necessary
- idempotency headers for suitable writes

Internal amounts are integer minor units, e.g. GHS 150.00 -> 15000 pesewas.

---

# 20. API AUTHENTICATION

## API keys

Use API keys for server-to-server integrations.

Example:

```http
X-API-Key: bb_live_...
```

Database storage should include:

```text
key_id
key_prefix
secret_hash
owner_id
scopes
created_at
expires_at
revoked_at
last_used_at
```

Never store the full secret plaintext.

Show the secret only once at creation time where appropriate.

Allow rotation and revocation.

## Future OAuth

Design for OAuth 2.1 + PKCE for applications acting on behalf of users.

Do not prematurely implement a large OAuth server in V1 unless explicitly requested.

---

# 21. API SCOPES

Initial public/developer scopes:

```text
catalog:read
courses:read
categories:read
publishers:read

profile:read
enrollments:read
progress:read
progress:write
bookmarks:read
bookmarks:write
notes:read
notes:write

assessments:read
assessments:attempt

certificates:read
receipts:read
receipts:verify

orders:create
orders:read
payments:read
entitlements:read
```

Protected publisher scopes:

```text
publisher:read
courses:manage
content:manage
assessments:manage
learners:read
analytics:read
```

Finance scopes are highly restricted:

```text
finance:read
refunds:create
payouts:read
```

Never grant financial/admin scopes to ordinary API clients.

Authorization must be enforced both by scope and resource ownership.

---

# 22. WEBHOOK ARCHITECTURE

Outgoing webhooks should support events such as:

```text
payment.verified
payment.failed
order.paid
refund.created
enrollment.created
course.published
assessment.completed
certificate.issued
receipt.issued
```

Webhook requirements:

- HMAC signature or provider-equivalent integrity mechanism
- timestamp
- event ID
- replay protection
- idempotency
- retries with backoff
- delivery history
- dead-letter handling where practical

Build a generic event/outbox pattern so critical events are not lost between a database transaction and queue delivery.

---

# 23. API ERROR STANDARD

Use one consistent structure, for example:

```json
{
  "error": {
    "code": "COURSE_ACCESS_DENIED",
    "message": "You do not have access to this course.",
    "requestId": "...",
    "details": {}
  }
}
```

Do not leak:

- stack traces
- database details
- SQL
- secrets
- internal infrastructure
- password existence information
- unnecessary user enumeration signals

---

# 24. SECURITY BASELINE

Implement at minimum:

- Argon2id password hashing
- secure session management
- refresh token rotation
- refresh token reuse detection
- MFA for privileged roles
- RBAC + permissions
- resource-level authorization
- rate limiting
- input validation
- output validation where appropriate
- CORS allowlist
- CSP
- HSTS
- secure headers
- CSRF protections for cookie-authenticated state-changing requests
- secure cookies
- request size limits
- file upload restrictions
- MIME validation
- malware scanning architecture for uploaded files where appropriate
- audit logs
- security events
- webhook signature verification
- payment reconciliation
- idempotency
- secret management
- encrypted backups
- dependency auditing
- database least privilege
- Redis network isolation
- PostgreSQL network isolation

Do not expose PostgreSQL or Redis publicly.

---

# 25. ADMIN / SUPERADMIN SECURITY

All privileged interfaces must be protected by server authorization.

SuperAdmin actions should be subject to:

- MFA
- step-up verification for highly sensitive operations
- audit logging
- explicit confirmation for destructive actions
- reason capture for security/financial actions where appropriate

Sensitive operations include:

- changing roles
- changing permissions
- creating SuperAdmin accounts
- refunding transactions
- revoking certificates
- revoking receipts
- creating/revoking API keys
- changing security configuration
- changing payment configuration
- changing system settings

---

# 26. OBSERVABILITY

All services should produce structured logs with fields such as:

```text
requestId
userId where appropriate
actorId where appropriate
route
method
statusCode
durationMs
service
environment
errorCode
```

Never log passwords, refresh tokens, API secrets, payment secrets or complete authentication cookies.

Implement:

```text
GET /healthz
GET /readyz
```

`healthz` should show process liveness.

`readyz` should validate required dependencies such as database/Redis when appropriate.

Add error monitoring.

Add queue monitoring.

Add basic application metrics.

---

# 27. BACKUPS AND DISASTER RECOVERY

Initial deployment uses PostgreSQL on the KVM 2 server, but the VPS must not be the only database copy.

Implement encrypted offsite backups.

Requirements:

- regular full backups
- WAL/point-in-time recovery strategy where practical
- retention policy
- backup integrity checks
- periodic restore tests
- documented disaster recovery procedure

Document:

```text
a) restore database
b) restore application
c) restore secrets/configuration
 d) verify integrity
 e) bring traffic online
```

---

# 28. DEPLOYMENT ARCHITECTURE

Initial KVM 2 deployment may host:

```text
Hostinger KVM 2
├── Caddy
├── Next.js
├── Fastify API
├── PostgreSQL
├── Redis
├── BullMQ worker
└── monitoring agents
```

Do not store large future video libraries on the VPS.

Use object storage for:

- ebook files where appropriate
- course images
- certificate assets
- future videos
- downloadable resources

Use signed URLs or equivalent controlled access for protected media.

Only Caddy/public web/API endpoints should be internet-facing.

---

# 29. UI / DESIGN DIRECTION

Use the supplied reference screenshot as a **visual direction reference only**.

Reference qualities to reinterpret:

- spacious premium SaaS composition
- strong hero statement
- large visual centerpiece
- floating/integrated content cards
- editorial typography
- asymmetric information composition
- generous whitespace
- rounded but controlled geometry
- visual storytelling

Do not clone the screenshot.

Do not reproduce its branding, wording, blue palette, clouds or exact composition.

CourseCity's identity is orange and white, with warm neutrals and restrained supporting pastel colors.

---

# 30. COURSECITY COLOR SYSTEM

Primary:

```css
--cc-orange-50: #fff7ed;
--cc-orange-100: #ffedd5;
--cc-orange-200: #fed7aa;
--cc-orange-300: #fdba74;
--cc-orange-400: #fb923c;
--cc-orange-500: #f97316;
--cc-orange-600: #ea580c;
--cc-orange-700: #c2410c;
--cc-orange-800: #9a3412;
```

Brand signature:

```text
CourseCity Orange: #F97316
Bright Orange Variant: #FF7A00
```

Neutrals:

```text
#FFFFFF
#FFFCF8
#FFF9F4
#17130F
#453B33
#766B61
#EDE3DA
```

Pastel supporting tones:

```text
#FFE2CC
#FFD5B5
#FFF3E8
#FFF0B8
#DDF3E7
#EEE7FF
```

Use secondary pastels semantically, not as a rainbow palette.

---

# 31. GRADIENT RULES

Gradients must be restrained.

Prefer:

- warm white -> pale orange
- pale orange -> orange
- cream -> warm ivory
- extremely subtle radial atmosphere

Avoid:

- rainbow gradients
- orange/purple/blue/pink mixtures without purpose
- intense neon gradients
- oversized glossy blobs
- gradient borders everywhere

A gradient should communicate depth or focus, not compensate for weak design.

---

# 32. TYPOGRAPHY

Use a clean sans-serif system.

Primary UI/body font may be Inter or the final approved equivalent.

Display typography may use a complementary editorial sans such as Manrope, Plus Jakarta Sans or another carefully approved family.

Use typography for hierarchy, not decoration.

Avoid excessive all-caps.

Avoid generic AI marketing language.

Do not invent fake testimonials, customer statistics, ratings, quotes or credibility claims.

---

# 33. RESPONSIVE DESIGN — NON-NEGOTIABLE

CourseCity must be mobile-first.

Responsive behavior is required for every feature, not only the landing page.

Support and test:

```text
small phones
large phones
small tablets
large tablets
laptops
standard desktops
large/wide displays
```

Responsive coverage includes:

- navigation
- cards
- course galleries
- buttons
- icons
- forms
- search
- filters
- tables
- dashboards
- modals
- dropdowns
- course reader
- assessments
- admin
- SuperAdmin
- developer portal
- charts
- Three.js scenes
- GSAP scenes
- typography
- spacing
- loading states
- empty states
- errors

Do not solve responsiveness by merely shrinking desktop components.

Prefer recomposition.

Example:

```text
Desktop: 3-column cards
Tablet: 2-column cards
Mobile: 1-column or touch horizontal gallery
```

Desktop hover interactions must have keyboard/touch equivalents.

Avoid horizontal page overflow.

Minimum preferred touch target: approximately 44x44 CSS px. Smaller visual icons may sit inside larger interactive targets.

Respect safe-area insets on mobile.

---

# 34. ACCESSIBILITY

Target WCAG 2.2 AA quality.

Implement:

- semantic HTML
- proper labels
- keyboard navigation
- visible focus states
- logical tab order
- accessible dialogs
- accessible menus
- accessible forms
- error descriptions
- sufficient contrast
- reduced motion support
- screen-reader-compatible status messages

Never encode critical information using color alone.

---

# 35. DESIGN ANTI-PATTERNS TO AVOID

Do not create:

- random floating blobs
- excessive glassmorphism
- excessive orbs
- rainbow color systems
- giant gradients
- generic emoji feature cards
- meaningless quotes
- generic testimonial walls
- checkmark bullet forests
- fake statistics
- excessive sparkle icons
- colored left stripes on every card
- identical rounded cards repeated dozens of times
- everything centered
- everything animated
- overuse of shadows
- generic AI SaaS copy
- crypto/cyberpunk aesthetics
- visual noise

The design must feel intentional and authored.

---

# 36. LANDING PAGE STRUCTURE

Build approximately:

```text
Announcement or utility layer where needed
Header/navigation
Hero
Featured course gallery
Editorial learning statement
Three major feature compositions
Course categories
Learning experience section
How CourseCity works
Assessment/credential section
Pricing/commercial section when commercially applicable
FAQ
CTA
Footer
```

Use three-feature-row compositions where visually useful, not as a rigid template in every section.

---

# 37. COURSE GALLERY

The course gallery is a signature CourseCity component.

Card contents may include:

- course cover
- category
- course title
- short useful descriptor
- instructor/publisher
- level
- duration
- price
- progress where applicable
- action

Hover/touch behavior should be subtle:

- translateY around 4-8px
- image scale around 1.02-1.03
- arrow translation around 4px
- restrained shadow change

Do not make cards spin, explode or glow excessively.

---

# 38. SKELETONS / LOADING

Implement reusable skeleton components:

```text
CourseCardSkeleton
CourseDetailSkeleton
DashboardSkeleton
ProfileSkeleton
TableSkeleton
LessonSkeleton
AssessmentSkeleton
```

Skeletons should reflect actual layout structure.

Avoid giant generic grey rectangles with unrelated proportions.

---

# 39. MOTION SYSTEM

Use:

- CSS transitions for micro-interactions
- GSAP for complex sequences
- ScrollTrigger for scroll-driven choreography
- React animation primitives where they are simpler and more appropriate
- Three.js only when 3D adds meaning

Motion categories:

1. Micro interaction
2. Component transition
3. Editorial reveal
4. Scroll choreography
5. 3D interaction
6. Progress feedback

Respect `prefers-reduced-motion`.

When reduced motion is enabled:

- disable pointer parallax
- disable unnecessary continuous floating
- disable complex scroll choreography
- preserve information hierarchy
- keep interactions understandable

---

# 40. THREE.JS VISUAL LANGUAGE

Primary 3D metaphor:

**A premium open digital textbook/ebook.**

Avoid generic:

- floating spheres
- brains
- laptops
- random cubes
- robots
- crypto-like geometry

Use Three.js primarily for visual storytelling around learning.

Potential models:

- open digital textbook
- chapter tabs
- bookmark ribbon
- course cards/tiles when materially useful
- learning geometry
- exploded course architecture

---

# 41. THREE.JS MASTER BEHAVIOR SPECIFICATION

Implement as reusable components, not one giant scene component.

Suggested components:

```text
<CourseCityScene />
<CourseBook />
<CourseCard3D />
<ExplodedCourse />
<BlueprintScene />
<XRAYScene />
```

## Hero object

Initial transform:

```text
position: 0, -0.15, 0
rotation: -0.04, 0.12, 0
scale: 1
```

Hero entrance begins around:

```text
positionY: -0.25
rotationY: 0.30
rotationX: -0.12
opacity: 0
```

and eases into the initial transform over approximately 1.2-1.5s using a power3-style ease.

## Idle movement

Never continuously spin the object.

Use extremely subtle:

```text
rotationY ±0.035 rad
rotationX ±0.015 rad
positionY ±0.025
positionX ±0.015
```

with a 6-9 second sine-like cycle.

## Pointer interaction

Normalize pointer coordinates to -1..1.

Map pointer to approximately:

```text
rotationY ±0.10 rad
rotationX ±0.06 rad
positionX ±0.12
positionY ±0.07
positionZ ±0.08
```

Use interpolation/lerp. Do not directly assign raw pointer coordinates each frame.

On pointer leave, return smoothly to neutral.

## Scroll interaction

Use ScrollTrigger.

As the hero leaves the viewport, gently transform approximately:

```text
rotationY 0.12 -> -0.18
rotationX -0.04 -> 0.08
positionY -0.15 -> 0.20
positionZ 0 -> -0.30
scale 1 -> 0.88
```

Use scrub around 0.8 as a starting point, then tune based on actual UX.

Never sacrifice content readability for animation.

## Responsive behavior

Desktop:
full 3D scene.

Tablet:
reduced motion and complexity.

Mobile:
reduced polygon/texture/shadow complexity and reduced interaction.

Low-powered devices:
allow a static/simplified fallback.

Reduced motion:
static presentation.

## Performance

Use:

- GLB/glTF
- Draco/Meshopt where useful
- KTX2 textures where useful
- lazy loading
- asset disposal
- material/geometry disposal
- reasonable draw calls
- reasonable triangle counts
- no unnecessary post-processing

Do not load 3D libraries on pages that do not use them.

---

# 42. EXPLODED VIEW / X-RAY / BLUEPRINT / STICKY NOTES / HANDWRITTEN

These are **visual modes**, not default decorations.

## Exploded view

Use for:

- course anatomy
- course structure
- learning journey

Separate elements by small, intentional distances. Use restrained rotations.

## X-ray

Use for:

- platform architecture
- lesson internals
- technical sections

Use muted transparent materials and subtle line structures.

## Blueprint

Use for:

- API architecture
- learning pathways
- platform diagrams

Use thin linework, grids, annotations and dimensions.

## Sticky notes

Use for:

- learning tips
- study advice
- small contextual notes

Limit visible notes.

## Handwritten

Use only for short annotations:

- Start here
- Important
- Key idea
- Recommended

Never use handwritten typography as general body text.

---

# 43. FILE/STORAGE SECURITY

All uploads must be validated by the backend.

Validate:

- file type
- MIME type
- extension
- size
- content where applicable

Never trust a user-provided filename or content type.

Sanitize filenames.

Use object-storage keys that do not directly expose private filesystem structure.

Protected resources should use short-lived signed URLs or server-mediated access.

---

# 44. PERFORMANCE REQUIREMENTS

The platform should prioritize:

- fast first render
- responsive interactions
- minimal JavaScript on pages that do not need it
- code splitting
- lazy loading
- image optimization
- CDN delivery
- caching
- database query efficiency
- pagination
- background processing
- asset compression

Do not optimize by guessing.

Profile and measure.

Avoid N+1 queries.

Use indexes based on real access patterns.

Do not add indexes blindly.

---

# 45. SEARCH

V1 may use PostgreSQL full-text search/trigram capabilities for course discovery unless a scale review approves a dedicated search engine.

Search must be:

- debounced on frontend
- cancellable where practical
- paginated
- filterable
- typo-tolerant where practical
- mobile-friendly
- accessible

Do not add Elasticsearch/OpenSearch to V1 solely because it is fashionable.

Add a dedicated search engine when actual scale or relevance requirements justify it.

---

# 46. CACHING

Cache only data that can safely be cached.

Potential cache candidates:

- public course catalogue fragments
- categories
- publisher public profiles
- configuration

Do not cache personalized authorization decisions without a safe invalidation design.

Always invalidate access-sensitive cache entries when entitlement/security state changes.

---

# 47. BACKGROUND JOBS

Use BullMQ for:

- transactional email
- receipt generation
- certificate generation
- notification delivery
- WhatsApp notification
- webhook delivery/retry
- report generation
- cleanup tasks
- reconciliation tasks

Jobs must be idempotent where possible.

Retries must not accidentally create duplicate payments, receipts or entitlements.

---

# 48. IDEMPOTENCY

Any operation that can create money movement, entitlement, receipt or externally visible side effects should have a safe idempotency strategy.

Examples:

- payment initiation
- webhook processing
- order finalization
- refund request
- receipt generation
- enrollment creation
- certificate issuance

Use provider references and CourseCity idempotency keys where appropriate.

---

# 49. AUDIT LOGGING

Audit logs should contain:

```text
actorId
actorRole/action context
resourceType
resourceId
action
before/after summary where safe
reason where required
requestId
timestamp
IP/security metadata where lawful and appropriate
```

Never log secrets.

Do not store arbitrary unbounded JSON without an intentional schema/retention strategy.

---

# 50. PHASED IMPLEMENTATION PLAN

The following phases are sequential. Do not skip a phase simply because later code appears easy.

---

## PHASE 0 — ARCHITECTURAL PRE-FLIGHT

### Objective

Turn this document into repository-level implementation documentation before writing business code.

### Tasks

Create:

```text
docs/product/product-requirements.md
docs/architecture/system-overview.md
docs/architecture/domain-model.md
docs/architecture/security-architecture.md
docs/architecture/payment-architecture.md
docs/architecture/receipt-verification.md
docs/architecture/marketplace-architecture.md
docs/architecture/api-architecture.md
docs/architecture/frontend-architecture.md
docs/architecture/mobile-architecture.md
docs/architecture/design-dna.md
docs/adr/0001-architecture-baseline.md
```

Create an explicit V1/V2/future scope matrix.

### Exit criteria

- architecture document exists
- V1 scope is unambiguous
- all major entities are documented
- security model is documented
- payment/receipt trust boundaries are documented
- publisher architecture is documented
- no contradictory requirements remain hidden

Do not begin feature implementation until Phase 0 documentation is complete.

---

## PHASE 1 — REPOSITORY AND TOOLCHAIN FOUNDATION

### Tasks

Create:

- pnpm workspace
- Turborepo configuration
- apps/web
- apps/api
- packages/contracts
- packages/api-client
- packages/validation
- packages/shared
- packages/design-system
- packages/design-tokens
- CI workflow
- formatting/linting/typecheck configuration

Use strict TypeScript.

Configure:

- ESLint
- Prettier or approved formatter
- import boundaries
- environment validation
- workspace scripts

Create `.env.example` files.

Never commit real credentials.

### Exit criteria

All packages build/typecheck.

CI executes:

```text
install
lint
typecheck
unit tests
build
```

---

## PHASE 2 — INFRASTRUCTURE AND LOCAL DEVELOPMENT

### Tasks

Implement Docker development services for:

- PostgreSQL
- Redis

Provide local developer startup documentation.

Implement:

```text
/healthz
/readyz
```

Add structured logging.

Create development/test environment separation.

Add database migration foundation.

### Exit criteria

A fresh developer can clone the repository, configure environment variables and run the entire backend/dependencies through documented commands.

---

## PHASE 3 — DATABASE AND DOMAIN FOUNDATION

### Tasks

Implement database schema for:

- identity
- roles/permissions
- publishers
- courses
- commerce
- learning
- assessments
- credentials
- receipts
- notifications
- API platform
- security/auditing

Implement migrations.

Add indexes based on actual access patterns.

Use constraints for invariants.

Use foreign keys intentionally.

Implement seed data only for development/test.

Create database documentation with ERD or equivalent architecture diagrams.

### Exit criteria

- migrations work from empty database
- migrations can be replayed in CI
- foreign keys and unique constraints are enforced
- seed data works
- critical query paths have indexes
- rollback/recovery strategy documented

---

## PHASE 4 — AUTHENTICATION AND AUTHORIZATION

### Tasks

Implement:

- sign up
- email verification
- sign in
- sign out
- refresh
- session management
- forgot password
- reset password
- change password
- user profile
- MFA foundation for privileged users
- RBAC
- permissions
- publisher-scoped authorization

Write security-focused unit/integration tests.

### Required tests

Test:

- invalid password
- password brute-force throttling
- reset token reuse
- expired reset token
- session revocation
- refresh rotation
- refresh replay/reuse detection
- privilege escalation attempts
- cross-publisher access
- learner accessing another user's data
- admin vs SuperAdmin restrictions

### Exit criteria

Authentication is production-quality and no protected resource relies only on frontend state.

---

## PHASE 5 — COURSE CATALOGUE AND CONTENT MANAGEMENT

### Tasks

Implement:

- publisher profiles
- instructor profiles
- organizations
- course CRUD
- course categories
- modules
- lessons
- content blocks
- course versioning
- publish/unpublish workflow
- public catalogue
- search/filter/sort

Implement instructor/publisher authorization.

### Exit criteria

A publisher can create a course, structure the lessons, draft and publish it while unauthorized users cannot modify it.

---

## PHASE 6 — LEARNER EXPERIENCE

### Tasks

Build the Next.js learner experience:

- responsive landing page
- course gallery
- catalogue
- search
- course detail page
- authentication pages
- account area
- library/enrollments
- ebook reader
- progress
- bookmarks
- notes
- learning history

Everything must be mobile-first.

### Exit criteria

A learner can browse and open free content and see the full intended learning UX on mobile, tablet and desktop.

---

## PHASE 7 — COMMERCE AND PAYMENTS

### Tasks

Implement:

- product/price model
- order creation
- Paystack initialization
- payment webhook verification
- transaction verification
- payment state machine
- order state machine
- entitlement creation
- enrollment creation
- payment history
- order history

Add reconciliation-safe behavior.

### Security requirements

- provider webhook verification
- idempotency
- amount/currency validation
- duplicate webhook protection
- replay protection
- no frontend-only payment confirmation
- audit events

### Exit criteria

A test payment produces exactly one valid order/payment/entitlement/enrollment chain.

---

## PHASE 8 — RECEIPTS AND VERIFICATION

### Tasks

Implement:

- canonical receipt data
- SHA-256 payload fingerprint
- Ed25519 signing
- receipt storage
- PDF/document rendering
- QR code
- public receipt verification
- receipt states
- receipt revocation
- receipt events
- email queue
- in-app notification
- WhatsApp provider abstraction

Implement verification endpoints and UI.

### Required tests

- genuine receipt verifies
- modified amount fails verification
- modified receipt ID fails
- nonexistent receipt fails
- revoked receipt shows revoked
- duplicate payment event does not create duplicate receipt
- receipt signature validates
- signature fails after payload tampering

### Exit criteria

A forged visual PDF cannot become "verified" merely by matching CourseCity branding.

---

## PHASE 9 — ASSESSMENTS, GRADING AND CERTIFICATES

### Tasks

Implement:

- question bank
- quizzes
- quiz attempts
- auto grading
- assignments
- assignment submission
- manual grading
- examinations
- examination attempts
- gradebook
- completion rules
- certificates
- certificate verification
- certificate revocation

### Exit criteria

A learner can complete a legitimate course workflow and receive a verifiable certificate only when the configured completion requirements are satisfied.

---

## PHASE 10 — ADMIN AND SUPERADMIN

### Tasks

Build separate operational dashboards.

Admin:

- users
- courses
- publishers
- orders
- payments read access
- refunds according to permission
- support/operations
- assessments
- reports

SuperAdmin:

- all Admin capabilities
- staff management
- roles
- permissions
- security
- API management
- global settings
- financial administration
- system controls
- audit inspection

Finance Admin:

- financial reporting
- payment records
- refund creation
- receipt records

### Exit criteria

Unauthorized staff actions fail server-side, not merely through hidden UI controls.

---

## PHASE 11 — DEVELOPER/API PLATFORM

### Tasks

Implement:

- OpenAPI 3.1
- API key generation
- hashing
- scopes
- expiration
- revocation
- API usage records
- rate limiting
- idempotency
- request IDs
- developer portal
- API documentation UI
- signed outbound webhooks
- webhook delivery/retry infrastructure

Implement the frozen V1 scopes only.

### Exit criteria

A third-party developer can create an API client, authenticate, call allowed endpoints and receive consistent documented results while unauthorized scopes fail.

---

## PHASE 12 — VISUAL SYSTEM AND ADVANCED INTERACTION

### Tasks

Finalize:

- CourseCity design tokens
- typography
- spacing
- responsive primitives
- component library
- Lucide icon system
- hover/focus/touch states
- GSAP
- ScrollTrigger
- horizontal scroll section
- pin animation
- parallax
- scroll progress
- scroll-linked animation
- selective 3D

Implement visual modes where useful:

- exploded view
- x-ray
- blueprint
- sticky notes
- handwritten annotations

Do not apply all effects to every page.

### Exit criteria

Motion enhances comprehension rather than becoming decoration.

---

## PHASE 13 — PERFORMANCE, ACCESSIBILITY AND RESPONSIVENESS HARDENING

### Tasks

Test all primary routes at:

- small mobile
- large mobile
- tablet portrait
- tablet landscape
- laptop
- desktop
- wide desktop

Test:

- 320px-ish narrow layouts
- common Android sizes
- common iPhone sizes
- iPad/tablet layouts
- keyboard navigation
- reduced motion
- touch interactions
- screen readers where practical
- slow network simulation
- low-power device behavior

Check:

- CLS
- LCP
- INP
- bundle size
- image sizes
- route JS
- 3D loading
- API latency
- database latency

Fix real bottlenecks rather than guessing.

---

## PHASE 14 — SECURITY HARDENING

Run:

- dependency audit
- secret scanning
- authorization tests
- session tests
- CSRF tests
- rate-limit tests
- input validation tests
- file upload tests
- webhook forgery tests
- payment replay tests
- receipt tampering tests
- privilege escalation tests
- IDOR/BOLA tests
- SQL injection tests
- XSS tests
- SSRF checks where applicable
- unsafe redirect checks
- CORS tests

Document findings.

Critical/high findings must be resolved or explicitly accepted through documented risk decisions before release.

---

## PHASE 15 — TESTING AND RELEASE ENGINEERING

Implement:

- unit tests
- integration tests
- API contract tests
- end-to-end tests
- Playwright browser flows
- payment mocked integration tests
- receipt verification tests
- authorization matrix tests

Minimum golden-path E2E:

```text
signup
email verification
signin
browse
open course
purchase
payment confirmation
receipt verification
course access
authenticated reading
quiz
assignment
exam
certificate verification
```

Admin golden path:

```text
admin login
course management
publisher management
payment lookup
refund
receipt verification
```

SuperAdmin golden path:

```text
SuperAdmin login
role management
permission management
system setting
security audit
```

---

## PHASE 16 — PRODUCTION DEPLOYMENT

Deploy to Hostinger KVM 2 using Docker.

Set up:

- Cloudflare
- DNS
- TLS
- Caddy
- environment secrets
- PostgreSQL private networking
- Redis private networking
- backups
- log rotation
- monitoring
- health checks
- restart policies
- resource limits
- deployment rollback instructions

Production domains should be separated logically, for example:

```text
www.coursecity....
api.coursecity....
verify.coursecity....
admin.coursecity....
```

Actual domain names can be configured later.

---

## PHASE 17 — MOBILE CLIENT FOUNDATION

Only after the web/API platform has stabilized, implement:

- React Native
- Expo
- Expo Router
- shared API client
- shared contracts
- authentication
- catalogue
- course detail
- learner library
- ebook reader
- progress
- assessments
- receipts/certificates

The mobile app must consume the same CourseCity API.

Do not fork business logic into the mobile client.

---

# 51. MOBILE ARCHITECTURE

Use:

```text
React Native
Expo
Expo Router
TypeScript
```

Use secure device storage for refresh credentials.

Use:

- native-friendly navigation
- touch-friendly controls
- responsive layouts
- appropriate mobile motion
- platform conventions

Do not attempt to copy desktop Three.js effects one-for-one on mobile.

Use React Native animation tools and lightweight graphics where appropriate.

---

# 52. MODEL-SPECIFIC WORK SPLIT

## Claude Opus 5.5 — architecture/security lead

Use Opus for:

- architecture decisions
- database/domain reviews
- security design
- authorization design
- payment and receipt trust model
- complex refactors
- large cross-package changes
- threat modeling
- ADR review
- final release audits
- difficult debugging where multiple subsystems interact

Opus must challenge implementations that violate the architecture instead of blindly accepting them.

## Gemini 3.8 Flash — high-throughput implementation and verification

Use Gemini for:

- multi-file implementation
- repetitive CRUD scaffolding
- component implementation
- API endpoint implementation
- test generation
- migration implementation
- documentation expansion
- refactoring within approved architectural constraints
- UI implementation
- responsive adjustments
- routine debugging

Gemini must still follow this architecture and must not treat speed as permission to bypass security controls.

---

# 53. MODEL HANDOFF PROTOCOL

When moving work from one model to another, create a handoff document:

```text
docs/handoffs/current-handoff.md
```

Include:

```text
Current phase
Completed work
Files changed
Database migrations
API changes
Known defects
Tests run
Tests failing
Open architectural questions
Next exact task
```

The next model must read this before modifying the project.

---

# 54. CODING AGENT OPERATING LOOP

Before coding:

1. Read architecture documentation.
2. Inspect the current repository.
3. Inspect package versions.
4. Identify the exact phase and task.
5. Confirm affected boundaries.
6. Check for existing implementation to extend rather than duplicate.

During coding:

1. Make focused changes.
2. Preserve existing behavior unless the task requires change.
3. Write tests alongside code.
4. Keep secrets out of logs and source.
5. Update documentation when architecture changes.
6. Keep migrations reversible or provide a documented forward migration strategy.

After coding:

1. Format.
2. Lint.
3. Typecheck.
4. Run relevant tests.
5. Run build.
6. Review changed files.
7. Review security impact.
8. Update handoff documentation.
9. Report exact results.

Never say "done" if a required verification step failed.

---

# 55. DOCUMENTATION REQUIREMENTS

Maintain:

```text
README.md
CONTRIBUTING.md
SECURITY.md
CHANGELOG.md

/docs/architecture/*
/docs/security/*
/docs/api/*
/docs/runbooks/*
/docs/adr/*
```

Document operational procedures for:

- deployment
- rollback
- database restore
- secret rotation
- API key rotation
- receipt key rotation
- refund handling
- webhook troubleshooting
- email troubleshooting
- WhatsApp troubleshooting
- incident response

---

# 56. ADR REQUIREMENTS

Create an ADR for any architectural change involving:

- database technology
- authentication strategy
- payment provider
- object storage
- API versioning
- authorization architecture
- receipt cryptographic method
- mobile framework
- major deployment architecture
- major library replacement
- marketplace settlement model

Format:

```text
Title
Status
Context
Decision
Alternatives
Consequences
Security impact
Operational impact
Migration plan if applicable
```

---

# 57. ACCEPTANCE GATES

Do not advance to the next phase until:

```text
architecture gate
security gate
functional gate
responsive UI gate
performance gate
runtime/test gate
```

are satisfied for the phase.

If a gate cannot be satisfied, stop and report:

```text
What failed
Why it failed
Evidence
Impact
Proposed remediation
```

Do not hide failures behind TODO comments.

---

# 58. DEFINITION OF DONE

A feature is done only when:

- implementation exists
- API contract is documented where applicable
- database changes are migrated
- authorization exists
- validation exists
- error handling exists
- tests exist
- responsive UI exists if user-facing
- accessibility has been considered
- loading/error/empty states exist
- logging does not leak secrets
- documentation is updated
- typecheck passes
- lint passes
- relevant tests pass
- production build passes

---

# 59. PRODUCTION-QUALITY UI STATES

Every major user-facing feature should account for:

```text
loading
success
empty
error
unauthorized
forbidden
not found
expired
offline/network failure where relevant
```

Do not create interfaces that only represent the happy path.

---

# 60. FINAL V1 PRODUCT CHECKLIST

Before release, verify:

## Learner

- account
- authentication
- password recovery
- catalogue
- search
- course details
- checkout
- payment verification
- receipt
- enrollment
- ebook reader
- progress
- bookmarks
- notes
- quiz
- assignment
- examination
- grading
- certificate
- public verification

## Publisher

- publisher profile
- instructor profile
- organization model
- course creation
- course editing
- content management
- versioning
- publishing
- assessments

## Admin

- user operations
- course operations
- publisher operations
- financial operations according to permissions
- refund
- receipt verification
- reporting

## SuperAdmin

- staff management
- roles
- permissions
- system controls
- security controls
- audit
- API management

## Developer

- API docs
- API key creation
- scopes
- key revocation
- rate limits
- idempotency
- webhook security
- usage tracking

## Infrastructure

- Docker
- private DB/Redis
- TLS
- backups
- logs
- monitoring
- health checks
- restore procedure

---

# 61. FINAL INSTRUCTION TO THE CODING AGENT

You are not being asked to produce a superficial template.

You are building the foundation of a real commercial learning platform.

Treat CourseCity as a long-lived software product, not a one-page demo.

Do not optimize for the appearance of progress at the expense of architecture.

Do not introduce arbitrary frameworks merely because they are popular.

Do not generate fake business data and present it as real data.

Do not implement security controls only on the frontend.

Do not trust client-provided payment states.

Do not expose protected course content without server-side entitlement checks.

Do not allow publisher users to cross organizational boundaries.

Do not let Admin/SuperAdmin restrictions exist only in the UI.

Do not store API secrets or refresh tokens in plaintext.

Do not treat a visually convincing receipt as proof of authenticity.

Do not allow external automation tools to become payment authorities.

Do not sacrifice mobile responsiveness for desktop visual effects.

Do not sacrifice accessibility for animation.

Do not sacrifice performance for Three.js.

Do not make every section look like a rounded-card grid.

Do not make CourseCity resemble an AI-generated SaaS template.

Build an intentional visual system with strong typography, spacing, hierarchy, controlled orange, warm neutrals, purposeful composition and meaningful motion.

The final product should feel like:

```text
premium
editorial
educational
technical
warm
trustworthy
fast
secure
human-designed
```

and never like:

```text
generic SaaS
AI slop
crypto UI
gaming UI
rainbow UI
over-animated template
```

When uncertain, prefer the option that:

1. preserves security,
2. preserves data integrity,
3. preserves API/client separation,
4. preserves future extensibility,
5. preserves accessibility and responsiveness,
6. reduces unnecessary complexity,
7. and remains maintainable by a small engineering team.

START WITH PHASE 0.

Do not jump directly into visual implementation.

First inspect the repository, create the architecture documentation, record the baseline ADR, and establish the implementation plan.

Then proceed phase-by-phase, reporting the evidence for every acceptance gate.
