import { Kysely, PostgresDialect, Generated } from 'kysely';
import pg from 'pg';
import type {
  UserStatus,
  SessionStatus,
  CourseStatus,
  CourseVersionStatus,
  CourseLevel,
  BlockType,
  PublisherType,
  OrderStatus,
  PaymentStatus,
  EntitlementStatus,
  EnrollmentStatus,
  ReceiptStatus,
  CertificateStatus,
} from '@coursecity/contracts';

// ==========================================
// 1. DATABASE TABLE DEFINITIONS
// ==========================================
export interface UsersTable {
  id: Generated<string>;
  email: string;
  password_hash: string;
  status: UserStatus;
  email_verified_at: Date | null;
  mfa_enabled: boolean;
  mfa_secret_encrypted: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface UserProfilesTable {
  id: Generated<string>;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  phone_number: string | null;
  whatsapp_enabled: boolean;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface SessionsTable {
  id: Generated<string>;
  user_id: string;
  session_token_hash: string;
  ip_address: string | null;
  user_agent: string | null;
  status: SessionStatus;
  last_activity_at: Generated<Date>;
  expires_at: Date;
  created_at: Generated<Date>;
}

export interface RefreshTokensTable {
  id: Generated<string>;
  session_id: string;
  user_id: string;
  token_hash: string;
  sequence_number: number;
  revoked_at: Date | null;
  expires_at: Date;
  created_at: Generated<Date>;
}

export interface EmailVerificationTokensTable {
  id: Generated<string>;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
  created_at: Generated<Date>;
}

export interface PasswordResetTokensTable {
  id: Generated<string>;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
  created_at: Generated<Date>;
}

export interface PublishersTable {
  id: Generated<string>;
  name: string;
  slug: string;
  type: PublisherType;
  verified: boolean;
  avatar_url: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface CoursesTable {
  id: Generated<string>;
  publisher_id: string;
  slug: string;
  status: CourseStatus;
  active_version_id: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface CourseVersionsTable {
  id: Generated<string>;
  course_id: string;
  version_number: number;
  title: string;
  subtitle: string | null;
  description: string;
  cover_image_url: string | null;
  level: CourseLevel;
  estimated_duration_minutes: number;
  price_minor: number;
  currency: string;
  is_free: boolean;
  status: CourseVersionStatus;
  created_at: Generated<Date>;
  published_at: Date | null;
}

export interface CourseModulesTable {
  id: Generated<string>;
  course_version_id: string;
  title: string;
  sort_order: number;
  created_at: Generated<Date>;
}

export interface LessonsTable {
  id: Generated<string>;
  module_id: string;
  title: string;
  slug: string;
  sort_order: number;
  estimated_read_time_minutes: number;
  is_previewable: boolean;
  created_at: Generated<Date>;
}

export interface LessonBlocksTable {
  id: Generated<string>;
  lesson_id: string;
  block_type: BlockType;
  sort_order: number;
  content_payload: string; // JSON string
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface OrdersTable {
  id: Generated<string>;
  order_reference: string;
  user_id: string;
  status: OrderStatus;
  total_amount_minor: number;
  currency: string;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface OrderItemsTable {
  id: Generated<string>;
  order_id: string;
  course_id: string;
  title: string;
  amount_minor: number;
  created_at: Generated<Date>;
}

export interface PaymentsTable {
  id: Generated<string>;
  payment_reference: string;
  order_id: string;
  provider: string;
  provider_reference: string;
  provider_transaction_id: string | null;
  amount_minor: number;
  currency: string;
  status: PaymentStatus;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface EntitlementsTable {
  id: Generated<string>;
  user_id: string;
  course_id: string;
  source_type: string;
  status: EntitlementStatus;
  created_at: Generated<Date>;
  expires_at: Date | null;
}

export interface EnrollmentsTable {
  id: Generated<string>;
  user_id: string;
  course_id: string;
  course_version_id: string;
  status: EnrollmentStatus;
  completed_at: Date | null;
  created_at: Generated<Date>;
}

export interface LessonProgressTable {
  id: Generated<string>;
  enrollment_id: string;
  lesson_id: string;
  is_completed: boolean;
  first_read_at: Date | null;
  completed_at: Date | null;
  progress_version: Generated<number>;
}

export interface CourseProgressTable {
  id: Generated<string>;
  enrollment_id: string;
  percentage: number;
  last_lesson_id: string | null;
  updated_at: Generated<Date>;
}

export interface BookmarksTable {
  id: Generated<string>;
  user_id: string;
  lesson_id: string;
  title: string | null;
  scroll_offset_percentage: number;
  created_at: Generated<Date>;
}

export interface LearnerNotesTable {
  id: Generated<string>;
  user_id: string;
  lesson_id: string;
  content: string;
  anchor_position: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface LearningActivityTable {
  id: Generated<string>;
  user_id: string;
  course_id: string;
  action_type: string;
  metadata: string | null;
  created_at: Generated<Date>;
}

export interface ReceiptsTable {
  id: Generated<string>;
  receipt_reference: string;
  order_id: string;
  payment_id: string;
  user_id: string;
  amount_minor: number;
  currency: string;
  status: ReceiptStatus;
  ed25519_signature: string;
  payload_hash_sha256: string;
  canonical_payload: string; // JSON string
  signing_key_id: string;
  issued_at: Generated<Date>;
  revoked_at: Date | null;
  revocation_reason: string | null;
}

export interface CertificatesTable {
  id: Generated<string>;
  certificate_reference: string;
  user_id: string;
  course_id: string;
  course_version_id: string;
  enrollment_id: string;
  recipient_name: string;
  course_title: string;
  final_grade: number | null;
  status: CertificateStatus;
  ed25519_signature: string;
  payload_hash: string;
  issued_at: Generated<Date>;
  revoked_at: Date | null;
  revocation_reason: string | null;
}

export interface OutboxEventsTable {
  id: Generated<string>;
  event_name: string;
  aggregate_type: string;
  aggregate_id: string;
  payload: string; // JSON string
  status: 'PENDING' | 'PROCESSING' | 'DELIVERED' | 'FAILED';
  retry_count: Generated<number>;
  created_at: Generated<Date>;
  processed_at: Date | null;
}

export interface IdempotencyKeysTable {
  id: Generated<string>;
  scope: string;
  key: string;
  actor_id: string;
  request_hash: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  response_status: number | null;
  response_body: string | null;
  resource_type: string | null;
  resource_id: string | null;
  expires_at: Date;
  created_at: Generated<Date>;
}

export interface RolesTable {
  id: Generated<string>;
  name: string;
  description: string | null;
  created_at: Generated<Date>;
}

export interface PermissionsTable {
  id: Generated<string>;
  name: string;
  description: string | null;
  created_at: Generated<Date>;
}

export interface RolePermissionsTable {
  role_id: string;
  permission_id: string;
}

export interface UserRolesTable {
  id: Generated<string>;
  user_id: string;
  role_id: string;
  scope_resource_type: string | null;
  scope_resource_id: string | null;
  created_at: Generated<Date>;
}

export interface ReceiptSigningKeysTable {
  id: Generated<string>;
  key_id: string;
  public_key_pem: string;
  is_active: boolean;
  created_at: Generated<Date>;
  revoked_at: Date | null;
}

// ==========================================
// 2. CONSOLIDATED DATABASE INTERFACE
// ==========================================
export interface Database {
  users: UsersTable;
  user_profiles: UserProfilesTable;
  sessions: SessionsTable;
  refresh_tokens: RefreshTokensTable;
  email_verification_tokens: EmailVerificationTokensTable;
  password_reset_tokens: PasswordResetTokensTable;
  roles: RolesTable;
  permissions: PermissionsTable;
  role_permissions: RolePermissionsTable;
  user_roles: UserRolesTable;
  publishers: PublishersTable;
  courses: CoursesTable;
  course_versions: CourseVersionsTable;
  course_modules: CourseModulesTable;
  lessons: LessonsTable;
  lesson_blocks: LessonBlocksTable;
  orders: OrdersTable;
  order_items: OrderItemsTable;
  payments: PaymentsTable;
  entitlements: EntitlementsTable;
  enrollments: EnrollmentsTable;
  lesson_progress: LessonProgressTable;
  course_progress: CourseProgressTable;
  bookmarks: BookmarksTable;
  learner_notes: LearnerNotesTable;
  learning_activity: LearningActivityTable;
  receipts: ReceiptsTable;
  receipt_signing_keys: ReceiptSigningKeysTable;
  certificates: CertificatesTable;
  outbox_events: OutboxEventsTable;
  idempotency_keys: IdempotencyKeysTable;
}

// ==========================================
// 3. DATABASE FACTORY
// ==========================================
export function createDatabase(connectionString: string, maxPool = 10): Kysely<Database> {
  const pool = new pg.Pool({
    connectionString,
    max: maxPool,
  });

  return new Kysely<Database>({
    dialect: new PostgresDialect({
      pool,
    }),
  });
}
