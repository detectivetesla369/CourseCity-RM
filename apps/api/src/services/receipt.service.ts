import type { Kysely } from 'kysely';
import type { Database } from '@coursecity/database';
import type {
  CanonicalReceiptPayload,
  ReceiptVerificationResultDTO,
} from '@coursecity/contracts';
import {
  canonicalJson,
  sha256,
  signEd25519,
  verifyEd25519,
  generateBusinessReference,
  maskName,
} from '@coursecity/shared';

// Standard development Ed25519 keypair for local/testing environments
export const DEV_RECEIPT_SIGNING_KEYS = {
  keyId: 'cc_ed25519_2026_v1',
  publicKeyPem:
    '-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEA4W5K26J77fy5VJeqC+iO/uLQJLFQIQBVfBfxLyjVAdM=\n-----END PUBLIC KEY-----\n',
  privateKeyPem:
    '-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQYDK2VwBCIEIGojIROd00DDdJtYuuDjh/yl/L58Nrb9MR1tOVcdTqdx\n-----END PRIVATE KEY-----\n',
};

export class ReceiptService {
  constructor(private readonly db: Kysely<Database>) {}

  private getSigningKeyId(): string {
    return process.env.RECEIPT_SIGNING_KEY_ID || DEV_RECEIPT_SIGNING_KEYS.keyId;
  }

  private getPrivateKeyPem(): string {
    return process.env.RECEIPT_SIGNING_PRIVATE_KEY || DEV_RECEIPT_SIGNING_KEYS.privateKeyPem;
  }

  private getPublicKeyPem(): string {
    return process.env.RECEIPT_SIGNING_PUBLIC_KEY || DEV_RECEIPT_SIGNING_KEYS.publicKeyPem;
  }

