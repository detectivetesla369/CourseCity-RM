import type { Kysely } from 'kysely';
import type { Database } from '@coursecity/database';
import type {
  IPaymentProvider,
  OrderDTO,
  PaymentInitializationResponse,
} from '@coursecity/contracts';
import { generateBusinessReference } from '@coursecity/shared';
import { ReceiptService } from './receipt.service.js';

export class PaymentService {
  constructor(
    private readonly db: Kysely<Database>,
    private readonly paymentProvider: IPaymentProvider,
    private readonly receiptService: ReceiptService,
  ) {}

  /**
   * Creates a pending Order for checkout with idempotency key protection
   */
  async createOrder(userId: string, courseId: string, idempotencyKey: string): Promise<OrderDTO> {
    const scope = 'create_order';

    // 1. Idempotency Check
    const existingKey = await this.db
      .selectFrom('idempotency_keys')
      .selectAll()
      .where('scope', '=', scope)
      .where('key', '=', idempotencyKey)
      .where('actor_id', '=', userId)
      .executeTakeFirst();

    if (existingKey) {
      if (existingKey.status === 'COMPLETED' && existingKey.response_body) {
        return JSON.parse(existingKey.response_body) as OrderDTO;
      }
      if (existingKey.status === 'PENDING') {
        const err = new Error('Order creation is already being processed');
        (err as unknown as { statusCode: number; code: string }).statusCode = 409;
        (err as unknown as { statusCode: number; code: string }).code = 'CONCURRENT_REQUEST';
        throw err;
      }
    }

    // 2. Fetch Course & Active Version
    const course = await this.db
      .selectFrom('courses')
      .innerJoin('course_versions', 'course_versions.id', 'courses.active_version_id')
      .select([
        'courses.id as course_id',
        'courses.status as course_status',
        'courses.active_version_id',
        'course_versions.id as version_id',
        'course_versions.title',
        'course_versions.price_minor',
        'course_versions.currency',
        'course_versions.is_free',
      ])
      .where('courses.id', '=', courseId)
      .where('courses.status', '=', 'PUBLISHED')
      .executeTakeFirst();

    if (!course || !course.active_version_id) {
      const err = new Error('Course not found or has no published version');
      (err as unknown as { statusCode: number; code: string }).statusCode = 404;
      (err as unknown as { statusCode: number; code: string }).code = 'COURSE_NOT_FOUND';
      throw err;
    }

    if (course.is_free || course.price_minor === 0) {
      const err = new Error('This course is free. Please use free enrollment instead.');
      (err as unknown as { statusCode: number; code: string }).statusCode = 400;
      (err as unknown as { statusCode: number; code: string }).code = 'FREE_COURSE_CHECKOUT_INVALID';
      throw err;
    }

    // 3. Verify user is not already enrolled
    const existingEnrollment = await this.db
      .selectFrom('enrollments')
      .select('id')
      .where('user_id', '=', userId)
      .where('course_id', '=', courseId)
      .where('status', 'in', ['ACTIVE', 'COMPLETED'])
      .executeTakeFirst();

    if (existingEnrollment) {
      const err = new Error('You are already enrolled in this course');
      (err as unknown as { statusCode: number; code: string }).statusCode = 409;
      (err as unknown as { statusCode: number; code: string }).code = 'ALREADY_ENROLLED';
      throw err;
    }

    // 4. Record Pending Idempotency Key
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours TTL
    await this.db
      .insertInto('idempotency_keys')
      .values({
        scope,
        key: idempotencyKey,
        actor_id: userId,
        request_hash: `${userId}:${courseId}`,
        status: 'PENDING',
        expires_at: expiresAt,
      })
      .onConflict((oc) =>
        oc.columns(['scope', 'key', 'actor_id']).doUpdateSet({
          status: 'PENDING',
          expires_at: expiresAt,
        }),
      )
      .execute();

    // 5. Create Order & Order Items
    const orderReference = generateBusinessReference('ORD');

    const order = await this.db
      .insertInto('orders')
      .values({
        order_reference: orderReference,
        user_id: userId,
        status: 'CREATED',
        total_amount_minor: course.price_minor,
        currency: course.currency,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    const orderItem = await this.db
      .insertInto('order_items')
      .values({
        order_id: order.id,
        course_id: course.course_id,
        title: course.title,
        amount_minor: course.price_minor,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // 6. Transactional Outbox Event
    await this.db
      .insertInto('outbox_events')
      .values({
        event_name: 'COMMERCE_ORDER_CREATED',
        aggregate_type: 'ORDER',
        aggregate_id: order.id,
        payload: JSON.stringify({
          orderId: order.id,
          orderReference: order.order_reference,
          userId,
          totalAmountMinor: Number(order.total_amount_minor),
          currency: order.currency,
        }),
        status: 'PENDING',
      })
      .execute();

    const result: OrderDTO = {
      id: order.id,
      orderReference: order.order_reference,
      status: order.status,
      totalAmountMinor: Number(order.total_amount_minor),
      currency: order.currency,
      createdAt: order.created_at.toISOString(),
      items: [
        {
          id: orderItem.id,
          courseId: orderItem.course_id,
          title: orderItem.title,
          amountMinor: Number(orderItem.amount_minor),
        },
      ],
    };

    // 7. Update Idempotency Record
    await this.db
      .updateTable('idempotency_keys')
      .set({
        status: 'COMPLETED',
        response_status: 201,
        response_body: JSON.stringify(result),
        resource_type: 'ORDER',
        resource_id: order.id,
      })
      .where('scope', '=', scope)
      .where('key', '=', idempotencyKey)
      .where('actor_id', '=', userId)
      .execute();

    return result;
  }

  /**
   * Activates free course entitlement and creates enrollment directly
   */
  async enrollFreeCourse(userId: string, courseId: string) {
    const course = await this.db
      .selectFrom('courses')
      .innerJoin('course_versions', 'course_versions.id', 'courses.active_version_id')
      .select([
        'courses.id as course_id',
        'courses.active_version_id',
        'course_versions.is_free',
        'course_versions.price_minor',
        'course_versions.title',
      ])
      .where('courses.id', '=', courseId)
      .where('courses.status', '=', 'PUBLISHED')
      .executeTakeFirst();

    if (!course || !course.active_version_id) {
      const err = new Error('Course not found or has no published version');
      (err as unknown as { statusCode: number; code: string }).statusCode = 404;
      (err as unknown as { statusCode: number; code: string }).code = 'COURSE_NOT_FOUND';
      throw err;
    }

    if (!course.is_free && course.price_minor > 0) {
      const err = new Error('This course requires purchase. Checkout required.');
      (err as unknown as { statusCode: number; code: string }).statusCode = 400;
      (err as unknown as { statusCode: number; code: string }).code = 'COURSE_REQUIRES_PURCHASE';
      throw err;
    }

    // Check if already enrolled
    const existingEnrollment = await this.db
      .selectFrom('enrollments')
      .selectAll()
      .where('user_id', '=', userId)
      .where('course_id', '=', courseId)
      .executeTakeFirst();

    if (existingEnrollment) {
      return {
        enrollmentId: existingEnrollment.id,
        courseId,
        status: existingEnrollment.status,
        alreadyEnrolled: true,
      };
    }

    // Grant Entitlement and Enrollment
    const entitlement = await this.db
      .insertInto('entitlements')
      .values({
        user_id: userId,
        course_id: courseId,
        source_type: 'FREE_ENROLLMENT',
        status: 'ACTIVE',
      })
      .onConflict((oc) =>
        oc.columns(['user_id', 'course_id']).doUpdateSet({
          status: 'ACTIVE',
        }),
      )
      .returningAll()
      .executeTakeFirstOrThrow();

    const enrollment = await this.db
      .insertInto('enrollments')
      .values({
        user_id: userId,
        course_id: courseId,
        course_version_id: course.active_version_id,
        status: 'ACTIVE',
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    await this.db
      .insertInto('course_progress')
      .values({
        enrollment_id: enrollment.id,
        percentage: 0,
      })
      .execute();

    await this.db
      .insertInto('outbox_events')
      .values({
        event_name: 'COMMERCE_ENROLLMENT_CREATED',
        aggregate_type: 'ENROLLMENT',
        aggregate_id: enrollment.id,
        payload: JSON.stringify({
          enrollmentId: enrollment.id,
          entitlementId: entitlement.id,
          userId,
          courseId,
          isFree: true,
        }),
        status: 'PENDING',
      })
      .execute();

    return {
      enrollmentId: enrollment.id,
      courseId,
      status: enrollment.status,
      alreadyEnrolled: false,
    };
  }

  /**
   * Initializes a payment session with Paystack for an order
   */
  async initializePayment(
    userId: string,
    orderIdOrRef: string,
    callbackUrl?: string,
  ): Promise<PaymentInitializationResponse> {
    const order = await this.db
      .selectFrom('orders')
      .selectAll()
      .where((eb) => eb.or([eb('id', '=', orderIdOrRef), eb('order_reference', '=', orderIdOrRef)]))
      .executeTakeFirst();

    if (!order) {
      const err = new Error('Order not found');
      (err as unknown as { statusCode: number; code: string }).statusCode = 404;
      (err as unknown as { statusCode: number; code: string }).code = 'ORDER_NOT_FOUND';
      throw err;
    }

    if (order.user_id !== userId) {
      const err = new Error('You do not have permission to access this order');
      (err as unknown as { statusCode: number; code: string }).statusCode = 403;
      (err as unknown as { statusCode: number; code: string }).code = 'FORBIDDEN';
      throw err;
    }

    if (order.status === 'PAID') {
      const err = new Error('This order is already paid');
      (err as unknown as { statusCode: number; code: string }).statusCode = 400;
      (err as unknown as { statusCode: number; code: string }).code = 'ORDER_ALREADY_PAID';
      throw err;
    }

    const user = await this.db
      .selectFrom('users')
      .select(['email'])
      .where('id', '=', userId)
      .executeTakeFirstOrThrow();

    const paymentReference = generateBusinessReference('PAY');

    const initResult = await this.paymentProvider.initializePayment({
      orderReference: order.order_reference,
      paymentReference,
      amountMinor: Number(order.total_amount_minor),
      currency: order.currency,
      customerEmail: user.email,
      callbackUrl:
        callbackUrl ||
        process.env.PAYMENT_CALLBACK_URL ||
        'http://localhost:3000/checkout/callback',
      metadata: {
        orderId: order.id,
        userId,
      },
    });

    await this.db
      .insertInto('payments')
      .values({
        payment_reference: paymentReference,
        order_id: order.id,
        provider: this.paymentProvider.providerName,
        provider_reference: initResult.providerReference,
        amount_minor: Number(order.total_amount_minor),
        currency: order.currency,
        status: 'INITIATED',
      })
      .execute();

    await this.db
      .updateTable('orders')
      .set({
        status: 'PENDING_PAYMENT',
        updated_at: new Date(),
      })
      .where('id', '=', order.id)
      .execute();

    await this.db
      .insertInto('outbox_events')
      .values({
        event_name: 'COMMERCE_PAYMENT_INITIATED',
        aggregate_type: 'PAYMENT',
        aggregate_id: order.id,
        payload: JSON.stringify({
          orderId: order.id,
          orderReference: order.order_reference,
          paymentReference,
          providerReference: initResult.providerReference,
          amountMinor: Number(order.total_amount_minor),
          currency: order.currency,
        }),
        status: 'PENDING',
      })
      .execute();

    return {
      orderReference: order.order_reference,
      paymentReference,
      authorizationUrl: initResult.authorizationUrl,
      amountMinor: Number(order.total_amount_minor),
      currency: order.currency,
    };
  }

  /**
   * Independent Payment Verification & Deterministic Row-Locking Fulfillment Engine
   * Enforces global lock hierarchy: Order -> Payment -> Entitlement -> Enrollment
   */
  async verifyAndFulfillPayment(paymentReferenceOrProviderRef: string) {
    // 1. Locate payment record
    const payment = await this.db
      .selectFrom('payments')
      .selectAll()
      .where((eb) =>
        eb.or([
          eb('payment_reference', '=', paymentReferenceOrProviderRef),
          eb('provider_reference', '=', paymentReferenceOrProviderRef),
        ]),
      )
      .executeTakeFirst();

    if (!payment) {
      const err = new Error(`Payment reference ${paymentReferenceOrProviderRef} not found`);
      (err as unknown as { statusCode: number; code: string }).statusCode = 404;
      (err as unknown as { statusCode: number; code: string }).code = 'PAYMENT_NOT_FOUND';
      throw err;
    }

    // Idempotency: Already verified
    if (payment.status === 'VERIFIED') {
      const order = await this.db
        .selectFrom('orders')
        .select(['order_reference', 'status'])
        .where('id', '=', payment.order_id)
        .executeTakeFirstOrThrow();

      const receipt = await this.db
        .selectFrom('receipts')
        .select('receipt_reference')
        .where('payment_id', '=', payment.id)
        .executeTakeFirst();

      return {
        isSuccessful: true,
        orderStatus: order.status,
        paymentStatus: payment.status,
        receiptReference: receipt?.receipt_reference,
        alreadyVerified: true,
      };
    }

    // 2. Perform OUTBOUND independent verification against Paystack (Network call outside DB tx)
    const verifyResult = await this.paymentProvider.verifyPayment(payment.provider_reference);

    if (!verifyResult.isSuccessful) {
      await this.db
        .updateTable('payments')
        .set({
          status: 'FAILED',
          updated_at: new Date(),
        })
        .where('id', '=', payment.id)
        .execute();

      await this.db
        .updateTable('orders')
        .set({
          status: 'PAYMENT_FAILED',
          updated_at: new Date(),
        })
        .where('id', '=', payment.order_id)
        .execute();

      return {
        isSuccessful: false,
        orderStatus: 'PAYMENT_FAILED',
        paymentStatus: 'FAILED',
        receiptReference: undefined,
      };
    }

    // 3. Payload Invariant Validation (Amount & Currency Match)
    const expectedAmount = Number(payment.amount_minor);
    if (verifyResult.amountMinor !== expectedAmount || verifyResult.currency !== payment.currency) {
      // Flag as mismatch in payment_reconciliations
      await this.db
        .insertInto('payment_reconciliations')
        .values({
          payment_id: payment.id,
          provider_reference: payment.provider_reference,
          expected_amount_minor: expectedAmount,
          provider_amount_minor: verifyResult.amountMinor,
          status: 'MISMATCH',
          notes: `Amount or currency mismatch: expected ${expectedAmount} ${payment.currency}, received ${verifyResult.amountMinor} ${verifyResult.currency}`,
        })
        .execute();

      await this.db
        .updateTable('payments')
        .set({
          status: 'RECONCILIATION_REQUIRED',
          updated_at: new Date(),
        })
        .where('id', '=', payment.id)
        .execute();

      const err = new Error('Payment payload invariant failed: Amount or currency mismatch');
      (err as unknown as { statusCode: number; code: string }).statusCode = 422;
      (err as unknown as { statusCode: number; code: string }).code = 'PAYMENT_AMOUNT_MISMATCH';
      throw err;
    }

    // 4. Atomic Fulfillment with Deterministic Row-Level Locking (Order -> Payment -> Entitlement -> Enrollment)
    let receiptRef: string | undefined;

    await this.db.transaction().execute(async (trx) => {
      // Step A: Lock Order
      const order = await trx
        .selectFrom('orders')
        .selectAll()
        .where('id', '=', payment.order_id)
        .forUpdate()
        .executeTakeFirstOrThrow();

      if (order.status === 'PAID') {
        return; // Idempotently resolved by a concurrent worker
      }

      // Step B: Lock Payment
      const lockedPayment = await trx
        .selectFrom('payments')
        .selectAll()
        .where('id', '=', payment.id)
        .forUpdate()
        .executeTakeFirstOrThrow();

      // Step C: Update Payment to VERIFIED
      await trx
        .updateTable('payments')
        .set({
          status: 'VERIFIED',
          provider_transaction_id: verifyResult.providerTransactionId,
          updated_at: new Date(),
        })
        .where('id', '=', lockedPayment.id)
        .execute();

      // Step D: Record Payment Event
      await trx
        .insertInto('payment_events')
        .values({
          payment_id: lockedPayment.id,
          event_type: 'PAYMENT_VERIFIED',
          payload: JSON.stringify(verifyResult.rawResponse),
        })
        .execute();

      // Step E: Fetch Order Items
      const orderItems = await trx
        .selectFrom('order_items')
        .selectAll()
        .where('order_id', '=', order.id)
        .execute();

      // Step F & G: Lock/Insert Entitlements & Enrollments
      for (const item of orderItems) {
        // Upsert Entitlement
        await trx
          .insertInto('entitlements')
          .values({
            user_id: order.user_id,
            course_id: item.course_id,
            source_type: 'PURCHASE',
            status: 'ACTIVE',
          })
          .onConflict((oc) =>
            oc.columns(['user_id', 'course_id']).doUpdateSet({
              status: 'ACTIVE',
            }),
          )
          .execute();

        // Fetch Course's Active Version
        const course = await trx
          .selectFrom('courses')
          .select('active_version_id')
          .where('id', '=', item.course_id)
          .executeTakeFirst();

        if (course?.active_version_id) {
          const enrollment = await trx
            .insertInto('enrollments')
            .values({
              user_id: order.user_id,
              course_id: item.course_id,
              course_version_id: course.active_version_id,
              status: 'ACTIVE',
            })
            .returning('id')
            .executeTakeFirstOrThrow();

          // Initialize Course Progress
          await trx
            .insertInto('course_progress')
            .values({
              enrollment_id: enrollment.id,
              percentage: 0,
            })
            .execute();
        }
      }

      // Step H: Update Order to PAID
      await trx
        .updateTable('orders')
        .set({
          status: 'PAID',
          updated_at: new Date(),
        })
        .where('id', '=', order.id)
        .execute();

      // Step I: Outbox Events
      await trx
        .insertInto('outbox_events')
        .values([
          {
            event_name: 'COMMERCE_PAYMENT_VERIFIED',
            aggregate_type: 'PAYMENT',
            aggregate_id: lockedPayment.id,
            payload: JSON.stringify({
              paymentId: lockedPayment.id,
              orderId: order.id,
              amountMinor: Number(lockedPayment.amount_minor),
              currency: lockedPayment.currency,
              providerTransactionId: verifyResult.providerTransactionId,
            }),
            status: 'PENDING',
          },
          {
            event_name: 'COMMERCE_ORDER_PAID',
            aggregate_type: 'ORDER',
            aggregate_id: order.id,
            payload: JSON.stringify({
              orderId: order.id,
              orderReference: order.order_reference,
              userId: order.user_id,
              amountMinor: Number(order.total_amount_minor),
              currency: order.currency,
            }),
            status: 'PENDING',
          },
        ])
        .execute();
    });

    // 5. Generate Cryptographic Receipt (Tamper-evident RFC 8785 Ed25519)
    try {
      const receipt = await this.receiptService.issueReceiptForPayment(payment.id);
      receiptRef = receipt.receipt_reference;
    } catch (receiptErr) {
      // In production, receipt issuance can also be dispatched by background outbox worker
      console.error('Synchronous receipt issuance note:', receiptErr);
    }

    return {
      isSuccessful: true,
      orderStatus: 'PAID',
      paymentStatus: 'VERIFIED',
      receiptReference: receiptRef,
      alreadyVerified: false,
    };
  }

  /**
   * Inbound Webhook Handler with HMAC-SHA512 Verification
   */
  async handleWebhook(rawBody: Buffer | string, signatureHeader: string) {
    const isValidSignature = this.paymentProvider.verifyWebhookSignature(
      rawBody,
      signatureHeader,
    );

    if (!isValidSignature) {
      const err = new Error('Invalid webhook HMAC signature');
      (err as unknown as { statusCode: number; code: string }).statusCode = 400;
      (err as unknown as { statusCode: number; code: string }).code = 'INVALID_WEBHOOK_SIGNATURE';
      throw err;
    }

    const payload = (
      typeof rawBody === 'string' ? JSON.parse(rawBody) : JSON.parse(rawBody.toString('utf8'))
    ) as {
      event: string;
      data?: {
        reference?: string;
        amount?: number;
        currency?: string;
      };
    };

    if (payload.event === 'charge.success' && payload.data?.reference) {
      await this.verifyAndFulfillPayment(payload.data.reference);
    }

    return { received: true };
  }

  /**
   * Retrieves an order by ID or Reference with items and payment status
   */
  async getOrder(orderIdOrRef: string, userId: string): Promise<OrderDTO> {
    const order = await this.db
      .selectFrom('orders')
      .selectAll()
      .where((eb) => eb.or([eb('id', '=', orderIdOrRef), eb('order_reference', '=', orderIdOrRef)]))
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!order) {
      const err = new Error('Order not found');
      (err as unknown as { statusCode: number; code: string }).statusCode = 404;
      (err as unknown as { statusCode: number; code: string }).code = 'ORDER_NOT_FOUND';
      throw err;
    }

    const items = await this.db
      .selectFrom('order_items')
      .selectAll()
      .where('order_id', '=', order.id)
      .execute();

    return {
      id: order.id,
      orderReference: order.order_reference,
      status: order.status,
      totalAmountMinor: Number(order.total_amount_minor),
      currency: order.currency,
      createdAt: order.created_at.toISOString(),
      items: items.map((i) => ({
        id: i.id,
        courseId: i.course_id,
        title: i.title,
        amountMinor: Number(i.amount_minor),
      })),
    };
  }
}
