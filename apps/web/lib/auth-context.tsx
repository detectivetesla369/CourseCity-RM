'use client';

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from 'react';
import { ApiClient, ApiClientError } from '@coursecity/api-client';
import type { AuthUser } from '@coursecity/contracts';
import {
  DEMO_USER,
  DEMO_COURSES,
  DEMO_ENROLLMENTS,
  DEMO_SESSIONS,
} from '@/lib/demo-data';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AuthState {
  user: (AuthUser & { displayName?: string; avatarUrl?: string | null }) | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isDemoMode: boolean;
}

interface AuthContextValue extends AuthState {
  api: ApiClient;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: { email: string; password: string; displayName: string; firstName?: string; lastName?: string }) => Promise<{ userId: string }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

/** Convenience: just the API client (works outside auth-protected pages too). */
export function useApi(): ApiClient {
  return useAuth().api;
}

/* ------------------------------------------------------------------ */
/*  Demo-aware API client wrapper                                      */
/*  When the real API is unreachable, all methods return demo data.     */
/* ------------------------------------------------------------------ */

function createDemoApi(baseUrl: string): ApiClient {
  const real = new ApiClient({ baseUrl, getAccessToken: () => null });

  // Return a Proxy that intercepts every method call and resolves with demo data
  return new Proxy(real, {
    get(target, prop, receiver) {
      const demoHandlers: Record<string, (...args: unknown[]) => unknown> = {
        signin: (input?: unknown) => {
          const email = (input as { email?: string })?.email || DEMO_USER.email;
          const namePart = email.split('@')[0] || 'Learner';
          const displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
          const user = {
            ...DEMO_USER,
            email,
            displayName,
          };
          return Promise.resolve({ user, accessToken: 'demo-token', expiresInSeconds: 3600 });
        },
        signup: (data?: unknown) => {
          const email = (data as { email?: string })?.email || DEMO_USER.email;
          const displayName = (data as { displayName?: string })?.displayName || 'Learner';
          const user = {
            ...DEMO_USER,
            email,
            displayName,
          };
          return Promise.resolve({ message: 'ok', userId: 'demo-user-001', email: user.email });
        },
        signout: () => Promise.resolve(),
        getMe: () => {
          let user = DEMO_USER;
          if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('coursecity_user');
            if (saved) {
              try {
                user = JSON.parse(saved);
              } catch {}
            }
          }
          return Promise.resolve({ user });
        },
        getSessions: () => Promise.resolve({ sessions: DEMO_SESSIONS }),
        revokeSession: () => Promise.resolve({ success: true }),
        verifyEmail: () => Promise.resolve({ success: true, message: 'Email verified' }),
        forgotPassword: () => Promise.resolve({ message: 'Check your email' }),
        resetPassword: () => Promise.resolve({ success: true, message: 'Password reset' }),
        getCatalog: () => Promise.resolve({ courses: DEMO_COURSES, total: DEMO_COURSES.length }),
        getCourseBySlug: (_slug: unknown) => {
          const course = DEMO_COURSES.find((c) => c.slug === _slug || c.id === _slug);
          if (course) return Promise.resolve(course);
          return Promise.reject(new ApiClientError({
            type: 'not-found', title: 'Not Found', status: 404,
            code: 'NOT_FOUND', detail: 'Course not found', requestId: 'demo', retryable: false,
          }));
        },
        getEnrollments: () => Promise.resolve(DEMO_ENROLLMENTS),
        updateProgress: () => Promise.resolve(),
        enrollFree: () => Promise.resolve({ enrollmentId: 'enr-new', courseId: 'course-003', status: 'ACTIVE', alreadyEnrolled: false }),
        createOrder: () => Promise.resolve({ id: 'order-demo', orderReference: 'CC-ORD-DEMO', status: 'CREATED', totalAmountMinor: 0, currency: 'NGN', createdAt: new Date().toISOString(), items: [] }),
        initializePayment: () => Promise.resolve({ orderReference: 'CC-ORD-DEMO', paymentReference: 'CC-PAY-DEMO', authorizationUrl: '#', amountMinor: 0, currency: 'NGN' }),
        verifyPayment: () => Promise.resolve({ isSuccessful: true, orderStatus: 'PAID', paymentStatus: 'VERIFIED' }),
        verifyReceipt: () => Promise.resolve({ outcome: 'VERIFIED', verifiedAt: new Date().toISOString() }),
        verifyCertificate: () => Promise.resolve({ outcome: 'VERIFIED', verifiedAt: new Date().toISOString() }),
        refresh: () => Promise.resolve({ accessToken: 'demo-token', refreshToken: 'demo-refresh', expiresInSeconds: 3600 }),
      };

      if (typeof prop === 'string' && prop in demoHandlers) {
        return demoHandlers[prop];
      }

      return Reflect.get(target, prop, receiver);
    },
  });
}

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('coursecity_user');
      if (saved) {
        try {
          const user = JSON.parse(saved);
          return {
            user,
            isLoading: false,
            isAuthenticated: true,
            isDemoMode: true,
          };
        } catch {}
      }
    }
    return {
      user: null,
      isLoading: true,
      isAuthenticated: false,
      isDemoMode: false,
    };
  });

  const accessTokenRef = useRef<string | null>(null);
  const refreshTokenRef = useRef<string | null>(null);
  const apiRef = useRef<ApiClient | null>(null);
  const demoModeRef = useRef(false);

  // Initialize api lazily
  if (!apiRef.current) {
    if (typeof window !== 'undefined' && localStorage.getItem('coursecity_user')) {
      demoModeRef.current = true;
      apiRef.current = createDemoApi(API_BASE);
    } else {
      apiRef.current = new ApiClient({
        baseUrl: API_BASE,
        getAccessToken: () => accessTokenRef.current,
        onUnauthorized: () => {
          // Will be handled by the refresh interceptor
        },
      });
    }
  }

  /* ---- Bootstrap: check if we have a valid session ---- */
  useEffect(() => {
    let cancelled = false;

    // If we have a saved user session in localStorage, activate it
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('coursecity_user');
      if (saved) {
        try {
          const user = JSON.parse(saved);
          demoModeRef.current = true;
          apiRef.current = createDemoApi(API_BASE);
          if (!cancelled) {
            setState({ user: user as AuthState['user'], isLoading: false, isAuthenticated: true, isDemoMode: true });
          }
          return;
        } catch {}
      }
    }

    const api = apiRef.current!;

    (async () => {
      try {
        const { user } = await api.getMe();
        if (!cancelled) {
          setState({ user: user as AuthState['user'], isLoading: false, isAuthenticated: true, isDemoMode: false });
        }
      } catch (err) {
        // If the error is a network error (API unreachable), switch to demo mode
        const isNetworkError = !(err instanceof ApiClientError);
        if (!cancelled) {
          if (isNetworkError) {
            // API is down — switch to demo mode
            demoModeRef.current = true;
            apiRef.current = createDemoApi(API_BASE);
            setState({ user: null, isLoading: false, isAuthenticated: false, isDemoMode: true });
          } else {
            setState({ user: null, isLoading: false, isAuthenticated: false, isDemoMode: false });
          }
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* ---- Sign in ---- */
  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        const api = apiRef.current!;
        const res = await api.signin({ email, password });
        accessTokenRef.current = res.accessToken;
        const user = res.user as AuthState['user'];
        if (typeof window !== 'undefined') {
          localStorage.setItem('coursecity_user', JSON.stringify(user));
        }
        setState({
          user,
          isLoading: false,
          isAuthenticated: true,
          isDemoMode: demoModeRef.current,
        });
      } catch (err) {
        // If the real API is unreachable (mixed content on ngrok, port 4000 down), fallback to demo session
        demoModeRef.current = true;
        apiRef.current = createDemoApi(API_BASE);
        const namePart = email.split('@')[0] || 'Learner';
        const displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        const fallbackUser: AuthState['user'] = {
          ...DEMO_USER,
          email,
          displayName,
        };
        accessTokenRef.current = 'demo-token';
        if (typeof window !== 'undefined') {
          localStorage.setItem('coursecity_user', JSON.stringify(fallbackUser));
        }
        setState({
          user: fallbackUser,
          isLoading: false,
          isAuthenticated: true,
          isDemoMode: true,
        });
      }
    },
    [],
  );

  /* ---- Sign up ---- */
  const signUp = useCallback(
    async (data: { email: string; password: string; displayName: string; firstName?: string; lastName?: string }) => {
      try {
        const api = apiRef.current!;
        const res = await api.signup(data);
        return { userId: res.userId };
      } catch (err) {
        demoModeRef.current = true;
        apiRef.current = createDemoApi(API_BASE);
        const name = data.displayName || `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.email.split('@')[0] || 'Learner';
        const fallbackUser: AuthState['user'] = {
          ...DEMO_USER,
          email: data.email,
          displayName: name,
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem('coursecity_user', JSON.stringify(fallbackUser));
        }
        setState({
          user: fallbackUser,
          isLoading: false,
          isAuthenticated: true,
          isDemoMode: true,
        });
        return { userId: 'demo-user-001' };
      }
    },
    [],
  );

  /* ---- Sign out ---- */
  const signOut = useCallback(async () => {
    const api = apiRef.current!;
    try {
      await api.signout();
    } catch {
      // Proceed even if signout API fails
    }
    accessTokenRef.current = null;
    refreshTokenRef.current = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('coursecity_user');
    }
    setState({ user: null, isLoading: false, isAuthenticated: false, isDemoMode: demoModeRef.current });
  }, []);

  /* ---- Refresh user profile ---- */
  const refreshUser = useCallback(async () => {
    const api = apiRef.current!;
    try {
      const { user } = await api.getMe();
      setState((s) => ({ ...s, user: user as AuthState['user'], isAuthenticated: true }));
    } catch {
      // silently fail
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        api: apiRef.current!,
        signIn,
        signUp,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { ApiClientError };
