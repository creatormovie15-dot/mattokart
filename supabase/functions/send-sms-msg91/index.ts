// Supabase Edge Function: send-sms-msg91
// Integrates Supabase Auth "Send SMS Hook" with MSG91 (India DLT-compliant OTP SMS).
// Secrets required in Supabase Edge Function Secrets (NEVER in frontend code):
//   - SEND_SMS_HOOK_SECRET : Webhook secret from Supabase Auth -> Hooks -> Send SMS (v1,whsec_...)
//   - MSG91_AUTH_KEY       : MSG91 API AuthKey
//   - MSG91_TEMPLATE_ID    : MSG91 / TRAI DLT approved OTP Template ID
//   - MSG91_SENDER_ID      : Optional 6-char approved Header (e.g. MTKART)
//   - MSG91_OTP_VAR_NAME   : Optional template variable name (default: OTP)

interface SupabaseSendSmsHookPayload {
  user?: {
    id?: string;
    phone?: string;
    email?: string;
  };
  sms?: {
    otp?: string;
  };
}

function getEnv(name: string): string {
  const denoEnv = (globalThis as any)?.Deno?.env;
  if (denoEnv && typeof denoEnv.get === 'function') {
    return (denoEnv.get(name) || '').trim();
  }
  return '';
}

function jsonError(status: number, message: string): Response {
  return new Response(
    JSON.stringify({
      error: {
        http_code: status,
        message,
      },
    }),
    {
      status,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    }
  );
}

function decodeBase64ToBytes(b64: string): Uint8Array {
  const normalized = b64.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    out[i] = bin.charCodeAt(i);
  }
  return out;
}

function encodeBytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin);
}

function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Verifies Supabase Auth Standard Webhooks HMAC-SHA256 signature.
 * Header format:
 *   webhook-id: msg_...
 *   webhook-timestamp: <unix-seconds>
 *   webhook-signature: v1,<base64> [v1,<base64> ...]
 */
async function verifyStandardWebhook(
  rawBody: string,
  headers: Headers,
  hookSecret: string
): Promise<{ valid: boolean; reason?: string }> {
  const webhookId = headers.get('webhook-id') || '';
  const webhookTimestamp = headers.get('webhook-timestamp') || '';
  const webhookSignature = headers.get('webhook-signature') || '';

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    return { valid: false, reason: 'Missing Standard Webhooks signature headers.' };
  }

  const tsNum = Number(webhookTimestamp);
  if (!Number.isFinite(tsNum)) {
    return { valid: false, reason: 'Invalid webhook-timestamp header.' };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - tsNum) > 300) {
    return { valid: false, reason: 'Webhook timestamp outside 5-minute replay window.' };
  }

  // Strip optional "v1," then "whsec_" prefix used by Supabase / Standard Webhooks
  let cleanSecret = hookSecret.trim();
  if (cleanSecret.startsWith('v1,')) {
    cleanSecret = cleanSecret.slice(3);
  }
  let keyBytes: Uint8Array;
  if (cleanSecret.startsWith('whsec_')) {
    keyBytes = decodeBase64ToBytes(cleanSecret.slice('whsec_'.length));
  } else {
    keyBytes = new TextEncoder().encode(cleanSecret);
  }

  const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes.buffer as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(signedContent));
  const expectedB64 = encodeBytesToBase64(new Uint8Array(sigBuffer));

  const signatures = webhookSignature.split(/\s+/).filter(Boolean);
  for (const entry of signatures) {
    const [version, candidate] = entry.split(',', 2);
    if (version === 'v1' && candidate && timingSafeEqualString(candidate, expectedB64)) {
      return { valid: true };
    }
  }

  return { valid: false, reason: 'Webhook signature mismatch.' };
}

function normalizeIndiaMobileForMsg91(rawPhone: string): string | null {
  let digits = rawPhone.replace(/\D/g, '');
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    digits = `91${digits}`;
  } else if (digits.length === 11 && digits.startsWith('0') && /^[6-9]/.test(digits.slice(1))) {
    digits = `91${digits.slice(1)}`;
  }

  if (digits.length === 12 && digits.startsWith('91') && /^[6-9]/.test(digits.slice(2))) {
    return digits;
  }
  return null;
}

export async function handleSendSmsHookRequest(
  req: Request,
  envLookup: (name: string) => string = getEnv
): Promise<Response> {
  if (req.method !== 'POST') {
    return jsonError(405, `Method ${req.method} not allowed.`);
  }

  const hookSecret = envLookup('SEND_SMS_HOOK_SECRET');
  const msg91AuthKey = envLookup('MSG91_AUTH_KEY');
  const msg91TemplateId = envLookup('MSG91_TEMPLATE_ID');
  const msg91SenderId = envLookup('MSG91_SENDER_ID');
  const otpVarName = envLookup('MSG91_OTP_VAR_NAME') || 'OTP';

  if (!hookSecret) {
    return jsonError(500, 'Server configuration error: SEND_SMS_HOOK_SECRET is not set.');
  }
  if (!msg91AuthKey || !msg91TemplateId) {
    return jsonError(503, 'SMS gateway misconfigured: MSG91_AUTH_KEY and MSG91_TEMPLATE_ID are required.');
  }

  const rawBody = await req.text();
  const sigCheck = await verifyStandardWebhook(rawBody, req.headers, hookSecret);
  if (!sigCheck.valid) {
    return jsonError(401, sigCheck.reason || 'Unauthorized webhook caller.');
  }

  let payload: SupabaseSendSmsHookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return jsonError(400, 'Invalid JSON payload from Supabase Auth Hook.');
  }

  const rawPhone = payload.user?.phone || '';
  const otp = String(payload.sms?.otp || '').trim();

  if (!rawPhone || !otp) {
    return jsonError(400, 'Missing user.phone or sms.otp in hook payload.');
  }

  const msg91Mobile = normalizeIndiaMobileForMsg91(rawPhone);
  if (!msg91Mobile) {
    return jsonError(400, 'Only valid 10-digit Indian (+91) mobile numbers are supported.');
  }

  const msg91Url = new URL('https://control.msg91.com/api/v5/otp');
  msg91Url.searchParams.set('template_id', msg91TemplateId);
  msg91Url.searchParams.set('mobile', msg91Mobile);
  msg91Url.searchParams.set('otp', otp);
  if (msg91SenderId) {
    msg91Url.searchParams.set('sender', msg91SenderId);
  }

  try {
    const msg91Res = await fetch(msg91Url.toString(), {
      method: 'POST',
      headers: {
        authkey: msg91AuthKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        [otpVarName]: otp,
      }),
    });

    const responseText = await msg91Res.text();
    let msg91Data: any = {};
    try {
      msg91Data = responseText ? JSON.parse(responseText) : {};
    } catch {
      msg91Data = { message: responseText };
    }

    if (!msg91Res.ok || msg91Data?.type === 'error') {
      const reason = msg91Data?.message || `MSG91 HTTP ${msg91Res.status}`;
      return jsonError(502, `MSG91 SMS dispatch failed: ${reason}`);
    }

    // Supabase Send SMS Hook expects HTTP 200 JSON {} on successful SMS handoff
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  } catch (err: any) {
    return jsonError(502, `Network error contacting MSG91: ${err?.message || 'Unknown error'}`);
  }
}

const denoRuntime = (globalThis as any)?.Deno;
if (denoRuntime && typeof denoRuntime.serve === 'function') {
  denoRuntime.serve((req: Request) => handleSendSmsHookRequest(req));
}
