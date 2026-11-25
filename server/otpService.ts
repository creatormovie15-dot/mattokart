import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type AuthRole = 'customer' | 'seller' | 'admin';

export interface PhoneValidationResult {
  isValid: boolean;
  formatted: string;
  cleanDigits: string;
  internationalPhone: string;
  error?: string;
}

export interface SendOtpServiceResult {
  httpStatus: number;
  body: {
    success: boolean;
    providerConfigured: boolean;
    provider?: 'supabase_phone_auth_msg91' | 'none';
    code?: string;
    formattedPhone?: string;
    message: string;
    error?: string;
    cooldownSeconds?: number;
    retryAfterSeconds?: number;
    expiresInSeconds?: number;
  };
}

export interface VerifyOtpServiceResult {
  httpStatus: number;
  body: {
    success: boolean;
    user?: {
      id: string;
      phone: string;
      email?: string;
      fullName: string;
      role: AuthRole;
      sellerId?: string;
      token: string;
    };
    session?: {
      access_token: string;
      refresh_token: string;
    };
    message?: string;
    error?: string;
    code?: string;
  };
}

export interface VerifiedSessionUser {
  id: string;
  phone: string;
  email?: string;
  fullName: string;
  role: AuthRole;
  sellerId?: string;
}

interface RateLimitRecord {
  attempts: number;
  lastAttemptAt: number;
  blockedUntil?: number;
}

const otpRateLimits = new Map<string, RateLimitRecord>();

export function getSupabaseServerConfig(): { url: string; serviceRoleKey: string; anonKey: string } {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const anonKey = (
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    ''
  ).trim();

  const isPlaceholder = (v: string) =>
    !v ||
    v.includes('your-project') ||
    v.includes('your-anon-or-publishable-key') ||
    v.includes('your-backend-service-role-key') ||
    v.includes('example.com');

  return {
    url: isPlaceholder(url) ? '' : url.replace(/\/+$/, ''),
    serviceRoleKey: isPlaceholder(serviceRoleKey) ? '' : serviceRoleKey,
    anonKey: isPlaceholder(anonKey) ? '' : anonKey,
  };
}

export function getSupabaseAdminClient(): SupabaseClient | null {
  const supa = getSupabaseServerConfig();
  if (!supa.url || !supa.serviceRoleKey) return null;
  return createClient(supa.url, supa.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getSmsProviderStatus(): {
  supabaseAuthConfigured: boolean;
  serviceRoleConfigured: boolean;
  anyConfigured: boolean;
  providerLabel: string;
} {
  const supa = getSupabaseServerConfig();
  const supabaseAuthConfigured = Boolean(supa.url && (supa.anonKey || supa.serviceRoleKey));
  const serviceRoleConfigured = Boolean(supa.url && supa.serviceRoleKey);

  return {
    supabaseAuthConfigured,
    serviceRoleConfigured,
    anyConfigured: supabaseAuthConfigured,
    providerLabel: supabaseAuthConfigured ? 'Supabase Phone Auth + MSG91 (Send SMS Hook)' : 'Not configured',
  };
}

export function validateIndianPhoneNumber(rawPhone: string): PhoneValidationResult {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return {
      isValid: false,
      formatted: '',
      cleanDigits: '',
      internationalPhone: '',
      error: 'Mobile number is required.',
    };
  }

  let digits = rawPhone.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) {
    digits = digits.slice(2);
  } else if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.slice(1);
  }

  if (digits.length !== 10) {
    return {
      isValid: false,
      formatted: '',
      cleanDigits: digits,
      internationalPhone: '',
      error: 'Please enter a valid 10-digit Indian mobile number (e.g. 98970 12345).',
    };
  }

  if (!/^[6-9]/.test(digits)) {
    return {
      isValid: false,
      formatted: '',
      cleanDigits: digits,
      internationalPhone: '',
      error: 'Valid Indian mobile numbers must begin with 6, 7, 8, or 9.',
    };
  }

  return {
    isValid: true,
    formatted: `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`,
    cleanDigits: digits,
    internationalPhone: `+91${digits}`,
  };
}

