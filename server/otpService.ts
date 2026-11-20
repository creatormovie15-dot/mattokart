import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

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
    provider?: 'twilio_verify' | 'twilio_sms' | 'msg91' | 'supabase_phone_auth' | 'none';
    code?: string;
    formattedPhone?: string;
    message: string;
    error?: string;
    challengeToken?: string;
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
      fullName: string;
      role: AuthRole;
      sellerId?: string;
      token: string;
    };
    message?: string;
    error?: string;
    code?: string;
    attemptsRemaining?: number;
  };
}

interface RateLimitRecord {
  attempts: number;
  lastAttemptAt: number;
  blockedUntil?: number;
}

interface PendingOtpSession {
  codeHash: string;
  nonce: string;
  phone: string;
  cleanDigits: string;
  role: AuthRole;
  fullName?: string;
  provider: 'twilio_verify' | 'twilio_sms' | 'msg91' | 'supabase_phone_auth';
  expiresAt: number;
  failedAttempts: number;
}

interface SignedChallengePayload {
  p: string; // clean 10-digit phone
  r: AuthRole;
  f?: string; // fullName
  pr: 'twilio_verify' | 'twilio_sms' | 'msg91' | 'supabase_phone_auth';
  e: number; // expiresAt ms
  n: string; // nonce
  h?: string; // hmac hash of OTP (only for direct SMS providers)
}

export interface VerifiedSessionUser {
  id: string;
  phone: string;
  fullName: string;
  role: AuthRole;
  sellerId?: string;
  createdAt: number;
  expiresAt: number;
}

const otpRateLimits = new Map<string, RateLimitRecord>();
const pendingOtpSessions = new Map<string, PendingOtpSession>();
const revokedUserTokens = new Set<string>();
const ephemeralFallbackSecret = crypto.randomBytes(32).toString('hex');

function getServerSigningSecret(): string {
  return (
    process.env.OTP_SIGNING_SECRET?.trim() ||
    process.env.ADMIN_SECRET_KEY?.trim() ||
    process.env.TWILIO_AUTH_TOKEN?.trim() ||
    process.env.MSG91_AUTH_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    ephemeralFallbackSecret
  );
}

function getSupabaseServerConfig(): { url: string; serviceRoleKey: string; anonKey: string } {
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
    url: isPlaceholder(url) ? '' : url,
    serviceRoleKey: isPlaceholder(serviceRoleKey) ? '' : serviceRoleKey,
    anonKey: isPlaceholder(anonKey) ? '' : anonKey,
  };
}

