import React, { useState } from 'react';
import {
  ShieldCheck,
  Truck,
  CheckCircle2,
  Lock,
  ArrowLeft,
  MapPin,
  CreditCard,
  Banknote,
  ArrowRight,
  Store,
  Phone,
  Clock,
  Sparkles,
} from 'lucide-react';
import { CartItem, Order, SaharanpurLocality, AuthUser } from '../types';
import { SAHARANPUR_LOCALITIES } from '../data/mockData';

interface CheckoutViewProps {
  cart: CartItem[];
  currentUser: AuthUser | null;
  selectedLocality: SaharanpurLocality;
  onPlaceOrder: (orderData: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    deliveryAddress: string;
    locality: string;
    city: string;
    state: string;
    pinCode: string;
    paymentMethod: 'cod' | 'pay_on_delivery';
    notes?: string;
  }) => Promise<Order | null>;
  onGoBackToCart: () => void;
  onGoToOrders: () => void;
  onGoToCatalog: () => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  cart,
  currentUser,
  selectedLocality,
  onPlaceOrder,
  onGoBackToCart,
  onGoToOrders,
  onGoToCatalog,
}) => {
  // Form State
  const [customerName, setCustomerName] = useState(currentUser?.fullName || '');
  const [customerPhone, setCustomerPhone] = useState(
    currentUser?.phone ? currentUser.phone.replace('+91', '').trim() : ''
  );
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || '');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [locality, setLocality] = useState(selectedLocality?.name || 'Court Road');
  const [pinCode, setPinCode] = useState(selectedLocality?.pinCode || '247001');
  const [city] = useState('Saharanpur');
  const [state] = useState('Uttar Pradesh');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'pay_on_delivery'>('cod');

  // Loading & Placed Order States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [formError, setFormError] = useState('');

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const formattedSubtotal = new Intl.NumberFormat('en-IN').format(subtotal);

  // When locality is selected, auto-update PIN code
  const handleLocalityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const locName = e.target.value;
    setLocality(locName);
    const found = SAHARANPUR_LOCALITIES.find((l) => l.name === locName);
    if (found) {
      setPinCode(found.pinCode);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!customerName.trim()) {
      setFormError('Please enter the customer name.');
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) {
      setFormError('Please enter a valid 10-digit Indian mobile number (e.g. 98970 12345).');
      return;
    }

    if (!deliveryAddress.trim() || deliveryAddress.trim().length < 6) {
      setFormError('Please enter your complete delivery street address, house/shop number, and mohalla.');
      return;
    }

    if (!pinCode.trim() || !/^\d{6}$/.test(pinCode.trim())) {
      setFormError('Please enter a valid 6-digit Saharanpur PIN code.');
      return;
    }

    if (cart.length === 0) {
      setFormError('Your cart is empty. Please add items before checking out.');
      return;
    }

    setIsSubmitting(true);
    try {
      const order = await onPlaceOrder({
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        customerEmail: customerEmail.trim() || undefined,
        deliveryAddress: deliveryAddress.trim(),
        locality: locality.trim(),
        city,
        state,
        pinCode: pinCode.trim(),
        paymentMethod,
        notes: notes.trim() || undefined,
      });

      if (order) {
        setPlacedOrder(order);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setFormError('Unable to place order. Please try again.');
      }
    } catch (err: any) {
      setFormError(err.message || 'An unexpected error occurred while placing order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS CONFIRMATION SCREEN
  if (placedOrder) {
    const formattedTotal = new Intl.NumberFormat('en-IN').format(placedOrder.totalAmount);

    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-lg text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Order Confirmed & Placed
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-brand">
              Shukriya, {placedOrder.customerName}!
            </h1>
            <p className="text-sm text-slate-600 max-w-lg mx-auto">
              Your order has been received by Saharanpur local merchants. You will receive an SMS confirmation on{' '}
              <strong>{placedOrder.customerPhone}</strong>.
            </p>
          </div>

          {/* Order Details Card */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 text-left space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block">Order Number</span>
                <span className="font-bold text-slate-900 font-mono text-sm">{placedOrder.orderNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Total Amount</span>
                <span className="font-bold text-slate-900 text-sm">₹{formattedTotal}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Payment Mode</span>
                <span className="font-semibold text-slate-900 uppercase">Cash on Delivery</span>
              </div>
              <div>
                <span className="text-slate-500 block">Est. Delivery</span>
                <span className="font-semibold text-emerald-700">24–48 Hours</span>
              </div>
            </div>

            {/* Delivery Destination */}
            <div className="text-xs text-slate-700 space-y-1">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-orange-600" />
                Shipping to:
              </span>
              <p className="pl-5 text-slate-600">
                {placedOrder.deliveryAddress}, {placedOrder.locality}, {placedOrder.city}, {placedOrder.state} — {placedOrder.pinCode}
              </p>
            </div>

            {/* Ordered Items Preview */}
            <div className="pt-3 border-t border-slate-200 text-xs space-y-2">
              <span className="font-bold text-slate-900 block">Items in this Order ({placedOrder.items.length}):</span>
              <div className="divide-y divide-slate-100">
                {placedOrder.items.map((item) => (
                  <div key={item.id} className="py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{item.productName}</span>
                      <span className="text-slate-400">× {item.quantity} {item.unit}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{new Intl.NumberFormat('en-IN').format(item.totalPrice)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={onGoToOrders}
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Track in My Orders</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onGoToCatalog}
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Back to Cart link */}
      <button
        onClick={onGoBackToCart}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-orange-600 transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Shopping Cart</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Checkout Form (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          <form onSubmit={handleSubmitOrder} className="space-y-6">
            {/* Step 1: Customer Details & Shipping Address */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 font-brand">
                    Delivery Address & Customer Contact
                  </h2>
                  <p className="text-xs text-slate-500">
                    Direct door delivery by verified Saharanpur local transport.
                  </p>
                </div>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Aman Singhal"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Number (10 Digits) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-xs font-semibold text-slate-400">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="98970 12345"
                      className="w-full pl-12 pr-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Order confirmation & delivery updates will be sent here
                  </span>
                </div>
              </div>

              {/* Complete Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Street Address, House/Plot No, Landmark <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="e.g. Shop #14, Near Ghanta Ghar, Civil Lines Road, Mohalla Hasanpur"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              {/* Locality, City, State, PIN */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {/* Locality */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Saharanpur Area / Locality <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={locality}
                    onChange={handleLocalityChange}
                    className="w-full px-3 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
                  >
                    {SAHARANPUR_LOCALITIES.map((loc) => (
                      <option key={loc.name} value={loc.name}>
                        {loc.name} ({loc.pinCode})
                      </option>
                    ))}
                  </select>
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    disabled
                    value={city}
                    className="w-full px-3 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-600"
                  />
                </div>

                {/* PIN Code */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    PIN Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="247001"
                    className="w-full px-3 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono"
                  />
                </div>
              </div>

              {/* Delivery Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Optional Delivery Instructions for Shopkeeper / Driver
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Deliver after 4 PM, call on second number, or call security guard"
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
            </div>

            {/* Step 2: Payment Method */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 font-brand">
                    Payment Method
                  </h2>
                  <p className="text-xs text-slate-500">
                    Safe payment options. Pay when you receive your goods.
                  </p>
                </div>
              </div>

              {/* Payment Options */}
              <div className="space-y-3">
                {/* Cash on Delivery (COD) */}
                <label
                  className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-orange-500 bg-orange-50/40 ring-1 ring-orange-500'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="mt-1 text-orange-600 focus:ring-orange-500"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-slate-900 text-sm">
                        Cash on Delivery (COD) / Pay on Delivery
                      </span>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Pay cash or scan shopkeeper&apos;s UPI QR code directly upon delivery at your doorstep anywhere in Saharanpur.
                    </p>
                  </div>
                </label>

                {/* Online Payment (Razorpay Ready placeholder) */}
                <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 opacity-80 space-y-1 text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold text-slate-600 text-sm">
                        Online Payment (UPI, Debit/Credit Card, Net Banking)
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                      Razorpay Ready
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Online gateway integration is architected and ready for future Razorpay activation. Currently, Cash on Delivery is active for all orders.
                  </p>
                </div>
              </div>
            </div>

            {/* Place Order Button Mobile */}
            <div className="block lg:hidden">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Generating Order...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Place Your Order (₹{formattedSubtotal})</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Order Review & Final Place Order CTA (4 Cols) */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-md space-y-5">
            <h3 className="text-base font-bold text-slate-900 font-brand pb-3 border-b border-slate-100">
              Review Items & Shipping
            </h3>

            {/* Mini Items List */}
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 pr-1 text-xs space-y-2">
              {cart.map((item) => (
                <div key={item.productId} className="py-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 truncate">
                    <img
                      src={(item.product.images && item.product.images[0]) || ''}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0"
                    />
                    <div className="truncate">
                      <div className="font-semibold text-slate-900 truncate">{item.product.name}</div>
                      <div className="text-slate-400 text-[10px]">Qty: {item.quantity} • Sold by: {item.product.sellerShopName}</div>
                    </div>
                  </div>
                  <span className="font-bold text-slate-900 shrink-0 font-mono">
                    ₹{new Intl.NumberFormat('en-IN').format(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Summary Lines */}
            <div className="space-y-2.5 pt-3 border-t border-slate-200 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal:</span>
                <span className="font-semibold text-slate-900">₹{formattedSubtotal}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery:</span>
                <span className="font-semibold text-emerald-700">FREE</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900">Order Total:</span>
                <span className="text-xl font-extrabold text-slate-900">
                  ₹{formattedSubtotal}
                </span>
              </div>
            </div>

            {/* Submit Button Desktop */}
            <button
              onClick={handleSubmitOrder}
              disabled={isSubmitting}
              className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-bold text-sm rounded-xl shadow-md shadow-orange-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Generating Order...</span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Place Your Order</span>
                </>
              )}
            </button>

            <div className="text-[11px] text-slate-400 text-center">
              By placing your order, you agree to MattoKart&apos;s terms and conditions.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
