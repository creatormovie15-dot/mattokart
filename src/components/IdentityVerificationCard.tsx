import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  FileCheck,
  Building,
  MapPin,
  ExternalLink,
  AlertCircle,
  Info,
  ArrowRight,
  RefreshCw,
  Lock,
} from 'lucide-react';
import {
  Seller,
  IdentityVerificationStatus,
  IdentityVerificationMethod,
} from '../types';
import { submitIdentityVerification } from '../lib/authClient';

interface IdentityVerificationCardProps {
  seller: Seller;
  onUpdateSeller: (updated: Seller) => void;
}

export const IdentityVerificationCard: React.FC<IdentityVerificationCardProps> = ({
  seller,
  onUpdateSeller,
}) => {
  const [selectedMethod, setSelectedMethod] =
    useState<IdentityVerificationMethod>('gstin_verified');
  const [gstinInput, setGstinInput] = useState(seller.gstNumber || '');
  const [licenseInput, setLicenseInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const status = seller.identityVerificationStatus || 'not_started';

  const getStatusBadge = () => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verified Saharanpur Merchant</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Pending Admin Review</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            <span>Verification Rejected</span>
          </span>
        );
      case 'not_started':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
            <span>Not Started</span>
          </span>
        );
    }
  };

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    let referenceId = '';
    if (selectedMethod === 'gstin_verified') {
      referenceId = gstinInput.trim().toUpperCase();
      if (!referenceId) {
        setFeedback({ type: 'error', message: 'Please enter your 15-character GSTIN number.' });
        setIsSubmitting(false);
        return;
      }
    } else if (selectedMethod === 'trade_license') {
      referenceId = licenseInput.trim();
      if (!referenceId) {
        setFeedback({ type: 'error', message: 'Please enter your Saharanpur Municipal Trade License number.' });
        setIsSubmitting(false);
        return;
      }
    } else if (selectedMethod === 'physical_inspection_saharanpur') {
      referenceId = `VISIT-REQ-${seller.locality.replace(/\s+/g, '-').toUpperCase()}-${Date.now().toString().slice(-4)}`;
    } else if (selectedMethod === 'digilocker_authorized') {
      referenceId = `DIGILOCKER-SANDBOX-${Date.now()}`;
    }

    const res = await submitIdentityVerification(
      seller.id,
      selectedMethod,
      referenceId,
      selectedMethod === 'gstin_verified' ? referenceId : undefined
    );

    setIsSubmitting(false);

    if (res.success) {
      setFeedback({
        type: 'success',
        message: res.message || 'Identity verification submitted successfully. Awaiting admin review.',
      });
      const updated: Seller = {
        ...seller,
        identityVerificationStatus: 'pending',
        identityVerificationMethod: selectedMethod,
        verificationReferenceId: referenceId,
        gstNumber: selectedMethod === 'gstin_verified' ? referenceId : seller.gstNumber,
      };
      onUpdateSeller(updated);
    } else {
      setFeedback({
        type: 'error',
        message: res.error || 'Verification submission failed. Please try again.',
      });
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden space-y-6 p-6">
      {/* Top Banner & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900 font-brand">
              Seller Identity & Business Verification
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Legal identity assurance for Saharanpur buyers and merchants.
          </p>
        </div>
        <div className="shrink-0">{getStatusBadge()}</div>
      </div>

      {/* Legal & Privacy Compliance Box (Strict requirement) */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
        <Lock className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 space-y-1">
          <p className="font-bold text-blue-950">
            Statutory Aadhaar Privacy & Legal Safeguard Notice
          </p>
          <p className="text-[11px] leading-relaxed text-blue-800">
            In compliance with Section 29 of the Aadhaar Act (2016) and UIDAI circulars, MattoKart{' '}
            <strong>never requests, collects, or stores raw 12-digit Aadhaar numbers or Aadhaar OTPs</strong>.
            Authorized electronic verification is conducted solely through Government DigiLocker OAuth or
            recognized business credentials (GSTIN / Saharanpur Municipal Trade License / Physical Field Inspection).
          </p>
        </div>
      </div>

      {/* Status Details */}
      {status === 'verified' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>Your shop is officially verified on MattoKart!</span>
          </div>
          <p className="text-emerald-800 text-[11px]">
            Method:{' '}
            <span className="font-semibold capitalize">
              {seller.identityVerificationMethod?.replace('_', ' ') || 'Government Verified'}
            </span>
            {seller.verificationReferenceId && (
              <>
                {' '}
                | Reference ID: <span className="font-mono font-semibold">{seller.verificationReferenceId}</span>
              </>
            )}
            {seller.reviewedAt && (
              <>
                {' '}
                | Verified on: {new Date(seller.reviewedAt).toLocaleDateString()}
              </>
            )}
          </p>
          <p className="text-emerald-700 text-[11px]">
            Verified badge is visible to all buyers in Saharanpur. You have full permission to publish products.
          </p>
        </div>
      )}

      {status === 'pending' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Clock className="w-4 h-4 text-amber-700" />
            <span>Verification Submitted — Under Administrator Review</span>
          </div>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            Your verification request (Method:{' '}
            <strong className="capitalize">{seller.identityVerificationMethod?.replace('_', ' ')}</strong>) is currently
            being reviewed by MattoKart Saharanpur administration. Once approved, your shop and products will go live!
          </p>
          {seller.verificationReferenceId && (
            <p className="text-[11px] text-amber-900 font-mono">
              Audit Ref: {seller.verificationReferenceId}
            </p>
          )}
        </div>
      )}

      {status === 'rejected' && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-red-900 space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-sm text-red-800">
            <XCircle className="w-4 h-4 text-red-600" />
            <span>Identity Verification Needs Attention</span>
          </div>
          <p className="text-[11px] text-red-800">
            Reason:{' '}
            <strong>
              {seller.verificationRejectionReason ||
                'Business address or registration documents could not be validated.'}
            </strong>
          </p>
          <p className="text-[11px] text-red-700">
            Please select an alternative verification method below to re-submit your application.
          </p>
        </div>
      )}

      {/* Verification Submission Form (When Not Started, Rejected, or Updating) */}
      {(status === 'not_started' || status === 'rejected') && (
        <form onSubmit={handleSubmitVerification} className="space-y-4 pt-2">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Choose Your Preferred Verification Method:
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Option 1: GSTIN */}
            <div
              onClick={() => setSelectedMethod('gstin_verified')}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                selectedMethod === 'gstin_verified'
                  ? 'border-orange-500 bg-orange-50/40 text-slate-900 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs mb-1">
                <FileCheck className="w-4 h-4 text-orange-600" />
                <span>GSTIN Verification (Recommended)</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Uttar Pradesh GST identification number (starts with 09). Verified against official tax jurisdiction.
              </p>
            </div>

            {/* Option 2: Municipal Trade License */}
            <div
              onClick={() => setSelectedMethod('trade_license')}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                selectedMethod === 'trade_license'
                  ? 'border-orange-500 bg-orange-50/40 text-slate-900 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs mb-1">
                <Building className="w-4 h-4 text-orange-600" />
                <span>Saharanpur Municipal License</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Saharanpur Nagar Nigam Shop & Commercial Establishment Trade License number.
              </p>
            </div>

            {/* Option 3: Physical Shop Inspection */}
            <div
              onClick={() => setSelectedMethod('physical_inspection_saharanpur')}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                selectedMethod === 'physical_inspection_saharanpur'
                  ? 'border-orange-500 bg-orange-50/40 text-slate-900 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs mb-1">
                <MapPin className="w-4 h-4 text-orange-600" />
                <span>Physical Saharanpur Shop Visit</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                On-site shop inspection by MattoKart Saharanpur local team within 24-48 business hours.
              </p>
            </div>

            {/* Option 4: DigiLocker KYC */}
            <div
              onClick={() => setSelectedMethod('digilocker_authorized')}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                selectedMethod === 'digilocker_authorized'
                  ? 'border-orange-500 bg-orange-50/40 text-slate-900 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs mb-1">
                <ShieldCheck className="w-4 h-4 text-orange-600" />
                <span>DigiLocker Partner OAuth</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Authorized DigiLocker KYC gateway redirect (zero raw Aadhaar storage).
              </p>
            </div>
          </div>

          {/* Conditional Input based on method */}
          {selectedMethod === 'gstin_verified' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Enter 15-Digit GSTIN Number (e.g. 09AABPN1234F1Z8)
              </label>
              <input
                type="text"
                value={gstinInput}
                onChange={(e) => setGstinInput(e.target.value.toUpperCase())}
                placeholder="09AABPN1234F1Z8"
                maxLength={15}
                className="w-full px-3.5 py-2.5 text-sm font-mono uppercase border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden font-bold"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                State code 09 identifies Uttar Pradesh registered businesses.
              </p>
            </div>
          )}

          {selectedMethod === 'trade_license' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Municipal Corporation License / Shop Act Number
              </label>
              <input
                type="text"
                value={licenseInput}
                onChange={(e) => setLicenseInput(e.target.value)}
                placeholder="e.g. SMC-TL-2024-XXXX"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden"
                required
              />
            </div>
          )}

          {selectedMethod === 'physical_inspection_saharanpur' && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
              <p className="font-semibold">Shop Premises to be Visited:</p>
              <p className="text-slate-600 mt-0.5">
                {seller.shopName}, {seller.address}, {seller.locality}, Saharanpur - {seller.pinCode}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Our local verification executive will contact {seller.phone} prior to the visit.
              </p>
            </div>
          )}

          {selectedMethod === 'digilocker_authorized' && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1">
              <p className="font-semibold">Authorized Government DigiLocker Gateway</p>
              <p className="text-[11px] text-slate-600">
                You will be securely redirected to the authorized DigiLocker consent page to share your verified business entity credentials. No passwords or Aadhaar OTPs are stored by MattoKart.
              </p>
            </div>
          )}

          {feedback && (
            <div
              className={`p-3 rounded-xl flex items-start gap-2 text-xs ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Submitting Verification Request...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-orange-400" />
                <span>Submit for Saharanpur Admin Review</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};
