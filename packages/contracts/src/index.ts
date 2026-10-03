/**
 * CourseCity 1.0 — Authoritative Shared Contracts & DTOs
 */

// ==========================================
// 1. STANDARDIZED RFC 7807 ERROR PROBLEM MODEL
// ==========================================
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  code: string;
  detail: string;
  requestId: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}

// ==========================================
// 2. THE 18 FROZEN LIFECYCLE STATE ENUMS
// ==========================================
export type UserStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
export type SessionStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED' | 'REPLACED';
export type CourseStatus =
  'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'UNPUBLISHED' | 'ARCHIVED' | 'SUSPENDED';
export type CourseVersionStatus =
  'DRAFT' | 'READY_FOR_REVIEW' | 'PUBLISHED' | 'SUPERSEDED' | 'ARCHIVED';
export type OrderStatus =
  | 'CREATED'
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'CANCELLED'
  | 'REFUND_PENDING'
  | 'REFUNDED'
  | 'PAYMENT_FAILED';
export type PaymentStatus =
  | 'INITIATED'
  | 'PENDING'
  | 'VERIFIED'
  | 'FAILED'
  | 'CANCEL_PENDING'
  | 'REFUND_PENDING'
  | 'REFUNDED'
  | 'RECONCILIATION_REQUIRED';
export type PaymentReconciliationStatus =
  'UNRECONCILED' | 'MATCHED' | 'RECONCILED' | 'MISMATCH' | 'REQUIRES_REVIEW' | 'RESOLVED';
export type EntitlementStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REVOKED' | 'EXPIRED';
export type EnrollmentStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'SUSPENDED' | 'CANCELLED';
export type AssessmentAttemptStatus =
  'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'GRADING' | 'GRADED' | 'VOIDED' | 'EXPIRED';
export type AssignmentSubmissionStatus =
  'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'GRADED' | 'RETURNED' | 'LATE' | 'CANCELLED';
export type ExaminationAttemptStatus =
  'SCHEDULED' | 'IN_PROGRESS' | 'SUBMITTED' | 'TIMED_OUT' | 'UNDER_REVIEW' | 'GRADED' | 'VOIDED';
export type ReceiptStatus =
  'GENERATING' | 'ISSUED' | 'DELIVERED' | 'VERIFIED' | 'REVOKED' | 'SUPERSEDED';
export type CertificateStatus = 'PENDING' | 'ISSUED' | 'VERIFIED' | 'REVOKED' | 'SUPERSEDED';
export type ApiKeyStatus = 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'REVOKED';
export type WebhookDeliveryStatus =
  'PENDING' | 'PROCESSING' | 'DELIVERED' | 'RETRYING' | 'FAILED' | 'DEAD_LETTER' | 'DISABLED';
export type BackgroundJobStatus =
  'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'RETRYING' | 'FAILED' | 'CANCELLED' | 'DEAD_LETTER';
export type IncidentStatus =
  'OPEN' | 'INVESTIGATING' | 'MITIGATING' | 'MONITORING' | 'RESOLVED' | 'CLOSED';

// ==========================================
// 3. IDENTITY & AUTHENTICATION
// ==========================================
export interface AuthUser {
  id: string;
  email: string;
  status: UserStatus;
  roles: string[];
  publisherMemberships?: Array<{
    publisherId: string;
    role: string;
  }>;
}

export interface UserProfileDTO {
  id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  whatsappEnabled: boolean;
}