  /**
   * Generates and cryptographically signs an immutable receipt for a verified payment
   */
  async issueReceiptForPayment(paymentId: string) {
    // 1. Fetch verified payment
    const payment = await this.db
      .selectFrom('payments')
      .selectAll()
      .where('id', '=', paymentId)
      .where('status', '=', 'VERIFIED')
      .executeTakeFirst();

    if (!payment) {
      throw new Error(`Cannot issue receipt: Payment ${paymentId} is not verified or does not exist`);
    }

    // 2. Check if receipt already issued (idempotency)
    const existingReceipt = await this.db
      .selectFrom('receipts')
      .selectAll()
      .where('payment_id', '=', payment.id)
      .executeTakeFirst();

    if (existingReceipt) {
      return existingReceipt;
    }

    // 3. Fetch linked order and order items
    const order = await this.db
      .selectFrom('orders')
      .selectAll()
      .where('id', '=', payment.order_id)
      .executeTakeFirstOrThrow();

    const orderItems = await this.db
      .selectFrom('order_items')
      .selectAll()
      .where('order_id', '=', order.id)
      .execute();

    // 4. Fetch user and profile
    const user = await this.db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', order.user_id)
      .executeTakeFirstOrThrow();

    const profile = await this.db
      .selectFrom('user_profiles')
      .selectAll()
      .where('user_id', '=', user.id)
      .executeTakeFirst();

    // 5. Fetch publisher metadata from first course item
    let publisherName = 'CourseCity Official';
    let publisherId = 'coursecity-official';

    if (orderItems.length > 0 && orderItems[0]) {
      const course = await this.db
        .selectFrom('courses')
        .innerJoin('publishers', 'publishers.id', 'courses.publisher_id')
        .select(['publishers.id as publisher_id', 'publishers.name as publisher_name'])
        .where('courses.id', '=', orderItems[0].course_id)
        .executeTakeFirst();

      if (course) {
        publisherId = course.publisher_id;
        publisherName = course.publisher_name;
      }
    }

    // 6. Ensure signing key exists in registry
    const keyId = this.getSigningKeyId();
    const existingKey = await this.db
      .selectFrom('receipt_signing_keys')
      .selectAll()
      .where('key_id', '=', keyId)
      .executeTakeFirst();

    if (!existingKey) {
      await this.db
        .insertInto('receipt_signing_keys')
        .values({
          key_id: keyId,
          public_key_pem: this.getPublicKeyPem(),
          is_active: true,
        })
        .onConflict((oc) => oc.column('key_id').doNothing())
        .execute();
    }

    // 7. Construct Canonical Receipt Payload (RFC 8785)
    const receiptReference = generateBusinessReference('RCP');
    const canonicalPayload: CanonicalReceiptPayload = {
      receiptVersion: '1.0',
      receiptReference,
      orderReference: order.order_reference,
      paymentReference: payment.payment_reference,
      providerTransactionId: payment.provider_transaction_id || 'manual_verified',
      issuedAt: new Date().toISOString(),
      currency: order.currency,
      amountMinor: Number(order.total_amount_minor),
      customer: {
        userId: user.id,
        emailHashed: sha256(user.email.toLowerCase().trim()),
        displayName: profile?.display_name || 'CourseCity Learner',
      },
      publisher: {
        publisherId,
        publisherName,
      },
      items: orderItems.map((item) => ({
        itemReference: item.id,
        title: item.title,
        quantity: 1,
        amountMinor: Number(item.amount_minor),
      })),
      signingKeyId: keyId,
    };

    // 8. RFC 8785 Serialization, SHA-256 Digest & Ed25519 Signing
    const canonicalPayloadString = canonicalJson(canonicalPayload);
    const payloadHash = sha256(canonicalPayloadString);
    const ed25519Signature = signEd25519(payloadHash, this.getPrivateKeyPem());

    // 9. Persist Receipt Record
    const receipt = await this.db
      .insertInto('receipts')
      .values({
        receipt_reference: receiptReference,
        order_id: order.id,
        payment_id: payment.id,
        user_id: user.id,
        amount_minor: Number(order.total_amount_minor),
        currency: order.currency,
        status: 'ISSUED',
        ed25519_signature: ed25519Signature,
        payload_hash_sha256: payloadHash,
        canonical_payload: canonicalPayloadString,
        signing_key_id: keyId,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // 10. Record Receipt Event
    await this.db
      .insertInto('receipt_events')
      .values({
        receipt_id: receipt.id,
        event_name: 'RECEIPT_ISSUED',
        payload: JSON.stringify({
          receiptReference,
          orderReference: order.order_reference,
          paymentReference: payment.payment_reference,
        }),
      })
      .execute();

    // 11. Transactional Outbox Event for Email/Notification Dispatch
    await this.db
      .insertInto('outbox_events')
      .values({
        event_name: 'COMMERCE_RECEIPT_ISSUED',
        aggregate_type: 'RECEIPT',
        aggregate_id: receipt.id,
        payload: JSON.stringify({
          receiptId: receipt.id,
          receiptReference,
          orderReference: order.order_reference,
          userId: user.id,
          userEmail: user.email,
          amountMinor: Number(order.total_amount_minor),
          currency: order.currency,
        }),
        status: 'PENDING',
      })
      .execute();

    return receipt;
  }

  /**
   * Public Verification Pipeline — Six Consecutive Cryptographic Assertions
   */
  async verifyReceipt(
    receiptReference: string,
    clientIp?: string,
    userAgent?: string,
  ): Promise<ReceiptVerificationResultDTO> {
    const verifiedAt = new Date().toISOString();

    // Assertion 1: Record Existence
    const receipt = await this.db
      .selectFrom('receipts')
      .selectAll()
      .where('receipt_reference', '=', receiptReference)
      .executeTakeFirst();

    if (!receipt) {
      await this.logVerification(null, receiptReference, 'NOT_FOUND', clientIp, userAgent);
      return {
        outcome: 'NOT_FOUND',
        verifiedAt,
      };
    }

    // Assertion 2: Revocation Check
    if (receipt.status === 'REVOKED') {
      await this.logVerification(receipt.id, receiptReference, 'REVOKED', clientIp, userAgent);
      return {
        outcome: 'REVOKED',
        receiptReference,
        verifiedAt,
      };
    }

    // Assertion 3: Payload Fingerprint Invariant
    const payloadStr =
      typeof receipt.canonical_payload === 'string'
        ? receipt.canonical_payload
        : canonicalJson(receipt.canonical_payload);
    const computedHash = sha256(payloadStr);

    if (computedHash !== receipt.payload_hash_sha256) {
      await this.logVerification(receipt.id, receiptReference, 'TAMPERED', clientIp, userAgent);
      return {
        outcome: 'TAMPERED',
        receiptReference,
        verifiedAt,
      };
    }

    // Assertion 4: Key Registry Lookup
    const signingKey = await this.db
      .selectFrom('receipt_signing_keys')
      .selectAll()
      .where('key_id', '=', receipt.signing_key_id)
      .executeTakeFirst();

    if (!signingKey || !signingKey.is_active) {
      await this.logVerification(receipt.id, receiptReference, 'INVALID', clientIp, userAgent);
      return {
        outcome: 'INVALID',
        receiptReference,
        verifiedAt,
      };
    }

    // Assertion 5: Cryptographic Signature Validation
    const isSignatureValid = verifyEd25519(
      receipt.payload_hash_sha256,
      receipt.ed25519_signature,
      signingKey.public_key_pem,
    );

    if (!isSignatureValid) {
      await this.logVerification(receipt.id, receiptReference, 'TAMPERED', clientIp, userAgent);
      return {
        outcome: 'TAMPERED',
        receiptReference,
        verifiedAt,
      };
    }

    // Assertion 6: Payment Linkage & State Invariant
    const payment = await this.db
      .selectFrom('payments')
      .selectAll()
      .where('id', '=', receipt.payment_id)
      .executeTakeFirst();

    if (!payment || payment.status !== 'VERIFIED') {
      await this.logVerification(receipt.id, receiptReference, 'INVALID', clientIp, userAgent);
      return {
        outcome: 'INVALID',
        receiptReference,
        verifiedAt,
      };
    }

    // All assertions passed — Record verification log & return public result
    await this.logVerification(receipt.id, receiptReference, 'VERIFIED', clientIp, userAgent);

    let parsedPayload: CanonicalReceiptPayload | null = null;
    try {
      parsedPayload =
        typeof receipt.canonical_payload === 'string'
          ? (JSON.parse(receipt.canonical_payload) as CanonicalReceiptPayload)
          : (receipt.canonical_payload as unknown as CanonicalReceiptPayload);
    } catch {
      parsedPayload = null;
    }

    return {
      outcome: 'VERIFIED',
      receiptReference: receipt.receipt_reference,
      issuedAt: receipt.issued_at.toISOString(),
      amountMinor: Number(receipt.amount_minor),
      currency: receipt.currency,
      publisherName: parsedPayload?.publisher?.publisherName || 'CourseCity Official',
      customerMaskedName: maskName(parsedPayload?.customer?.displayName || 'Learner'),
      signingKeyId: receipt.signing_key_id,
      fingerprintSha256: receipt.payload_hash_sha256,
      verifiedAt,
    };
  }

  /**
   * Retrieves full receipt detail for authenticated customer
   */
  async getReceiptByReference(receiptReference: string) {
    const receipt = await this.db
      .selectFrom('receipts')
      .selectAll()
      .where('receipt_reference', '=', receiptReference)
      .executeTakeFirst();

    if (!receipt) {
      return null;
    }

    const payload =
      typeof receipt.canonical_payload === 'string'
        ? (JSON.parse(receipt.canonical_payload) as CanonicalReceiptPayload)
        : (receipt.canonical_payload as unknown as CanonicalReceiptPayload);

    return {
      ...receipt,
      parsedPayload: payload,
    };
  }

  private async logVerification(
    receiptId: string | null,
    receiptReference: string,
    result: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    try {
      await this.db
        .insertInto('receipt_verifications')
        .values({
          receipt_id: receiptId,
          receipt_reference: receiptReference,
          result,
          ip_address: ipAddress || null,
          user_agent: userAgent || null,
        })
        .execute();
    } catch {
      // Non-blocking telemetry
    }
  }
}
