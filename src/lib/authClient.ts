import { AuthUser, UserRole, IdentityVerificationMethod } from '../types';

export interface SendOtpResponse {
  success: boolean;
  providerConfigured: boolean;
  provider?: string;
  code?: string;
  sandboxMode?: boolean;
  formattedPhone?: string;
  message: string;
  developerNotice?: string;
  testOtpCode?: string;
  challengeToken?: string;
  cooldownSeconds?: number;
  retryAfterSeconds?: number;
  expiresInSeconds?: number;
  error?: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  user?: AuthUser;
  message?: string;
  error?: string;
  code?: string;
  attemptsRemaining?: number;
}

const STORAGE_KEY = 'mattokart_auth_user';

export const getStoredAuthUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredAuthUser = (user: AuthUser | null): void => {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Fail safe
  }
};

/**
 * Safely fetch JSON from an API endpoint.
 * Prevents "Unexpected token '<', '<!DOCTYPE ...' is not valid JSON" when an HTML fallback
 * or proxy error page is returned instead of JSON.
 */
async function safeApiFetchJson<T extends Record<string, any>>(
  url: string,
  options?: RequestInit
): Promise<{ ok: boolean; status: number; data: T | null; error?: string }> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    const rawText = await res.text();
    const trimmed = rawText.trim();

    if (!trimmed) {
      return {
        ok: false,
        status: res.status,
        data: null,
        error: `Empty response from server (HTTP ${res.status}).`,
      };
    }

    if (
      contentType.toLowerCase().includes('text/html') ||
      trimmed.startsWith('<!DOCTYPE') ||
      trimmed.startsWith('<!doctype') ||
      trimmed.startsWith('<html')
    ) {
      return {
        ok: false,
        status: res.status,
        data: null,
        error: `API endpoint returned HTML instead of JSON (HTTP ${res.status}). Please verify Netlify Functions and /api/* redirects are deployed.`,
      };
    }

    try {
      const parsed = JSON.parse(trimmed) as T;
      return {
        ok: res.ok,
        status: res.status,
        data: parsed,
        error: !res.ok ? parsed.error || parsed.message || `Request failed with HTTP ${res.status}` : undefined,
      };
    } catch {
      return {
        ok: false,
        status: res.status,
        data: null,
        error: `Invalid JSON response from server (HTTP ${res.status}).`,
      };
    }
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: err?.message || 'Network error connecting to MattoKart API server.',
    };
  }
}

/**
 * Send OTP to an Indian mobile number
 */
export async function sendMobileOtp(
  phone: string,
  role: UserRole = 'customer',
  fullName?: string
): Promise<SendOtpResponse> {
  const result = await safeApiFetchJson<SendOtpResponse>('/api/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ phone, role, fullName }),
  });

  if (result.data) {
    return {
      ...result.data,
      success: Boolean(result.data.success && result.ok),
      error: result.data.error || result.error,
    };
  }

  return {
    success: false,
    providerConfigured: false,
    message: result.error || 'Unable to reach OTP verification service.',
    error: result.error || 'Unable to reach OTP verification service.',
  };
}

/**
 * Verify OTP code
 */
export async function verifyMobileOtp(
  phone: string,
  otp: string,
  role: UserRole = 'customer',
  fullName?: string,
  challengeToken?: string
): Promise<VerifyOtpResponse> {
  const result = await safeApiFetchJson<VerifyOtpResponse>('/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ phone, otp, role, fullName, challengeToken }),
  });

  if (result.data) {
    if (result.data.success && result.ok && result.data.user) {
      setStoredAuthUser(result.data.user);
    }
    return {
      ...result.data,
      success: Boolean(result.data.success && result.ok),
      error: result.data.error || result.error,
    };
  }

  return {
    success: false,
    error: result.error || 'Verification network error',
  };
}

/**
 * Log out
 */
