import crypto from 'node:crypto';
import type {
  IPaymentProvider,
  InitializePaymentParams,
  PaymentInitializationResult,
  VerifyPaymentResult,
  RefundResult,
} from '@coursecity/contracts';

export interface PaystackProviderOptions {
  secretKey?: string;
  baseUrl?: string;
  isMockMode?: boolean;
}

export class PaystackPaymentProvider implements IPaymentProvider {
  public readonly providerName = 'PAYSTACK';
  private readonly secretKey: string;
  private readonly baseUrl: string;
  private readonly isMockMode: boolean;

  // In-memory registry for mock mode transactions during tests and local dev
  private readonly mockTransactions = new Map<
    string,
    {
      amountMinor: number;
      currency: string;
      isSuccessful: boolean;
      paidAt: Date;
    }
  >();

  constructor(options: PaystackProviderOptions = {}) {
    this.secretKey =
      options.secretKey ||
      process.env.PAYSTACK_SECRET_KEY ||
      'sk_test_dev_paystack_secret_key_mock';
    this.baseUrl = options.baseUrl || process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co';

    // Enable mock mode if explicitly requested or if running in test environment or secret key is mock
    this.isMockMode =
      options.isMockMode !== undefined
        ? options.isMockMode
        : process.env.NODE_ENV === 'test' ||
          this.secretKey.startsWith('sk_test_dev') ||
          this.secretKey.includes('mock');
  }

  /**
   * Initializes a payment checkout session with Paystack
   */
  async initializePayment(params: InitializePaymentParams): Promise<PaymentInitializationResult> {
    if (this.isMockMode) {
      // Store transaction params in mock registry
      this.mockTransactions.set(params.paymentReference, {
        amountMinor: params.amountMinor,
        currency: params.currency,
        isSuccessful: true,
        paidAt: new Date(),
      });

      return {
        providerReference: params.paymentReference,
        authorizationUrl: `https://checkout.paystack.com/mock_auth_${params.paymentReference}`,
        accessCode: `acc_${params.paymentReference.replace(/-/g, '').toLowerCase()}`,
      };
    }

    const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reference: params.paymentReference,
        amount: params.amountMinor,
        email: params.customerEmail,
        currency: params.currency,
        callback_url: params.callbackUrl,
        metadata: {
          orderReference: params.orderReference,
          ...params.metadata,
        },
      }),
    });

    const body = (await response.json()) as {
      status: boolean;
      message: string;
      data?: {
        reference: string;
        authorization_url: string;
        access_code: string;
      };
    };

    if (!response.ok || !body.status || !body.data) {
      throw new Error(`Paystack initialization failed: ${body.message || response.statusText}`);
    }

    return {
      providerReference: body.data.reference,
      authorizationUrl: body.data.authorization_url,
      accessCode: body.data.access_code,
    };
  }

  /**
   * Outbound independent payment verification via Paystack API
   */
  async verifyPayment(providerReference: string): Promise<VerifyPaymentResult> {
    if (this.isMockMode) {
      const mock = this.mockTransactions.get(providerReference);
      const isSuccessful = mock ? mock.isSuccessful : true;
      const amountMinor = mock ? mock.amountMinor : 14999;
      const currency = mock ? mock.currency : 'GHS';
      const paidAt = mock ? mock.paidAt : new Date();

      return {
        isSuccessful,
        providerTransactionId: `pstk_tx_${providerReference}`,
        providerReference,
        amountMinor,
        currency,
        paidAt,
        rawResponse: {
          status: true,
          message: 'Verification successful',
          data: {
            id: 123456789,
            status: isSuccessful ? 'success' : 'failed',
            reference: providerReference,
            amount: amountMinor,
            currency,
            paid_at: paidAt.toISOString(),
          },
        },
      };
    }

    const response = await fetch(
      `${this.baseUrl}/transaction/verify/${encodeURIComponent(providerReference)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
        },
      },
    );

    const body = (await response.json()) as {
      status: boolean;
      message: string;
      data?: {
        id: number | string;
        status: string;
        reference: string;
        amount: number;
        currency: string;
        paid_at?: string;
      };
    };

    if (!response.ok || !body.status || !body.data) {
      return {
        isSuccessful: false,
        providerTransactionId: '',
        providerReference,
        amountMinor: 0,
        currency: 'GHS',
        paidAt: new Date(),
        rawResponse: body as Record<string, unknown>,
      };
    }

    return {
      isSuccessful: body.data.status === 'success',
      providerTransactionId: String(body.data.id),
      providerReference: body.data.reference,
      amountMinor: body.data.amount,
      currency: body.data.currency,
      paidAt: body.data.paid_at ? new Date(body.data.paid_at) : new Date(),
      rawResponse: body as Record<string, unknown>,
    };
  }

  /**
   * Verifies inbound webhook HMAC-SHA512 signature in constant-time
   */
  verifyWebhookSignature(rawBody: Buffer | string, signatureHeader: string): boolean {
    if (!signatureHeader || !this.secretKey) return false;

    const hmac = crypto.createHmac('sha512', this.secretKey);
    hmac.update(rawBody);
    const calculatedSignature = hmac.digest('hex');

    try {
      const sigBuf = Buffer.from(signatureHeader, 'hex');
      const calcBuf = Buffer.from(calculatedSignature, 'hex');
      if (sigBuf.length !== calcBuf.length) return false;
      return crypto.timingSafeEqual(sigBuf, calcBuf);
    } catch {
      return false;
    }
  }

  /**
   * Generates a valid webhook signature for test simulation
   */
  generateTestWebhookSignature(rawBody: Buffer | string): string {
    const hmac = crypto.createHmac('sha512', this.secretKey);
    hmac.update(rawBody);
    return hmac.digest('hex');
  }

  /**
   * Test helper to register or override mock transaction status
   */
  setMockTransaction(
    reference: string,
    mock: {
      amountMinor: number;
      currency: string;
      isSuccessful: boolean;
      paidAt?: Date;
    },
  ): void {
    this.mockTransactions.set(reference, {
      amountMinor: mock.amountMinor,
      currency: mock.currency,
      isSuccessful: mock.isSuccessful,
      paidAt: mock.paidAt || new Date(),
    });
  }

  /**
   * Processes a refund via Paystack API
   */
  async processRefund(
    paymentReference: string,
    amountMinor: number,
    reason: string,
  ): Promise<RefundResult> {
    if (this.isMockMode) {
      return {
        isSuccessful: true,
        refundReference: `pstk_rf_${paymentReference}`,
        amountMinor,
        rawResponse: { status: true, message: 'Mock refund successful' },
      };
    }

    const response = await fetch(`${this.baseUrl}/refund`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transaction: paymentReference,
        amount: amountMinor,
        customer_note: reason,
      }),
    });

    const body = (await response.json()) as {
      status: boolean;
      message: string;
      data?: {
        id: number | string;
        status: string;
      };
    };

    return {
      isSuccessful: response.ok && !!body.status,
      refundReference: body.data ? String(body.data.id) : `rf_${paymentReference}`,
      amountMinor,
      rawResponse: body as Record<string, unknown>,
    };
  }
}
