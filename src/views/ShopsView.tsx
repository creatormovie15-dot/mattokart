import React, { useState } from 'react';
import {
  Store,
  MapPin,
  Phone,
  MessageCircle,
  Truck,
  CheckCircle2,
  Search,
  Package,
} from 'lucide-react';
import { Seller, Product } from '../types';

interface ShopsViewProps {
  sellers: Seller[];
  products: Product[];
  onSelectShopProducts: (shopName: string) => void;
  onGoToSellerRegister: () => void;
}

export const ShopsView: React.FC<ShopsViewProps> = ({
  sellers,
  products,
  onSelectShopProducts,
  onGoToSellerRegister,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocality, setSelectedLocality] = useState('all');

  const filteredSellers = sellers.filter((s) => {
    if (s.status !== 'active') return false;
    if (
      selectedLocality !== 'all' &&
      !(s.locality || '').toLowerCase().includes(selectedLocality.toLowerCase())
    ) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = (s.shopName || '').toLowerCase().includes(q);
      const matchOwner = (s.ownerName || '').toLowerCase().includes(q);
      const matchLoc = (s.locality || '').toLowerCase().includes(q);
      const matchDesc = (s.description || '').toLowerCase().includes(q);
      if (!matchName && !matchOwner && !matchLoc && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Header banner */}
      <div className="bg-gradient-to-r from-orange-950 via-slate-900 to-amber-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-orange-500/20">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-400/30 text-orange-200 text-xs font-semibold">
            <Store className="w-3.5 h-3.5" />
            <span>Saharanpur Local Dukaan Network</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold font-brand tracking-tight">
            Kharedari Seedhi Saharanpur ki Dukaano Se
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Discover verified retailers, lumber yards, hardware distributors, and artisan workshops across Saharanpur. Contact proprietors directly via phone or WhatsApp.
          </p>
          <div className="pt-2">
            <button
              onClick={onGoToSellerRegister}
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
            >
              Register Your Shop — FREE First Year (₹0)
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search shop name, owner, or products..."
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>

        <div className="text-xs text-slate-500">
          Showing <strong className="text-slate-900">{filteredSellers.length}</strong> verified shops
        </div>
      </div>

      {/* Sellers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSellers.map((seller) => {
          const shopProductCount = products.filter(
            (p) => p.sellerId === seller.id && p.status === 'approved'
          ).length;

          const cleanPhone = seller.phone.replace(/\D/g, '');
          const whatsappUrl = `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${encodeURIComponent(
            `Namaste ${seller.ownerName}! I found your shop "${seller.shopName}" on MattoKart Saharanpur. I would like to inquire about your products.`
          )}`;

          return (
            <div
              key={seller.id}
              className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden hover:shadow-xl hover:border-orange-300 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Banner image */}
                <div className="h-28 bg-slate-100 relative overflow-hidden">
                  <img
                    src={seller.bannerImage || 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=600&q=80'}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                  <div className="absolute top-2.5 right-2.5 bg-white/95 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified Seller
                  </div>
                </div>

                {/* Profile row */}
                <div className="px-5 pt-0 pb-4 relative">
                  <div className="-mt-7 mb-3 flex items-end justify-between">
                    <img
                      src={seller.shopLogo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'}
                      alt={seller.shopName}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md bg-white"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80';
                      }}
                    />
                    <span className="text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-lg">
                      ★ {seller.rating} ({seller.reviewsCount})
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 text-base leading-snug">
                      {seller.shopName}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Proprietor: <strong className="text-slate-700">{seller.ownerName}</strong>
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-3 mt-3 leading-relaxed">
                    {seller.description}
                  </p>

                  {/* Address & Delivery */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" />
                      <span className="leading-tight">{seller.address}, {seller.locality}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Delivery Radius: {seller.deliveryRadiusKm} km</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-2xs transition-colors"
                    title="Chat on WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                  <a
                    href={`tel:${cleanPhone}`}
                    className="p-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition-colors"
                    title="Call Shop"
                  >
                    <Phone className="w-4 h-4 text-orange-600" />
                  </a>
                </div>

                <button
                  onClick={() => onSelectShopProducts(seller.shopName)}
                  className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>View Products ({shopProductCount})</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