function checkRateLimit(
  cleanDigits: string,
  clientIp: string
): { allowed: true } | { allowed: false; retryAfterSeconds: number; message: string } {
  const key = `${clientIp}_${cleanDigits}`;
  const now = Date.now();
  const record = otpRateLimits.get(key) || { attempts: 0, lastAttemptAt: 0 };

  if (record.blockedUntil && now < record.blockedUntil) {
    const waitSecs = Math.ceil((record.blockedUntil - now) / 1000);
    return {
      allowed: false,
      retryAfterSeconds: waitSecs,
      message: `Too many OTP requests. Please wait ${waitSecs} seconds before retrying.`,
    };
  }

  if (record.lastAttemptAt && now - record.lastAttemptAt < 60 * 1000) {
    const cooldownLeft = Math.ceil((60 * 1000 - (now - record.lastAttemptAt)) / 1000);
    return {
      allowed: false,
      retryAfterSeconds: cooldownLeft,
      message: `Please wait ${cooldownLeft} seconds before requesting a new OTP.`,
    };
  }

  if (record.attempts >= 5) {
    record.blockedUntil = now + 10 * 60 * 1000;
    otpRateLimits.set(key, record);
    return {
      allowed: false,
      retryAfterSeconds: 600,
      message: 'OTP limit reached (max 5 per 10 minutes). Please try again later.',
    };
  }

  record.attempts += 1;
  record.lastAttemptAt = now;
  otpRateLimits.set(key, record);
  return { allowed: true };
}

async function safeFetchJson(url: string, init: RequestInit): Promise<{ ok: boolean; status: number; data: any }> {
  const response = await fetch(url, init);
  const rawText = await response.text();
  let data: any = null;
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = { message: rawText.slice(0, 300) };
  }
  return { ok: response.ok, status: response.status, data };
}

/**
 * Non-destructive lookup & preservation of existing user profiles and seller records.
 * Never overwrites an existing admin/seller role and never deletes or mutates existing seller data.
 */
async function resolveProfileAndSeller(params: {
  userId: string;
  cleanDigits: string;
  internationalPhone: string;
  requestedRole: AuthRole;
  requestedFullName?: string;
}): Promise<{ role: AuthRole; fullName?: string; sellerId?: string; email?: string }> {
  const adminClient = getSupabaseAdminClient();
  if (!adminClient) {
    return {
      role: params.requestedRole,
      fullName: params.requestedFullName,
      sellerId: params.requestedRole === 'seller' ? `seller-${params.cleanDigits}` : undefined,
      email: `${params.cleanDigits}@phone.mattokart.in`,
    };
  }

  let matchedSeller: { id: string; owner_name?: string; shop_name?: string; user_id?: string } | null = null;
  try {
    const formattedPhone = `+91 ${params.cleanDigits.slice(0, 5)} ${params.cleanDigits.slice(5)}`;
    const spacedPhone = `+91 ${params.cleanDigits}`;

    // Match by auth user_id first, then by normalized Indian phone formats
    const { data: sellerByUid } = await adminClient
      .from('sellers')
      .select('id, owner_name, shop_name, user_id')
      .eq('user_id', params.userId)
      .limit(1);

    if (Array.isArray(sellerByUid) && sellerByUid.length > 0) {
      matchedSeller = sellerByUid[0];
    } else {
      const { data: sellerByPhone } = await adminClient
        .from('sellers')
        .select('id, owner_name, shop_name, user_id')
        .or(
          `phone.eq.${params.internationalPhone},phone.eq.${formattedPhone},phone.eq.${spacedPhone},phone.eq.${params.cleanDigits}`
        )
        .limit(1);

      if (Array.isArray(sellerByPhone) && sellerByPhone.length > 0) {
        matchedSeller = sellerByPhone[0];
      }
    }
  } catch {
    // Preserve graceful fallback without mutating existing seller data
  }

  let resolvedRole: AuthRole = matchedSeller ? 'seller' : params.requestedRole;
  let resolvedName = params.requestedFullName || matchedSeller?.owner_name;
  let resolvedEmail = `${params.cleanDigits}@phone.mattokart.in`;

  try {
    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('id', params.userId)
      .maybeSingle();

    if (existingProfile) {
      // Preserve existing role (especially admin or seller)
      if (existingProfile.role === 'admin') {
        resolvedRole = 'admin';
      } else if (existingProfile.role === 'seller' || matchedSeller) {
        resolvedRole = 'seller';
      } else {
        resolvedRole = existingProfile.role as AuthRole;
      }

      if (existingProfile.full_name) {
        resolvedName = existingProfile.full_name;
      }
      if (existingProfile.email) {
        resolvedEmail = existingProfile.email;
      }
    } else {
      // Create missing profile safely using non-null email fallback
      await adminClient.from('profiles').insert({
        id: params.userId,
        email: resolvedEmail,
        full_name: resolvedName || null,
        phone: params.internationalPhone,
        role: resolvedRole === 'admin' ? 'customer' : resolvedRole,
      });
    }
  } catch {
    // Do not block verified login if profile table has not yet been seeded
  }

  return {
    role: resolvedRole,
    fullName: resolvedName,
    sellerId: matchedSeller?.id || (resolvedRole === 'seller' ? `seller-${params.cleanDigits}` : undefined),
    email: resolvedEmail,
  };
}

