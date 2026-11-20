import crypto from 'node:crypto';
import {
  getSmsProviderStatus,
  handleSendOtp,
  handleVerifyOtp,
  revokeUserToken,
  verifySignedUserToken,
} from './otpService';

const PROHIBITED_KEYS = new Set(['admin123', 'mattokart', 'admin', 'password', '123456', 'root', 'qwerty']);
const revokedAdminTokens = new Set<string>();
const adminLoginAttempts = new Map<string, { attempts: number; blockedUntil?: number }>();

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function getAdminSecret(): string {
  return (process.env.ADMIN_SECRET_KEY || '').trim();
}

function issueAdminToken(secret: string): string {
  const payload = {
    role: 'admin' as const,
    exp: Date.now() + 8 * 60 * 60 * 1000,
    jti: crypto.randomBytes(12).toString('hex'),
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(`adm:${encoded}`).digest('base64url');
  return `mkt_adm_${encoded}.${sig}`;
}

function verifyAdminToken(token: string): boolean {
  const secret = getAdminSecret();
  if (!secret || !token || revokedAdminTokens.has(token) || !token.startsWith('mkt_adm_')) {
    return false;
  }
  try {
    const raw = token.slice('mkt_adm_'.length);
    const parts = raw.split('.');
    if (parts.length !== 2) return false;
    const [encoded, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', secret).update(`adm:${encoded}`).digest('base64url');
    const sigBuf = Buffer.from(sig, 'utf8');
    const expBuf = Buffer.from(expectedSig, 'utf8');
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return false;
    }
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as { role?: string; exp?: number };
    return Boolean(parsed && parsed.role === 'admin' && typeof parsed.exp === 'number' && Date.now() <= parsed.exp);
  } catch {
    return false;
  }
}

function normalizeApiPath(rawUrl: string): string {
  let pathname = '/';
  try {
    pathname = new URL(rawUrl, 'http://localhost').pathname;
  } catch {
    pathname = rawUrl.split('?')[0] || '/';
  }

  // Handle Netlify Functions path prefixes cleanly
  if (pathname.startsWith('/.netlify/functions/auth-send-otp')) {
    return '/api/auth/send-otp';
  }
  if (pathname.startsWith('/.netlify/functions/auth-verify-otp')) {
    return '/api/auth/verify-otp';
  }
  if (pathname.startsWith('/.netlify/functions/api')) {
    const rest = pathname.slice('/.netlify/functions/api'.length);
    return rest.startsWith('/api') ? rest : `/api${rest.startsWith('/') ? rest : `/${rest}`}`;
  }

  return pathname;
}

async function parseJsonBody(req: Request): Promise<{ ok: true; body: Record<string, any> } | { ok: false; error: string }> {
  const text = await req.text();
  if (!text || !text.trim()) {
    return { ok: true, body: {} };
  }
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object') {
      return { ok: true, body: parsed };
    }
    return { ok: false, error: 'Request JSON body must be a JSON object.' };
  } catch {
    return { ok: false, error: 'Invalid JSON request body.' };
  }
}