export function getSmsProviderStatus(): {
  hasTwilioVerify: boolean;
  hasTwilioSms: boolean;
  hasMsg91: boolean;
  hasMsg91KeyOnly: boolean;
  hasSupabasePhoneAuth: boolean;
  anyConfigured: boolean;
  providerLabel: string;
} {
  const sid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
  const token = (process.env.TWILIO_AUTH_TOKEN || '').trim();
  const fromPhone = (process.env.TWILIO_PHONE_NUMBER || '').trim();
  const verifySid = (process.env.TWILIO_VERIFY_SERVICE_SID || '').trim();
  const msg91Key = (process.env.MSG91_AUTH_KEY || '').trim();
  const msg91Template = (process.env.MSG91_TEMPLATE_ID || '').trim();
  const supa = getSupabaseServerConfig();

  const hasTwilioVerify = Boolean(sid && token && verifySid);
  const hasTwilioSms = Boolean(sid && token && fromPhone);
  const hasMsg91 = Boolean(msg91Key && msg91Template);
  const hasMsg91KeyOnly = Boolean(msg91Key && !msg91Template);
  const hasSupabasePhoneAuth = Boolean(supa.url && (supa.serviceRoleKey || supa.anonKey));

  const anyConfigured = hasTwilioVerify || hasTwilioSms || hasMsg91 || hasSupabasePhoneAuth;
  const providerLabel = hasTwilioVerify
    ? 'Twilio Verify'
    : hasTwilioSms
    ? 'Twilio SMS'
    : hasMsg91
    ? 'MSG91'
    : hasSupabasePhoneAuth
    ? 'Supabase Phone Auth'
    : 'Not configured';

  return {
    hasTwilioVerify,
    hasTwilioSms,
    hasMsg91,
    hasMsg91KeyOnly,
    hasSupabasePhoneAuth,
    anyConfigured,
    providerLabel,
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

function hashOtpCode(cleanDigits: string, role: AuthRole, otpCode: string, expiresAt: number, nonce: string): string {
  return crypto
    .createHmac('sha256', getServerSigningSecret())
    .update(`${cleanDigits}:${role}:${otpCode}:${expiresAt}:${nonce}`)
    .digest('hex');
}

function signChallengePayload(payload: SignedChallengePayload): string {
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', getServerSigningSecret()).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyChallengeToken(token: string): SignedChallengePayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [encoded, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', getServerSigningSecret()).update(encoded).digest('base64url');
    const sigBuf = Buffer.from(sig, 'utf8');
    const expectedBuf = Buffer.from(expectedSig, 'utf8');
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }
    const decoded = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SignedChallengePayload;
    if (!decoded || typeof decoded.p !== 'string' || typeof decoded.e !== 'number') {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function issueSignedUserToken(user: Omit<VerifiedSessionUser, 'expiresAt'>): string {
  const fullPayload: VerifiedSessionUser = {
    ...user,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  const encoded = Buffer.from(JSON.stringify(fullPayload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', getServerSigningSecret()).update(`usr:${encoded}`).digest('base64url');
  return `mkt_${encoded}.${sig}`;
}

export function verifySignedUserToken(token: string): VerifiedSessionUser | null {
  try {
    if (!token || revokedUserTokens.has(token) || !token.startsWith('mkt_')) return null;
    const raw = token.slice(4);
    const parts = raw.split('.');
    if (parts.length !== 2) return null;
    const [encoded, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', getServerSigningSecret()).update(`usr:${encoded}`).digest('base64url');
    const sigBuf = Buffer.from(sig, 'utf8');
    const expectedBuf = Buffer.from(expectedSig, 'utf8');
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as VerifiedSessionUser;
    if (!parsed || !parsed.id || Date.now() > parsed.expiresAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function revokeUserToken(token?: string): void {
  if (token) {
    revokedUserTokens.add(token);
  }
}

function checkRateLimit(cleanDigits: string, clientIp: string): { allowed: true } | { allowed: false; retryAfterSeconds: number; message: string } {
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

async function safeFetchJson(url: string, init: RequestInit): Promise<{ ok: boolean; status: number; data: any; rawText: string }> {
  const response = await fetch(url, init);
  const rawText = await response.text();
  let data: any = null;
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = { message: rawText.slice(0, 300) };
  }
  return { ok: response.ok, status: response.status, data, rawText };
}

async function lookupSellerByPhone(cleanDigits: string, internationalPhone: string): Promise<{ sellerId?: string; shopName?: string; ownerName?: string }> {
  const supa = getSupabaseServerConfig();
  if (!supa.url || !supa.serviceRoleKey) return {};

  try {
    const adminClient = createClient(supa.url, supa.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const formattedPhone = `+91 ${cleanDigits.slice(0, 5)} ${cleanDigits.slice(5)}`;
    const spacedPhone = `+91 ${cleanDigits}`;

    const { data, error } = await adminClient
      .from('sellers')
      .select('id, shop_name, owner_name, phone')
      .or(`phone.eq.${internationalPhone},phone.eq.${formattedPhone},phone.eq.${spacedPhone},phone.eq.${cleanDigits}`)
      .limit(1);

    if (!error && Array.isArray(data) && data.length > 0) {
      return {
        sellerId: data[0].id,
        shopName: data[0].shop_name,
        ownerName: data[0].owner_name,
      };
    }
  } catch {
    // Preserve caller fallback without modifying seller records
  }
  return {};
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
        providerConfigured: getSmsProviderStatus().anyConfigured,
        code: 'RATE_LIMITED',
        message: rateCheck.message,
        error: rateCheck.message,
        retryAfterSeconds: rateCheck.retryAfterSeconds,
        cooldownSeconds: rateCheck.retryAfterSeconds,
      },
    };
  }

  const status = getSmsProviderStatus();

  if (status.hasMsg91KeyOnly && !status.hasTwilioVerify && !status.hasTwilioSms && !status.hasSupabasePhoneAuth) {
    return {
      httpStatus: 503,
      body: {
        success: false,
        providerConfigured: false,
        code: 'MSG91_TEMPLATE_MISSING',
        message: 'MSG91_TEMPLATE_ID is required alongside MSG91_AUTH_KEY for DLT-compliant Indian SMS OTP delivery.',
        error: 'MSG91_TEMPLATE_ID is missing in server environment variables.',
      },
    };
  }

  if (!status.anyConfigured) {
    return {
      httpStatus: 503,
      body: {
        success: false,
        providerConfigured: false,
        provider: 'none',
        code: 'SMS_PROVIDER_NOT_CONFIGURED',
        message: 'Live SMS OTP gateway is not configured on this server.',
        error:
          'SMS OTP service is not configured. Please add Twilio (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID or TWILIO_PHONE_NUMBER), MSG91 (MSG91_AUTH_KEY, MSG91_TEMPLATE_ID), or Supabase Phone Auth environment variables.',
      },
    };
  }

  const expiresAt = Date.now() + 5 * 60 * 1000;
  const nonce = crypto.randomBytes(12).toString('hex');

  // 1. Twilio Verify (Recommended stateless SMS verification)
  if (status.hasTwilioVerify) {
    const sid = process.env.TWILIO_ACCOUNT_SID!.trim();
    const token = process.env.TWILIO_AUTH_TOKEN!.trim();
    const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID!.trim();
    const auth = Buffer.from(`${sid}:${token}`).toString('base64');

    const form = new URLSearchParams({
      To: internationalPhone,
      Channel: 'sms',
    });

    const twilioRes = await safeFetchJson(
      `https://verify.twilio.com/v2/Services/${encodeURIComponent(verifySid)}/Verifications`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form.toString(),
      }
    );

    if (!twilioRes.ok) {
      const errDetail = twilioRes.data?.message || `Twilio Verify returned HTTP ${twilioRes.status}`;
      return {
        httpStatus: 502,
        body: {
          success: false,
          providerConfigured: true,
          provider: 'twilio_verify',
          code: 'SMS_DISPATCH_FAILED',
          message: 'Failed to send OTP via Twilio Verify.',
          error: `Twilio Verify SMS error: ${errDetail}`,
        },
      };
    }

    const challengeToken = signChallengePayload({
      p: cleanDigits,
      r: role,
      f: fullName,
      pr: 'twilio_verify',
      e: expiresAt,
      n: nonce,
    });

    return {
      httpStatus: 200,
      body: {
        success: true,
        providerConfigured: true,
        provider: 'twilio_verify',
        formattedPhone: phoneCheck.formatted,
        message: `OTP sent via SMS to ${phoneCheck.formatted}`,
        challengeToken,
        cooldownSeconds: 60,
        expiresInSeconds: 300,
      },
    };
  }

  // 2. Twilio Programmable SMS
  if (status.hasTwilioSms) {
    const otpCode = crypto.randomInt(100000, 1000000).toString();
    const sid = process.env.TWILIO_ACCOUNT_SID!.trim();
    const token = process.env.TWILIO_AUTH_TOKEN!.trim();
    const fromPhone = process.env.TWILIO_PHONE_NUMBER!.trim();
    const auth = Buffer.from(`${sid}:${token}`).toString('base64');

    const form = new URLSearchParams({
      To: internationalPhone,
      From: fromPhone,
      Body: `Your MattoKart verification OTP is ${otpCode}. Valid for 5 minutes. Do not share this code with anyone.`,
    });

    const twilioRes = await safeFetchJson(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form.toString(),
      }
    );

    if (!twilioRes.ok) {
      const errDetail = twilioRes.data?.message || `Twilio SMS returned HTTP ${twilioRes.status}`;
      return {
        httpStatus: 502,
        body: {
          success: false,
          providerConfigured: true,
          provider: 'twilio_sms',
          code: 'SMS_DISPATCH_FAILED',
          message: 'Failed to send OTP via Twilio SMS.',
          error: `Twilio SMS delivery error: ${errDetail}`,
        },
      };
    }

    const codeHash = hashOtpCode(cleanDigits, role, otpCode, expiresAt, nonce);
    pendingOtpSessions.set(cleanDigits, {
      codeHash,
      nonce,
      phone: internationalPhone,
      cleanDigits,
      role,
      fullName,
      provider: 'twilio_sms',
      expiresAt,
      failedAttempts: 0,
    });

    const challengeToken = signChallengePayload({
      p: cleanDigits,
      r: role,
      f: fullName,
      pr: 'twilio_sms',
      e: expiresAt,
      n: nonce,
      h: codeHash,
    });

    return {
      httpStatus: 200,
      body: {
        success: true,
        providerConfigured: true,
        provider: 'twilio_sms',
        formattedPhone: phoneCheck.formatted,
        message: `OTP sent via SMS to ${phoneCheck.formatted}`,
        challengeToken,
        cooldownSeconds: 60,
        expiresInSeconds: 300,
      },
    };
  }

  // 3. MSG91 India SMS Gateway
  if (status.hasMsg91) {
    const otpCode = crypto.randomInt(100000, 1000000).toString();
    const authKey = process.env.MSG91_AUTH_KEY!.trim();
    const templateId = process.env.MSG91_TEMPLATE_ID!.trim();
    const msg91Url = new URL('https://control.msg91.com/api/v5/otp');
    msg91Url.searchParams.set('template_id', templateId);
    msg91Url.searchParams.set('mobile', `91${cleanDigits}`);
    msg91Url.searchParams.set('otp', otpCode);

    const msg91Res = await safeFetchJson(msg91Url.toString(), {
      method: 'POST',
      headers: {
        authkey: authKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ OTP: otpCode }),
    });

    if (!msg91Res.ok || msg91Res.data?.type === 'error') {
      const errDetail = msg91Res.data?.message || `MSG91 returned HTTP ${msg91Res.status}`;
      return {
        httpStatus: 502,
        body: {
          success: false,
          providerConfigured: true,
          provider: 'msg91',
          code: 'SMS_DISPATCH_FAILED',
          message: 'Failed to dispatch OTP via MSG91.',
          error: `MSG91 SMS error: ${errDetail}`,
        },
      };
    }

    const codeHash = hashOtpCode(cleanDigits, role, otpCode, expiresAt, nonce);
    pendingOtpSessions.set(cleanDigits, {
      codeHash,
      nonce,
      phone: internationalPhone,
      cleanDigits,
      role,
      fullName,
      provider: 'msg91',
      expiresAt,
      failedAttempts: 0,
    });

    const challengeToken = signChallengePayload({
      p: cleanDigits,
      r: role,
      f: fullName,
      pr: 'msg91',
      e: expiresAt,
      n: nonce,
      h: codeHash,
    });

    return {
      httpStatus: 200,
      body: {
        success: true,
        providerConfigured: true,
        provider: 'msg91',
        formattedPhone: phoneCheck.formatted,
        message: `OTP sent via SMS to ${phoneCheck.formatted}`,
        challengeToken,
        cooldownSeconds: 60,
        expiresInSeconds: 300,
      },
    };
  }

  // 4. Supabase Phone Auth (/auth/v1/otp)
  const supa = getSupabaseServerConfig();
  const supaApiKey = supa.serviceRoleKey || supa.anonKey;
  const supaRes = await safeFetchJson(`${supa.url.replace(/\/+$/, '')}/auth/v1/otp`, {
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
    const rawMsg = supaRes.data?.msg || supaRes.data?.error_description || supaRes.data?.message || `HTTP ${supaRes.status}`;
    return {
      httpStatus: 502,
      body: {
        success: false,
        providerConfigured: false,
        provider: 'supabase_phone_auth',
        code: 'SUPABASE_PHONE_PROVIDER_ERROR',
        message: 'Supabase Phone Auth could not dispatch an SMS OTP.',
        error: `Supabase SMS dispatch failed: ${rawMsg}. Ensure Phone Auth with an SMS provider (Twilio/MSG91) is enabled in Supabase Authentication settings, or set TWILIO_* / MSG91_* variables in Netlify.`,
      },
    };
  }

  const challengeToken = signChallengePayload({
    p: cleanDigits,
    r: role,
    f: fullName,
    pr: 'supabase_phone_auth',
    e: expiresAt,
    n: nonce,
  });

  return {
    httpStatus: 200,
    body: {
      success: true,
      providerConfigured: true,
      provider: 'supabase_phone_auth',
      formattedPhone: phoneCheck.formatted,
      message: `OTP sent via SMS to ${phoneCheck.formatted}`,
      challengeToken,
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
  challengeToken?: unknown;
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

  const cleanDigits = phoneCheck.cleanDigits;
  const internationalPhone = phoneCheck.internationalPhone;
  const status = getSmsProviderStatus();

  if (!status.anyConfigured) {
    return {
      httpStatus: 503,
      body: {
        success: false,
        code: 'SMS_PROVIDER_NOT_CONFIGURED',
        error: 'Authentication is unavailable: Live SMS gateway credentials are not configured on the server.',
      },
    };
  }

  const signedChallenge =
    typeof params.challengeToken === 'string' && params.challengeToken.trim()
      ? verifyChallengeToken(params.challengeToken.trim())
      : null;

  const localSession = pendingOtpSessions.get(cleanDigits);

  if (signedChallenge && signedChallenge.p !== cleanDigits) {
    return {
      httpStatus: 400,
      body: {
        success: false,
        code: 'CHALLENGE_PHONE_MISMATCH',
        error: 'OTP session does not match this mobile number. Please request a new OTP.',
      },
    };
  }

  const expiresAt = signedChallenge?.e ?? localSession?.expiresAt;
  if (expiresAt && Date.now() > expiresAt) {
    pendingOtpSessions.delete(cleanDigits);
    return {
      httpStatus: 400,
      body: {
        success: false,
        code: 'OTP_EXPIRED',
        error: 'OTP has expired. Please request a new verification code.',
      },
    };
  }

  const provider =
    signedChallenge?.pr ||
    localSession?.provider ||
    (status.hasTwilioVerify
      ? 'twilio_verify'
      : status.hasTwilioSms
      ? 'twilio_sms'
      : status.hasMsg91
      ? 'msg91'
      : 'supabase_phone_auth');

  const resolvedRole: AuthRole =
    params.role === 'seller' || signedChallenge?.r === 'seller' || localSession?.role === 'seller'
      ? 'seller'
      : 'customer';

  let verifiedUserId = `user-${cleanDigits}`;

  if (provider === 'twilio_verify') {
    if (!status.hasTwilioVerify) {
      return {
        httpStatus: 503,
        body: { success: false, error: 'Twilio Verify credentials are missing on the server.' },
      };
    }

    const sid = process.env.TWILIO_ACCOUNT_SID!.trim();
    const token = process.env.TWILIO_AUTH_TOKEN!.trim();
    const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID!.trim();
    const auth = Buffer.from(`${sid}:${token}`).toString('base64');
    const form = new URLSearchParams({
      To: internationalPhone,
      Code: cleanInputOtp,
    });

    const verifyRes = await safeFetchJson(
      `https://verify.twilio.com/v2/Services/${encodeURIComponent(verifySid)}/VerificationCheck`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form.toString(),
      }
    );

    if (!verifyRes.ok || verifyRes.data?.status !== 'approved') {
      return {
        httpStatus: verifyRes.ok ? 400 : 502,
        body: {
          success: false,
          code: 'OTP_VERIFICATION_FAILED',
          error: verifyRes.data?.message || 'Incorrect or expired OTP code. Please check and try again.',
        },
      };
    }
  } else if (provider === 'supabase_phone_auth') {
    const supa = getSupabaseServerConfig();
    if (!supa.url || (!supa.serviceRoleKey && !supa.anonKey)) {
      return {
        httpStatus: 503,
        body: { success: false, error: 'Supabase Auth credentials are missing on the server.' },
      };
    }

    const supaApiKey = supa.serviceRoleKey || supa.anonKey;
    const verifyRes = await safeFetchJson(`${supa.url.replace(/\/+$/, '')}/auth/v1/verify`, {
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

    if (!verifyRes.ok) {
      const msg =
        verifyRes.data?.msg ||
        verifyRes.data?.error_description ||
        verifyRes.data?.message ||
        'Incorrect or expired OTP code.';
      return {
        httpStatus: verifyRes.status >= 500 ? 502 : 400,
        body: {
          success: false,
          code: 'OTP_VERIFICATION_FAILED',
          error: msg,
        },
      };
    }

    if (verifyRes.data?.user?.id) {
      verifiedUserId = String(verifyRes.data.user.id);
    }
  } else {
    // twilio_sms or msg91 using stateless signed challenge or local session hash
    if (!signedChallenge?.h && !localSession) {
      return {
        httpStatus: 400,
        body: {
          success: false,
          code: 'NO_ACTIVE_OTP',
          error: 'No active OTP session found for this mobile number. Please click "Send OTP".',
        },
      };
    }

    if (localSession && localSession.failedAttempts >= 5) {
      pendingOtpSessions.delete(cleanDigits);
      return {
        httpStatus: 429,
        body: {
          success: false,
          code: 'OTP_LOCKED',
          error: 'Too many incorrect attempts. This OTP session has been locked. Please request a new code.',
        },
      };
    }

    const targetNonce = signedChallenge?.n ?? localSession!.nonce;
    const targetExpiresAt = signedChallenge?.e ?? localSession!.expiresAt;
    const expectedHash = signedChallenge?.h ?? localSession!.codeHash;
    const candidateHash = hashOtpCode(cleanDigits, resolvedRole, cleanInputOtp, targetExpiresAt, targetNonce);

    const expectedBuf = Buffer.from(expectedHash, 'utf8');
    const candidateBuf = Buffer.from(candidateHash, 'utf8');
    const isMatch = expectedBuf.length === candidateBuf.length && crypto.timingSafeEqual(expectedBuf, candidateBuf);

    if (!isMatch) {
      let attemptsRemaining: number | undefined;
      if (localSession) {
        localSession.failedAttempts += 1;
        attemptsRemaining = Math.max(0, 5 - localSession.failedAttempts);
      }
      return {
        httpStatus: 400,
        body: {
          success: false,
          code: 'INCORRECT_OTP',
          error:
            attemptsRemaining !== undefined
              ? `Incorrect OTP code. ${attemptsRemaining} attempts remaining.`
              : 'Incorrect OTP code. Please verify and try again.',
          attemptsRemaining,
        },
      };
    }

    pendingOtpSessions.delete(cleanDigits);
  }

  // Non-destructive read-only seller lookup if Supabase service role is configured
  const matchedSeller = resolvedRole === 'seller' ? await lookupSellerByPhone(cleanDigits, internationalPhone) : {};

  const requestedFullName =
    (typeof params.fullName === 'string' && params.fullName.trim()) ||
    signedChallenge?.f ||
    localSession?.fullName ||
    matchedSeller.ownerName ||
    (resolvedRole === 'seller' ? 'MattoKart Seller' : 'MattoKart Customer');

  const sellerId = resolvedRole === 'seller' ? matchedSeller.sellerId || `seller-${cleanDigits}` : undefined;

  const userToken = issueSignedUserToken({
    id: verifiedUserId,
    phone: internationalPhone,
    fullName: requestedFullName,
    role: resolvedRole,
    sellerId,
    createdAt: Date.now(),
  });

  return {
    httpStatus: 200,
    body: {
      success: true,
      user: {
        id: verifiedUserId,
        phone: internationalPhone,
        fullName: requestedFullName,
        role: resolvedRole,
        sellerId,
        token: userToken,
      },
      message: 'Verified successfully! Welcome to MattoKart.',
    },
  };
}
