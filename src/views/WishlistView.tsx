import React from 'react';
import { Heart, ShoppingCart, Trash2, ArrowRight, Store, ArrowLeft } from 'lucide-react';
import { Product } from '../types';

interface WishlistViewProps {
  wishlistIds: string[];
  products: Product[];
  onRemoveFromWishlist: (productId: string) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onViewProductDetails: (product: Product) => void;
  onGoToCatalog: () => void;
}

export const WishlistView: React.FC<WishlistViewProps> = ({
  wishlistIds,
  products,
  onRemoveFromWishlist,
  onAddToCart,
  onViewProductDetails,
  onGoToCatalog,
}) => {
  const wishlistedProducts = wishlistIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => p !== undefined && p.status === 'approved');

  if (wishlistedProducts.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 shadow-sm space-y-5">
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto shadow-inner">
            <Heart className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 font-brand">
              Your Wishlist is Empty
            </h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Save items you want to buy later by clicking the heart icon on any product.
            </p>
          </div>

          <button
            onClick={onGoToCatalog}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#f97316] hover:bg-orange-600 text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <span>Explore Products</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-3 sm:px-4 py-6 space-y-5">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-brand flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-500 fill-red-500" />
            <span>Your Wishlist ({wishlistedProducts.length})</span>
          </h1>
          <p className="text-xs text-slate-500">Products saved for later purchase</p>
        </div>

        <button
          onClick={onGoToCatalog}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-orange-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Continue Shopping</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
        {wishlistedProducts.map((product) => {
          const formattedPrice = new Intl.NumberFormat('en-IN').format(product.price);
          const fallbackImg =
            'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80';

          return (
            <div
              key={product.id}
              className="bg-white rounded-lg border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden p-2.5 space-y-2"
            >
              <div
                className="h-28 sm:h-32 rounded bg-white border border-slate-100 overflow-hidden cursor-pointer p-2 flex items-center justify-center relative"
                onClick={() => onViewProductDetails(product)}
              >
                <img
                  src={(product.images && product.images[0]) || fallbackImg}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="max-h-full max-w-full object-contain hover:scale-105 transition-transform"
                />
              </div>

              <div className="space-y-1">
                <div className="text-[10px] text-slate-400 uppercase font-bold truncate">
                  {product.subcategory}
                </div>
                <h3
                  onClick={() => onViewProductDetails(product)}
                  className="font-bold text-xs text-slate-900 hover:text-orange-600 cursor-pointer line-clamp-2"
                >
                  {product.name}
                </h3>
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <Store className="w-3 h-3 text-orange-600" />
                  <span className="truncate">{product.sellerShopName}</span>
                </div>
                <div className="text-base font-extrabold text-slate-900 pt-1">
                  ₹{formattedPrice} <span className="text-xs font-normal text-slate-500">/ {product.unit}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    onAddToCart(product, 1);
                    onRemoveFromWishlist(product.id);
                  }}
                  disabled={!product.inStock}
                  className="w-full py-2 bg-[#f97316] hover:bg-orange-600 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <ShoppingCart className="w-3.5 h-3.5 text-white" />
                  <span>Move to Cart</span>
                </button>

                <button
                  type="button"
                  onClick={() => onRemoveFromWishlist(product.id)}
                  className="w-full py-1 text-slate-500 hover:text-red-600 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