function getClientIp(req: Request): string {
  return (
    req.headers.get('x-nf-client-connection-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('client-ip') ||
    'unknown'
  );
}

export async function handleApiRequest(req: Request): Promise<Response> {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    const apiPath = normalizeApiPath(req.url);
    const method = req.method.toUpperCase();

    // 1. Send OTP
    if (apiPath === '/api/auth/send-otp') {
      if (method !== 'POST') {
        return jsonResponse({ success: false, error: `Method ${method} not allowed. Use POST.` }, 405);
      }
      const parsed = await parseJsonBody(req);
      if (!parsed.ok) {
        return jsonResponse({ success: false, error: parsed.error }, 400);
      }
      const result = await handleSendOtp({
        phone: parsed.body.phone,
        role: parsed.body.role,
        fullName: parsed.body.fullName,
        clientIp: getClientIp(req),
      });
      return jsonResponse(result.body, result.httpStatus);
    }

    // 2. Verify OTP
    if (apiPath === '/api/auth/verify-otp') {
      if (method !== 'POST') {
        return jsonResponse({ success: false, error: `Method ${method} not allowed. Use POST.` }, 405);
      }
      const parsed = await parseJsonBody(req);
      if (!parsed.ok) {
        return jsonResponse({ success: false, error: parsed.error }, 400);
      }
      const result = await handleVerifyOtp({
        phone: parsed.body.phone,
        otp: parsed.body.otp,
        role: parsed.body.role,
        fullName: parsed.body.fullName,
        challengeToken: parsed.body.challengeToken,
      });
      return jsonResponse(result.body, result.httpStatus);
    }

    // 3. Current authenticated user
    if (apiPath === '/api/auth/me') {
      if (method !== 'GET') {
        return jsonResponse({ success: false, error: `Method ${method} not allowed.` }, 405);
      }
      const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() || '';
      const user = verifySignedUserToken(token);
      if (!user) {
        return jsonResponse({ success: false, error: 'Unauthorized: No active session.' }, 401);
      }
      return jsonResponse({ success: true, user });
    }

    // 4. Logout
    if (apiPath === '/api/auth/logout') {
      if (method !== 'POST') {
        return jsonResponse({ success: false, error: `Method ${method} not allowed.` }, 405);
      }
      const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
      revokeUserToken(token);
      return jsonResponse({ success: true, message: 'Logged out successfully.' });
    }

    // 5. Seller Identity Verification
    const verifyIdentityMatch = apiPath.match(/^\/api\/sellers\/([^/]+)\/verify-identity$/);
    if (verifyIdentityMatch) {
      if (method !== 'POST') {
        return jsonResponse({ success: false, error: `Method ${method} not allowed.` }, 405);
      }
      const parsed = await parseJsonBody(req);
      if (!parsed.ok) {
        return jsonResponse({ success: false, error: parsed.error }, 400);
      }
      const sellerId = decodeURIComponent(verifyIdentityMatch[1]);
      const { method: kycMethod, referenceId, gstin, rawAadhaar } = parsed.body;

      if (rawAadhaar || (referenceId && /^\d{12}$/.test(String(referenceId).replace(/\s/g, '')))) {
        return jsonResponse(
          {
            success: false,
            error:
              'Security & Legal Violation: Under Section 29 of the Aadhaar Act and UIDAI directives, storing raw 12-digit Aadhaar numbers or Aadhaar OTPs is strictly prohibited.',
          },
          400
        );
      }

      if (!kycMethod) {
        return jsonResponse({ success: false, error: 'Verification method is required.' }, 400);
      }

      let verifiedRef = String(referenceId || '');
      if (kycMethod === 'gstin_verified') {
        const cleanGst = String(gstin || referenceId || '').trim().toUpperCase();
        const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        if (!gstinRegex.test(cleanGst)) {
          return jsonResponse(
            {
              success: false,
              error: 'Invalid GSTIN format. Must be a 15-character Indian GSTIN.',
            },
            400
          );
        }
        verifiedRef = cleanGst;
      }

      const hasKycProvider = Boolean(process.env.DIGILOCKER_CLIENT_ID || process.env.KYC_PROVIDER_API_KEY);
      return jsonResponse({
        success: true,
        sellerId,
        identityVerificationStatus: 'pending',
        identityVerificationMethod: kycMethod,
        verificationReferenceId: verifiedRef || `REF-${Date.now()}`,
        providerConfigured: hasKycProvider,
        message:
          kycMethod === 'physical_inspection_saharanpur'
            ? 'Physical verification requested. MattoKart representative will verify shop premises within 24-48 hours.'
            : 'Identity documents submitted for administrator review. Shop remains Pending until approved.',
      });
    }

    // 6. Admin Login
    if (apiPath === '/api/admin/login') {
      if (method !== 'POST') {
        return jsonResponse({ success: false, error: `Method ${method} not allowed.` }, 405);
      }
      const parsed = await parseJsonBody(req);
      if (!parsed.ok) {
        return jsonResponse({ success: false, error: parsed.error }, 400);
      }

      const ip = getClientIp(req);
      const now = Date.now();
      const rateRecord = adminLoginAttempts.get(ip) || { attempts: 0 };
      if (rateRecord.blockedUntil && now < rateRecord.blockedUntil) {
        const waitSecs = Math.ceil((rateRecord.blockedUntil - now) / 1000);
        return jsonResponse(
          {
            success: false,
            error: `Too many failed admin login attempts. Please wait ${waitSecs} seconds.`,
            retryAfterSeconds: waitSecs,
          },
          429
        );
      }

      const providedKey = String(parsed.body.secretKey || parsed.body.password || '').trim();
      if (!providedKey) {
        return jsonResponse({ success: false, error: 'Administrator secret key is required.' }, 400);
      }
      if (PROHIBITED_KEYS.has(providedKey.toLowerCase())) {
        return jsonResponse(
          {
            success: false,
            error: 'Security Error: Weak default keys are strictly prohibited.',
          },
          400
        );
      }

      const adminSecret = getAdminSecret();
      if (!adminSecret) {
        return jsonResponse(
          {
            success: false,
            error: 'Server configuration error: ADMIN_SECRET_KEY environment variable is not configured.',
          },
          500
        );
      }

      const providedBuf = Buffer.from(providedKey, 'utf8');
      const secretBuf = Buffer.from(adminSecret, 'utf8');
      const isMatch = providedBuf.length === secretBuf.length && crypto.timingSafeEqual(providedBuf, secretBuf);

      if (!isMatch) {
        rateRecord.attempts += 1;
        if (rateRecord.attempts >= 5) {
          rateRecord.blockedUntil = now + 15 * 60 * 1000;
        }
        adminLoginAttempts.set(ip, rateRecord);
        return jsonResponse({ success: false, error: 'Invalid administrator credentials. Access denied.' }, 401);
      }

      adminLoginAttempts.delete(ip);
      const token = issueAdminToken(adminSecret);
      return jsonResponse({
        success: true,
        token,
        role: 'admin',
        expiresInSeconds: 28800,
        message: 'Administrator authenticated successfully.',
      });
    }

    // 7. Admin Logout
    if (apiPath === '/api/admin/logout') {
      const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
      if (token) revokedAdminTokens.add(token);
      return jsonResponse({ success: true, message: 'Admin logged out successfully.' });
    }

    // 8. Admin Session Check
    if (apiPath === '/api/admin/session') {
      const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() || '';
      if (!verifyAdminToken(token)) {
        return jsonResponse({ authenticated: false, error: 'Session expired or invalid.' }, 401);
      }
      return jsonResponse({ authenticated: true, role: 'admin' });
    }

    // 9. Admin Seller & Product Moderation
    const adminSellerMatch = apiPath.match(/^\/api\/admin\/sellers\/([^/]+)\/(approve|reject)$/);
    if (adminSellerMatch) {
      if (method !== 'POST') {
        return jsonResponse({ success: false, error: `Method ${method} not allowed.` }, 405);
      }
      const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() || '';
      if (!verifyAdminToken(token)) {
        return jsonResponse({ success: false, error: 'Access Denied: Valid administrator session required.' }, 401);
      }
      const parsed = await parseJsonBody(req);
      const sellerId = decodeURIComponent(adminSellerMatch[1]);
      const action = adminSellerMatch[2];
      if (action === 'approve') {
        return jsonResponse({
          success: true,
          sellerId,
          status: 'active',
          identityVerificationStatus: 'verified',
          reviewedBy: 'Admin (Saharanpur Trade HQ)',
          reviewedAt: new Date().toISOString(),
          adminNotes: parsed.ok && parsed.body.adminNotes ? parsed.body.adminNotes : 'Approved by administrator.',
          message: 'Seller successfully verified and approved.',
        });
      }
      return jsonResponse({
        success: true,
        sellerId,
        status: 'pending_approval',
        identityVerificationStatus: 'rejected',
        verificationRejectionReason:
          parsed.ok && parsed.body.reason ? parsed.body.reason : 'Incomplete business credentials or address mismatch',
        reviewedBy: 'Admin (Saharanpur Trade HQ)',
        reviewedAt: new Date().toISOString(),
        message: 'Seller verification rejected.',
      });
    }

    const adminProductMatch = apiPath.match(/^\/api\/admin\/products\/([^/]+)\/(approve|reject)$/);
    if (adminProductMatch) {
      if (method !== 'POST') {
        return jsonResponse({ success: false, error: `Method ${method} not allowed.` }, 405);
      }
      const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() || '';
      if (!verifyAdminToken(token)) {
        return jsonResponse({ success: false, error: 'Access Denied: Valid administrator session required.' }, 401);
      }
      const parsed = await parseJsonBody(req);
      const productId = decodeURIComponent(adminProductMatch[1]);
      const action = adminProductMatch[2];
      if (action === 'approve') {
        return jsonResponse({
          success: true,
          productId,
          status: 'approved',
          reviewedAt: new Date().toISOString(),
          message: 'Product listing approved for public catalog.',
        });
      }
      return jsonResponse({
        success: true,
        productId,
        status: 'rejected',
        rejectionReason:
          parsed.ok && parsed.body.reason ? parsed.body.reason : 'Listing does not comply with marketplace standards',
        reviewedAt: new Date().toISOString(),
        message: 'Product rejected.',
      });
    }

    // 10. Validate Product Publish Permission
    if (apiPath === '/api/products/validate-publish-permission') {
      if (method !== 'POST') {
        return jsonResponse({ success: false, error: `Method ${method} not allowed.` }, 405);
      }
      const parsed = await parseJsonBody(req);
      if (!parsed.ok) {
        return jsonResponse({ allowed: false, error: parsed.error }, 400);
      }
      const { sellerStatus, sellerIdentityStatus } = parsed.body;
      if (sellerStatus !== 'active') {
        return jsonResponse(
          {
            allowed: false,
            error: `Access Denied: Only approved sellers can publish products. Current shop status: ${sellerStatus || 'pending_approval'}.`,
          },
          403
        );
      }
      if (sellerIdentityStatus === 'rejected') {
        return jsonResponse(
          {
            allowed: false,
            error: 'Access Denied: Identity verification rejected. Please update your business credentials.',
          },
          403
        );
      }
      return jsonResponse({ allowed: true, message: 'Seller authorized to publish products.' });
    }

    // 10b. Orders API (mirrors Express routes cleanly in serverless mode)
    if (apiPath === '/api/orders') {
      if (method === 'POST') {
        const parsed = await parseJsonBody(req);
        if (!parsed.ok) {
          return jsonResponse({ success: false, error: parsed.error }, 400);
        }
        const order = parsed.body;
        if (!order.customerName || !order.customerPhone || !order.deliveryAddress) {
          return jsonResponse({ success: false, error: 'Customer name, mobile number, and delivery address are required.' }, 400);
        }
        return jsonResponse(
          {
            success: true,
            order: {
              ...order,
              id: order.id || `ord-${Date.now()}`,
              orderNumber: order.orderNumber || `MKT-IN-${Date.now().toString().slice(-6)}`,
              updatedAt: new Date().toISOString(),
            },
            message: 'Order recorded.',
          },
          201
        );
      }
      if (method === 'GET') {
        return jsonResponse({ success: true, orders: [], count: 0 });
      }
      return jsonResponse({ success: false, error: `Method ${method} not allowed.` }, 405);
    }

    const orderActionMatch = apiPath.match(/^\/api\/orders\/([^/]+)\/(status|cancel|return)$/);
    if (orderActionMatch) {
      const orderId = decodeURIComponent(orderActionMatch[1]);
      const action = orderActionMatch[2];
      const parsed = await parseJsonBody(req);
      if (!parsed.ok) {
        return jsonResponse({ success: false, error: parsed.error }, 400);
      }
      return jsonResponse({
        success: true,
        orderId,
        action,
        status: action === 'cancel' ? 'cancelled' : action === 'return' ? 'return_requested' : parsed.body.status || 'updated',
        updatedAt: new Date().toISOString(),
        message: `Order ${action} processed.`,
      });
    }

    // 11. System Status
    if (apiPath === '/api/system/status') {
      const smsStatus = getSmsProviderStatus();
      const hasSupabase = Boolean(
        (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) &&
          (process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)
      );
      const hasKyc = Boolean(process.env.DIGILOCKER_CLIENT_ID || process.env.KYC_PROVIDER_API_KEY);
      const hasRazorpay = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
      const hasShiprocket = Boolean(process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD);

      return jsonResponse({
        status: 'operational',
        service: 'MattoKart Marketplace API',
        location: 'Saharanpur, Uttar Pradesh',
        integrations: {
          supabaseDatabase: {
            configured: hasSupabase,
            note: hasSupabase ? 'Active' : 'Awaiting SUPABASE_URL & key in environment',
          },
          stageBCheckoutCodTracking: {
            configured: true,
            note: 'Multi-vendor Cart, Address Book, COD Checkout, Heavy Transport & 10-Stage Tracking active',
          },
          razorpayPayments: {
            configured: hasRazorpay,
            note: hasRazorpay ? 'Live Razorpay active' : 'Scheduled for Stage C',
          },
          shiprocketLogistics: {
            configured: hasShiprocket,
            note: hasShiprocket ? 'Live Shiprocket active' : 'Scheduled for Stage C',
          },
          smsGateway: {
            configured: smsStatus.anyConfigured,
            provider: smsStatus.providerLabel,
            note: smsStatus.anyConfigured
              ? `Live Indian SMS configured (${smsStatus.providerLabel})`
              : 'Not configured (Set TWILIO_*, MSG91_*, or Supabase Phone Auth)',
          },
          identityKycProvider: {
            configured: hasKyc,
            provider: hasKyc ? 'DigiLocker / Surepass API' : 'Alternative Business KYC active',
            note: hasKyc ? 'Live DigiLocker partner active' : 'Compliant GSTIN & Shop Verification active',
          },
          serverSideAdminAuth: {
            configured: Boolean(getAdminSecret()),
            enforced: true,
          },
        },
      });
    }

    // Fallback: Guarantee ALL /api/* routes return JSON (never HTML)
    return jsonResponse(
      {
        success: false,
        error: `API endpoint not found: ${method} ${apiPath}`,
      },
      404
    );
  } catch (err: any) {
    return jsonResponse(
      {
        success: false,
        error: err?.message || 'Internal server error',
      },
      500
    );
  }
}
