import { AuthUser, UserRole, IdentityVerificationMethod } from '../types';

export interface SendOtpResponse {
  success: boolean;
  providerConfigured: boolean;
  sandboxMode?: boolean;
  formattedPhone?: string;
  message: string;
  developerNotice?: string;
  testOtpCode?: string;
  cooldownSeconds?: number;
  retryAfterSeconds?: number;
  error?: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  user?: AuthUser;
  message?: string;
  error?: string;
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
 * Send OTP to an Indian mobile number
 */
export async function sendMobileOtp(
  phone: string,
  role: UserRole = 'customer',
  fullName?: string
): Promise<SendOtpResponse> {
  try {
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, role, fullName }),
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      providerConfigured: false,
      message: 'Network error connecting to verification gateway',
      error: err.message,
    };
  }
}

/**
 * Verify OTP code
 */
export async function verifyMobileOtp(
  phone: string,
  otp: string,
  role: UserRole = 'customer',
  fullName?: string
): Promise<VerifyOtpResponse> {
  try {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp, role, fullName }),
    });

    const data = await res.json();
    if (data.success && data.user) {
      setStoredAuthUser(data.user);
    }
    return data;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Verification network error',
    };
  }
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
  try {
    const res = await fetch(`/api/sellers/${encodeURIComponent(sellerId)}/verify-identity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method, referenceId, gstin }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
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
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secretKey }),
    });
    const data = await res.json();
    if (data.success && data.token) {
      setAdminToken(data.token);
    }
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error during admin login' };
  }
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
  try {
    const res = await fetch('/api/admin/session', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    return Boolean(data.authenticated);
  } catch {
    return false;
  }
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
  try {
    const res = await fetch(`/api/admin/sellers/${encodeURIComponent(sellerId)}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ adminNotes }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
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
  try {
    const res = await fetch(`/api/admin/sellers/${encodeURIComponent(sellerId)}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reason }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
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
  try {
    const res = await fetch(`/api/admin/products/${encodeURIComponent(productId)}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
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
  try {
    const res = await fetch(`/api/admin/products/${encodeURIComponent(productId)}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reason }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Server-side Product Publishing Permission Check
 */
export async function checkProductPublishPermission(
  sellerStatus: string,
  sellerIdentityStatus: string
): Promise<{ allowed: boolean; error?: string }> {
  try {
    const res = await fetch('/api/products/validate-publish-permission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sellerStatus, sellerIdentityStatus }),
    });
    return await res.json();
  } catch (err: any) {
    return { allowed: false, error: err.message };
  }
}
