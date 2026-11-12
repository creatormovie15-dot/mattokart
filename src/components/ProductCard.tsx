import React from 'react';
import {
  MapPin,
  Store,
  MessageCircle,
  Eye,
  CheckCircle2,
  Sparkles,
  ShoppingCart,
  Zap,
  Heart,
  Star,
} from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onViewDetails: (product: Product) => void;
  onContactSeller: (product: Product) => void;
  onAddToCart?: (product: Product, quantity?: number) => void;
  onBuyNow?: (product: Product, quantity?: number) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onViewDetails,
  onContactSeller,
  onAddToCart,
  onBuyNow,
  isWishlisted = false,
  onToggleWishlist,
}) => {
  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

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

  // Star ratings representation (default to 4.8 if not set)
  const ratingValue = product.sellerRating || 4.8;
  const reviewCount = (product.sellerRating ? Math.round(product.sellerRating * 6) : 28);

  return (
    <div className="group bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden relative">
      {/* Top Badges & Wishlist */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 items-start">
        {product.isWoodcraftSpecial && (
          <span className="bg-[#131921] text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-amber-400" /> Saharanpur Craft
          </span>
        )}
        {discountPercent > 0 && (
          <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
            {discountPercent}% OFF
          </span>
        )}
      </div>

      {/* Wishlist Button Top-Right */}
      <div className="absolute top-2 right-2 z-10">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleWishlist) onToggleWishlist(product.id);
          }}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm cursor-pointer ${
            isWishlisted
              ? 'bg-red-50 text-red-600 ring-1 ring-red-300'
              : 'bg-white/90 text-slate-400 hover:text-red-500 hover:bg-white'
          }`}
          title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-600 text-red-600' : ''}`} />
        </button>
      </div>

      {/* Product Image */}
      <div
        className="relative aspect-square overflow-hidden bg-slate-50 cursor-pointer p-2 flex items-center justify-center"
        onClick={() => onViewDetails(product)}
      >
        <img
          src={productImg}
          alt={product.name || 'Product'}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src !== fallbackImg) {
              target.src = fallbackImg;
            }
          }}
        />
      </div>

      {/* Product Information */}
      <div className="p-3.5 flex-1 flex flex-col justify-between border-t border-slate-100">
        <div>
          {/* Subcategory & Seller Locality */}
          <div className="text-[11px] text-slate-500 mb-1 flex items-center justify-between">
            <span className="font-medium text-slate-600 truncate">{product.subcategory}</span>
            <span className="text-[10px] font-mono text-slate-400">per {product.unit}</span>
          </div>

          {/* Product Title */}
          <h3
            onClick={() => onViewDetails(product)}
            className="font-semibold text-slate-900 text-xs sm:text-sm leading-snug line-clamp-2 hover:text-orange-600 transition-colors cursor-pointer mb-1.5"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Customer Star Rating */}
          <div className="flex items-center gap-1 mb-2 text-xs">
            <div className="flex items-center text-amber-500">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            </div>
            <span className="font-bold text-slate-800 text-[11px]">{ratingValue}</span>
            <span className="text-slate-400 text-[11px]">({reviewCount})</span>
            <span className="text-slate-300 mx-0.5">·</span>
            <span className="text-[10px] text-slate-500 truncate max-w-[85px]">{product.sellerLocality}</span>
          </div>

          {/* Price Block */}
          <div className="flex items-baseline gap-1.5 mb-2">
            <span className="text-sm font-medium text-slate-500">₹</span>
            <span className="text-lg font-extrabold text-slate-900 -ml-1">
              {formattedPrice}
            </span>
            {formattedOriginalPrice && (
              <span className="text-xs text-slate-400 line-through">
                ₹{formattedOriginalPrice}
              </span>
            )}
          </div>

          {/* Dukaan & Stock Status */}
          <div className="text-[11px] text-slate-600 mb-3 flex items-center justify-between">
            <span className="truncate flex items-center gap-1 text-slate-700">
              <Store className="w-3 h-3 text-orange-600 shrink-0" />
              <span className="truncate">{product.sellerShopName}</span>
            </span>
            <span
              className={`text-[10px] font-semibold shrink-0 ${
                product.inStock ? 'text-emerald-700' : 'text-red-600'
              }`}
            >
              {product.inStock ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>
        </div>

        {/* Amazon-Style Action Buttons */}
        <div className="space-y-1.5 pt-1">
          {/* Add to Cart (Amber Button) */}
          <button
            type="button"
            onClick={() => onAddToCart && onAddToCart(product, 1)}
            disabled={!product.inStock}
            className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all shadow-xs ${
              product.inStock
                ? 'bg-[#ffd814] hover:bg-[#f7ca00] text-slate-950 active:scale-[0.99] cursor-pointer'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5 text-slate-950" />
            <span>Add to Cart</span>
          </button>

          {/* Buy Now (Orange Button) */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => onBuyNow ? onBuyNow(product, 1) : onAddToCart && onAddToCart(product, 1)}
              disabled={!product.inStock}
              className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                product.inStock
                  ? 'bg-[#ffa41c] hover:bg-[#fa8900] text-slate-950 active:scale-[0.99] cursor-pointer'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Zap className="w-3 h-3 fill-slate-950 text-slate-950" />
              <span>Buy Now</span>
            </button>

            <button
              type="button"
              onClick={() => onViewDetails(product)}
              className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <Eye className="w-3 h-3 text-slate-500" />
              <span>Details</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
