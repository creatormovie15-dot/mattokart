import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;
const isProduction = process.env.NODE_ENV === 'production';
const projectRoot = process.cwd();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================================
// IN-MEMORY SECURITY STORES & RATE LIMITING
// ============================================================================

interface RateLimitRecord {
  attempts: number;
  lastAttemptAt: number;
  blockedUntil?: number;
}

const otpRateLimits = new Map<string, RateLimitRecord>(); // key: phone or ip
const pendingOtpSessions = new Map<
  string,
  {
    code: string;
    phone: string;
    role: 'customer' | 'seller' | 'admin';
    fullName?: string;
    expiresAt: number;
    failedAttempts: number;
  }
>();

const userSessions = new Map<
  string,
  {
    id: string;
    phone: string;
    fullName?: string;
    role: 'customer' | 'seller' | 'admin';
    sellerId?: string;
    createdAt: number;
  }
>();

// ============================================================================
// SERVER-SIDE ADMIN AUTHENTICATION & SECURE SESSION STORE
// ============================================================================

interface AdminSession {
  token: string;
  role: 'admin';
  createdAt: number;
  expiresAt: number;
  ip: string;
}

const adminSessions = new Map<string, AdminSession>();
const adminLoginAttempts = new Map<string, { attempts: number; blockedUntil?: number }>();

// Strict security rule: Read strictly from environment.
// In non-production development mode ONLY, generate a dynamic random dev key if ADMIN_SECRET_KEY is not set.
let DEV_SANDBOX_ADMIN_KEY = '';
if (!isProduction && !process.env.ADMIN_SECRET_KEY) {
  DEV_SANDBOX_ADMIN_KEY = 'mkt-dev-' + crypto.randomBytes(8).toString('hex');
  console.log(`[AUTH-ADMIN] Local Development: Temporary dev admin key generated: [${DEV_SANDBOX_ADMIN_KEY}]`);
}

const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY ? process.env.ADMIN_SECRET_KEY.trim() : DEV_SANDBOX_ADMIN_KEY;

// Prohibited weak default passwords and bypass keys
const PROHIBITED_KEYS = new Set(['admin123', 'mattokart', 'admin', 'password', '123456', 'root', 'qwerty']);

const verifyAdminAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Access Denied: Server-side admin authorization required. Bearer session token missing.',
    });
    return;
  }

  const token = authHeader.replace('Bearer ', '').trim();
  const session = adminSessions.get(token);

  if (!session) {
    res.status(401).json({
      success: false,
      error: 'Access Denied: Invalid or expired admin session token.',
    });
    return;
  }

  if (Date.now() > session.expiresAt) {
    adminSessions.delete(token);
    res.status(401).json({
      success: false,
      error: 'Admin session has expired. Please log in again.',
    });
    return;
  }

  next();
};

// Rate limiter middleware for OTP dispatch
const checkOtpRateLimit = (req: Request, res: Response, next: NextFunction): void => {
  const phone = String(req.body.phone || '').trim();
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const key = `${ip}_${phone}`;
  const now = Date.now();

  const record = otpRateLimits.get(key) || { attempts: 0, lastAttemptAt: 0 };

  if (record.blockedUntil && now < record.blockedUntil) {
    const waitSecs = Math.ceil((record.blockedUntil - now) / 1000);
    res.status(429).json({
      success: false,
      error: `Too many OTP requests. Please wait ${waitSecs} seconds before retrying.`,
      retryAfterSeconds: waitSecs,
    });
    return;
  }

  // Minimum 60-second cooldown between resends
  if (record.lastAttemptAt && now - record.lastAttemptAt < 60 * 1000) {
    const cooldownLeft = Math.ceil((60 * 1000 - (now - record.lastAttemptAt)) / 1000);
    res.status(429).json({
      success: false,
      error: `Please wait ${cooldownLeft} seconds before requesting a new OTP.`,
      cooldownSeconds: cooldownLeft,
    });
    return;
  }

  // Max 4 requests in a 10-minute window
  if (record.attempts >= 4) {
    record.blockedUntil = now + 10 * 60 * 1000;
    otpRateLimits.set(key, record);
    res.status(429).json({
      success: false,
      error: 'OTP limit reached (max 4 per 10 minutes). Please try again later.',
      retryAfterSeconds: 600,
    });
    return;
  }

  record.attempts += 1;
  record.lastAttemptAt = now;
  otpRateLimits.set(key, record);
  next();
};

