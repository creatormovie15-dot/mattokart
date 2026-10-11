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

/**
 * Server-side Admin Approval for Seller
 */
export async function adminApproveSeller(
  sellerId: string,
  adminKey: string,
  adminNotes?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`/api/admin/sellers/${encodeURIComponent(sellerId)}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey,
      },
      body: JSON.stringify({ adminNotes }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Server-side Admin Rejection for Seller
 */
export async function adminRejectSeller(
  sellerId: string,
  adminKey: string,
  reason: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`/api/admin/sellers/${encodeURIComponent(sellerId)}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey,
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