export async function logoutUser(): Promise<void> {
  const current = getStoredAuthUser();
  if (current?.token) {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${current.token}`,
        },
      });
    } catch {
      // Ignore network errors on logout
    }
  }
  setStoredAuthUser(null);
}

/**
 * Submit seller identity verification
 */
export async function submitIdentityVerification(
  sellerId: string,
  method: IdentityVerificationMethod,
  referenceId: string,
  gstin?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const result = await safeApiFetchJson<{ success: boolean; message?: string; error?: string }>(
    `/api/sellers/${encodeURIComponent(sellerId)}/verify-identity`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ method, referenceId, gstin }),
    }
  );
  if (result.data) {
    return {
      ...result.data,
      success: Boolean(result.data.success && result.ok),
      error: result.data.error || result.error,
    };
  }
  return { success: false, error: result.error };
}

const ADMIN_STORAGE_KEY = 'mattokart_admin_session';

export const getAdminToken = (): string | null => {
  try {
    return sessionStorage.getItem(ADMIN_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const setAdminToken = (token: string | null): void => {
  try {
    if (token) {
      sessionStorage.setItem(ADMIN_STORAGE_KEY, token);
    } else {
      sessionStorage.removeItem(ADMIN_STORAGE_KEY);
    }
  } catch {
    // Fail safe
  }
};

/**
 * Server-side Admin Login
 */
export async function adminLogin(
  secretKey: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  const result = await safeApiFetchJson<{ success: boolean; token?: string; error?: string }>('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ secretKey }),
  });

  if (result.data) {
    if (result.data.success && result.ok && result.data.token) {
      setAdminToken(result.data.token);
    }
    return {
      ...result.data,
      success: Boolean(result.data.success && result.ok),
      error: result.data.error || result.error,
    };
  }
  return { success: false, error: result.error || 'Network error during admin login' };
}

/**
 * Server-side Admin Logout
 */
export async function adminLogout(): Promise<void> {
  const token = getAdminToken();
  if (token) {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // Ignore network errors on logout
    }
  }
  setAdminToken(null);
}

/**
 * Verify active Admin Session on server
 */
export async function checkAdminSession(): Promise<boolean> {
  const token = getAdminToken();
  if (!token) return false;
  const result = await safeApiFetchJson<{ authenticated?: boolean }>('/api/admin/session', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  return Boolean(result.ok && result.data?.authenticated);
}

/**
 * Server-side Admin Approval for Seller (Authenticated via Bearer token)
 */
export async function adminApproveSeller(
  sellerId: string,
  adminNotes?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const token = getAdminToken();
  if (!token) {
    return { success: false, error: 'Administrator session not found. Please log in.' };
  }
  const result = await safeApiFetchJson<{ success: boolean; message?: string; error?: string }>(
    `/api/admin/sellers/${encodeURIComponent(sellerId)}/approve`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ adminNotes }),
    }
  );
  if (result.data) {
    return {
      ...result.data,
      success: Boolean(result.data.success && result.ok),
      error: result.data.error || result.error,
    };
  }
  return { success: false, error: result.error };
}

/**
 * Server-side Admin Rejection for Seller (Authenticated via Bearer token)
 */
export async function adminRejectSeller(
  sellerId: string,
  reason: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const token = getAdminToken();
  if (!token) {
    return { success: false, error: 'Administrator session not found. Please log in.' };
  }
  const result = await safeApiFetchJson<{ success: boolean; message?: string; error?: string }>(
    `/api/admin/sellers/${encodeURIComponent(sellerId)}/reject`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reason }),
    }
  );
  if (result.data) {
    return {
      ...result.data,
      success: Boolean(result.data.success && result.ok),
      error: result.data.error || result.error,
    };
  }
  return { success: false, error: result.error };
}

/**
 * Server-side Product Moderation Approval (Authenticated via Bearer token)
 */
export async function adminApproveProduct(
  productId: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const token = getAdminToken();
  if (!token) {
    return { success: false, error: 'Administrator session required. Please log in.' };
  }
  const result = await safeApiFetchJson<{ success: boolean; message?: string; error?: string }>(
    `/api/admin/products/${encodeURIComponent(productId)}/approve`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (result.data) {
    return {
      ...result.data,
      success: Boolean(result.data.success && result.ok),
      error: result.data.error || result.error,
    };
  }
  return { success: false, error: result.error };
}

/**
 * Server-side Product Moderation Rejection (Authenticated via Bearer token)
 */
export async function adminRejectProduct(
  productId: string,
  reason: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const token = getAdminToken();
  if (!token) {
    return { success: false, error: 'Administrator session required. Please log in.' };
  }
  const result = await safeApiFetchJson<{ success: boolean; message?: string; error?: string }>(
    `/api/admin/products/${encodeURIComponent(productId)}/reject`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reason }),
    }
  );
  if (result.data) {
    return {
      ...result.data,
      success: Boolean(result.data.success && result.ok),
      error: result.data.error || result.error,
    };
  }
  return { success: false, error: result.error };
}

/**
 * Server-side Product Publishing Permission Check
 */
export async function checkProductPublishPermission(
  sellerStatus: string,
  sellerIdentityStatus: string
): Promise<{ allowed: boolean; error?: string }> {
  const result = await safeApiFetchJson<{ allowed: boolean; error?: string }>(
    '/api/products/validate-publish-permission',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ sellerStatus, sellerIdentityStatus }),
    }
  );
  if (result.data) {
    return {
      allowed: Boolean(result.data.allowed && result.ok),
      error: result.data.error || result.error,
    };
  }
  return { allowed: false, error: result.error };
}