export async function handleSendOtp(params: {
  phone?: unknown;
  role?: unknown;
  fullName?: unknown;
  clientIp?: string;
}): Promise<SendOtpServiceResult> {
  const rawPhone = typeof params.phone === 'string' || typeof params.phone === 'number' ? String(params.phone) : '';
  const phoneCheck = validateIndianPhoneNumber(rawPhone);

  if (!phoneCheck.isValid) {
    return {
      httpStatus: 400,
      body: {
        success: false,
        providerConfigured: getSmsProviderStatus().anyConfigured,
        code: 'INVALID_PHONE',
        message: phoneCheck.error || 'Invalid mobile number.',
        error: phoneCheck.error || 'Invalid mobile number.',
      },
    };
  }

  const supa = getSupabaseServerConfig();
  const supaApiKey = supa.anonKey || supa.serviceRoleKey;

  if (!supa.url || !supaApiKey) {
    return {
      httpStatus: 503,
      body: {
        success: false,
        providerConfigured: false,
        provider: 'none',
        code: 'SMS_PROVIDER_NOT_CONFIGURED',
        message: 'Supabase Phone Auth is not configured on this server.',
        error:
          'Authentication service is not configured. Set SUPABASE_URL, SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY), and SUPABASE_SERVICE_ROLE_KEY, and enable Phone Auth with the send-sms-msg91 Hook in Supabase.',
      },
    };
  }

  const role: AuthRole = params.role === 'seller' ? 'seller' : 'customer';
  const fullName = params.fullName ? String(params.fullName).trim().slice(0, 120) : undefined;
  const cleanDigits = phoneCheck.cleanDigits;
  const internationalPhone = phoneCheck.internationalPhone;

  const rateCheck = checkRateLimit(cleanDigits, params.clientIp || 'unknown');
  if (!rateCheck.allowed) {
    return {
      httpStatus: 429,
      body: {
        success: false,
        providerConfigured: true,
        code: 'RATE_LIMITED',
        message: rateCheck.message,
        error: rateCheck.message,
        retryAfterSeconds: rateCheck.retryAfterSeconds,
        cooldownSeconds: rateCheck.retryAfterSeconds,
      },
    };
  }

  const supaRes = await safeFetchJson(`${supa.url}/auth/v1/otp`, {
    method: 'POST',
    headers: {
      apikey: supaApiKey,
      Authorization: `Bearer ${supaApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phone: internationalPhone,
      create_user: true,
      data: {
        role,
        ...(fullName ? { full_name: fullName } : {}),
      },
    }),
  });

  if (!supaRes.ok) {
    const rawMsg =
      supaRes.data?.msg ||
      supaRes.data?.error_description ||
      supaRes.data?.message ||
      `Supabase Auth returned HTTP ${supaRes.status}`;

    const httpStatus = supaRes.status === 429 ? 429 : supaRes.status >= 500 ? 502 : 502;
    return {
      httpStatus,
      body: {
        success: false,
        providerConfigured: true,
        provider: 'supabase_phone_auth_msg91',
        code: supaRes.status === 429 ? 'SUPABASE_RATE_LIMIT' : 'SMS_DISPATCH_FAILED',
        message: 'Failed to dispatch SMS OTP via Supabase Phone Auth.',
        error: `OTP delivery failed: ${rawMsg}. Verify Phone Auth and the send-sms-msg91 Send SMS Hook in Supabase Dashboard.`,
      },
    };
  }

  return {
    httpStatus: 200,
    body: {
      success: true,
      providerConfigured: true,
      provider: 'supabase_phone_auth_msg91',
      formattedPhone: phoneCheck.formatted,
      message: `OTP sent via SMS to ${phoneCheck.formatted}`,
      cooldownSeconds: 60,
      expiresInSeconds: 300,
    },
  };
}

export async function handleVerifyOtp(params: {
  phone?: unknown;
  otp?: unknown;
  role?: unknown;
  fullName?: unknown;
}): Promise<VerifyOtpServiceResult> {
  const rawPhone = typeof params.phone === 'string' || typeof params.phone === 'number' ? String(params.phone) : '';
  const phoneCheck = validateIndianPhoneNumber(rawPhone);

  if (!phoneCheck.isValid) {
    return {
      httpStatus: 400,
      body: {
        success: false,
        code: 'INVALID_PHONE',
        error: phoneCheck.error || 'Invalid Indian mobile number.',
      },
    };
  }

  const cleanInputOtp = String(params.otp || '').trim();
  if (!/^\d{6}$/.test(cleanInputOtp)) {
    return {
      httpStatus: 400,
      body: {
        success: false,
        code: 'INVALID_OTP_FORMAT',
        error: 'Please enter the 6-digit numeric OTP code.',
      },
    };
  }

  const supa = getSupabaseServerConfig();
  const supaApiKey = supa.anonKey || supa.serviceRoleKey;
  if (!supa.url || !supaApiKey) {
    return {
      httpStatus: 503,
      body: {
        success: false,
        code: 'SMS_PROVIDER_NOT_CONFIGURED',
        error: 'Authentication is unavailable: Supabase Auth is not configured on the server.',
      },
    };
  }

  const cleanDigits = phoneCheck.cleanDigits;
  const internationalPhone = phoneCheck.internationalPhone;
  const requestedRole: AuthRole = params.role === 'seller' ? 'seller' : 'customer';
  const requestedFullName = params.fullName ? String(params.fullName).trim().slice(0, 120) : undefined;

  const verifyRes = await safeFetchJson(`${supa.url}/auth/v1/verify`, {
    method: 'POST',
    headers: {
      apikey: supaApiKey,
      Authorization: `Bearer ${supaApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phone: internationalPhone,
      token: cleanInputOtp,
      type: 'sms',
    }),
  });

  if (!verifyRes.ok || !verifyRes.data?.access_token || !verifyRes.data?.user?.id) {
    const rawMsg =
      verifyRes.data?.msg ||
      verifyRes.data?.error_description ||
      verifyRes.data?.message ||
      'Incorrect or expired OTP code. Please verify and try again.';
    return {
      httpStatus: verifyRes.status >= 500 ? 502 : 400,
      body: {
        success: false,
        code: 'OTP_VERIFICATION_FAILED',
        error: rawMsg,
      },
    };
  }

  const verifiedUserId = String(verifyRes.data.user.id);
  const accessToken = String(verifyRes.data.access_token);
  const refreshToken = String(verifyRes.data.refresh_token || '');
  const metaName =
    requestedFullName ||
    (typeof verifyRes.data.user?.user_metadata?.full_name === 'string'
      ? verifyRes.data.user.user_metadata.full_name.trim()
      : undefined);

  const resolved = await resolveProfileAndSeller({
    userId: verifiedUserId,
    cleanDigits,
    internationalPhone,
    requestedRole,
    requestedFullName: metaName,
  });

  const finalFullName =
    resolved.fullName || (resolved.role === 'seller' ? 'MattoKart Seller' : 'MattoKart Customer');

  return {
    httpStatus: 200,
    body: {
      success: true,
      user: {
        id: verifiedUserId,
        phone: internationalPhone,
        email: resolved.email,
        fullName: finalFullName,
        role: resolved.role,
        sellerId: resolved.sellerId,
        token: accessToken,
      },
      session: {
        access_token: accessToken,
        refresh_token: refreshToken,
      },
      message: 'Verified successfully! Welcome to MattoKart.',
    },
  };
}

