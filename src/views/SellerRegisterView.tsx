import React, { useState } from 'react';
import {
  Store,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Building,
  MapPin,
  Mail,
  Phone,
  FileCheck,
  Info,
  Layers,
} from 'lucide-react';
import { Category, CategoryId, Seller } from '../types';
import { SAHARANPUR_LOCALITIES } from '../data/mockData';

interface SellerRegisterViewProps {
  categories: Category[];
  onRegisterSeller: (seller: Seller) => void;
  onGoToDashboard: () => void;
}

export const SellerRegisterView: React.FC<SellerRegisterViewProps> = ({
  categories,
  onRegisterSeller,
  onGoToDashboard,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form states
  const [ownerName, setOwnerName] = useState('');
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [locality, setLocality] = useState(SAHARANPUR_LOCALITIES[0].name);
  const [city] = useState('Saharanpur');
  const [pinCode, setPinCode] = useState(SAHARANPUR_LOCALITIES[0].pinCode);
  const [landmark, setLandmark] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<CategoryId[]>(['furniture']);
  const [gstNumber, setGstNumber] = useState('');
  const [description, setDescription] = useState('');
  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState(30);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submittedApplication, setSubmittedApplication] = useState<Seller | null>(null);

  const handleCategoryToggle = (catId: CategoryId) => {
    if (selectedCategories.includes(catId)) {
      if (selectedCategories.length === 1) return; // Keep at least one
      setSelectedCategories(selectedCategories.filter((c) => c !== catId));
    } else {
      setSelectedCategories([...selectedCategories, catId]);
    }
  };

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!ownerName.trim()) errs.ownerName = 'Please enter proprietor / owner full name';
    if (!shopName.trim()) errs.shopName = 'Please enter your shop or business name';
    const cleanPh = phone.replace(/\D/g, '');
    if (!cleanPh || cleanPh.length < 10) errs.phone = 'Please enter a valid 10-digit mobile number';
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
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setErrors({ terms: 'You must accept the MattoKart Seller Agreement to proceed.' });
      return;
    }

    const sellerId = `seller-${Date.now()}`;
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
      gstNumber: gstNumber.trim() || undefined,
      rating: 5.0,
      reviewsCount: 1,
      joinedDate: new Date().toISOString().split('T')[0],
      status: 'pending_approval', // Pending admin review
      registrationFeeStatus: 'paid_pending_gateway', // Clearly marked as pending real payment verification
      proposedFee: 199,
      description: description.trim(),
      deliveryRadiusKm,
      bannerImage: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1200&q=80',
      shopLogo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    };

    onRegisterSeller(newSeller);
    setSubmittedApplication(newSeller);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-wider">
          <Store className="w-3.5 h-3.5" />
          <span>MattoKart Partner Network • Saharanpur</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-brand">
          Register Your Shop on MattoKart
        </h1>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          Expand your sales across Saharanpur & western Uttar Pradesh. Reach retail buyers, contractors, and local families.
        </p>
      </div>

      {/* Success State */}
      {submittedApplication ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-xl space-y-6 text-center animate-in zoom-in-95">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Application Submitted (Pending Verification)
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 font-brand">
              Badhai Ho, {submittedApplication.ownerName}!
            </h2>
            <p className="text-sm text-slate-600 max-w-lg mx-auto">
              Your application for <strong className="text-slate-900">{submittedApplication.shopName}</strong> has been received by MattoKart's Saharanpur administration desk.
            </p>
          </div>

          {/* Fee & Payment Notice */}
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-left text-xs space-y-2 max-w-xl mx-auto">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Proposed Seller Registration Fee: ₹199 / Year</span>
            </div>
            <p className="text-amber-800 leading-relaxed">
              <strong>Notice:</strong> The annual seller registration fee of <strong>₹199/year</strong> is currently marked as <span className="font-semibold underline">Pending Verification</span>. No live payment has been processed. In production, this fee will be verified via a licensed Indian payment gateway (Razorpay / UPI) before public storefront listing.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={onGoToDashboard}
              className="px-6 py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Store className="w-4 h-4" />
              <span>Go to Seller Dashboard</span>
            </button>
          </div>
        </div>
      ) : (
        /* Multi-step Registration Wizard */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Step Progress Bar */}
          <div className="grid grid-cols-4 border-b border-slate-100 text-xs font-semibold text-center bg-slate-50">
            <button
              onClick={() => setStep(1)}
              className={`py-3.5 px-2 transition-colors border-b-2 ${
                step === 1
                  ? 'border-orange-600 text-orange-600 bg-white font-bold'
                  : 'border-transparent text-slate-500'
              }`}
            >
              1. Shop Info
            </button>
            <button
              onClick={() => {
                if (validateStep1()) setStep(2);
              }}
              className={`py-3.5 px-2 transition-colors border-b-2 ${
                step === 2
                  ? 'border-orange-600 text-orange-600 bg-white font-bold'
                  : 'border-transparent text-slate-500'
              }`}
            >
              2. Address
            </button>
            <button
              onClick={() => {
                if (validateStep1() && validateStep2()) setStep(3);
              }}
              className={`py-3.5 px-2 transition-colors border-b-2 ${
                step === 3
                  ? 'border-orange-600 text-orange-600 bg-white font-bold'
                  : 'border-transparent text-slate-500'
              }`}
            >
              3. Categories
            </button>
            <button
              onClick={() => {
                if (validateStep1() && validateStep2() && validateStep3()) setStep(4);
              }}
              className={`py-3.5 px-2 transition-colors border-b-2 ${
                step === 4
                  ? 'border-orange-600 text-orange-600 bg-white font-bold'
                  : 'border-transparent text-slate-500'
              }`}
            >
              4. Fee & Terms
            </button>
          </div>

          {/* Form Container */}
          <div className="p-6 sm:p-8">
            {/* STEP 1: Owner and Shop Details */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-bold text-slate-900">
                    Step 1: Proprietor & Business Details
                  </h3>
                  <p className="text-xs text-slate-500">
                    Enter basic information about yourself and your retail or wholesale dukaan.
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
                      placeholder="e.g. Ramesh Aggarwal"
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
                      placeholder="e.g. Aggarwal Hardware & Building Materials"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                    {errors.shopName && <p className="text-xs text-red-500 mt-1">{errors.shopName}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mobile Number (WhatsApp) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="9876543210"
                        className="w-full pl-11 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono"
                      />
                    </div>
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

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      GSTIN / Trade License (Optional)
                    </label>
                    <input
                      type="text"
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                      placeholder="09AAAAA0000A1Z5"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl font-mono uppercase focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Small micro-sellers can register without GST under composition / unregistered limit.
                    </p>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (validateStep1()) setStep(2);
                    }}
                    className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <span>Next: Address Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Location and Address */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-bold text-slate-900">
                    Step 2: Shop Location in Saharanpur
                  </h3>
                  <p className="text-xs text-slate-500">
                    Accurate physical address helps customers locate you and calculate delivery distance.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Shop / Godown Full Address *
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
                        placeholder="e.g. Near Ghanta Ghar, Opposite State Bank"
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
                    className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (validateStep2()) setStep(3);
                    }}
                    className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
                  >
                    <span>Next: Permitted Categories</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Permitted Categories */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-bold text-slate-900">
                    Step 3: Permitted Categories Selection
                  </h3>
                  <p className="text-xs text-slate-500">
                    Select which types of legal, verified products you plan to sell on MattoKart.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {categories.map((cat) => {
                    const isChecked = selectedCategories.includes(cat.id);
                    return (
                      <div
                        key={cat.id}
                        onClick={() => handleCategoryToggle(cat.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isChecked
                            ? 'border-orange-500 bg-orange-50/70 text-orange-950 font-semibold'
                            : 'border-slate-200 hover:border-orange-200 text-slate-700'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="text-xs font-bold leading-tight truncate">{cat.name}</div>
                          <div className="text-[11px] text-slate-500 truncate">{cat.hindiName}</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="accent-orange-600 rounded"
                        />
                      </div>
                    );
                  })}
                </div>
                {errors.categories && <p className="text-xs text-red-500">{errors.categories}</p>}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Shop Profile Summary / Description *
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell buyers about your manufacturing capacity, products, quality guarantees, or years in Saharanpur business..."
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl resize-none"
                  />
                  {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (validateStep3()) setStep(4);
                    }}
                    className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
                  >
                    <span>Next: Fee & Agreement</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Proposed Fee Disclosure & Seller Agreement */}
            {step === 4 && (
              <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-bold text-slate-900">
                    Step 4: Seller Registration Fee & Agreement
                  </h3>
                  <p className="text-xs text-slate-500">
                    Please review the planned registration fee structure and agree to permitted goods compliance.
                  </p>
                </div>

                {/* Proposed Fee Disclosure Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-orange-700 uppercase tracking-wider">
                        Annual Seller Membership
                      </span>
                      <h4 className="text-2xl font-black text-slate-900 font-brand">
                        ₹199 <span className="text-xs font-semibold text-slate-500">/ Year</span>
                      </h4>
                    </div>
                    <span className="px-3 py-1 bg-amber-200/70 text-amber-900 font-bold text-xs rounded-full border border-amber-300">
                      Planned Demo Fee
                    </span>
                  </div>

                  <div className="text-xs text-slate-700 space-y-1.5 border-t border-orange-200/60 pt-3">
                    <p className="font-semibold text-orange-950">
                      Payment Verification Notice:
                    </p>
                    <p className="text-slate-600 leading-relaxed">
                      The proposed seller registration fee is <strong>₹199 per year</strong>. In this demo MVP, your registration will be submitted as <em>"Pending Verification"</em>. No payment will be deducted until an official RBI-compliant payment gateway is linked.
                    </p>
                  </div>
                </div>

                {/* Seller Guidelines & Agreement */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs text-slate-600">
                  <h5 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                    MattoKart Seller Obligations
                  </h5>
                  <ul className="space-y-1.5 list-disc pl-4">
                    <li>I will only list permitted, lawful products. Prohibited, illicit, or counterfeit goods are strictly forbidden.</li>
                    <li>I will maintain transparent pricing in Indian Rupees (₹) and honor quotes given to local buyers.</li>
                    <li>I will deliver genuine products matching the specifications listed on my shop page.</li>
                    <li>I acknowledge that MattoKart administration may suspend accounts found violating safety or quality norms.</li>
                  </ul>
                </div>

                {/* Checkbox agreement */}
                <div className="space-y-1">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-1 accent-orange-600 rounded"
                    />
                    <span className="text-xs text-slate-700 leading-snug">
                      I have read and agree to the <strong>MattoKart Seller Terms & Conditions</strong> and acknowledge that my shop application and ₹199/yr membership are subject to admin review.
                    </span>
                  </label>
                  {errors.terms && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.terms}</p>}
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-600/30 flex items-center gap-2"
                  >
                    <Store className="w-4 h-4" />
                    <span>Submit Seller Registration</span>
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
