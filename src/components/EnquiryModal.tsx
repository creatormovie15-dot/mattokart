import React, { useState } from 'react';
import { X, Send, Store, MapPin, CheckCircle2, MessageCircle, AlertCircle } from 'lucide-react';
import { Product, BuyerEnquiry, SaharanpurLocality } from '../types';
import { SAHARANPUR_LOCALITIES } from '../data/mockData';

interface EnquiryModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitEnquiry: (enquiry: BuyerEnquiry) => void;
  currentLocality: SaharanpurLocality;
}

export const EnquiryModal: React.FC<EnquiryModalProps> = ({
  product,
  isOpen,
  onClose,
  onSubmitEnquiry,
  currentLocality,
}) => {
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerLocality, setBuyerLocality] = useState(currentLocality?.name || 'Saharanpur');
  const [quantity, setQuantity] = useState<number>(product?.minOrderQuantity || 1);
  const [message, setMessage] = useState(
    product
      ? `Namaste! I would like to inquire about "${product.name}". Please share best pricing and delivery timeline to my locality in Saharanpur.`
      : ''
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [createdEnquiryId, setCreatedEnquiryId] = useState('');

  if (!isOpen || !product) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!buyerName.trim()) {
      newErrors.buyerName = 'Please enter your full name';
    }
    const cleanPhone = buyerPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      newErrors.buyerPhone = 'Please enter a valid 10-digit mobile number';
    }
    if (!buyerLocality.trim()) {
      newErrors.buyerLocality = 'Please select or specify your delivery locality';
    }
    if (!quantity || quantity < 1) {
      newErrors.quantity = 'Quantity must be at least 1';
    }
    if (!message.trim()) {
      newErrors.message = 'Please write a brief note for the seller';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const enquiryId = `MK-ENQ-${Math.floor(1000 + Math.random() * 9000)}`;
    const newEnquiry: BuyerEnquiry = {
      id: enquiryId,
      productId: product.id,
      productName: product.name,
      productPrice: product.price,
      productImage: product.images[0],
      sellerId: product.sellerId,
      sellerShopName: product.sellerShopName,
      sellerPhone: product.sellerPhone,
      buyerName: buyerName.trim(),
      buyerPhone: buyerPhone.trim(),
      buyerLocality: buyerLocality,
      quantityNeeded: quantity,
      unit: product.unit,
      message: message.trim(),
      status: 'pending',
      createdAt: new Date().toLocaleString('en-IN', {
        dateStyle: 'short',
        timeStyle: 'short',
      }),
    };

    setCreatedEnquiryId(enquiryId);
    setSubmittedSuccess(true);
    onSubmitEnquiry(newEnquiry);
  };

  const handleClose = () => {
    setSubmittedSuccess(false);
    setErrors({});
    onClose();
  };

  // WhatsApp quick redirect
  const cleanPhone = (product.sellerPhone || '').replace(/\D/g, '');
  const encodedMsg = encodeURIComponent(
    `Namaste! I am ${buyerName || 'a buyer'} from ${buyerLocality}. I have enquired on MattoKart for "${product.name || 'Product'}" (${quantity} ${product.unit || 'unit'}). Please connect with me.`
  );
  const whatsappUrl = `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${encodedMsg}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-orange-50 via-amber-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                Direct Seller Enquiry
              </h3>
              <p className="text-xs text-slate-500">
                Connect directly with {product.sellerShopName}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {submittedSuccess ? (
            <div className="py-8 px-4 text-center space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-bold text-slate-900">
                  Enquiry Sent Successfully!
                </h4>
                <p className="text-xs text-slate-500">
                  Reference ID:{' '}
                  <span className="font-mono font-bold text-slate-800">{createdEnquiryId}</span>
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
                <p className="text-slate-700">
                  Your enquiry has been forwarded to{' '}
                  <strong className="text-slate-900">{product.sellerShopName}</strong>. The shopkeeper will contact your mobile{' '}
                  <strong className="font-mono text-slate-900">{buyerPhone}</strong> shortly.
                </p>
                <p className="text-slate-500">
                  Product: {product.name} ({quantity} {product.unit})
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Also Message on WhatsApp</span>
                </a>
                <button
                  onClick={handleClose}
                  className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Product mini banner */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <img
                  src={product.images[0]}
                  alt=""
                  className="w-12 h-12 rounded-xl object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {product.name}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    <span className="font-bold text-orange-600">
                      ₹{new Intl.NumberFormat('en-IN').format(product.price)} / {product.unit}
                    </span>
                    <span>•</span>
                    <span className="truncate">{product.sellerShopName}</span>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                  {errors.buyerName && (
                    <p className="text-xs text-red-500 mt-1">{errors.buyerName}</p>
                  )}
                </div>

                {/* Mobile & Quantity row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        value={buyerPhone}
                        onChange={(e) => setBuyerPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="9876543210"
                        className="w-full pl-11 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono"
                      />
                    </div>
                    {errors.buyerPhone && (
                      <p className="text-xs text-red-500 mt-1">{errors.buyerPhone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Quantity Needed ({product.unit}s) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono"
                    />
                    {errors.quantity && (
                      <p className="text-xs text-red-500 mt-1">{errors.quantity}</p>
                    )}
                  </div>
                </div>

                {/* Delivery Locality in Saharanpur */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Delivery Locality in Saharanpur *
                  </label>
                  <select
                    value={buyerLocality}
                    onChange={(e) => setBuyerLocality(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  >
                    {SAHARANPUR_LOCALITIES.map((loc) => (
                      <option key={loc.name} value={loc.name}>
                        {loc.name} (PIN {loc.pinCode})
                      </option>
                    ))}
                    <option value="Other Saharanpur Village / Area">
                      Other Saharanpur Village / Rural Area
                    </option>
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Requirement Details / Message *
                  </label>
                  <textarea
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your requirement, size specifications, or delivery urgency..."
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
                  />
                  {errors.message && (
                    <p className="text-xs text-red-500 mt-1">{errors.message}</p>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-orange-600 hover:bg-orange-700 text-white transition-all shadow-md shadow-orange-600/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Submit Enquiry to Seller</span>
                  </button>
                  <p className="text-[11px] text-center text-slate-600 mt-2">
                    Direct local shop connection • Free inquiry without obligation
                  </p>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