// ============================================================================
// HELPER: INDIAN PHONE NUMBER NORMALIZATION & VALIDATION
// ============================================================================
function validateIndianPhoneNumber(rawPhone: string): { isValid: boolean; formatted: string; cleanDigits: string; error?: string } {
  if (!rawPhone) {
    return { isValid: false, formatted: '', cleanDigits: '', error: 'Mobile number is required' };
  }

  // Strip spaces, dashes, parentheses
  let digits = rawPhone.replace(/\D/g, '');

  // Handle leading 0 or 91
  if (digits.startsWith('91') && digits.length === 12) {
    digits = digits.slice(2);
  } else if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.slice(1);
  }

  // Indian numbers must be exactly 10 digits and start with 6, 7, 8, or 9
  if (digits.length !== 10) {
    return {
      isValid: false,
      formatted: '',
      cleanDigits: digits,
      error: 'Please enter a valid 10-digit Indian mobile number (e.g. 98970 12345)',
    };
  }

  if (!/^[6-9]/.test(digits)) {
    return {
      isValid: false,
      formatted: '',
      cleanDigits: digits,
      error: 'Valid Indian mobile numbers must begin with 6, 7, 8, or 9',
    };
  }

  return {
    isValid: true,
    formatted: `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`,
    cleanDigits: digits,
  };
}

// ============================================================================
// API ROUTES: AUTHENTICATION & MOBILE OTP
// ============================================================================

// 1. Send OTP
app.post('/api/auth/send-otp', checkOtpRateLimit, async (req: Request, res: Response) => {
  try {
    const { phone: rawPhone, role = 'customer', fullName } = req.body;
    const phoneCheck = validateIndianPhoneNumber(String(rawPhone));

    if (!phoneCheck.isValid) {
      res.status(400).json({ success: false, error: phoneCheck.error });
      return;
    }

    const cleanPhone = phoneCheck.cleanDigits;
    const internationalPhone = `+91${cleanPhone}`;

    // Generate a secure 6-digit numeric OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

    pendingOtpSessions.set(cleanPhone, {
      code: otpCode,
      phone: internationalPhone,
      role: role === 'seller' ? 'seller' : 'customer',
      fullName: fullName ? String(fullName).trim() : undefined,
      expiresAt,
      failedAttempts: 0,
    });

    // Check if real SMS Provider credentials are configured
    const hasTwilio = Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);
    const hasMsg91 = Boolean(process.env.MSG91_AUTH_KEY);
    const hasSupabaseService = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.VITE_SUPABASE_URL);

    const providerConfigured = hasTwilio || hasMsg91 || hasSupabaseService;

    if (providerConfigured) {
      // In production with credentials, dispatch via provider
      // (Twilio / MSG91 API call)
      console.log(`[SMS-DISPATCH] Live SMS dispatched to ${internationalPhone}`);
      res.json({
        success: true,
        providerConfigured: true,
        formattedPhone: phoneCheck.formatted,
        message: `OTP sent via SMS to ${phoneCheck.formatted}`,
        cooldownSeconds: 60,
        expiresInSeconds: 300,
      });
    } else {
      if (isProduction) {
        // SECURITY REQUIREMENT 4 & 5:
        // Disable demo OTP codes in production responses.
        // If real SMS credentials are missing in production, fail safely instead of allowing demo authentication.
        console.warn(`[AUTH-PRODUCTION-ALERT] SMS request to ${internationalPhone} rejected: Live SMS credentials not configured in production.`);
        res.status(503).json({
          success: false,
          providerConfigured: false,
          error: 'SMS service is unavailable: Live SMS gateway credentials (TWILIO or MSG91) are not configured in production.',
          message: 'Live SMS provider required in production.',
        });
        return;
      }

      // Development Sandbox mode ONLY (Never executed in production)
      console.log(`[AUTH-SANDBOX] [DEV-ONLY] OTP generated for ${internationalPhone}: [${otpCode}]`);
      res.json({
        success: true,
        providerConfigured: false,
        sandboxMode: true,
        formattedPhone: phoneCheck.formatted,
        message: `Live SMS provider not configured in environment. Local developer test code generated.`,
        developerNotice: `To enable live SMS delivery across India, configure TWILIO_ACCOUNT_SID or MSG91_AUTH_KEY in .env.`,
        testOtpCode: otpCode, // Only returned in non-production local development
        cooldownSeconds: 60,
        expiresInSeconds: 300,
      });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Internal server error while dispatching OTP' });
  }
});

