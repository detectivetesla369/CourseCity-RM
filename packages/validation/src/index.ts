import { z } from 'zod';

// ==========================================
// 1. AUTHENTICATION SCHEMAS
// ==========================================
export const signupInputSchema = z.object({
  email: z.string().email('Valid email address is required').max(255),
  password: z
    .string()
    .min(10, 'Password must be at least 10 characters long')
    .max(128, 'Password must not exceed 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one digit')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special symbol'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(100),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
});
export type SignupInput = z.infer<typeof signupInputSchema>;

export const signinInputSchema = z.object({
  email: z.string().email('Valid email address is required'),
  password: z.string().min(1, 'Password is required'),
});
export type SigninInput = z.infer<typeof signinInputSchema>;

export const forgotPasswordInputSchema = z.object({
  email: z.string().email('Valid email address is required'),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordInputSchema>;

export const resetPasswordInputSchema = z.object({
  token: z.string().min(10, 'Valid reset token is required'),
  newPassword: z
    .string()
    .min(10, 'Password must be at least 10 characters long')
    .max(128)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one digit')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special symbol'),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordInputSchema>;

export const changePasswordInputSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(10, 'Password must be at least 10 characters long')
    .max(128)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one digit')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special symbol'),
});
export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>;

export const verifyEmailInputSchema = z.object({
  token: z.string().min(10, 'Valid verification token is required'),
});
export type VerifyEmailInput = z.infer<typeof verifyEmailInputSchema>;

// ==========================================
// 2. COMMERCE SCHEMAS
// ==========================================
export const createOrderInputSchema = z.object({
  courseId: z.string().uuid('Valid course ID is required'),
  idempotencyKey: z.string().uuid('Idempotency key must be a valid UUID'),
});
export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;

export const freeEnrollmentInputSchema = z.object({
  courseId: z.string().uuid('Valid course ID is required'),
});
export type FreeEnrollmentInput = z.infer<typeof freeEnrollmentInputSchema>;

export const initializePaymentInputSchema = z.object({
  callbackUrl: z.string().url('Callback URL must be a valid URL').optional(),
});
export type InitializePaymentInput = z.infer<typeof initializePaymentInputSchema>;

// ==========================================
// 3. LEARNING & PROGRESS SCHEMAS
// ==========================================
export const updateProgressInputSchema = z.object({
  lessonId: z.string().uuid('Valid lesson ID is required'),
  isCompleted: z.boolean(),
});
export type UpdateProgressInput = z.infer<typeof updateProgressInputSchema>;

export const createNoteInputSchema = z.object({
  lessonId: z.string().uuid('Valid lesson ID is required'),
  content: z
    .string()
    .min(1, 'Note content cannot be empty')
    .max(10000, 'Note cannot exceed 10,000 characters'),
  anchorPosition: z.string().max(255).optional(),
});
export type CreateNoteInput = z.infer<typeof createNoteInputSchema>;

export const createBookmarkInputSchema = z.object({
  lessonId: z.string().uuid('Valid lesson ID is required'),
  title: z.string().max(255).optional(),
  scrollOffsetPercentage: z.number().min(0).max(100).optional(),
});
export type CreateBookmarkInput = z.infer<typeof createBookmarkInputSchema>;

// ==========================================
// 4. ASSESSMENTS SCHEMAS
// ==========================================
export const submitQuizInputSchema = z.object({
  assessmentId: z.string().uuid('Valid assessment ID is required'),
  answers: z.record(z.string(), z.string().or(z.array(z.string()))),
});
export type SubmitQuizInput = z.infer<typeof submitQuizInputSchema>;

export const submitAssignmentInputSchema = z.object({
  assignmentId: z.string().uuid('Valid assignment ID is required'),
  textPayload: z.string().max(50000).optional(),
  attachmentUrl: z.string().url().max(1000).optional(),
});
export type SubmitAssignmentInput = z.infer<typeof submitAssignmentInputSchema>;

export const submitExamInputSchema = z.object({
  examinationId: z.string().uuid('Valid examination ID is required'),
  attemptId: z.string().uuid('Valid attempt ID is required'),
  answers: z.record(z.string(), z.string().or(z.array(z.string()))),
});
export type SubmitExamInput = z.infer<typeof submitExamInputSchema>;

// ==========================================
// 5. PUBLIC VERIFICATION SCHEMAS
// ==========================================
export const receiptVerificationParamsSchema = z.object({
  receiptReference: z
    .string()
    .regex(
      /^CC-RCP-\d{8}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/,
      'Invalid receipt reference format',
    ),
});
export type ReceiptVerificationParams = z.infer<typeof receiptVerificationParamsSchema>;

export const certificateVerificationParamsSchema = z.object({
  certificateReference: z
    .string()
    .regex(
      /^CC-CERT-\d{8}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/,
      'Invalid certificate reference format',
    ),
});
export type CertificateVerificationParams = z.infer<typeof certificateVerificationParamsSchema>;

// ==========================================
// 6. PAGINATION & CATALOG FILTER SCHEMAS
// ==========================================
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export const catalogFilterQuerySchema = paginationQuerySchema.extend({
  search: z.string().max(128).optional(),
  category: z.string().max(64).optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS']).optional(),
  isFree: z.coerce.boolean().optional(),
  sort: z.enum(['newest', 'popular', 'price_asc', 'price_desc']).default('newest'),
});
export type CatalogFilterQuery = z.infer<typeof catalogFilterQuerySchema>;
