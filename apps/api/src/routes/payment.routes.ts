import type { FastifyPluginAsync } from 'fastify';
import {
  createOrderInputSchema,
  freeEnrollmentInputSchema,
  initializePaymentInputSchema,
  type CreateOrderInput,
  type FreeEnrollmentInput,
  type InitializePaymentInput,
} from '@coursecity/validation';
import { getDatabase } from '../db.js';
import { PaystackPaymentProvider } from '../services/payments/paystack.provider.js';
import { ReceiptService } from '../services/receipt.service.js';
import { PaymentService } from '../services/payment.service.js';

export const paymentRoutes: FastifyPluginAsync = async (fastify) => {
  const db = getDatabase();
  const paymentProvider = new PaystackPaymentProvider();
  const receiptService = new ReceiptService(db);
  const paymentService = new PaymentService(db, paymentProvider, receiptService);

  // Expose services via fastify decorators if needed or use directly
  fastify.decorate('paymentService', paymentService);
  fastify.decorate('paymentProvider', paymentProvider);

  // ==========================================
  // 1. ORDER CREATION
  // ==========================================
  fastify.post<{ Body: CreateOrderInput }>(
    '/orders',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: createOrderInputSchema,
        tags: ['Commerce'],
        summary: 'Create a pending checkout order for a course',
      },
    },
    async (request, reply) => {
      const order = await paymentService.createOrder(
        request.user!.id,
        request.body.courseId,
        request.body.idempotencyKey,
      );
      return reply.status(201).send(order);
    },
  );

  // ==========================================
  // 2. FREE ENROLLMENT ACTIVATION
  // ==========================================
  fastify.post<{ Body: FreeEnrollmentInput }>(
    '/enrollments/free',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: freeEnrollmentInputSchema,
        tags: ['Commerce'],
        summary: 'Directly enroll into a free course',
      },
    },
    async (request, reply) => {
      const result = await paymentService.enrollFreeCourse(
        request.user!.id,
        request.body.courseId,
      );
      return reply.status(result.alreadyEnrolled ? 200 : 201).send(result);
    },
  );

  // ==========================================
  // 3. PAYMENT INITIALIZATION
  // ==========================================
  fastify.post<{ Params: { orderId: string }; Body: InitializePaymentInput }>(
    '/payments/initialize/:orderId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: initializePaymentInputSchema,
        tags: ['Commerce'],
        summary: 'Initialize Paystack checkout for an order',
      },
    },
    async (request, reply) => {
      const initResponse = await paymentService.initializePayment(
        request.user!.id,
        request.params.orderId,
        request.body?.callbackUrl,
      );
      return reply.status(200).send(initResponse);
    },
  );

  // ==========================================
  // 4. TWO-WAY PAYMENT VERIFICATION (CLIENT POLLING / CALLBACK FALLBACK)
  // ==========================================
  fastify.get<{ Params: { reference: string } }>(
    '/payments/verify/:reference',
    {
      schema: {
        tags: ['Commerce'],
        summary: 'Independently verify transaction status with payment provider',
      },
    },
    async (request, reply) => {
      const result = await paymentService.verifyAndFulfillPayment(request.params.reference);
      return reply.status(200).send(result);
    },
  );

  // ==========================================
  // 5. INBOUND PAYSTACK WEBHOOK
  // ==========================================
  fastify.post(
    '/payments/webhook',
    {
      schema: {
        tags: ['Commerce'],
        summary: 'Authoritative Paystack webhook receiver',
      },
    },
    async (request, reply) => {
      const signatureHeader = request.headers['x-paystack-signature'] as string;
      const rawBody = (request as unknown as { rawBody?: Buffer }).rawBody || JSON.stringify(request.body);

      const result = await paymentService.handleWebhook(rawBody, signatureHeader);
      return reply.status(200).send(result);
    },
  );

  // ==========================================
  // 6. ORDER DETAILS RETRIEVAL
  // ==========================================
  fastify.get<{ Params: { orderId: string } }>(
    '/orders/:orderId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['Commerce'],
        summary: 'Get details of an order owned by current user',
      },
    },
    async (request, reply) => {
      const order = await paymentService.getOrder(request.params.orderId, request.user!.id);
      return reply.status(200).send(order);
    },
  );
};
