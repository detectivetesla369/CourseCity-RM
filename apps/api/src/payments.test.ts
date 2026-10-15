import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildServer } from './server.js';
import { signAccessToken } from '@coursecity/auth';
import { PaystackPaymentProvider } from './services/payments/paystack.provider.js';
import { PaymentService } from './services/payment.service.js';
import { ReceiptService, DEV_RECEIPT_SIGNING_KEYS } from './services/receipt.service.js';
import { OutboxProcessor } from './services/outbox.processor.js';
import { canonicalJson, sha256 } from '@coursecity/shared';

describe('Payments, Reconciliation, Receipts & Outbox Integration Test Suite', () => {
  let app: FastifyInstance;
  const testSecret = 'test_jwt_secret_must_be_minimum_32_chars_long_2026';
  const testUserId = 'a0000000-0000-4000-8000-000000000001';
  const otherUserId = 'a0000000-0000-4000-8000-000000000002';
  const testCourseId = 'b0000000-0000-4000-8000-000000000001';
  const testFreeCourseId = 'b0000000-0000-4000-8000-000000000002';
  const testIdempotencyKey = 'c0000000-0000-4000-8000-000000000001';

  beforeAll(async () => {
    process.env.JWT_SECRET = testSecret;
    app = await buildServer({ logLevel: 'silent' });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  const getLearnerToken = (userId = testUserId) =>
    signAccessToken(
      {
        sub: userId,
        email: 'learner@coursecity.com',
        sessionId: 'ses_learner_123',
        roles: ['LEARNER'],
        exp: Math.floor(Date.now() / 1000) + 900,
      },
      testSecret,
    );

  // ==========================================
  // 1. FASTIFY ROUTE GUARDS & INPUT VALIDATION
  // ==========================================
  describe('Fastify Route Guards & Input Validation', () => {
    it('POST /api/v1/orders rejects unauthenticated requests with 401', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/orders',
        payload: {
          courseId: testCourseId,
          idempotencyKey: testIdempotencyKey,
        },
      });

      expect(response.statusCode).toBe(401);
      expect(response.headers['content-type']).toContain('application/problem+json');
    });

    it('POST /api/v1/orders rejects invalid payload with 400 Problem Details', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/orders',
        headers: {
          authorization: `Bearer ${getLearnerToken()}`,
        },
        payload: {
          courseId: 'not-a-uuid',
          idempotencyKey: 'not-a-uuid',
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.headers['content-type']).toContain('application/problem+json');
    });

    it('POST /api/v1/enrollments/free rejects unauthenticated requests with 401', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/enrollments/free',
        payload: {
          courseId: testCourseId,
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('POST /api/v1/payments/initialize/:orderId rejects unauthenticated requests with 401', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/payments/initialize/ord_123',
        payload: {},
      });

      expect(response.statusCode).toBe(401);
    });
  });

  // ==========================================
  // 2. ORDER CREATION & IDEMPOTENCY ENGINE
  // ==========================================
  describe('PaymentService.createOrder', () => {
    it('returns cached order response when idempotency key is already COMPLETED', async () => {
      const cachedOrder = {
        id: 'ord_cached_123',
        orderReference: 'CC-ORD-20261015-XYZ123',
        status: 'CREATED',
        totalAmountMinor: 14999,
        currency: 'GHS',
        createdAt: new Date().toISOString(),
        items: [],
      };

      const mockDb: any = {
        selectFrom: vi.fn((table: string) => {
          if (table === 'idempotency_keys') {
            return {
              selectAll: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              executeTakeFirst: vi.fn().mockResolvedValue({
                status: 'COMPLETED',
                response_body: JSON.stringify(cachedOrder),
              }),
            };
          }
          return {};
        }),
      };

      const provider = new PaystackPaymentProvider();
      const receiptService = new ReceiptService(mockDb);
      const paymentService = new PaymentService(mockDb, provider, receiptService);

      const result = await paymentService.createOrder(testUserId, testCourseId, testIdempotencyKey);
      expect(result.id).toBe('ord_cached_123');
      expect(result.orderReference).toBe('CC-ORD-20261015-XYZ123');
    });

    it('rejects order creation with 409 Conflict when idempotency key is PENDING', async () => {
      const mockDb: any = {
        selectFrom: vi.fn((table: string) => {
          if (table === 'idempotency_keys') {
            return {
              selectAll: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              executeTakeFirst: vi.fn().mockResolvedValue({
                status: 'PENDING',
              }),
            };
          }
          return {};
        }),
      };

      const provider = new PaystackPaymentProvider();
      const receiptService = new ReceiptService(mockDb);
      const paymentService = new PaymentService(mockDb, provider, receiptService);

      await expect(
        paymentService.createOrder(testUserId, testCourseId, testIdempotencyKey),
      ).rejects.toThrow('Order creation is already being processed');
    });

    it('rejects checkout on a free course with 400 Bad Request', async () => {
      const mockDb: any = {
        selectFrom: vi.fn((table: string) => {
          if (table === 'idempotency_keys') {
            return {
              selectAll: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              executeTakeFirst: vi.fn().mockResolvedValue(null),
            };
          }
          if (table === 'courses') {
            return {
              innerJoin: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              executeTakeFirst: vi.fn().mockResolvedValue({
                course_id: testFreeCourseId,
                active_version_id: 'ver_free_1',
                is_free: true,
                price_minor: 0,
                title: 'Free Beginner Course',
              }),
            };
          }
          return {};
        }),
      };

      const provider = new PaystackPaymentProvider();
      const receiptService = new ReceiptService(mockDb);
      const paymentService = new PaymentService(mockDb, provider, receiptService);

      await expect(
        paymentService.createOrder(testUserId, testFreeCourseId, testIdempotencyKey),
      ).rejects.toThrow('This course is free. Please use free enrollment instead.');
    });

    it('rejects order creation when user is already enrolled with 409 Conflict', async () => {
      const mockDb: any = {
        selectFrom: vi.fn((table: string) => {
          if (table === 'idempotency_keys') {
            return {
              selectAll: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              executeTakeFirst: vi.fn().mockResolvedValue(null),
            };
          }
          if (table === 'courses') {
            return {
              innerJoin: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              executeTakeFirst: vi.fn().mockResolvedValue({
                course_id: testCourseId,
                active_version_id: 'ver_paid_1',
                is_free: false,
                price_minor: 14999,
                title: 'Cloud-Native Architecture',
                currency: 'GHS',
              }),
            };
          }
          if (table === 'enrollments') {
            return {
              select: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              executeTakeFirst: vi.fn().mockResolvedValue({ id: 'enr_existing' }),
            };
          }
          return {};
        }),
      };

      const provider = new PaystackPaymentProvider();
      const receiptService = new ReceiptService(mockDb);
      const paymentService = new PaymentService(mockDb, provider, receiptService);

      await expect(
        paymentService.createOrder(testUserId, testCourseId, testIdempotencyKey),
      ).rejects.toThrow('You are already enrolled in this course');
    });

    it('creates order, items, records idempotency key, and emits COMMERCE_ORDER_CREATED', async () => {
      const mockDb: any = {
        selectFrom: vi.fn((table: string) => {
          if (table === 'idempotency_keys') {
            return {
              selectAll: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              executeTakeFirst: vi.fn().mockResolvedValue(null),
            };
          }
          if (table === 'courses') {
            return {
              innerJoin: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              executeTakeFirst: vi.fn().mockResolvedValue({
                course_id: testCourseId,
                active_version_id: 'ver_paid_1',
                is_free: false,
                price_minor: 14999,
                title: 'Cloud-Native Architecture',
                currency: 'GHS',
              }),
            };
          }
          if (table === 'enrollments') {
            return {
              select: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              executeTakeFirst: vi.fn().mockResolvedValue(null),
            };
          }
          return {};
        }),
        insertInto: vi.fn((table: string) => {
          if (table === 'idempotency_keys') {
            return {
              values: vi.fn().mockReturnThis(),
              onConflict: vi.fn().mockReturnValue({ execute: vi.fn().mockResolvedValue([]) }),
            };
          }
          if (table === 'orders') {
            return {
              values: vi.fn().mockReturnThis(),
              returningAll: vi.fn().mockReturnValue({
                executeTakeFirstOrThrow: vi.fn().mockResolvedValue({
                  id: 'ord_new_1',
                  order_reference: 'CC-ORD-20261015-ABC123',
                  status: 'CREATED',
                  total_amount_minor: 14999,
                  currency: 'GHS',
                  created_at: new Date(),
                }),
              }),
            };
          }
          if (table === 'order_items') {
            return {
              values: vi.fn().mockReturnThis(),
              returningAll: vi.fn().mockReturnValue({
                executeTakeFirstOrThrow: vi.fn().mockResolvedValue({
                  id: 'item_1',
                  course_id: testCourseId,
                  title: 'Cloud-Native Architecture',
                  amount_minor: 14999,
                }),
              }),
            };
          }
          if (table === 'outbox_events') {
            return {
              values: vi.fn().mockReturnThis(),
              execute: vi.fn().mockResolvedValue([]),
            };
          }
          return { values: vi.fn().mockReturnThis(), execute: vi.fn().mockResolvedValue([]) };
        }),
        updateTable: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([]),
        }),
      };

      const provider = new PaystackPaymentProvider();
      const receiptService = new ReceiptService(mockDb);
      const paymentService = new PaymentService(mockDb, provider, receiptService);

      const order = await paymentService.createOrder(testUserId, testCourseId, testIdempotencyKey);

      expect(order.id).toBe('ord_new_1');
      expect(order.totalAmountMinor).toBe(14999);
      expect(order.status).toBe('CREATED');
      expect(mockDb.insertInto).toHaveBeenCalledWith('orders');
      expect(mockDb.insertInto).toHaveBeenCalledWith('order_items');
      expect(mockDb.insertInto).toHaveBeenCalledWith('outbox_events');
      expect(mockDb.updateTable).toHaveBeenCalledWith('idempotency_keys');
    });
  });

  // ==========================================
  // 3. FREE ENROLLMENT ACTIVATION
  // ==========================================
  describe('PaymentService.enrollFreeCourse', () => {
    it('activates entitlement and enrollment immediately for free courses', async () => {
      const mockDb: any = {
        selectFrom: vi.fn((table: string) => {
          if (table === 'courses') {
            return {
              innerJoin: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              executeTakeFirst: vi.fn().mockResolvedValue({
                course_id: testFreeCourseId,
                active_version_id: 'ver_free_1',
                is_free: true,
                price_minor: 0,
                title: 'Free Intro to TypeScript',
              }),
            };
          }
          if (table === 'enrollments') {
            return {
              selectAll: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              executeTakeFirst: vi.fn().mockResolvedValue(null),
            };
          }
          return {};
        }),
        insertInto: vi.fn((table: string) => {
          if (table === 'entitlements') {
            return {
              values: vi.fn().mockReturnThis(),
              onConflict: vi.fn().mockReturnValue({
                returningAll: vi.fn().mockReturnValue({
                  executeTakeFirstOrThrow: vi.fn().mockResolvedValue({ id: 'ent_free_1' }),
                }),
              }),
            };
          }
          if (table === 'enrollments') {
            return {
              values: vi.fn().mockReturnThis(),
              returningAll: vi.fn().mockReturnValue({
                executeTakeFirstOrThrow: vi.fn().mockResolvedValue({
                  id: 'enr_free_1',
                  status: 'ACTIVE',
                }),
              }),
            };
          }
          return { values: vi.fn().mockReturnThis(), execute: vi.fn().mockResolvedValue([]) };
        }),
      };

      const provider = new PaystackPaymentProvider();
      const receiptService = new ReceiptService(mockDb);
      const paymentService = new PaymentService(mockDb, provider, receiptService);

      const result = await paymentService.enrollFreeCourse(testUserId, testFreeCourseId);
      expect(result.enrollmentId).toBe('enr_free_1');
      expect(result.status).toBe('ACTIVE');
      expect(result.alreadyEnrolled).toBe(false);
      expect(mockDb.insertInto).toHaveBeenCalledWith('entitlements');
      expect(mockDb.insertInto).toHaveBeenCalledWith('enrollments');
      expect(mockDb.insertInto).toHaveBeenCalledWith('course_progress');
      expect(mockDb.insertInto).toHaveBeenCalledWith('outbox_events');
    });

    it('rejects free enrollment on a paid course with 400 Bad Request', async () => {
      const mockDb: any = {
        selectFrom: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue({
            course_id: testCourseId,
            active_version_id: 'ver_paid_1',
            is_free: false,
            price_minor: 14999,
            title: 'Paid Architecture Course',
          }),
        }),
      };

      const provider = new PaystackPaymentProvider();
      const receiptService = new ReceiptService(mockDb);
      const paymentService = new PaymentService(mockDb, provider, receiptService);

      await expect(paymentService.enrollFreeCourse(testUserId, testCourseId)).rejects.toThrow(
        'This course requires purchase. Checkout required.',
      );
    });
  });

  // ==========================================
  // 4. PAYMENT INITIALIZATION & PROVIDER
  // ==========================================
  describe('PaymentService.initializePayment & PaystackProvider', () => {
    it('denies initialization when user does not own the order (403)', async () => {
      const mockDb: any = {
        selectFrom: vi.fn().mockReturnValue({
          selectAll: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue({
            id: 'ord_123',
            user_id: otherUserId, // Owned by another user
            status: 'CREATED',
          }),
        }),
      };

      const provider = new PaystackPaymentProvider();
      const receiptService = new ReceiptService(mockDb);
      const paymentService = new PaymentService(mockDb, provider, receiptService);

      await expect(
        paymentService.initializePayment(testUserId, 'ord_123'),
      ).rejects.toThrow('You do not have permission to access this order');
    });

    it('generates payment checkout url and transitions order to PENDING_PAYMENT', async () => {
      const mockDb: any = {
        selectFrom: vi.fn((table: string) => {
          if (table === 'orders') {
            return {
              selectAll: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              executeTakeFirst: vi.fn().mockResolvedValue({
                id: 'ord_123',
                order_reference: 'CC-ORD-20261015-XYZ123',
                user_id: testUserId,
                status: 'CREATED',
                total_amount_minor: 14999,
                currency: 'GHS',
              }),
            };
          }
          if (table === 'users') {
            return {
              select: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              executeTakeFirstOrThrow: vi.fn().mockResolvedValue({
                email: 'learner@coursecity.com',
              }),
            };
          }
          return {};
        }),
        insertInto: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([]),
        }),
        updateTable: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([]),
        }),
      };

      const provider = new PaystackPaymentProvider();
      const receiptService = new ReceiptService(mockDb);
      const paymentService = new PaymentService(mockDb, provider, receiptService);

      const result = await paymentService.initializePayment(testUserId, 'ord_123');

      expect(result.orderReference).toBe('CC-ORD-20261015-XYZ123');
      expect(result.paymentReference).toMatch(/^CC-PAY-\d{8}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/);
      expect(result.authorizationUrl).toContain('checkout.paystack.com');
      expect(result.amountMinor).toBe(14999);
      expect(result.currency).toBe('GHS');

      // Invariants: Payment inserted in INITIATED state, Order updated to PENDING_PAYMENT
      expect(mockDb.insertInto).toHaveBeenCalledWith('payments');
      expect(mockDb.updateTable).toHaveBeenCalledWith('orders');
      expect(mockDb.insertInto).toHaveBeenCalledWith('outbox_events');
    });
  });

  // ==========================================
  // 5. WEBHOOK SIGNATURE & TWO-WAY VERIFICATION
  // ==========================================
  describe('Paystack Webhook & Outbound Verification', () => {
    it('verifies valid HMAC-SHA512 webhook signature and rejects invalid signatures', () => {
      const provider = new PaystackPaymentProvider({
        secretKey: 'sk_test_mock_secret_key_12345',
      });

      const payload = JSON.stringify({ event: 'charge.success', data: { reference: 'CC-PAY-123' } });
      const validSig = provider.generateTestWebhookSignature(payload);

      expect(provider.verifyWebhookSignature(payload, validSig)).toBe(true);
      expect(provider.verifyWebhookSignature(payload, 'invalid_signature_hex')).toBe(false);
      expect(provider.verifyWebhookSignature(payload + 'tampered', validSig)).toBe(false);
    });

    it('rejects fulfillment when provider amount does not match stored order (Reconciliation Flag)', async () => {
      const mockDb: any = {
        selectFrom: vi.fn().mockReturnValue({
          selectAll: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue({
            id: 'pay_123',
            order_id: 'ord_123',
            payment_reference: 'CC-PAY-20261015-TEST1',
            provider_reference: 'CC-PAY-20261015-TEST1',
            amount_minor: 14999, // Expected 149.99 GHS
            currency: 'GHS',
            status: 'INITIATED',
          }),
        }),
        insertInto: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([]),
        }),
        updateTable: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([]),
        }),
      };

      const provider = new PaystackPaymentProvider();
      // Configure mock provider to return an underpaid amount: 10000 instead of 14999
      provider.setMockTransaction('CC-PAY-20261015-TEST1', {
        amountMinor: 10000,
        currency: 'GHS',
        isSuccessful: true,
      });

      const receiptService = new ReceiptService(mockDb);
      const paymentService = new PaymentService(mockDb, provider, receiptService);

      await expect(
        paymentService.verifyAndFulfillPayment('CC-PAY-20261015-TEST1'),
      ).rejects.toThrow('Payment payload invariant failed');

      // Invariant: payment_reconciliations row created with MISMATCH status
      expect(mockDb.insertInto).toHaveBeenCalledWith('payment_reconciliations');
      // Invariant: payment updated to RECONCILIATION_REQUIRED
      expect(mockDb.updateTable).toHaveBeenCalledWith('payments');
    });

    it('atomically fulfills transaction in lock order (Order->Payment->Entitlement->Enrollment) and signs receipt', async () => {
      const lockedOrder = {
        id: 'ord_atomic_1',
        order_reference: 'CC-ORD-20261015-LOCK1',
        user_id: testUserId,
        status: 'PENDING_PAYMENT',
        total_amount_minor: 14999,
        currency: 'GHS',
      };

      const lockedPayment = {
        id: 'pay_atomic_1',
        order_id: 'ord_atomic_1',
        payment_reference: 'CC-PAY-20261015-LOCK1',
        provider_reference: 'CC-PAY-20261015-LOCK1',
        amount_minor: 14999,
        currency: 'GHS',
        status: 'INITIATED',
      };

      const mockTrx: any = {
        selectFrom: vi.fn((table: string) => {
          if (table === 'orders') {
            return {
              selectAll: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              forUpdate: vi.fn().mockReturnThis(),
              executeTakeFirstOrThrow: vi.fn().mockResolvedValue(lockedOrder),
            };
          }
          if (table === 'payments') {
            return {
              selectAll: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              forUpdate: vi.fn().mockReturnThis(),
              executeTakeFirstOrThrow: vi.fn().mockResolvedValue(lockedPayment),
            };
          }
          if (table === 'order_items') {
            return {
              selectAll: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              execute: vi.fn().mockResolvedValue([
                { id: 'item_1', order_id: 'ord_atomic_1', course_id: testCourseId },
              ]),
            };
          }
          if (table === 'courses') {
            return {
              select: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              executeTakeFirst: vi.fn().mockResolvedValue({
                active_version_id: 'ver_paid_1',
              }),
            };
          }
          return {};
        }),
        updateTable: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([]),
        }),
        insertInto: vi.fn((table: string) => {
          if (table === 'entitlements') {
            return {
              values: vi.fn().mockReturnThis(),
              onConflict: vi.fn().mockReturnValue({
                execute: vi.fn().mockResolvedValue([]),
              }),
            };
          }
          if (table === 'enrollments') {
            return {
              values: vi.fn().mockReturnThis(),
              returning: vi.fn().mockReturnValue({
                executeTakeFirstOrThrow: vi.fn().mockResolvedValue({ id: 'enr_atomic_1' }),
              }),
            };
          }
          return {
            values: vi.fn().mockReturnThis(),
            execute: vi.fn().mockResolvedValue([]),
          };
        }),
      };

      const mockDb: any = {
        selectFrom: vi.fn((table: string) => {
          if (table === 'payments') {
            return {
              selectAll: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              executeTakeFirst: vi.fn().mockResolvedValue(lockedPayment),
            };
          }
          if (table === 'orders') {
            return {
              selectAll: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              executeTakeFirstOrThrow: vi.fn().mockResolvedValue(lockedOrder),
            };
          }
          if (table === 'order_items') {
            return {
              selectAll: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              execute: vi.fn().mockResolvedValue([
                { id: 'item_1', title: 'Course 1', course_id: testCourseId, amount_minor: 14999 },
              ]),
            };
          }
          if (table === 'users') {
            return {
              selectAll: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              executeTakeFirstOrThrow: vi.fn().mockResolvedValue({
                id: testUserId,
                email: 'learner@coursecity.com',
              }),
            };
          }
          if (table === 'user_profiles') {
            return {
              selectAll: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              executeTakeFirst: vi.fn().mockResolvedValue({
                display_name: 'Kwame Mensah',
              }),
            };
          }
          if (table === 'courses') {
            return {
              innerJoin: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              executeTakeFirst: vi.fn().mockResolvedValue({
                publisher_id: 'pub_official',
                publisher_name: 'CourseCity Official',
              }),
            };
          }
          if (table === 'receipts') {
            return {
              selectAll: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              executeTakeFirst: vi.fn().mockResolvedValue(null),
            };
          }
          if (table === 'receipt_signing_keys') {
            return {
              selectAll: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              executeTakeFirst: vi.fn().mockResolvedValue({
                key_id: DEV_RECEIPT_SIGNING_KEYS.keyId,
                public_key_pem: DEV_RECEIPT_SIGNING_KEYS.publicKeyPem,
                is_active: true,
              }),
            };
          }
          return {};
        }),
        transaction: vi.fn().mockReturnValue({
          execute: vi.fn().mockImplementation(async (callback) => {
            return callback(mockTrx);
          }),
        }),
        insertInto: vi.fn((table: string) => {
          if (table === 'receipts') {
            return {
              values: vi.fn().mockReturnThis(),
              returningAll: vi.fn().mockReturnValue({
                executeTakeFirstOrThrow: vi.fn().mockResolvedValue({
                  id: 'rcp_123',
                  receipt_reference: 'CC-RCP-20261015-VALID1',
                  status: 'ISSUED',
                  order_id: lockedOrder.id,
                  payment_id: lockedPayment.id,
                }),
              }),
            };
          }
          return { values: vi.fn().mockReturnThis(), execute: vi.fn().mockResolvedValue([]) };
        }),
        updateTable: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([]),
        }),
      };

      const provider = new PaystackPaymentProvider();
      provider.setMockTransaction('CC-PAY-20261015-LOCK1', {
        amountMinor: 14999,
        currency: 'GHS',
        isSuccessful: true,
      });

      const receiptService = new ReceiptService(mockDb);
      const paymentService = new PaymentService(mockDb, provider, receiptService);

      const result = await paymentService.verifyAndFulfillPayment('CC-PAY-20261015-LOCK1');

      expect(result.isSuccessful).toBe(true);
      expect(result.orderStatus).toBe('PAID');
      expect(result.paymentStatus).toBe('VERIFIED');
      expect(result.receiptReference).toBe('CC-RCP-20261015-VALID1');

      // Verify row locks in transaction
      expect(mockTrx.selectFrom).toHaveBeenCalledWith('orders');
      expect(mockTrx.selectFrom).toHaveBeenCalledWith('payments');
      expect(mockTrx.insertInto).toHaveBeenCalledWith('entitlements');
      expect(mockTrx.insertInto).toHaveBeenCalledWith('enrollments');
      expect(mockTrx.insertInto).toHaveBeenCalledWith('course_progress');
      expect(mockTrx.updateTable).toHaveBeenCalledWith('orders');
      expect(mockTrx.updateTable).toHaveBeenCalledWith('payments');

      // Verify receipt was generated
      expect(mockDb.insertInto).toHaveBeenCalledWith('receipts');
      expect(mockDb.insertInto).toHaveBeenCalledWith('receipt_events');
      expect(mockDb.insertInto).toHaveBeenCalledWith('outbox_events');
    });
  });

  // ==========================================
  // 6. CRYPTOGRAPHIC RECEIPT VERIFICATION
  // ==========================================
  describe('ReceiptService Cryptographic Verification Pipeline', () => {
    it('verifies authentic receipt with Ed25519 signature and returns masked learner identity', async () => {
      const canonicalPayload = {
        receiptVersion: '1.0',
        receiptReference: 'CC-RCP-20261015-TEST99',
        orderReference: 'CC-ORD-20261015-TEST99',
        paymentReference: 'CC-PAY-20261015-TEST99',
        providerTransactionId: 'pstk_12345',
        issuedAt: new Date().toISOString(),
        currency: 'GHS',
        amountMinor: 14999,
        customer: {
          userId: testUserId,
          emailHashed: sha256('learner@coursecity.com'),
          displayName: 'Kwame Mensah',
        },
        publisher: {
          publisherId: 'pub_1',
          publisherName: 'CourseCity Official',
        },
        items: [
          {
            itemReference: 'item_1',
            title: 'Full-Stack Architecture',
            quantity: 1,
            amountMinor: 14999,
          },
        ],
        signingKeyId: DEV_RECEIPT_SIGNING_KEYS.keyId,
      };

      const canonicalPayloadString = canonicalJson(canonicalPayload);
      const payloadHash = sha256(canonicalPayloadString);
      const crypto = await import('node:crypto');
      const signature = crypto
        .sign(null, Buffer.from(payloadHash, 'utf8'), DEV_RECEIPT_SIGNING_KEYS.privateKeyPem)
        .toString('base64url');

      const mockDb: any = {
        selectFrom: vi.fn((table: string) => {
          if (table === 'receipts') {
            return {
              selectAll: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              executeTakeFirst: vi.fn().mockResolvedValue({
                id: 'rcp_valid_1',
                receipt_reference: 'CC-RCP-20261015-TEST99',
                status: 'ISSUED',
                payment_id: 'pay_123',
                amount_minor: 14999,
                currency: 'GHS',
                ed25519_signature: signature,
                payload_hash_sha256: payloadHash,
                canonical_payload: canonicalPayloadString,
                signing_key_id: DEV_RECEIPT_SIGNING_KEYS.keyId,
                issued_at: new Date(),
              }),
            };
          }
          if (table === 'receipt_signing_keys') {
            return {
              selectAll: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              executeTakeFirst: vi.fn().mockResolvedValue({
                key_id: DEV_RECEIPT_SIGNING_KEYS.keyId,
                public_key_pem: DEV_RECEIPT_SIGNING_KEYS.publicKeyPem,
                is_active: true,
              }),
            };
          }
          if (table === 'payments') {
            return {
              selectAll: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              executeTakeFirst: vi.fn().mockResolvedValue({
                id: 'pay_123',
                status: 'VERIFIED',
              }),
            };
          }
          return {};
        }),
        insertInto: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([]),
        }),
      };

      const receiptService = new ReceiptService(mockDb);
      const verification = await receiptService.verifyReceipt(
        'CC-RCP-20261015-TEST99',
        '127.0.0.1',
        'Vitest Test Runner',
      );

      expect(verification.outcome).toBe('VERIFIED');
      expect(verification.receiptReference).toBe('CC-RCP-20261015-TEST99');
      expect(verification.amountMinor).toBe(14999);
      expect(verification.currency).toBe('GHS');
      expect(verification.publisherName).toBe('CourseCity Official');
      // Privacy invariant: Learner name is masked!
      expect(verification.customerMaskedName).toBe('K*** M***');
      expect(verification.fingerprintSha256).toBe(payloadHash);
      expect(mockDb.insertInto).toHaveBeenCalledWith('receipt_verifications');
    });

    it('returns NOT_FOUND when receipt reference does not exist in registry', async () => {
      const mockDb: any = {
        selectFrom: vi.fn().mockReturnValue({
          selectAll: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(null),
        }),
        insertInto: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([]),
        }),
      };

      const receiptService = new ReceiptService(mockDb);
      const verification = await receiptService.verifyReceipt('CC-RCP-20261015-NONEXIST');
      expect(verification.outcome).toBe('NOT_FOUND');
    });

    it('returns TAMPERED when canonical payload has been modified', async () => {
      const mockDb: any = {
        selectFrom: vi.fn().mockReturnValue({
          selectAll: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue({
            id: 'rcp_tampered',
            receipt_reference: 'CC-RCP-20261015-TAMPER1',
            status: 'ISSUED',
            canonical_payload: '{"tampered": true}',
            payload_hash_sha256: 'original_hash_value',
          }),
        }),
        insertInto: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([]),
        }),
      };

      const receiptService = new ReceiptService(mockDb);
      const verification = await receiptService.verifyReceipt('CC-RCP-20261015-TAMPER1');
      expect(verification.outcome).toBe('TAMPERED');
    });
  });

  // ==========================================
  // 7. OUTBOX PROCESSOR WORKER
  // ==========================================
  describe('OutboxProcessor Worker', () => {
    it('processes pending events, dispatches domain side-effects and marks DELIVERED', async () => {
      const pendingEvents = [
        {
          id: 'ev_1',
          event_name: 'AUTH_USER_REGISTERED',
          payload: JSON.stringify({ userId: testUserId, email: 'learner@coursecity.com' }),
          status: 'PENDING',
          retry_count: 0,
        },
        {
          id: 'ev_2',
          event_name: 'COMMERCE_ENROLLMENT_CREATED',
          payload: JSON.stringify({ userId: testUserId, courseId: testCourseId }),
          status: 'PENDING',
          retry_count: 0,
        },
      ];

      const mockDb: any = {
        selectFrom: vi.fn().mockReturnValue({
          selectAll: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue(pendingEvents),
        }),
        updateTable: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([]),
        }),
        insertInto: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([]),
        }),
      };

      const processor = new OutboxProcessor(mockDb);
      const result = await processor.processPendingEvents(10);

      expect(result.processed).toBe(2);
      expect(result.failed).toBe(0);

      // Verify side-effect table inserts
      expect(mockDb.insertInto).toHaveBeenCalledWith('email_events');
      expect(mockDb.insertInto).toHaveBeenCalledWith('notifications');
      expect(mockDb.updateTable).toHaveBeenCalledWith('outbox_events');
    });

    it('moves event to dead_letter_events after 5 failed retry attempts', async () => {
      const failingEvent = {
        id: 'ev_fail_5',
        event_name: 'AUTH_USER_REGISTERED',
        payload: '{invalid_json',
        status: 'PENDING',
        retry_count: 4, // 5th attempt
      };

      const mockDb: any = {
        selectFrom: vi.fn().mockReturnValue({
          selectAll: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([failingEvent]),
        }),
        updateTable: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([]),
        }),
        insertInto: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([]),
        }),
      };

      const processor = new OutboxProcessor(mockDb);
      const result = await processor.processPendingEvents(10);

      expect(result.failed).toBe(1);
      expect(mockDb.insertInto).toHaveBeenCalledWith('dead_letter_events');
      expect(mockDb.updateTable).toHaveBeenCalledWith('outbox_events');
    });
  });
});
