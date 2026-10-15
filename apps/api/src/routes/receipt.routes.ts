import type { FastifyPluginAsync } from 'fastify';
import {
  receiptVerificationParamsSchema,
  type ReceiptVerificationParams,
} from '@coursecity/validation';
import { getDatabase } from '../db.js';
import { ReceiptService } from '../services/receipt.service.js';

export const receiptRoutes: FastifyPluginAsync = async (fastify) => {
  const db = getDatabase();
  const receiptService = new ReceiptService(db);

  // ==========================================
  // 1. PUBLIC CRYPTOGRAPHIC RECEIPT VERIFICATION
  // ==========================================
  fastify.get<{ Params: ReceiptVerificationParams }>(
    '/receipts/verify/:receiptReference',
    {
      schema: {
        params: receiptVerificationParamsSchema,
        tags: ['Receipts & Verification'],
        summary: 'Publicly verify authenticity and cryptographic signature of a receipt',
      },
    },
    async (request, reply) => {
      const clientIp = request.ip;
      const userAgent = request.headers['user-agent'];

      const result = await receiptService.verifyReceipt(
        request.params.receiptReference,
        clientIp,
        userAgent,
      );

      return reply.status(200).send(result);
    },
  );

  // ==========================================
  // 2. AUTHENTICATED RECEIPT DETAIL
  // ==========================================
  fastify.get<{ Params: { receiptReference: string } }>(
    '/receipts/:receiptReference',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['Receipts & Verification'],
        summary: 'Get full receipt details for an authenticated learner',
      },
    },
    async (request, reply) => {
      const receipt = await receiptService.getReceiptByReference(
        request.params.receiptReference,
      );

      if (!receipt) {
        return reply.status(404).send({
          type: 'https://api.coursecity.com/problems/not_found',
          title: 'Receipt Not Found',
          status: 404,
          code: 'RECEIPT_NOT_FOUND',
          detail: `Receipt ${request.params.receiptReference} does not exist`,
          requestId: request.id,
          retryable: false,
        });
      }

      // Check ownership or super admin role
      const isOwner = receipt.user_id === request.user!.id;
      const isAdmin =
        request.user!.roles.includes('SUPER_ADMIN') ||
        request.user!.roles.includes('FINANCE_ADMIN');

      if (!isOwner && !isAdmin) {
        return reply.status(403).send({
          type: 'https://api.coursecity.com/problems/forbidden',
          title: 'Forbidden',
          status: 403,
          code: 'FORBIDDEN',
          detail: 'You are not authorized to view this receipt',
          requestId: request.id,
          retryable: false,
        });
      }

      return reply.status(200).send(receipt);
    },
  );
};
