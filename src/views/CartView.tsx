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
  AlertCircle,
  MapPin,
  PackageCheck,
} from 'lucide-react';
import { CartItem, Product, SaharanpurLocality, AuthUser } from '../types';
import { calculateMultiVendorCheckoutQuote } from '../data/indiaData';

interface CartViewProps {
  cart: CartItem[];
  selectedLocality?: SaharanpurLocality;
  currentUser?: AuthUser | null;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onProceedToCheckout: () => void;
  onGoToCatalog: () => void;
  onViewProductDetails: (product: Product) => void;
  onOpenLocationModal?: () => void;
  onOpenAuthModal?: () => void;
}

export const CartView: React.FC<CartViewProps> = ({
  cart,
  selectedLocality,
  currentUser,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceedToCheckout,
  onGoToCatalog,
  onViewProductDetails,
  onOpenLocationModal,
  onOpenAuthModal,
}) => {
  const buyerPin = selectedLocality?.pinCode || '247001';
  const quote = calculateMultiVendorCheckoutQuote(cart, buyerPin);

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const formattedSubtotal = new Intl.NumberFormat('en-IN').format(quote.subtotal);
  const formattedShipping = new Intl.NumberFormat('en-IN').format(quote.totalShippingFee);
  const formattedEstimatedPayable = new Intl.NumberFormat('en-IN').format(quote.grandTotalPrepaid);
  const hasStockBlocking = quote.stockIssues.length > 0;

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
              Shop directly from verified sellers across India — construction materials, furniture, electronics, groceries, tools &amp; handcrafted goods.
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
      {/* Breadcrumb & Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <button
          onClick={onGoToCatalog}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-orange-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Continue Shopping</span>
        </button>

        <div className="flex items-center gap-4">
          {selectedLocality && (
            <button
              type="button"
              onClick={onOpenLocationModal}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:border-orange-400 cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-orange-600" />
              <span>
                Delivering to: <strong>{selectedLocality.city || selectedLocality.name}</strong> ({selectedLocality.pinCode})
              </span>
            </button>
          )}

          <button
            onClick={onClearCart}
            className="text-xs text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
          >
            Clear Cart
          </button>
        </div>
      </div>

      {/* Logged-in Cart Sync / Guest Banner */}
      {!currentUser && onOpenAuthModal && (
        <div className="mb-6 bg-[#091e3a] text-white rounded-xl p-3.5 px-5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-4 h-4 text-orange-400 shrink-0" />
            <span>
              Sign in with your mobile number to save this multi-seller cart to your MattoKart account across sessions.
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenAuthModal}
            className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg cursor-pointer shrink-0"
          >
            Login / Save Cart
          </button>
        </div>
      )}

      {/* Stock Warning Banner */}
      {hasStockBlocking && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-900 rounded-2xl p-4 flex items-start gap-3 text-xs">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-sm">Stock Action Required Before Checkout</div>
            <ul className="list-disc list-inside space-y-0.5">
              {quote.stockIssues.map((iss) => (
                <li key={iss.productId}>
                  <strong>{iss.productName}:</strong> {iss.issue}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Cart Items Grouped by Seller (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 font-brand">
                Shopping Cart ({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'})
              </h1>
              <p className="text-xs text-slate-500">
                Grouped across {quote.sellerQuotes.length} verified seller{quote.sellerQuotes.length === 1 ? '' : 's'} · Separate dispatch &amp; tracking per shop
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Price &amp; stock verified live
            </span>
          </div>

          {/* Render seller groups */}
          {quote.sellerQuotes.map((group) => (
            <div
              key={group.sellerId}
              className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs"
            >
              {/* Seller Header */}
              <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-orange-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-800">
                    Sold By: {group.sellerShopName}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    ({group.sellerCity}, {group.sellerState} – {group.sellerPinCode})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {group.containsHeavyGoods && (
                    <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                      Heavy Goods / Transport
                    </span>
                  )}
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                      group.serviceable
                        ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                        : 'text-red-700 bg-red-50 border-red-200'
                    }`}
                  >
                    {group.serviceable
                      ? group.selectedMethod?.fee === 0
                        ? `Shipping: FREE (${group.zone})`
                        : `Est. Shipping: ₹${group.selectedMethod?.fee || 0} (${group.zone})`
                      : 'Check Delivery PIN'}
                  </span>
                </div>
              </div>

              {/* Unserviceable warning for this seller at current PIN */}
              {!group.serviceable && group.unserviceableReason && (
                <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>{group.unserviceableReason}</span>
                </div>
              )}

              {/* Items for this seller */}
              <div className="divide-y divide-slate-100 p-4 sm:p-5">
                {group.items.map(({ product, quantity }) => {
                  const itemTotal = product.price * quantity;
                  const formattedItemPrice = new Intl.NumberFormat('en-IN').format(product.price);
                  const formattedItemTotal = new Intl.NumberFormat('en-IN').format(itemTotal);
                  const productImg =
                    (product.images && product.images[0]) ||
                    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80';
                  const minQty = product.minOrderQuantity || 1;
                  const maxStock = product.stockCount ?? 999;
                  const stockIssue = quote.stockIssues.find((si) => si.productId === product.id);

                  return (
                    <div
                      key={product.id}
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
                          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-slate-800">₹{formattedItemPrice} / {product.unit}</span>
                            <span>•</span>
                            <span
                              className={
                                !product.inStock || maxStock <= 0
                                  ? 'text-red-600 font-bold'
                                  : maxStock <= 5
                                  ? 'text-amber-700 font-semibold'
                                  : 'text-emerald-700 font-medium'
                              }
                            >
                              {!product.inStock || maxStock <= 0
                                ? 'Out of Stock'
                                : maxStock <= 5
                                ? `Only ${maxStock} left`
                                : `In Stock (${maxStock} available)`}
                            </span>
                            {minQty > 1 && (
                              <>
                                <span>•</span>
                                <span className="text-slate-600">Min Qty: {minQty}</span>
                              </>
                            )}
                          </div>
                          {stockIssue && (
                            <p className="text-[11px] text-red-600 font-semibold">
                              ⚠ {stockIssue.issue}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Quantity Stepper & Price Column */}
                      <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        {/* Stepper + Manual Input */}
                        <div className="flex items-center border border-slate-300 rounded-xl bg-white overflow-hidden shadow-2xs">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(product.id, Math.max(minQty, quantity - 1))}
                            disabled={quantity <= minQty || !product.inStock}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="number"
                            min={minQty}
                            max={maxStock}
                            value={quantity}
                            onChange={(e) => {
                              const parsed = parseInt(e.target.value, 10);
                              if (!Number.isNaN(parsed) && parsed >= 1) {
                                onUpdateQuantity(product.id, Math.min(maxStock, Math.max(minQty, parsed)));
                              }
                            }}
                            aria-label={`Quantity for ${product.name}`}
                            className="w-11 py-1 text-xs font-bold text-slate-900 text-center font-mono focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(product.id, Math.min(maxStock, quantity + 1))}
                            disabled={quantity >= maxStock || !product.inStock}
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
                          {quantity > 1 && (
                            <div className="text-[10px] text-slate-400">
                              (₹{formattedItemPrice} × {quantity})
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
              Cart Summary
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal ({totalItemsCount} units):</span>
                <span className="font-semibold text-slate-900">₹{formattedSubtotal}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Est. Shipping (PIN {buyerPin}):</span>
                <span className={`font-semibold ${quote.totalShippingFee === 0 ? 'text-emerald-700' : 'text-slate-900'}`}>
                  {quote.totalShippingFee === 0 ? 'FREE' : `₹${formattedShipping}`}
                </span>
              </div>

              {quote.totalCodFee > 0 && (
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Courier COD Fee (if COD selected):</span>
                  <span>+₹{quote.totalCodFee}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-base font-bold text-slate-900">Estimated Total:</span>
                <span className="text-2xl font-extrabold text-slate-900">
                  ₹{formattedEstimatedPayable}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Final shipping &amp; COD charges are confirmed per seller on checkout after PIN verification.
              </p>
            </div>

            {/* Proceed to Checkout CTA */}
            <button
              type="button"
              disabled={hasStockBlocking}
              onClick={onProceedToCheckout}
              className="w-full py-3.5 px-4 bg-amber-400 hover:bg-amber-500 disabled:bg-slate-200 disabled:text-slate-500 active:scale-[0.98] text-slate-950 font-bold text-sm rounded-xl shadow-md shadow-amber-400/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              <Lock className="w-4 h-4" />
              <span>
                {hasStockBlocking
                  ? 'Fix Stock Issues to Checkout'
                  : `Proceed to Checkout (${totalItemsCount} items)`}
              </span>
            </button>

            {/* Trust and Assurance Points */}
            <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-500">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Cash on Delivery (COD)</strong> supported where seller &amp; courier allow.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Truck className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                <span>
                  Multi-vendor checkout splits fulfillment transparently per seller with unified tracking.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
