import React from 'react';
import {
  MapPin,
  Store,
  MessageCircle,
  Eye,
  CheckCircle2,
  Sparkles,
  PhoneCall,
} from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onViewDetails: (product: Product) => void;
  onContactSeller: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onViewDetails,
  onContactSeller,
}) => {
  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  // Format price in Indian Rupee format safely
  const formattedPrice = Number.isFinite(product?.price)
    ? new Intl.NumberFormat('en-IN').format(product.price)
    : '0';
  const formattedOriginalPrice =
    product.originalPrice && Number.isFinite(product.originalPrice)
      ? new Intl.NumberFormat('en-IN').format(product.originalPrice)
      : null;

  const fallbackImg =
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80';
  const productImg = (product.images && product.images[0]) || fallbackImg;

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/90 hover:border-orange-300 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden relative">
      {/* Badges Overlay */}
      <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 items-start">
        {product.isWoodcraftSpecial && (
          <span className="bg-amber-600/95 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
            <Sparkles className="w-2.5 h-2.5" /> GI Woodcraft
          </span>
        )}
        {discountPercent > 0 && (
          <span className="bg-emerald-600/95 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
            {discountPercent}% OFF
          </span>
        )}
      </div>

      {/* Stock status indicator badge top right */}
      <div className="absolute top-2.5 right-2.5 z-10">
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-xs shadow-xs ${
            product.inStock
              ? 'bg-white/95 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {product.inStock ? 'In Stock' : 'Out of Stock'}
        </span>
      </div>

      {/* Product Image */}
      <div
        className="relative aspect-4/3 overflow-hidden bg-slate-100 cursor-pointer"
        onClick={() => onViewDetails(product)}
      >
        <img
          src={productImg}
          alt={product.name || 'Product'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src !== fallbackImg) {
              target.src = fallbackImg;
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Subcategory */}
          <div className="text-[11px] font-medium text-slate-500 mb-1 flex items-center justify-between">
            <span className="truncate">{product.subcategory}</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
              per {product.unit}
            </span>
          </div>

          {/* Product Name */}
          <h3
            onClick={() => onViewDetails(product)}
            className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 hover:text-orange-600 transition-colors cursor-pointer mb-2"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Price block */}
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-lg font-extrabold text-slate-900">
              ₹{formattedPrice}
            </span>
            {formattedOriginalPrice && (
              <span className="text-xs text-slate-400 line-through">
                ₹{formattedOriginalPrice}
              </span>
            )}
            <span className="text-[11px] text-slate-500 font-medium">
              / {product.unit}
            </span>
          </div>
        </div>

        {/* Shop & Location info */}
        <div className="pt-2.5 border-t border-slate-100 space-y-1.5 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-700">
            <Store className="w-3.5 h-3.5 text-orange-600 shrink-0" />
            <span className="font-semibold truncate text-slate-800">{product.sellerShopName}</span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-1 truncate max-w-[170px]">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{product.sellerLocality}</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-800 font-semibold shrink-0">
              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
              <span>Verified</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => onViewDetails(product)}
            className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>Details</span>
          </button>

          <button
            onClick={() => onContactSeller(product)}
            className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 transition-colors shadow-xs cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Contact</span>
          </button>
        </div>
      </div>
    </div>
  );
};
