import React, { useState } from 'react';
import {
  X,
  MapPin,
  Store,
  Phone,
  MessageCircle,
  Truck,
  ShieldCheck,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Product } from '../types';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onOpenEnquiry: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onOpenEnquiry,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (!product) return null;

  const fallbackImg =
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80';
  const images = Array.isArray(product.images) && product.images.length > 0 ? product.images : [fallbackImg];
  const safeImg = images[activeImageIndex] || images[0] || fallbackImg;
  const deliveryAreas = Array.isArray(product.deliveryAreas) ? product.deliveryAreas : ['Saharanpur Local Area'];

  const formattedPrice = Number.isFinite(product.price)
    ? new Intl.NumberFormat('en-IN').format(product.price)
    : '0';
  const formattedOriginalPrice =
    product.originalPrice && Number.isFinite(product.originalPrice)
      ? new Intl.NumberFormat('en-IN').format(product.originalPrice)
      : null;
  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  // Generate WhatsApp chat link with prefilled enquiry text
  const cleanPhone = (product.sellerPhone || '').replace(/\D/g, '');
  const encodedMsg = encodeURIComponent(
    `Namaste! I am interested in "${product.name || 'Product'}" (Price: ₹${formattedPrice} / ${product.unit || 'unit'}) listed on MattoKart Saharanpur. Is it available for delivery?`
  );
  const whatsappUrl = `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${encodedMsg}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Sticky Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2 text-xs text-slate-500 truncate">
            <span className="font-semibold text-orange-600">MattoKart</span>
            <span>/</span>
            <span className="capitalize">{product.categoryId.replace('-', ' & ')}</span>
            <span>/</span>
            <span className="truncate text-slate-700 font-medium">{product.subcategory}</span>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Images */}
            <div className="space-y-4">
              <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner">
                <img
                  src={safeImg}
                  alt={product.name || 'Product'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== fallbackImg) {
                      target.src = fallbackImg;
                    }
                  }}
                />

                {product.isWoodcraftSpecial && (
                  <div className="absolute top-3 left-3 bg-amber-600 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                    <Sparkles className="w-3.5 h-3.5" /> Saharanpur GI Craft
                  </div>
                )}
              </div>

              {/* Thumbnails if multiple */}
              {images.length > 1 && (
                <div className="flex gap-2">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        activeImageIndex === idx
                          ? 'border-orange-500 ring-2 ring-orange-500/30'
                          : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.src !== fallbackImg) {
                            target.src = fallbackImg;
                          }
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Verified Trust Strip */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>MattoKart Saharanpur Local Assurance</span>
                </div>
                <p className="text-amber-800 leading-relaxed">
                  Direct connection with verified physical shops in Saharanpur. No hidden commissions. Inspect or verify stock in person before bulky orders.
                </p>
              </div>
            </div>

            {/* Right: Details & Buying Info */}
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {product.subcategory}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      product.inStock
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {product.inStock
                      ? `In Stock (${product.stockCount} ${product.unit}s available)`
                      : 'Out of Stock'}
                  </span>
                </div>

                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                  {product.name}
                </h1>
              </div>

              {/* Price Row */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-extrabold text-slate-900">
                    ₹{formattedPrice}
                  </span>
                  {formattedOriginalPrice && (
                    <span className="text-base text-slate-400 line-through">
                      ₹{formattedOriginalPrice}
                    </span>
                  )}
                  {discountPercent > 0 && (
                    <span className="bg-emerald-600 text-white text-xs font-bold px-2 py-0.5 rounded-md">
                      {discountPercent}% OFF
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                  <span>Unit: <strong>Per {product.unit}</strong></span>
                  {product.minOrderQuantity && product.minOrderQuantity > 1 && (
                    <span>• Min Order: <strong>{product.minOrderQuantity} {product.unit}s</strong></span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                  Product Description
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Specifications Table */}
              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Key Specifications
                  </h3>
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    {Object.entries(product.specifications).map(([key, value], idx) => (
                      <div
                        key={key}
                        className={`grid grid-cols-2 p-2.5 ${
                          idx % 2 === 0 ? 'bg-slate-50/70' : 'bg-white'
                        }`}
                      >
                        <span className="text-slate-500 font-medium">{key}</span>
                        <span className="text-slate-900 font-semibold">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Seller / Shop Info Box */}
              <div className="p-4 rounded-2xl border border-orange-200 bg-orange-50/40 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">
                      Sold By Local Dukaan
                    </span>
                    <h4 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                      <Store className="w-4 h-4 text-orange-600" />
                      {product.sellerShopName}
                    </h4>
                    <p className="text-xs text-slate-600">
                      Proprietor: <span className="font-medium text-slate-800">{product.sellerName}</span>
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-white rounded-lg border border-orange-200 text-xs font-bold text-orange-700 shadow-2xs">
                    ★ {product.sellerRating} / 5.0
                  </span>
                </div>

                <div className="text-xs text-slate-600 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                  <span>{product.sellerLocality}, Saharanpur</span>
                </div>

                {/* Delivery Areas */}
                <div className="pt-2 border-t border-orange-200/60 text-xs text-slate-600 space-y-1">
                  <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-slate-500" />
                    <span>Delivery Coverage:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {deliveryAreas.map((area, idx) => (
                      <span
                        key={idx}
                        className="bg-white/80 border border-orange-200/70 text-slate-700 px-2 py-0.5 rounded-md text-[11px]"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Primary Contact Actions */}
              <div className="pt-2 space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* WhatsApp Click to Chat */}
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md shadow-emerald-600/20"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Chat on WhatsApp</span>
                  </a>

                  {/* Direct Enquiry Modal Trigger */}
                  <button
                    onClick={() => {
                      onOpenEnquiry(product);
                      onClose();
                    }}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-orange-600 hover:bg-orange-700 text-white transition-all shadow-md shadow-orange-600/20 cursor-pointer"
                  >
                    <span>Send Direct Enquiry</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Direct Call Link */}
                <a
                  href={`tel:${product.sellerPhone.replace(/\s+/g, '')}`}
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-orange-600" />
                  <span>Call Seller Directly: {product.sellerPhone}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