export interface AuthSessionDTO {
  id: string;
  ipAddress?: string;
  userAgent?: string;
  lastActivityAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export interface AuthResponseDTO {
  user: AuthUser;
  accessToken: string;
  expiresInSeconds: number;
}

// ==========================================
// 4. PUBLISHER & MARKETPLACE
// ==========================================
export type PublisherType = 'PLATFORM' | 'INSTRUCTOR' | 'ORGANIZATION';
export type OrganizationRole =
  'OWNER' | 'ADMIN' | 'INSTRUCTOR' | 'CONTENT_EDITOR' | 'FINANCE_MEMBER' | 'ANALYTICS_MEMBER';

export interface PublisherDTO {
  id: string;
  name: string;
  slug: string;
  type: PublisherType;
  verified: boolean;
  avatarUrl?: string;
}

// ==========================================
// 5. COURSE & CURRICULUM
// ==========================================
export type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL_LEVELS';

export type BlockType =
  | 'HEADING'
  | 'PARAGRAPH'
  | 'IMAGE'
  | 'CODE'
  | 'TABLE'
  | 'CALLOUT'
  | 'QUOTE'
  | 'DIAGRAM'
  | 'FORMULA'
  | 'RESOURCE'
  | 'EXERCISE';

export interface LessonBlockDTO {
  id: string;
  blockType: BlockType;
  sortOrder: number;
  content: Record<string, unknown>;
}

export interface LessonSummaryDTO {
  id: string;
  title: string;
  slug: string;
  sortOrder: number;
  estimatedReadTimeMinutes: number;
  isPreviewable: boolean;
  isCompleted?: boolean;
}

export interface CourseModuleDTO {
  id: string;
  title: string;
  sortOrder: number;
  lessons: LessonSummaryDTO[];
}

export interface CourseDetailDTO {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  coverImageUrl?: string;
  level: CourseLevel;
  estimatedDurationMinutes: number;
  publisher: PublisherDTO;
  priceMinor: number;
  currency: string;
  isFree: boolean;
  isEnrolled?: boolean;
  modules: CourseModuleDTO[];
}

// ==========================================
// 6. COMMERCE & PAYMENTS
// ==========================================
export interface OrderItemDTO {
  id: string;
  courseId: string;
  title: string;
  amountMinor: number;
}

export interface OrderDTO {
  id: string;
  orderReference: string;
  status: OrderStatus;
  totalAmountMinor: number;
  currency: string;
  createdAt: string;
  items: OrderItemDTO[];
}

export interface PaymentInitializationResponse {
  orderReference: string;
  paymentReference: string;
  authorizationUrl: string;
  amountMinor: number;
  currency: string;
}

// ==========================================
// 7. LEARNING & PROGRESS
// ==========================================
export interface EnrollmentDTO {
  id: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  status: EnrollmentStatus;
  completedAt?: string;
  progressPercentage: number;
  enrolledAt: string;
}

export interface LessonProgressUpdateDTO {
  lessonId: string;
  isCompleted: boolean;
}

// ==========================================
// 8. RECEIPTS & CRYPTOGRAPHIC VERIFICATION
// ==========================================
export interface CanonicalReceiptPayload {
  receiptVersion: '1.0';
  receiptReference: string;
  orderReference: string;
  paymentReference: string;
  providerTransactionId: string;
  issuedAt: string;
  currency: string;
  amountMinor: number;
  customer: {
    userId: string;
    emailHashed: string;
    displayName: string;
  };
  publisher: {
    publisherId: string;
    publisherName: string;
  };
  items: Array<{
    itemReference: string;
    title: string;
    quantity: number;
    amountMinor: number;
  }>;
  signingKeyId: string;
}

export type ReceiptVerificationOutcome =
  'VERIFIED' | 'NOT_FOUND' | 'INVALID' | 'TAMPERED' | 'REVOKED';

export interface ReceiptVerificationResultDTO {
  outcome: ReceiptVerificationOutcome;
  receiptReference?: string;
  issuedAt?: string;
  amountMinor?: number;
  currency?: string;
  publisherName?: string;
  customerMaskedName?: string;
  signingKeyId?: string;
  fingerprintSha256?: string;
  verifiedAt: string;
}

// ==========================================
// 9. CERTIFICATES
// ==========================================
export interface CertificateVerificationResultDTO {
  outcome: 'VERIFIED' | 'NOT_FOUND' | 'REVOKED' | 'TAMPERED';
  certificateReference?: string;
  recipientName?: string;
  courseTitle?: string;
  publisherName?: string;
  finalGrade?: number;
  issuedAt?: string;
  verifiedAt: string;
}

// ==========================================
// 10. SYSTEM STATUS & TELEMETRY
// ==========================================
export type ServiceHealthStatus =
  'OPERATIONAL' | 'DEGRADED' | 'MAINTENANCE' | 'READ_ONLY' | 'DISABLED' | 'INCIDENT';

export interface SystemStatusSnapshotDTO {
  status: ServiceHealthStatus;
  timestamp: string;
  components: {
    web: ServiceHealthStatus;
    api: ServiceHealthStatus;
    database: ServiceHealthStatus;
    redis: ServiceHealthStatus;
    payments: ServiceHealthStatus;
    email: ServiceHealthStatus;
    storage: ServiceHealthStatus;
  };
}