export async function verifySupabaseAccessToken(accessToken: string): Promise<VerifiedSessionUser | null> {
  if (!accessToken) return null;
  const supa = getSupabaseServerConfig();
  const supaApiKey = supa.anonKey || supa.serviceRoleKey;
  if (!supa.url || !supaApiKey) return null;

  try {
    const res = await safeFetchJson(`${supa.url}/auth/v1/user`, {
      method: 'GET',
      headers: {
        apikey: supaApiKey,
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!res.ok || !res.data?.id) return null;

    const rawPhone = String(res.data.phone || '');
    const digits = rawPhone.replace(/\D/g, '').slice(-10);
    const intlPhone = digits.length === 10 ? `+91${digits}` : rawPhone;
    const reqRole: AuthRole = res.data.user_metadata?.role === 'seller' ? 'seller' : 'customer';

    const resolved = await resolveProfileAndSeller({
      userId: String(res.data.id),
      cleanDigits: digits,
      internationalPhone: intlPhone,
      requestedRole: reqRole,
      requestedFullName: res.data.user_metadata?.full_name,
    });

    return {
      id: String(res.data.id),
      phone: intlPhone,
      email: resolved.email || res.data.email,
      fullName: resolved.fullName || (resolved.role === 'seller' ? 'MattoKart Seller' : 'MattoKart Customer'),
      role: resolved.role,
      sellerId: resolved.sellerId,
    };
  } catch {
    return null;
  }
}
