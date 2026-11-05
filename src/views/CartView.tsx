import React from 'react';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Store,
  ShieldCheck,
  Truck,
  ArrowLeft,
  Lock,
} from 'lucide-react';
import { CartItem, Product } from '../types';

interface CartViewProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onProceedToCheckout: () => void;
  onGoToCatalog: () => void;
  onViewProductDetails: (product: Product) => void;
}

export const CartView: React.FC<CartViewProps> = ({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceedToCheckout,
  onGoToCatalog,
  onViewProductDetails,
}) => {
  // Group items by seller for clear multi-vendor transparency
  const itemsBySeller = cart.reduce<Record<string, { sellerName: string; sellerShopName: string; items: CartItem[] }>>(
    (acc, item) => {
      const sellerId = item.product.sellerId || 'seller-1';
      if (!acc[sellerId]) {
        acc[sellerId] = {
          sellerName: item.product.sellerName,
          sellerShopName: item.product.sellerShopName,
          items: [],
        };
      }
      acc[sellerId].items.push(item);
      return acc;
    },
    {}
  );

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const formattedSubtotal = new Intl.NumberFormat('en-IN').format(subtotal);

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
            <ShoppingBag className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900 font-brand">
              Aapka Jhola Khaali Hai (Your Cart is Empty)
            </h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Explore authentic Saharanpur Sheesham woodcrafts, building materials, electronics, and local dukaan goods.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onGoToCatalog}
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm rounded-xl shadow-md shadow-orange-600/20 transition-all cursor-pointer"
            >
              <span>Explore MattoKart Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onGoToCatalog}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-orange-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Continue Shopping</span>
        </button>

        <button
          onClick={onClearCart}
          className="text-xs text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Cart Items Grouped by Seller (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex items-center justify-between">
            <h1 className="text-xl font-extrabold text-slate-900 font-brand">
              Shopping Cart ({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'})
            </h1>
            <span className="text-xs font-semibold text-slate-500">
              Price per unit
            </span>
          </div>

          {/* Render seller groups */}
          {Object.entries(itemsBySeller).map(([sellerId, group]) => (
            <div
              key={sellerId}
              className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs"
            >
              {/* Seller Header */}
              <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-orange-600" />
                  <span className="text-xs font-bold text-slate-800">
                    Sold By: {group.sellerShopName}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    ({group.sellerName})
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Direct Saharanpur Dukaan
                </span>
              </div>

              {/* Items for this seller */}
              <div className="divide-y divide-slate-100 p-2 sm:p-5">
                {group.items.map((item) => {
                  const product = item.product;
                  const itemTotal = product.price * item.quantity;
                  const formattedItemPrice = new Intl.NumberFormat('en-IN').format(product.price);
                  const formattedItemTotal = new Intl.NumberFormat('en-IN').format(itemTotal);
                  const productImg =
                    (product.images && product.images[0]) ||
                    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80';

                  return (
                    <div
                      key={item.productId}
                      className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      {/* Product Thumbnail & Details */}
                      <div className="flex items-start gap-4 flex-1">
                        <div
                          onClick={() => onViewProductDetails(product)}
                          className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 cursor-pointer"
                        >
                          <img
                            src={productImg}
                            alt={product.name}
                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                          />
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                            {product.subcategory}
                          </span>
                          <h3
                            onClick={() => onViewProductDetails(product)}
                            className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 hover:text-orange-600 transition-colors cursor-pointer"
                          >
                            {product.name}
                          </h3>
                          <div className="text-xs text-slate-500 flex items-center gap-2">
                            <span>₹{formattedItemPrice} / {product.unit}</span>
                            <span>•</span>
                            <span className={product.inStock ? 'text-emerald-700 font-medium' : 'text-red-600'}>
                              {product.inStock ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Quantity Stepper & Price Column */}
                      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        {/* Stepper */}
                        <div className="flex items-center border border-slate-300 rounded-xl bg-white overflow-hidden shadow-2xs">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(product.id, Math.max(1, item.quantity - 1))}
                            disabled={item.quantity <= (product.minOrderQuantity || 1)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-3 py-1 text-xs font-bold text-slate-900 min-w-[28px] text-center font-mono">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(product.id, Math.min(product.stockCount || 999, item.quantity + 1))}
                            disabled={item.quantity >= (product.stockCount || 999)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
                            title="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Total Price */}
                        <div className="text-right min-w-[90px]">
                          <div className="text-base font-extrabold text-slate-900">
                            ₹{formattedItemTotal}
                          </div>
                          {item.quantity > 1 && (
                            <div className="text-[10px] text-slate-400">
                              (₹{formattedItemPrice} × {item.quantity})
                            </div>
                          )}
                        </div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => onRemoveItem(product.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                          title="Remove item from cart"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Order Summary & Checkout Card (4 Cols) */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-md space-y-5">
            <h2 className="text-lg font-bold text-slate-900 font-brand pb-3 border-b border-slate-100">
              Order Summary
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal ({totalItemsCount} units):</span>
                <span className="font-semibold text-slate-900">₹{formattedSubtotal}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span className="flex items-center gap-1">
                  <span>Local Saharanpur Delivery:</span>
                </span>
                <span className="font-semibold text-emerald-700">FREE</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Payment Mode:</span>
                <span className="font-semibold text-slate-900">Cash on Delivery (COD)</span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-base font-bold text-slate-900">Grand Total:</span>
                <span className="text-2xl font-extrabold text-slate-900">
                  ₹{formattedSubtotal}
                </span>
              </div>
            </div>

            {/* Proceed to Checkout CTA */}
            <button
              type="button"
              onClick={onProceedToCheckout}
              className="w-full py-3.5 px-4 bg-amber-400 hover:bg-amber-500 active:scale-[0.98] text-slate-950 font-bold text-sm rounded-xl shadow-md shadow-amber-400/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4 text-slate-950" />
              <span>Proceed to Buy ({totalItemsCount} items)</span>
            </button>

            {/* Trust and Assurance Points */}
            <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-500">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Cash on Delivery (COD)</strong> active across Saharanpur district. Pay when goods arrive.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Truck className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                <span>
                  Fast delivery from local shops within 24–48 hours.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
