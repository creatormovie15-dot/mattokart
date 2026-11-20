import React from 'react';
import {
  Store,
  ShoppingCart,
  Heart,
  Star,
  Zap,
} from 'lucide-react';
import { Product } from '../types';
import { OptimizedImage } from '../utils/imageOptimizer';

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

  const productImg = product.images && product.images[0] ? product.images[0] : '';
  const ratingValue = product.sellerRating || 4.8;
  const reviewCount = product.sellerRating ? Math.round(product.sellerRating * 6) : 28;

  return (
    <article className="group bg-white rounded-lg border border-slate-200 hover:border-orange-400 hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden relative">
      {/* Discount / Craft Tag Top-Left */}
      {(discountPercent > 0 || product.isWoodcraftSpecial) && (
        <div className="absolute top-1.5 left-1.5 z-10 flex flex-col gap-1 items-start pointer-events-none">
          {discountPercent > 0 && (
            <span className="bg-red-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs tabular-nums">
              -{discountPercent}%
            </span>
          )}
          {product.isWoodcraftSpecial && discountPercent === 0 && (
            <span className="bg-[#091e3a] text-amber-300 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
              GI Craft
            </span>
          )}
        </div>
      )}

      {/* Wishlist Heart Top-Right */}
      {onToggleWishlist && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product.id);
          }}
          className={`absolute top-1.5 right-1.5 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-colors shadow-xs cursor-pointer ${
            isWishlisted
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-white/95 text-slate-600 hover:text-red-700 border border-slate-200'
          }`}
          aria-label={isWishlisted ? `Remove ${product.name} from Wishlist` : `Add ${product.name} to Wishlist`}
          aria-pressed={isWishlisted}
          title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-red-600 text-red-600' : ''}`} aria-hidden="true" />
        </button>
      )}

      {/* Small, Neatly Contained, Consistently Sized Product Image */}
      <button
        type="button"
        onClick={() => onViewDetails(product)}
        aria-label={`View details for ${product.name}`}
        className="relative h-28 sm:h-32 w-full bg-white border-b border-slate-100 cursor-pointer p-2.5 flex items-center justify-center overflow-hidden"
      >
        <OptimizedImage
          src={productImg}
          alt={product.name || 'MattoKart Product'}
          widths={[180, 320, 480]}
          sizes="(max-width: 640px) 42vw, (max-width: 1024px) 22vw, 220px"
          width={220}
          height={128}
          className="max-h-full max-w-full w-auto h-auto object-contain group-hover:scale-105 transition-transform duration-200"
          fallbackLabel={product.subcategory}
        />
      </button>

      {/* Compact Card Content Matching Reference Proportions */}
      <div className="p-2.5 flex-1 flex flex-col justify-between gap-1.5">
        <div className="space-y-1">
          {/* Title */}
          <h3 className="font-bold text-slate-900 text-xs leading-snug line-clamp-2 min-h-[2rem]">
            <button
              type="button"
              onClick={() => onViewDetails(product)}
              className="text-left hover:text-[#c2410c] transition-colors cursor-pointer line-clamp-2 w-full"
              title={product.name}
            >
              {product.name}
            </button>
          </h3>

          {/* Star Rating Row */}
          <div className="flex items-center gap-1 text-[11px] text-slate-600">
            <Star className="w-3 h-3 fill-amber-400 text-amber-500 shrink-0" aria-hidden="true" />
            <span className="font-bold text-slate-900 tabular-nums">{ratingValue}</span>
            <span className="text-slate-600 tabular-nums">({reviewCount})</span>
            <span className="text-slate-400" aria-hidden="true">·</span>
            <span
              className={`text-[10px] font-semibold truncate ${
                product.inStock ? 'text-emerald-800' : 'text-red-700'
              }`}
            >
              {product.inStock ? 'In Stock' : 'Out'}
            </span>
          </div>

          {/* Price Row */}
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-sm sm:text-[15px] font-extrabold text-slate-900 tabular-nums">
              ₹{formattedPrice}
            </span>
            {formattedOriginalPrice && (
              <span className="text-[11px] text-slate-600 line-through tabular-nums">
                ₹{formattedOriginalPrice}
              </span>
            )}
            <span className="text-[10px] text-slate-600">/{product.unit}</span>
          </div>

          {/* Seller Name */}
          <div className="flex items-center gap-1 text-[10px] text-slate-600 truncate">
            <Store className="w-2.5 h-2.5 text-[#c2410c] shrink-0" aria-hidden="true" />
            <span className="truncate">{product.sellerShopName}</span>
          </div>
        </div>

        {/* Clean Action Area */}
        <div className="space-y-1 pt-1">
          <button
            type="button"
            onClick={() => onAddToCart && onAddToCart(product, 1)}
            disabled={!product.inStock}
            className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-[11px] font-bold transition-colors whitespace-nowrap ${
              product.inStock
                ? 'bg-[#c2410c] hover:bg-[#9a3412] text-white cursor-pointer shadow-2xs'
                : 'bg-slate-200 text-slate-600 cursor-not-allowed'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Add to Cart</span>
          </button>

          <div className="flex items-center justify-between text-[10px] px-0.5 pt-0.5">
            <button
              type="button"
              onClick={() =>
                onBuyNow ? onBuyNow(product, 1) : onAddToCart && onAddToCart(product, 1)
              }
              disabled={!product.inStock}
              className={`font-bold flex items-center gap-0.5 cursor-pointer py-0.5 ${
                product.inStock
                  ? 'text-[#091e3a] hover:text-[#c2410c]'
                  : 'text-slate-500 cursor-not-allowed'
              }`}
            >
              <Zap className="w-2.5 h-2.5 text-[#c2410c]" aria-hidden="true" />
              <span>Buy Now</span>
            </button>
            <button
              type="button"
              onClick={() => onViewDetails(product)}
              className="font-semibold text-slate-700 hover:text-[#091e3a] cursor-pointer py-0.5"
            >
              Details &rsaquo;
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
