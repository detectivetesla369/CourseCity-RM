import type {
  ProblemDetails,
  AuthResponseDTO,
  AuthUser,
  AuthSessionDTO,
  CourseDetailDTO,
  EnrollmentDTO,
  OrderDTO,
  PaymentInitializationResponse,
  ReceiptVerificationResultDTO,
  CertificateVerificationResultDTO,
} from '@coursecity/contracts';
import type {
  SignupInput,
  SigninInput,
  VerifyEmailInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  CatalogFilterQuery,
  CreateOrderInput,
  UpdateProgressInput,
} from '@coursecity/validation';

export class ApiClientError extends Error {
  public readonly problem: ProblemDetails;

  constructor(problem: ProblemDetails) {
    super(problem.detail || problem.title);
    this.name = 'ApiClientError';
    this.problem = problem;
  }
}

export interface ApiClientConfig {
  baseUrl: string;
  getAccessToken?: () => Promise<string | null> | string | null;
  onUnauthorized?: () => void;
}

export class ApiClient {
  private baseUrl: string;
  private getAccessToken?: () => Promise<string | null> | string | null;
  private onUnauthorized?: () => void;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.getAccessToken = config.getAccessToken;
    this.onUnauthorized = config.onUnauthorized;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = new Headers(options.headers || {});

    if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
      headers.set('Content-Type', 'application/json');
    }

    if (this.getAccessToken && !headers.has('Authorization')) {
      const token = await this.getAccessToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401 && this.onUnauthorized) {
        this.onUnauthorized();
      }

      let problem: ProblemDetails;
      try {
        problem = (await response.json()) as ProblemDetails;
      } catch {
        problem = {
          type: 'https://api.coursecity.com/problems/network-error',
          title: response.statusText || 'Request Failed',
          status: response.status,
          code: 'HTTP_ERROR',
          detail: `HTTP ${response.status} occurred when calling ${endpoint}`,
          requestId: 'client-gen-' + Math.random().toString(36).substring(7),
          retryable: response.status >= 500,
        };
      }
      throw new ApiClientError(problem);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  // --- Auth Endpoints ---
  async signup(data: SignupInput): Promise<{ message: string; userId: string; email: string }> {
    return this.request<{ message: string; userId: string; email: string }>('/api/v1/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async signin(data: SigninInput): Promise<AuthResponseDTO> {
    return this.request<AuthResponseDTO>('/api/v1/auth/signin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async refresh(refreshToken?: string): Promise<{ accessToken: string; refreshToken: string; expiresInSeconds: number }> {
    return this.request<{ accessToken: string; refreshToken: string; expiresInSeconds: number }>('/api/v1/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  async signout(): Promise<void> {
    return this.request<void>('/api/v1/auth/signout', { method: 'POST' });
  }

  async verifyEmail(data: VerifyEmailInput): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/api/v1/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async forgotPassword(data: ForgotPasswordInput): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resetPassword(data: ResetPasswordInput): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMe(): Promise<{ user: AuthUser }> {
    return this.request<{ user: AuthUser }>('/api/v1/auth/me');
  }

  async getSessions(): Promise<{ sessions: AuthSessionDTO[] }> {
    return this.request<{ sessions: AuthSessionDTO[] }>('/api/v1/auth/sessions');
  }

  async revokeSession(sessionId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/v1/auth/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  // --- Catalog & Courses ---
  async getCatalog(
    query: Partial<CatalogFilterQuery> = {},
  ): Promise<{ courses: CourseDetailDTO[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (query.page) searchParams.set('page', String(query.page));
    if (query.limit) searchParams.set('limit', String(query.limit));
    if (query.search) searchParams.set('search', query.search);
    if (query.category) searchParams.set('category', query.category);
    if (query.level) searchParams.set('level', query.level);
    if (query.sort) searchParams.set('sort', query.sort);

    return this.request<{ courses: CourseDetailDTO[]; total: number }>(
      `/api/v1/catalog?${searchParams.toString()}`,
    );
  }

  async getCourseBySlug(slug: string): Promise<CourseDetailDTO> {
    return this.request<CourseDetailDTO>(`/api/v1/courses/${slug}`);
  }

  // --- Learning & Progress ---
  async getEnrollments(): Promise<EnrollmentDTO[]> {
    return this.request<EnrollmentDTO[]>('/api/v1/enrollments');
  }

  async updateProgress(data: UpdateProgressInput): Promise<void> {
    return this.request<void>('/api/v1/progress', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- Orders & Checkout ---
  async createOrder(data: CreateOrderInput): Promise<OrderDTO> {
    return this.request<OrderDTO>('/api/v1/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async enrollFree(courseId: string): Promise<{ enrollmentId: string; courseId: string; status: string; alreadyEnrolled: boolean }> {
    return this.request<{ enrollmentId: string; courseId: string; status: string; alreadyEnrolled: boolean }>('/api/v1/enrollments/free', {
      method: 'POST',
      body: JSON.stringify({ courseId }),
    });
  }

  async initializePayment(orderId: string, callbackUrl?: string): Promise<PaymentInitializationResponse> {
    return this.request<PaymentInitializationResponse>(`/api/v1/payments/initialize/${orderId}`, {
      method: 'POST',
      body: callbackUrl ? JSON.stringify({ callbackUrl }) : undefined,
    });
  }

  async verifyPayment(reference: string): Promise<{ isSuccessful: boolean; orderStatus: string; paymentStatus: string; receiptReference?: string }> {
    return this.request<{ isSuccessful: boolean; orderStatus: string; paymentStatus: string; receiptReference?: string }>(`/api/v1/payments/verify/${reference}`);
  }

  // --- Public Verifications ---
  async verifyReceipt(receiptReference: string): Promise<ReceiptVerificationResultDTO> {
    return this.request<ReceiptVerificationResultDTO>(
      `/api/v1/receipts/verify/${receiptReference}`,
    );
  }

  async verifyCertificate(certificateReference: string): Promise<CertificateVerificationResultDTO> {
    return this.request<CertificateVerificationResultDTO>(
      `/api/v1/certificates/verify/${certificateReference}`,
    );
  }
}
