import React, { useState, useEffect } from 'react';
import {
  Store,
  CheckCircle2,
  ArrowRight,
  Info,
  Phone,
  MessageCircle,
  Mail,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Lock,
  FileCheck,
  Building,
  MapPin,
  Sparkles,
  Package,
  Plus,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import {
  Category,
  CategoryId,
  Seller,
  UnitType,
  IdentityVerificationMethod,
  AuthUser,
} from '../types';
import { SAHARANPUR_LOCALITIES } from '../data/mockData';
import { sendMobileOtp, verifyMobileOtp } from '../lib/authClient';

interface SellerRegisterViewProps {
  categories: Category[];
  onRegisterSeller: (seller: Seller) => void;
  onGoToDashboard: () => void;
  currentUser?: AuthUser | null;
  onOpenAuthModal?: () => void;
}

export const SellerRegisterView: React.FC<SellerRegisterViewProps> = ({
  categories,
  onRegisterSeller,
  onGoToDashboard,
  currentUser,
  onOpenAuthModal,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Form states - Step 1: Owner and Contact
  const [ownerName, setOwnerName] = useState(currentUser?.fullName || '');
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState(
    currentUser?.phone ? currentUser.phone.replace('+91', '').trim() : ''
  );
  const [isPhoneOtpVerified, setIsPhoneOtpVerified] = useState(Boolean(currentUser?.phone));
  const [otpInput, setOtpInput] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [testOtpCode, setTestOtpCode] = useState<string | null>(null);
  const [email, setEmail] = useState('');

  // Step 2: Address
  const [address, setAddress] = useState('');
  const [locality, setLocality] = useState(SAHARANPUR_LOCALITIES[0].name);
  const [city] = useState('Saharanpur');
  const [pinCode, setPinCode] = useState(SAHARANPUR_LOCALITIES[0].pinCode);
  const [landmark, setLandmark] = useState('');
  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState(30);

  // Step 3: Categories & Initial Product (Goal 2)
  const [selectedCategories, setSelectedCategories] = useState<CategoryId[]>(['furniture']);
  const [description, setDescription] = useState('');
  const [hasInitialProduct, setHasInitialProduct] = useState(true);
  const [initialProdName, setInitialProdName] = useState('Handcrafted Teak Mandir / Carved Artifact');
  const [initialProdPrice, setInitialProdPrice] = useState<number>(3500);
  const [initialProdUnit, setInitialProdUnit] = useState<UnitType>('piece');
  const [initialProdStock, setInitialProdStock] = useState<number>(5);
  const [initialProdDescription, setInitialProdDescription] = useState(
    'Premium seasoned solid Sheesham wood carving, crafted in Saharanpur.'
  );
  const [initialProdImageUrl, setInitialProdImageUrl] = useState(
    'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80'
  );

  // Step 4: Identity Verification Selection (Goal 3)
  const [verificationMethod, setVerificationMethod] =
    useState<IdentityVerificationMethod>('gstin_verified');
  const [gstNumber, setGstNumber] = useState('');
  const [tradeLicenseNumber, setTradeLicenseNumber] = useState('');

  // Step 5: Terms
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submittedApplication, setSubmittedApplication] = useState<Seller | null>(null);

  // Sync if current user changes
  useEffect(() => {
    if (currentUser?.phone) {
      setPhone(currentUser.phone.replace('+91', '').trim());
      setIsPhoneOtpVerified(true);
    }
  }, [currentUser]);

  const handleCategoryToggle = (catId: CategoryId) => {
    if (selectedCategories.includes(catId)) {
      if (selectedCategories.length === 1) return; // Keep at least one
      setSelectedCategories(selectedCategories.filter((c) => c !== catId));
    } else {
      setSelectedCategories([...selectedCategories, catId]);
    }
  };

  // Inline OTP send for Step 1
  const handleSendInlineOtp = async () => {
    const cleanPh = phone.replace(/\D/g, '');
    if (cleanPh.length !== 10 || !/^[6-9]/.test(cleanPh)) {
      setErrors({ phone: 'Please enter a valid 10-digit Indian mobile number.' });
      return;
    }
    setOtpLoading(true);
    setErrors({});
    const res = await sendMobileOtp(cleanPh, 'seller', ownerName);
    setOtpLoading(false);

    if (res.success) {
      setIsOtpSent(true);
      if (res.testOtpCode) {
        setTestOtpCode(res.testOtpCode);
      }
    } else {
      setErrors({ phone: res.error || res.message || 'Failed to dispatch OTP.' });
    }
  };

  // Inline OTP verify for Step 1
  const handleVerifyInlineOtp = async () => {
    if (otpInput.trim().length !== 6) {
      setErrors({ otp: 'Please enter the 6-digit verification code.' });
      return;
    }
    setOtpLoading(true);
    setErrors({});
    const res = await verifyMobileOtp(phone, otpInput.trim(), 'seller', ownerName);
    setOtpLoading(false);

    if (res.success) {
      setIsPhoneOtpVerified(true);
      setIsOtpSent(false);
      setErrors({});
    } else {
      setErrors({ otp: res.error || 'Incorrect OTP code.' });
    }
  };

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!ownerName.trim()) errs.ownerName = 'Please enter proprietor / owner full name';
    if (!shopName.trim()) errs.shopName = 'Please enter your shop or business name';
    const cleanPh = phone.replace(/\D/g, '');
    if (!cleanPh || cleanPh.length !== 10) {
      errs.phone = 'Please enter a valid 10-digit mobile number';
    } else if (!isPhoneOtpVerified) {
      errs.phone = 'Please verify your Indian mobile number via OTP before proceeding.';
    }
    if (email && !email.includes('@')) errs.email = 'Please enter a valid email address';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (!address.trim()) errs.address = 'Please enter complete shop physical address';
    if (!pinCode || pinCode.length !== 6) errs.pinCode = 'Please enter valid 6-digit PIN code';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep3 = () => {
    const errs: Record<string, string> = {};
    if (selectedCategories.length === 0) errs.categories = 'Please select at least 1 permitted category';
    if (!description.trim()) errs.description = 'Please write a brief summary of what you sell';
    if (hasInitialProduct) {
      if (!initialProdName.trim()) errs.prodName = 'Please enter initial product title';
      if (!initialProdPrice || initialProdPrice <= 0) errs.prodPrice = 'Please enter a valid price in ₹';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep4 = () => {
    const errs: Record<string, string> = {};
    if (verificationMethod === 'gstin_verified') {
      const g = gstNumber.trim().toUpperCase();
      if (!g || !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(g)) {
        errs.gstNumber = 'Valid 15-character GSTIN starting with 09 (Uttar Pradesh) is required.';
      }
    } else if (verificationMethod === 'trade_license') {
      if (!tradeLicenseNumber.trim()) {
        errs.tradeLicense = 'Please enter your Saharanpur Municipal Trade License number.';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setErrors({ terms: 'You must accept the MattoKart Seller Agreement to proceed.' });
      return;
    }

    let refId = '';
    if (verificationMethod === 'gstin_verified') {
      refId = gstNumber.trim().toUpperCase();
    } else if (verificationMethod === 'trade_license') {
      refId = tradeLicenseNumber.trim();
    } else if (verificationMethod === 'physical_inspection_saharanpur') {
      refId = `VISIT-${locality.replace(/\s+/g, '-').toUpperCase()}-${Date.now().toString().slice(-4)}`;
    } else {
      refId = `DL-SANDBOX-${Date.now()}`;
    }

    const sellerId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `seller-${Date.now()}`;
    const newSeller: Seller = {
      id: sellerId,
      ownerName: ownerName.trim(),
      shopName: shopName.trim(),
      phone: `+91 ${phone.trim()}`,
      email: email.trim() || `${phone.trim()}@mattokart-seller.in`,
      address: address.trim(),
      locality,
      city,
      pinCode,
      landmark: landmark.trim(),
      categories: selectedCategories,
      gstNumber: gstNumber.trim().toUpperCase() || undefined,
      rating: 5.0,
      reviewsCount: 0,
      joinedDate: new Date().toISOString().split('T')[0],
      status: 'pending_approval', // Remains Pending until authorized admin approves
      registrationFeeStatus: 'free_first_year', // Free first year: zero fee
      proposedFee: 0,
      description: description.trim(),
      deliveryRadiusKm,
      bannerImage: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1200&q=80',
      shopLogo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
      // Identity Verification (Goal 3)
      identityVerificationStatus: 'pending',
      identityVerificationMethod: verificationMethod,
      verificationReferenceId: refId,
      initialProduct: hasInitialProduct
        ? {
            name: initialProdName.trim(),
            price: Number(initialProdPrice),
            unit: initialProdUnit,
            description: initialProdDescription.trim(),
            imageUrl: initialProdImageUrl.trim(),
            stockCount: Number(initialProdStock),
          }
        : undefined,
    };

    onRegisterSeller(newSeller);
    setSubmittedApplication(newSeller);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider border border-emerald-300">
          <Store className="w-3.5 h-3.5" />
          <span>Join MattoKart — FREE for Your First Year</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-brand">
          Register Your Shop on MattoKart
        </h1>
        <p className="text-sm font-semibold text-emerald-700 max-w-xl mx-auto">
          No registration fee. No listing fee during the first year.
        </p>
        <p className="text-xs text-slate-600 max-w-xl mx-auto">
          Expand your sales across Saharanpur & western Uttar Pradesh with ₹0 shop creation, ₹0 product listing, and zero commission buyer leads.
        </p>

        {/* Support Bar */}
        <div className="pt-2 max-w-xl mx-auto">
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-950 font-semibold text-center sm:text-left">
              <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Need help onboarding? Chat with MattoKart on WhatsApp</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 shrink-0">
              <a
                href="https://wa.me/918221077674?text=Namaste%20MattoKart!%20I%20need%20help%20registering%20my%20shop%20in%20Saharanpur."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp: +91 8221077674</span>
              </a>
              <a
                href="tel:+918221077674"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-emerald-200 font-semibold rounded-xl transition-colors"
                title="Call Support"
              >
                <Phone className="w-3.5 h-3.5 text-orange-600" />
                <span>Call</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Success State */}
      {submittedApplication ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-xl space-y-6 text-center animate-in zoom-in-95">
          <div className="w-20 h-20 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-md">
            <Clock className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
              Application Submitted (Pending Administrator Review)
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 font-brand">
              Namaste {submittedApplication.ownerName}!
            </h2>
            <p className="text-sm text-slate-600 max-w-lg mx-auto">
              Your application for <strong className="text-slate-900">{submittedApplication.shopName}</strong> has been securely submitted to MattoKart's Saharanpur administration.
            </p>
          </div>

          {/* Verification & Permission Status Card */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-3 max-w-xl mx-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-700">Account Status:</span>
              <span className="font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                Pending Admin Approval
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-700">Identity Verification:</span>
              <span className="font-mono text-slate-800 font-semibold">
                {submittedApplication.identityVerificationMethod?.replace('_', ' ').toUpperCase()} (Ref: {submittedApplication.verificationReferenceId})
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-700">Registration & Listing Fee:</span>
              <span className="font-bold text-emerald-700">₹0 (FREE First Year)</span>
            </div>
            <div className="text-slate-600 leading-relaxed text-[11px] pt-1">
              <strong>Product Listing Security Rule:</strong> In accordance with MattoKart marketplace policy, new shops remain Pending until an authorized administrator verifies the credentials. Only approved sellers may publish products to the public catalog.
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={onGoToDashboard}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
            >
              Open Seller Portal & View Status
            </button>
          </div>
        </div>
      ) : (
        /* Stepper Form */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Progress Tabs */}
          <div className="grid grid-cols-5 text-center text-xs font-semibold bg-slate-50 border-b border-slate-200">
            <button
              onClick={() => setStep(1)}
              className={`py-3.5 px-2 transition-colors border-b-2 cursor-pointer ${
                step === 1 ? 'border-orange-600 text-orange-600 bg-white font-bold' : 'border-transparent text-slate-500'
              }`}
            >
              1. Mobile & Shop
            </button>
            <button
              onClick={() => {
                if (validateStep1()) setStep(2);
              }}
              className={`py-3.5 px-2 transition-colors border-b-2 cursor-pointer ${
                step === 2 ? 'border-orange-600 text-orange-600 bg-white font-bold' : 'border-transparent text-slate-500'
              }`}
            >
              2. Address
            </button>
            <button
              onClick={() => {
                if (validateStep1() && validateStep2()) setStep(3);
              }}
              className={`py-3.5 px-2 transition-colors border-b-2 cursor-pointer ${
                step === 3 ? 'border-orange-600 text-orange-600 bg-white font-bold' : 'border-transparent text-slate-500'
              }`}
            >
              3. Sample Listing
            </button>
            <button
              onClick={() => {
                if (validateStep1() && validateStep2() && validateStep3()) setStep(4);
              }}
              className={`py-3.5 px-2 transition-colors border-b-2 cursor-pointer ${
                step === 4 ? 'border-orange-600 text-orange-600 bg-white font-bold' : 'border-transparent text-slate-500'
              }`}
            >
              4. Identity KYC
            </button>
            <button
              onClick={() => {
                if (validateStep1() && validateStep2() && validateStep3() && validateStep4()) setStep(5);
              }}
              className={`py-3.5 px-2 transition-colors border-b-2 cursor-pointer ${
                step === 5 ? 'border-orange-600 text-orange-600 bg-white font-bold' : 'border-transparent text-slate-500'
              }`}
            >
              5. ₹0 Fee & Agree
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {/* STEP 1: Owner and Mobile Phone Verification */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-bold text-slate-900">
                    Step 1: Proprietor Details & Mobile Verification
                  </h3>
                  <p className="text-xs text-slate-500">
                    Separate Customer and Seller roles. Verify your Indian mobile number via OTP.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Proprietor / Owner Full Name *
                    </label>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="e.g. Rashid Ahmed Ansari"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                    {errors.ownerName && <p className="text-xs text-red-500 mt-1">{errors.ownerName}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Shop / Business Name *
                    </label>
                    <input
                      type="text"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      placeholder="e.g. Noor Handicrafts & Timber Works"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                    {errors.shopName && <p className="text-xs text-red-500 mt-1">{errors.shopName}</p>}
                  </div>

                  {/* Mobile Number with OTP Verification */}
                  <div className="sm:col-span-2 space-y-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Indian Mobile Number (for OTP & Buyer Enquiries) *
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          +91
                        </span>
                        <input
                          type="tel"
                          maxLength={10}
                          value={phone}
                          disabled={isPhoneOtpVerified}
                          onChange={(e) => {
                            setPhone(e.target.value.replace(/\D/g, ''));
                            setIsPhoneOtpVerified(false);
                            setIsOtpSent(false);
                          }}
                          placeholder="98970 12345"
                          className="w-full pl-11 pr-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono disabled:bg-slate-50"
                        />
                      </div>

                      {isPhoneOtpVerified ? (
                        <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold shrink-0 border border-emerald-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>OTP Verified</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendInlineOtp}
                          disabled={otpLoading || phone.length !== 10}
                          className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs shrink-0 cursor-pointer"
                        >
                          {otpLoading ? 'Sending...' : isOtpSent ? 'Resend OTP' : 'Send OTP'}
                        </button>
                      )}
                    </div>

                    {/* Inline OTP input */}
                    {isOtpSent && !isPhoneOtpVerified && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 animate-in fade-in">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-amber-900 font-semibold">Enter 6-digit OTP code:</span>
                          {testOtpCode && (
                            <span className="text-[11px] bg-white px-2 py-0.5 rounded border border-amber-300 text-slate-800 font-mono">
                              Test Code: <strong>{testOtpCode}</strong>
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            value={otpInput}
                            onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                            placeholder="• • • • • •"
                            className="flex-1 px-3 py-2 text-center font-mono font-bold text-sm tracking-widest border border-slate-300 rounded-lg bg-white"
                          />
                          <button
                            type="button"
                            onClick={handleVerifyInlineOtp}
                            disabled={otpLoading || otpInput.length !== 6}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg cursor-pointer"
                          >
                            Verify
                          </button>
                        </div>
                        {errors.otp && <p className="text-xs text-red-600">{errors.otp}</p>}
                      </div>
                    )}

                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="shopname@gmail.com"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (validateStep1()) setStep(2);
                    }}
                    className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Next: Shop Location</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Location and Physical Address */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-bold text-slate-900">
                    Step 2: Shop Location in Saharanpur
                  </h3>
                  <p className="text-xs text-slate-500">
                    Accurate physical address helps buyers locate you and calculate delivery coverage.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Shop / Factory / Godown Physical Address *
                    </label>
                    <textarea
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Shop Number, Building Name, Street / Gali, Market..."
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
                    />
                    {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Market / Locality *
                      </label>
                      <select
                        value={locality}
                        onChange={(e) => {
                          const chosen = e.target.value;
                          setLocality(chosen);
                          const matched = SAHARANPUR_LOCALITIES.find((l) => l.name === chosen);
                          if (matched) setPinCode(matched.pinCode);
                        }}
                        className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white"
                      >
                        {SAHARANPUR_LOCALITIES.map((loc) => (
                          <option key={loc.name} value={loc.name}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        City & State
                      </label>
                      <input
                        type="text"
                        disabled
                        value="Saharanpur, Uttar Pradesh"
                        className="w-full px-3 py-2.5 text-sm bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        PIN Code *
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={pinCode}
                        onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl font-mono"
                      />
                      {errors.pinCode && <p className="text-xs text-red-500 mt-1">{errors.pinCode}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nearby Landmark
                      </label>
                      <input
                        type="text"
                        value={landmark}
                        onChange={(e) => setLandmark(e.target.value)}
                        placeholder="e.g. Near Ghanta Ghar, Court Road, Timber Market"
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Delivery Coverage Radius (km)
                      </label>
                      <input
                        type="number"
                        min={5}
                        max={100}
                        value={deliveryRadiusKm}
                        onChange={(e) => setDeliveryRadiusKm(parseInt(e.target.value) || 20)}
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (validateStep2()) setStep(3);
                    }}
                    className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Next: Categories & Product</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Categories & Initial Product Listing (Goal 2) */}
            {step === 3 && (
              <div className="space-y-5 animate-in fade-in">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-bold text-slate-900">
                    Step 3: Categories & Initial Product Upload
                  </h3>
                  <p className="text-xs text-slate-500">
                    Select your categories and upload a sample product to prepare your catalog.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Select Permitted Product Categories *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {categories.map((cat) => {
                      const isSelected = selectedCategories.includes(cat.id);
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleCategoryToggle(cat.id)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'border-orange-500 bg-orange-50/50 text-slate-900 shadow-xs'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <div className="font-bold text-xs truncate">{cat.name}</div>
                          <div className="text-[10px] text-slate-500 truncate">{cat.hindiName}</div>
                        </button>
                      );
                    })}
                  </div>
                  {errors.categories && <p className="text-xs text-red-500 mt-1">{errors.categories}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Shop Summary & Specialities *
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your shop specialties (e.g. Master woodcraft furniture, pure desi gur, or TMT steel supply)..."
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
                  />
                  {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
                </div>

                {/* Initial Product Upload Box */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-orange-600" />
                      <span className="text-xs font-bold text-slate-800">
                        Upload Your First Product Listing
                      </span>
                    </div>
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasInitialProduct}
                        onChange={(e) => setHasInitialProduct(e.target.checked)}
                        className="accent-orange-600 rounded"
                      />
                      <span>Include sample listing</span>
                    </label>
                  </div>

                  {hasInitialProduct && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Product Name *
                        </label>
                        <input
                          type="text"
                          value={initialProdName}
                          onChange={(e) => setInitialProdName(e.target.value)}
                          placeholder="e.g. Pure Teak Carved Mandir"
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                        />
                        {errors.prodName && <p className="text-[10px] text-red-500 mt-0.5">{errors.prodName}</p>}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Price (₹) *
                          </label>
                          <input
                            type="number"
                            value={initialProdPrice}
                            onChange={(e) => setInitialProdPrice(Number(e.target.value))}
                            placeholder="3500"
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                          />
                          {errors.prodPrice && <p className="text-[10px] text-red-500 mt-0.5">{errors.prodPrice}</p>}
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Unit
                          </label>
                          <select
                            value={initialProdUnit}
                            onChange={(e) => setInitialProdUnit(e.target.value as UnitType)}
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                          >
                            <option value="piece">Piece</option>
                            <option value="kg">Kg</option>
                            <option value="bag">Bag</option>
                            <option value="meter">Meter</option>
                            <option value="set">Set</option>
                          </select>
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Product Description
                        </label>
                        <input
                          type="text"
                          value={initialProdDescription}
                          onChange={(e) => setInitialProdDescription(e.target.value)}
                          placeholder="Dimensions, wood type, or specifications..."
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (validateStep3()) setStep(4);
                    }}
                    className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Next: Identity Verification</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Identity Verification Selection (Goal 3) */}
            {step === 4 && (
              <div className="space-y-4 animate-in fade-in">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-bold text-slate-900">
                    Step 4: Seller Identity Verification (Saharanpur KYC)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Verify your business identity. Protects consumers and gives your shop a verified local badge.
                  </p>
                </div>

                {/* Aadhaar Privacy & Legal Notice */}
                <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-start gap-2.5 text-xs text-blue-900">
                  <Lock className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-[11px] leading-relaxed">
                    <p className="font-bold text-blue-950">Statutory Aadhaar Compliance Notice</p>
                    <p className="text-blue-800">
                      Under Section 29 of the Aadhaar Act and UIDAI guidelines, MattoKart <strong>never collects or stores raw 12-digit Aadhaar numbers or OTPs</strong>. Verification is processed via authorized DigiLocker KYC or official business credentials (GSTIN / Trade License / Saharanpur Shop Inspection).
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Select Your Preferred Verification Method:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => setVerificationMethod('gstin_verified')}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                        verificationMethod === 'gstin_verified'
                          ? 'border-orange-500 bg-orange-50/50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs text-slate-900 mb-1">
                        <FileCheck className="w-4 h-4 text-orange-600" />
                        <span>GSTIN Verification (Instant)</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight">
                        Uttar Pradesh GST number (09...). Verified against official tax jurisdiction.
                      </p>
                    </div>

                    <div
                      onClick={() => setVerificationMethod('trade_license')}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                        verificationMethod === 'trade_license'
                          ? 'border-orange-500 bg-orange-50/50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs text-slate-900 mb-1">
                        <Building className="w-4 h-4 text-orange-600" />
                        <span>Saharanpur Municipal License</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight">
                        Saharanpur Nagar Nigam Trade License or Shop Act registration.
                      </p>
                    </div>

                    <div
                      onClick={() => setVerificationMethod('physical_inspection_saharanpur')}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                        verificationMethod === 'physical_inspection_saharanpur'
                          ? 'border-orange-500 bg-orange-50/50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs text-slate-900 mb-1">
                        <MapPin className="w-4 h-4 text-orange-600" />
                        <span>Physical Shop Inspection</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight">
                        MattoKart local field team visits your Saharanpur shop within 24-48 business hours.
                      </p>
                    </div>

                    <div
                      onClick={() => setVerificationMethod('digilocker_authorized')}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                        verificationMethod === 'digilocker_authorized'
                          ? 'border-orange-500 bg-orange-50/50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs text-slate-900 mb-1">
                        <ShieldCheck className="w-4 h-4 text-orange-600" />
                        <span>DigiLocker Partner OAuth</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight">
                        Authorized Government DigiLocker gateway redirect. Zero raw Aadhaar storage.
                      </p>
                    </div>
                  </div>
                </div>

                {verificationMethod === 'gstin_verified' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      15-Digit GSTIN Number (e.g. 09AABPN1234F1Z8) *
                    </label>
                    <input
                      type="text"
                      maxLength={15}
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                      placeholder="09AABPN1234F1Z8"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl font-mono uppercase font-bold"
                    />
                    {errors.gstNumber && <p className="text-xs text-red-500 mt-1">{errors.gstNumber}</p>}
                  </div>
                )}

                {verificationMethod === 'trade_license' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Municipal Trade License / Shop Registration Number *
                    </label>
                    <input
                      type="text"
                      value={tradeLicenseNumber}
                      onChange={(e) => setTradeLicenseNumber(e.target.value)}
                      placeholder="e.g. SMC-TL-2024-8841"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl font-mono"
                    />
                    {errors.tradeLicense && <p className="text-xs text-red-500 mt-1">{errors.tradeLicense}</p>}
                  </div>
                )}

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (validateStep4()) setStep(5);
                    }}
                    className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Next: Fee & Agreement</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: Free First Year Model & Final Agreement */}
            {step === 5 && (
              <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-bold text-slate-900">
                    Step 5: FREE First-Year Membership & Seller Agreement
                  </h3>
                  <p className="text-xs text-slate-500">
                    Join MattoKart — FREE for Your First Year. Review the ₹0 fee model and submit for review.
                  </p>
                </div>

                {/* Proposed Fee Disclosure Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                        Join MattoKart — FREE for Your First Year
                      </span>
                      <h4 className="text-3xl font-black text-emerald-950 font-brand flex items-baseline gap-2">
                        ₹0 <span className="text-xs font-semibold text-emerald-800">/ First Year</span>
                      </h4>
                    </div>
                    <span className="px-3 py-1 bg-emerald-200/80 text-emerald-950 font-bold text-xs rounded-full border border-emerald-300">
                      100% Free Onboarding
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                    <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200/60">
                      <div className="font-bold text-emerald-900">₹0 Registration Fee</div>
                      <div className="text-[11px] text-slate-600">Zero signup charge</div>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200/60">
                      <div className="font-bold text-emerald-900">₹0 Shop Creation Fee</div>
                      <div className="text-[11px] text-slate-600">Digital storefront setup</div>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200/60">
                      <div className="font-bold text-emerald-900">₹0 Listing Fee</div>
                      <div className="text-[11px] text-slate-600">Unlimited products</div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-700 space-y-1.5 border-t border-emerald-200/60 pt-3">
                    <p className="font-bold text-emerald-950">
                      No registration fee. No listing fee during the first year.
                    </p>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      We do not collect any registration or listing payments. MattoKart does not automatically promise or assume that the service will become paid after one year. Any future fees or commercial terms will be clearly announced in advance and will require your explicit review and acceptance before taking effect.
                    </p>
                  </div>
                </div>

                {/* Seller Guidelines & Agreement */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-600">
                  <h5 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                    MattoKart Seller Obligations
                  </h5>
                  <ul className="space-y-1 list-disc pl-4 text-[11px]">
                    <li>I will only list permitted, lawful products. Prohibited or counterfeit goods are strictly forbidden.</li>
                    <li>I will maintain transparent pricing in Indian Rupees (₹) and honor quotes given to local buyers.</li>
                    <li>I acknowledge that applications remain Pending until verified and approved by MattoKart administrators.</li>
                  </ul>
                </div>

                <div className="space-y-1">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-1 accent-emerald-600 rounded"
                    />
                    <span className="text-xs text-slate-700 leading-snug">
                      I have read and agree to the <strong>MattoKart Seller Terms & Conditions</strong> and acknowledge that my shop application is <strong>FREE for the first year (₹0 registration, ₹0 listing fee)</strong> and subject to standard administrative verification.
                    </span>
                  </label>
                  {errors.terms && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.terms}</p>}
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-600/30 flex items-center gap-2 cursor-pointer"
                  >
                    <Store className="w-4 h-4" />
                    <span>Submit Seller Registration for Review</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
