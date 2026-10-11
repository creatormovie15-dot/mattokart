import React, { useState, useEffect } from 'react';
import {
  X,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Store,
  User,
  Info,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { AuthUser, UserRole } from '../types';
import { sendMobileOtp, verifyMobileOtp, SendOtpResponse } from '../lib/authClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
  initialRole?: UserRole;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialRole = 'customer',
}) => {
  const [role, setRole] = useState<UserRole>(initialRole);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpResponse, setOtpResponse] = useState<SendOtpResponse | null>(null);

  // 60-second cooldown timer
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    setRole(initialRole);
  }, [initialRole]);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((c) => Math.max(0, c - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!isOpen) return null;

  const handlePhoneChange = (val: string) => {
    setError(null);
    // Allow digits and basic punctuation
    const digits = val.replace(/\D/g, '');
    if (digits.length <= 10) {
      setPhone(digits);
    }
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (phone.length !== 10 || !/^[6-9]/.test(phone)) {
      setError('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const res = await sendMobileOtp(phone, role, fullName);
    setIsLoading(false);

    if (res.success) {
      setOtpResponse(res);
      setStep('otp');
      setCooldown(res.cooldownSeconds || 60);
      setOtp('');
    } else {
      setError(res.error || res.message || 'Failed to send OTP.');
      if (res.retryAfterSeconds) {
        setCooldown(res.retryAfterSeconds);
      }
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length !== 6) {
      setError('Please enter the 6-digit numeric verification code.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const res = await verifyMobileOtp(phone, otp.trim(), role, fullName);
    setIsLoading(false);

    if (res.success && res.user) {
      onSuccess(res.user);
      onClose();
    } else {
      setError(res.error || 'Verification failed. Please check the code.');
    }
  };

  const handleFillTestOtp = () => {
    if (otpResponse?.testOtpCode) {
      setOtp(otpResponse.testOtpCode);
      setError(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden relative">
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 p-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
              Saharanpur Gateway
            </span>
          </div>
          <h2 className="text-xl font-extrabold font-brand">
            {role === 'seller' ? 'Seller Login & Portal' : 'Customer Account Login'}
          </h2>
          <p className="text-xs text-orange-100 mt-0.5">
            {role === 'seller'
              ? 'Dukaandar Bhaiyon ke liye: Free First-Year Portal Access'
              : 'Direct local shopping & verified merchant enquiries'}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Role Switcher Pill */}
          <div className="flex p-1 bg-slate-100 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setRole('customer');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                role === 'customer'
                  ? 'bg-white text-orange-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Customer (Grahak)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setRole('seller');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                role === 'seller'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Seller (Dukaandar)</span>
            </button>
          </div>

          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name (Optional)
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={role === 'seller' ? 'e.g. Ramesh Chandra' : 'e.g. Amit Sharma'}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Indian Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-sm font-bold text-slate-600 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="98970 12345"
                    maxLength={10}
                    className="flex-1 px-3.5 py-2.5 text-sm border border-slate-200 rounded-r-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden font-medium"
                    required
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Enter 10-digit mobile number for secure SMS OTP authentication.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || phone.length !== 10}
                className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Generating Verification Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-[11px] text-slate-500 text-center leading-relaxed">
                By signing in, you agree to MattoKart's Terms of Service and Privacy Policy. Your credentials and OTPs are never stored in plain text.
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Verification code sent to:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('phone');
                      setError(null);
                    }}
                    className="text-orange-600 font-bold hover:underline cursor-pointer"
                  >
                    Change Number
                  </button>
                </div>
                <div className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-orange-600" />
                  <span>{otpResponse?.formattedPhone || `+91 ${phone}`}</span>
                </div>

                {/* Clear distinction: Live Provider vs Sandbox Test mode */}
                {otpResponse?.sandboxMode ? (
                  <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Developer Sandbox Mode Active</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-tight">
                      SMS Gateway is awaiting live credentials (Twilio/MSG91). For testing the registration flow, use authorized code:
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="font-mono font-bold text-base bg-white px-2.5 py-0.5 rounded border border-amber-300 text-slate-900 tracking-wider">
                        {otpResponse.testOtpCode}
                      </span>
                      <button
                        type="button"
                        onClick={handleFillTestOtp}
                        className="text-[11px] font-bold text-amber-900 hover:text-amber-950 underline cursor-pointer"
                      >
                        Auto-fill Code
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Live SMS dispatched to your mobile handset</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Enter 6-Digit OTP Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    setError(null);
                    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                  }}
                  placeholder="• • • • • •"
                  maxLength={6}
                  className="w-full text-center tracking-widest text-xl font-bold font-mono px-3.5 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden"
                  required
                  autoFocus
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify & Continue</span>
                  </>
                )}
              </button>

              {/* Resend OTP Bar */}
              <div className="flex items-center justify-between text-xs pt-1">
                {cooldown > 0 ? (
                  <span className="text-slate-500 flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Resend in {cooldown}s</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    disabled={isLoading}
                    className="text-orange-600 font-bold hover:underline cursor-pointer"
                  >
                    Resend OTP
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setError(null);
                  }}
                  className="text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Use another number
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