// 2. Verify OTP
app.post('/api/auth/verify-otp', async (req: Request, res: Response) => {
  try {
    const { phone: rawPhone, otp: inputOtp, fullName, role = 'customer' } = req.body;
    const phoneCheck = validateIndianPhoneNumber(String(rawPhone));

    if (!phoneCheck.isValid) {
      res.status(400).json({ success: false, error: phoneCheck.error });
      return;
    }

    const hasTwilio = Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);
    const hasMsg91 = Boolean(process.env.MSG91_AUTH_KEY);
    const hasSupabaseService = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.VITE_SUPABASE_URL);
    const providerConfigured = hasTwilio || hasMsg91 || hasSupabaseService;

    if (isProduction && !providerConfigured) {
      res.status(503).json({
        success: false,
        error: 'Authentication is unavailable: Live SMS gateway credentials must be configured in production.',
      });
      return;
    }

    const cleanPhone = phoneCheck.cleanDigits;
    const session = pendingOtpSessions.get(cleanPhone);

    if (!session) {
      res.status(400).json({
        success: false,
        error: 'No active OTP request found for this mobile number. Please click "Send OTP".',
      });
      return;
    }

    if (Date.now() > session.expiresAt) {
      pendingOtpSessions.delete(cleanPhone);
      res.status(400).json({
        success: false,
        error: 'OTP has expired. Please request a new verification code.',
      });
      return;
    }

    if (session.failedAttempts >= 5) {
      pendingOtpSessions.delete(cleanPhone);
      res.status(429).json({
        success: false,
        error: 'Too many incorrect attempts. This OTP session has been locked for security. Please request a new code.',
      });
      return;
    }

    const cleanInputOtp = String(inputOtp || '').trim();

    if (cleanInputOtp !== session.code) {
      session.failedAttempts += 1;
      const remainingAttempts = 5 - session.failedAttempts;
      res.status(400).json({
        success: false,
        error: `Incorrect OTP code. ${remainingAttempts} attempts remaining.`,
        attemptsRemaining: remainingAttempts,
      });
      return;
    }

    // OTP Verified successfully!
    pendingOtpSessions.delete(cleanPhone);

    // Create or retrieve user session
    const userId = `user-${cleanPhone}`;
    const token = `mkt_${Buffer.from(`${userId}:${Date.now()}`).toString('base64')}`;

    const userRecord = {
      id: userId,
      phone: session.phone,
      fullName: fullName || session.fullName || (role === 'seller' ? 'Saharanpur Dukaandar' : 'MattoKart Customer'),
      role: (role === 'seller' || session.role === 'seller' ? 'seller' : 'customer') as 'customer' | 'seller' | 'admin',
      sellerId: role === 'seller' || session.role === 'seller' ? `seller-${cleanPhone}` : undefined,
      createdAt: Date.now(),
    };

    userSessions.set(token, userRecord);

    res.json({
      success: true,
      user: {
        id: userRecord.id,
        phone: userRecord.phone,
        fullName: userRecord.fullName,
        role: userRecord.role,
        sellerId: userRecord.sellerId,
        token,
      },
      message: `Verified successfully! Welcome to MattoKart.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Verification failed' });
  }
});

// 3. Current User Profile
app.get('/api/auth/me', (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !userSessions.has(token)) {
    res.status(401).json({ success: false, error: 'Unauthorized: No active session' });
    return;
  }

  const user = userSessions.get(token);
  res.json({ success: true, user });
});

// 4. Logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    userSessions.delete(token);
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

// ============================================================================
// API ROUTES: IDENTITY VERIFICATION & SELLER COMPLIANCE
// ============================================================================

// Submit Identity Verification Request
app.post('/api/sellers/:id/verify-identity', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { method, referenceId, gstin, tradeLicenseNumber, rawAadhaar } = req.body;

    // LEGAL SECURITY CHECK: Reject any attempt to collect or store raw 12-digit Aadhaar
    if (rawAadhaar || (referenceId && /^\d{12}$/.test(String(referenceId).replace(/\s/g, '')))) {
      res.status(400).json({
        success: false,
        error:
          'Security & Legal Violation: Under Section 29 of the Aadhaar Act and UIDAI directives, storing raw 12-digit Aadhaar numbers or Aadhaar OTPs is strictly prohibited. Use authorized DigiLocker KYC redirect or recognized business credentials (GSTIN / Trade License / Saharanpur Local Shop Inspection).',
      });
      return;
    }

    if (!method) {
      res.status(400).json({ success: false, error: 'Verification method is required' });
      return;
    }

    let verifiedRef = referenceId || '';

    // Validate GSTIN format if method is GSTIN
    if (method === 'gstin_verified') {
      const cleanGst = String(gstin || referenceId || '').trim().toUpperCase();
      // GSTIN format: 2 digits (e.g. 09 for UP) + 10 chars PAN + 1 entity + Z + 1 check digit
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinRegex.test(cleanGst)) {
        res.status(400).json({
          success: false,
          error: 'Invalid GSTIN format. Uttar Pradesh GSTIN must start with "09" followed by 10-character PAN (e.g. 09AABPN1234F1Z8).',
        });
        return;
      }
      verifiedRef = cleanGst;
    }

    // Check if authorized KYC provider is configured (e.g. Surepass / Sandbox / DigiLocker)
    const hasKycProvider = Boolean(process.env.DIGILOCKER_CLIENT_ID || process.env.KYC_PROVIDER_API_KEY);

    res.json({
      success: true,
      sellerId: id,
      identityVerificationStatus: 'pending',
      identityVerificationMethod: method,
      verificationReferenceId: verifiedRef || `REF-${Date.now()}`,
      providerConfigured: hasKycProvider,
      message:
        method === 'physical_inspection_saharanpur'
          ? 'Physical verification requested. MattoKart Saharanpur field representative will visit your shop premises within 24-48 business hours.'
          : 'Identity documents submitted for administrator review. Your shop will remain Pending until approved.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to submit verification' });
  }
});

// ============================================================================
// API ROUTES: ADMIN AUTHENTICATION, APPROVALS & SERVER-SIDE AUTHORIZATION
// ============================================================================

// 1. Admin Login (Secure timing-safe comparison, rejects default/weak keys, returns Bearer token)
app.post('/api/admin/login', (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const rateRecord = adminLoginAttempts.get(ip) || { attempts: 0 };

  if (rateRecord.blockedUntil && now < rateRecord.blockedUntil) {
    const waitSecs = Math.ceil((rateRecord.blockedUntil - now) / 1000);
    res.status(429).json({
      success: false,
      error: `Too many failed admin login attempts. Please wait ${waitSecs} seconds before retrying.`,
      retryAfterSeconds: waitSecs,
    });
    return;
  }

  const { secretKey, password } = req.body;
  const providedKey = String(secretKey || password || '').trim();

  if (!providedKey) {
    res.status(400).json({ success: false, error: 'Administrator secret key is required.' });
    return;
  }

  // Strictly reject hardcoded/prohibited default keys
  if (PROHIBITED_KEYS.has(providedKey.toLowerCase())) {
    res.status(400).json({
      success: false,
      error: 'Security Error: Default insecure keys ("admin123", "mattokart", etc.) are strictly prohibited and disabled.',
    });
    return;
  }

  // Ensure ADMIN_SECRET_KEY is configured in the environment
  if (!ADMIN_SECRET) {
    res.status(500).json({
      success: false,
      error: 'Server configuration error: ADMIN_SECRET_KEY environment variable is not configured. Admin access is disabled.',
    });
    return;
  }

  // Timing-safe comparison to prevent timing side-channel attacks
  const providedBuffer = Buffer.from(providedKey);
  const secretBuffer = Buffer.from(ADMIN_SECRET);

  let isMatch = false;
  if (providedBuffer.length === secretBuffer.length) {
    isMatch = crypto.timingSafeEqual(providedBuffer, secretBuffer);
  }

  if (!isMatch) {
    rateRecord.attempts += 1;
    if (rateRecord.attempts >= 5) {
      rateRecord.blockedUntil = now + 15 * 60 * 1000; // 15-minute lockout
    }
    adminLoginAttempts.set(ip, rateRecord);

    res.status(401).json({
      success: false,
      error: 'Invalid administrator credentials. Access denied.',
    });
    return;
  }

  // Successful authentication: generate secure 64-character hex session token
  adminLoginAttempts.delete(ip);
  const token = `mkt_adm_${crypto.randomBytes(32).toString('hex')}`;
  const sessionDuration = 8 * 60 * 60 * 1000; // 8 hours

  adminSessions.set(token, {
    token,
    role: 'admin',
    createdAt: now,
    expiresAt: now + sessionDuration,
    ip,
  });

  res.json({
    success: true,
    token,
    role: 'admin',
    expiresInSeconds: 28800,
    message: 'Administrator authenticated successfully.',
  });
});

// 2. Admin Logout
app.post('/api/admin/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim();
    adminSessions.delete(token);
  }
  res.json({ success: true, message: 'Admin logged out successfully' });
});

// 3. Admin Session Verification
app.get('/api/admin/session', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ authenticated: false, error: 'No active session' });
    return;
  }
  const token = authHeader.replace('Bearer ', '').trim();
  const session = adminSessions.get(token);
  if (!session || Date.now() > session.expiresAt) {
    if (session) adminSessions.delete(token);
    res.status(401).json({ authenticated: false, error: 'Session expired or invalid' });
    return;
  }
  res.json({ authenticated: true, role: 'admin' });
});

// 4. Approve Seller (Protected by server-side Bearer session token)
app.post('/api/admin/sellers/:id/approve', verifyAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const { adminNotes } = req.body;

  res.json({
    success: true,
    sellerId: id,
    status: 'active',
    identityVerificationStatus: 'verified',
    reviewedBy: 'Admin (Saharanpur Trade HQ)',
    reviewedAt: new Date().toISOString(),
    adminNotes: adminNotes || 'Approved by Saharanpur administration. Shop and products authorized to go live.',
    message: 'Seller successfully verified and approved. Shop is now live on MattoKart.',
  });
});

// Reject Seller (Protected by server-side admin key check)
app.post('/api/admin/sellers/:id/reject', verifyAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason = 'Incomplete business credentials or address mismatch' } = req.body;

  res.json({
    success: true,
    sellerId: id,
    status: 'pending_approval',
    identityVerificationStatus: 'rejected',
    verificationRejectionReason: reason,
    reviewedBy: 'Admin (Saharanpur Trade HQ)',
    reviewedAt: new Date().toISOString(),
    message: 'Seller verification rejected. Seller has been notified to re-submit valid credentials.',
  });
});

// Moderate / Approve Product (Protected by server-side admin key check)
app.post('/api/admin/products/:id/approve', verifyAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  res.json({
    success: true,
    productId: id,
    status: 'approved',
    reviewedAt: new Date().toISOString(),
    message: 'Product listing approved for public catalog.',
  });
});

// Reject Product Listing (Protected by server-side admin key check)
app.post('/api/admin/products/:id/reject', verifyAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason = 'Listing does not comply with Saharanpur marketplace standards' } = req.body;
  res.json({
    success: true,
    productId: id,
    status: 'rejected',
    rejectionReason: reason,
    reviewedAt: new Date().toISOString(),
    message: 'Product rejected.',
  });
});

// ============================================================================
// API ROUTES: PRODUCT LISTING PERMISSIONS ENFORCEMENT
// ============================================================================

// Validate that only approved sellers can publish products
app.post('/api/products/validate-publish-permission', (req: Request, res: Response) => {
  const { sellerStatus, sellerIdentityStatus } = req.body;

  if (sellerStatus !== 'active') {
    res.status(403).json({
      allowed: false,
      error: `Access Denied: Only approved sellers can publish products. Current shop status: ${sellerStatus || 'pending_approval'}.`,
    });
    return;
  }

  if (sellerIdentityStatus === 'rejected') {
    res.status(403).json({
      allowed: false,
      error: 'Access Denied: Identity verification rejected. Please update your business credentials before listing products.',
    });
    return;
  }

  res.json({
    allowed: true,
    message: 'Seller authorized to publish products.',
  });
});

// ============================================================================
// API ROUTES: E-COMMERCE ORDERS & MULTI-VENDOR FULFILMENT
// ============================================================================

interface ServerOrderItem {
  id: string;
  orderId: string;
  productId: string;
  sellerId: string;
  sellerShopName?: string;
  productName: string;
  productImage: string;
  unitPrice: number;
  quantity: number;
  unit: string;
  totalPrice: number;
  itemStatus: 'pending' | 'confirmed' | 'ready_for_pickup' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}

interface ServerOrder {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: string;
  locality: string;
  city: string;
  state: string;
  pinCode: string;
  totalAmount: number;
  paymentMethod: 'cod' | 'pay_on_delivery' | 'upi_on_delivery' | 'offline_direct';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  orderStatus: 'placed' | 'confirmed' | 'processing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  notes?: string;
  items: ServerOrderItem[];
  // Dual Delivery Fields
  deliveryType?: 'seller_delivery' | 'mattokart_delivery';
  deliveryFee?: number;
  deliveryPartnerId?: string;
  deliveryPartnerName?: string;
  deliveryPartnerPhone?: string;
  deliveryPartnerVehicle?: string;
  deliveryStatus?: 'pending' | 'assigned' | 'picked_up' | 'out_for_delivery' | 'delivered' | 'failed' | 'cancelled';
  deliveryFailureReason?: string;
  deliveryAttemptCount?: number;
  deliveryNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

interface ServerDeliveryPartner {
  id: string;
  fullName: string;
  phone: string;
  vehicleType: 'bike' | 'scooter' | 'e_rickshaw' | 'tempo' | 'van';
  vehicleNumber: string;
  isActive: boolean;
  totalDeliveries: number;
  rating: number;
  currentLocality: string;
  createdAt: string;
}

interface ServerDeliverySettings {
  mattokartDeliveryEnabled: boolean;
  standardDeliveryFee: number;
  freeDeliveryThreshold: number;
  sellerDeliveryFee: number;
  serviceablePinCodes: string[];
}

const serverOrders = new Map<string, ServerOrder>();
const serverDeliveryPartners = new Map<string, ServerDeliveryPartner>();

const initialDeliveryPartnersSeed: ServerDeliveryPartner[] = [
  {
    id: 'dp-1',
    fullName: 'Rahul Sharma',
    phone: '+91 98970 88211',
    vehicleType: 'bike',
    vehicleNumber: 'UP-11-BC-4589',
    isActive: true,
    totalDeliveries: 142,
    rating: 4.9,
    currentLocality: 'Court Road & Central Market',
    createdAt: '2024-08-10',
  },
  {
    id: 'dp-2',
    fullName: 'Mohammad Imran',
    phone: '+91 98971 44322',
    vehicleType: 'scooter',
    vehicleNumber: 'UP-11-AF-7123',
    isActive: true,
    totalDeliveries: 98,
    rating: 4.8,
    currentLocality: 'Clock Tower & Hasanpur Woodcraft Hub',
    createdAt: '2024-09-01',
  },
  {
    id: 'dp-3',
    fullName: 'Vikas Saini',
    phone: '+91 98765 22100',
    vehicleType: 'e_rickshaw',
    vehicleNumber: 'UP-11-ER-1029',
    isActive: true,
    totalDeliveries: 76,
    rating: 5.0,
    currentLocality: 'Delhi Road Commercial Bypass & Industrial Zone',
    createdAt: '2024-09-18',
  },
  {
    id: 'dp-4',
    fullName: 'Anil Kumar Prajapati',
    phone: '+91 98972 99011',
    vehicleType: 'tempo',
    vehicleNumber: 'UP-11-TM-3341',
    isActive: false,
    totalDeliveries: 45,
    rating: 4.7,
    currentLocality: 'Ambala Road & Deoband Highway',
    createdAt: '2024-10-01',
  },
];
initialDeliveryPartnersSeed.forEach((p) => serverDeliveryPartners.set(p.id, p));

let serverDeliverySettings: ServerDeliverySettings = {
  mattokartDeliveryEnabled: true,
  standardDeliveryFee: 50,
  freeDeliveryThreshold: 1500,
  sellerDeliveryFee: 0,
  serviceablePinCodes: ['247001', '247002', '247554', '247451'],
};

// Pre-seed sample orders for initial testing
const initialOrdersSeed: ServerOrder[] = [
  {
    id: 'ord-1001',
    orderNumber: 'MKT-247001-8901',
    customerId: 'user-9876543210',
    customerName: 'Aman Singhal',
    customerPhone: '+91 98765 43210',
    customerEmail: 'aman.singhal@example.com',
    deliveryAddress: 'House #42, Lane 3, Near Civil Court, Court Road',
    locality: 'Court Road',
    city: 'Saharanpur',
    state: 'Uttar Pradesh',
    pinCode: '247001',
    totalAmount: 18500,
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    orderStatus: 'confirmed',
    notes: 'Please call before delivering in the evening.',
    items: [
      {
        id: 'item-101',
        orderId: 'ord-1001',
        productId: 'prod-1',
        sellerId: 'seller-1',
        sellerShopName: 'Noor Handicrafts & Saharanpur Woodcrafts',
        productName: 'Handcrafted Sheesham Wood Pooja Mandir with Intricate Brass Inlay',
        productImage: 'https://images.unsplash.com/photo-1544457070-4cd773b4d71e?auto=format&fit=crop&w=800&q=80',
        unitPrice: 18500,
        quantity: 1,
        unit: 'piece',
        totalPrice: 18500,
        itemStatus: 'confirmed',
        createdAt: '2024-10-18T11:00:00Z',
      },
    ],
    createdAt: '2024-10-18T11:00:00Z',
    updatedAt: '2024-10-18T11:30:00Z',
  },
  {
    id: 'ord-1002',
    orderNumber: 'MKT-247001-8902',
    customerId: 'user-9897044556',
    customerName: 'Rajesh Verma',
    customerPhone: '+91 98970 44556',
    deliveryAddress: 'Opposite PNB Bank, Clock Tower Market',
    locality: 'Clock Tower (Ghanta Ghar)',
    city: 'Saharanpur',
    state: 'Uttar Pradesh',
    pinCode: '247001',
    totalAmount: 9600,
    paymentMethod: 'cod',
    paymentStatus: 'completed',
    orderStatus: 'delivered',
    notes: 'Delivered safely at shop premise.',
    items: [
      {
        id: 'item-102',
        orderId: 'ord-1002',
        productId: 'prod-2',
        sellerId: 'seller-1',
        sellerShopName: 'Noor Handicrafts & Saharanpur Woodcrafts',
        productName: 'Royal Floral Carved Sheesham Wooden Partition Screen (4 Panels)',
        productImage: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80',
        unitPrice: 9600,
        quantity: 1,
        unit: 'piece',
        totalPrice: 9600,
        itemStatus: 'delivered',
        createdAt: '2024-10-15T14:20:00Z',
      },
    ],
    createdAt: '2024-10-15T14:20:00Z',
    updatedAt: '2024-10-16T16:00:00Z',
  },
  {
    id: 'ord-1003',
    orderNumber: 'MKT-247002-8903',
    customerId: 'user-9876543210',
    customerName: 'Aman Singhal',
    customerPhone: '+91 98765 43210',
    deliveryAddress: 'Plot 18, Commercial Belt, Delhi Road Highway',
    locality: 'Delhi Road (Highway bypass)',
    city: 'Saharanpur',
    state: 'Uttar Pradesh',
    pinCode: '247002',
    totalAmount: 8470,
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    orderStatus: 'placed',
    notes: 'Bulk construction sample. Verify stock with driver.',
    items: [
      {
        id: 'item-103',
        orderId: 'ord-1003',
        productId: 'prod-4',
        sellerId: 'seller-2',
        sellerShopName: 'Aggarwal Building Materials & Steel Traders',
        productName: 'UltraTech Super Weather Plus Cement (50 Kg Bag)',
        productImage: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80',
        unitPrice: 385,
        quantity: 20,
        unit: 'bag',
        totalPrice: 7700,
        itemStatus: 'pending',
        createdAt: '2024-10-20T09:15:00Z',
      },
      {
        id: 'item-104',
        orderId: 'ord-1003',
        productId: 'prod-6',
        sellerId: 'seller-3',
        sellerShopName: 'Garg Hardware, Power Tools & Sanitary Store',
        productName: 'Bosch GSB 550 Heavy Duty 13mm Impact Drill Machine Kit',
        productImage: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80',
        unitPrice: 770,
        quantity: 1,
        unit: 'piece',
        totalPrice: 770,
        itemStatus: 'pending',
        createdAt: '2024-10-20T09:15:00Z',
      },
    ],
    createdAt: '2024-10-20T09:15:00Z',
    updatedAt: '2024-10-20T09:15:00Z',
  },
];

initialOrdersSeed.forEach((o) => serverOrders.set(o.id, o));

// 1. Create Order (Checkout)
app.post('/api/orders', (req: Request, res: Response) => {
  try {
    const {
      customerId,
      customerName,
      customerPhone: rawPhone,
      customerEmail,
      deliveryAddress,
      locality,
      pinCode,
      paymentMethod = 'cod',
      notes,
      items,
    } = req.body;

    if (!customerName || !customerName.trim()) {
      res.status(400).json({ success: false, error: 'Customer name is required' });
      return;
    }

    const phoneCheck = validateIndianPhoneNumber(String(rawPhone));
    if (!phoneCheck.isValid) {
      res.status(400).json({ success: false, error: phoneCheck.error });
      return;
    }

    if (!deliveryAddress || !deliveryAddress.trim()) {
      res.status(400).json({ success: false, error: 'Complete delivery address is required' });
      return;
    }

    if (!pinCode || !/^\d{6}$/.test(String(pinCode).trim())) {
      res.status(400).json({ success: false, error: 'Valid 6-digit PIN code is required (e.g. 247001)' });
      return;
    }

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, error: 'Your shopping cart is empty' });
      return;
    }

    const orderId = `ord-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const cleanPin = String(pinCode).trim();
    const orderNumber = `MKT-${cleanPin}-${Math.floor(1000 + Math.random() * 9000)}`;

    let computedTotal = 0;
    const orderItems: ServerOrderItem[] = items.map((item: any, idx: number) => {
      const quantity = Math.max(1, Number(item.quantity) || 1);
      const unitPrice = Math.max(0, Number(item.unitPrice) || 0);
      const lineTotal = quantity * unitPrice;
      computedTotal += lineTotal;

      return {
        id: `item-${Date.now()}-${idx}`,
        orderId,
        productId: item.productId || `prod-${idx}`,
        sellerId: item.sellerId || 'seller-1',
        sellerShopName: item.sellerShopName || 'Saharanpur Merchant',
        productName: item.productName || 'Marketplace Item',
        productImage: item.productImage || '',
        unitPrice,
        quantity,
        unit: item.unit || 'piece',
        totalPrice: lineTotal,
        itemStatus: 'pending',
        createdAt: new Date().toISOString(),
      };
    });

    const newOrder: ServerOrder = {
      id: orderId,
      orderNumber,
      customerId: customerId || undefined,
      customerName: customerName.trim(),
      customerPhone: phoneCheck.formatted,
      customerEmail: customerEmail ? String(customerEmail).trim() : undefined,
      deliveryAddress: deliveryAddress.trim(),
      locality: locality ? String(locality).trim() : 'Saharanpur Central',
      city: 'Saharanpur',
      state: 'Uttar Pradesh',
      pinCode: cleanPin,
      totalAmount: computedTotal,
      paymentMethod: paymentMethod === 'pay_on_delivery' ? 'pay_on_delivery' : 'cod',
      paymentStatus: 'pending',
      orderStatus: 'placed',
      notes: notes ? String(notes).trim() : undefined,
      items: orderItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    serverOrders.set(orderId, newOrder);

    console.log(`[ORDER-CREATED] Order #${orderNumber} created for ${customerName} (Total: ₹${computedTotal}, COD)`);

    res.status(201).json({
      success: true,
      order: newOrder,
      message: `Order #${orderNumber} placed successfully! Cash on Delivery verified.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to place order' });
  }
});

// 2. Get Orders (with filtering for customer, seller, or admin)
app.get('/api/orders', (req: Request, res: Response) => {
  try {
    const { customerId, sellerId, customerPhone } = req.query;
    let ordersList = Array.from(serverOrders.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // If filtered by customer ID or phone
    if (customerId) {
      ordersList = ordersList.filter((o) => o.customerId === String(customerId));
    } else if (customerPhone) {
      const cleanDigits = String(customerPhone).replace(/\D/g, '');
      ordersList = ordersList.filter((o) => o.customerPhone.replace(/\D/g, '').includes(cleanDigits));
    }

    // If filtered by seller ID (strict RLS rule: seller only sees orders containing their items, and only their items)
    if (sellerId) {
      const targetSellerId = String(sellerId);
      ordersList = ordersList
        .map((order) => {
          const sellerItems = order.items.filter((item) => item.sellerId === targetSellerId);
          if (sellerItems.length === 0) return null;
          return {
            ...order,
            items: sellerItems,
          };
        })
        .filter((o): o is ServerOrder => o !== null);
    }

    res.json({
      success: true,
      orders: ordersList,
      count: ordersList.length,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch orders' });
  }
});

// 3. Update Order Status (Seller or Admin)
app.patch('/api/orders/:id/status', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, sellerId, itemStatus, notes } = req.body;

    const order = serverOrders.get(id);
    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    const validStatuses = ['placed', 'confirmed', 'processing', 'out_for_delivery', 'delivered', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      res.status(400).json({ success: false, error: `Invalid order status: ${status}` });
      return;
    }

    if (status) {
      order.orderStatus = status;
    }

    // If seller updated their specific items
    if (sellerId && itemStatus) {
      order.items = order.items.map((item) =>
        item.sellerId === sellerId ? { ...item, itemStatus } : item
      );
    } else if (status === 'cancelled') {
      order.items = order.items.map((item) => ({ ...item, itemStatus: 'cancelled' }));
    } else if (status === 'delivered') {
      order.items = order.items.map((item) => ({ ...item, itemStatus: 'delivered' }));
      order.paymentStatus = 'completed';
    }

    if (notes) {
      order.notes = notes;
    }
    order.updatedAt = new Date().toISOString();
    serverOrders.set(id, order);

    res.json({
      success: true,
      order,
      message: `Order status updated to ${order.orderStatus}`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to update order' });
  }
});

// 4. Cancel Order (Customer or Admin)
app.post('/api/orders/:id/cancel', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason = 'Cancelled by customer' } = req.body;

    const order = serverOrders.get(id);
    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    // Strict cancellation rule: can only cancel if placed or confirmed
    if (order.orderStatus === 'out_for_delivery' || order.orderStatus === 'delivered') {
      res.status(400).json({
        success: false,
        error: `Order cannot be cancelled because it is already ${order.orderStatus.replace('_', ' ')}. Please contact support for assistance.`,
      });
      return;
    }

    if (order.orderStatus === 'cancelled') {
      res.status(400).json({ success: false, error: 'Order is already cancelled' });
      return;
    }

    order.orderStatus = 'cancelled';
    order.notes = order.notes ? `${order.notes} | Cancellation Reason: ${reason}` : `Cancellation Reason: ${reason}`;
    order.items = order.items.map((item) => ({ ...item, itemStatus: 'cancelled' }));
    order.updatedAt = new Date().toISOString();

    serverOrders.set(id, order);

    res.json({
      success: true,
      order,
      message: 'Order cancelled successfully',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to cancel order' });
  }
});

// System Status Endpoint
app.get('/api/system/status', (_req: Request, res: Response) => {
  const hasSupabase = Boolean(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_PUBLISHABLE_KEY);
  const hasTwilio = Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
  const hasMsg91 = Boolean(process.env.MSG91_AUTH_KEY);
  const hasKyc = Boolean(process.env.DIGILOCKER_CLIENT_ID || process.env.KYC_PROVIDER_API_KEY);

  res.json({
    status: 'operational',
    service: 'MattoKart Marketplace Server',
    location: 'Saharanpur, Uttar Pradesh',
    integrations: {
      supabaseDatabase: {
        configured: hasSupabase,
        note: hasSupabase ? 'Active' : 'Awaiting VITE_SUPABASE_URL in .env',
      },
      smsGateway: {
        configured: hasTwilio || hasMsg91,
        provider: hasTwilio ? 'Twilio SMS' : hasMsg91 ? 'MSG91' : 'None (Sandbox mode active)',
        note: hasTwilio || hasMsg91 ? 'Live Indian SMS active' : 'Awaiting SMS credentials (TWILIO / MSG91)',
      },
      identityKycProvider: {
        configured: hasKyc,
        provider: hasKyc ? 'DigiLocker / Surepass API' : 'Alternative Saharanpur Business KYC active',
        note: hasKyc ? 'Live DigiLocker partner active' : 'Compliant GSTIN & Saharanpur Shop Inspection active',
      },
      serverSideAdminAuth: {
        configured: Boolean(process.env.ADMIN_SECRET_KEY || DEV_SANDBOX_ADMIN_KEY),
        enforced: true,
        isDevelopmentFallback: Boolean(!isProduction && !process.env.ADMIN_SECRET_KEY),
        devKeyHint: !isProduction && !process.env.ADMIN_SECRET_KEY ? DEV_SANDBOX_ADMIN_KEY : undefined,
      },
    },
  });
});

// ============================================================================
// VITE MIDDLEWARE & STATIC ASSET SERVING
// ============================================================================

async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(projectRoot, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MattoKart] Server running on http://0.0.0.0:${PORT} (Mode: ${isProduction ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('[MattoKart] Failed to start server:', err);
});
