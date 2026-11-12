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
  Printer,
  Plus,
} from 'lucide-react';
import { CartItem, Order, SaharanpurLocality, AuthUser, SavedAddress, DeliveryType } from '../types';
import { SAHARANPUR_LOCALITIES } from '../data/mockData';

interface CheckoutViewProps {
  cart: CartItem[];
  currentUser: AuthUser | null;
  selectedLocality: SaharanpurLocality;
  savedAddresses?: SavedAddress[];
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
    deliveryType: DeliveryType;
    deliveryFee: number;
  }) => Promise<Order | null>;
  onGoBackToCart: () => void;
  onGoToOrders: () => void;
  onGoToCatalog: () => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  cart,
  currentUser,
  selectedLocality,
  savedAddresses = [],
  onPlaceOrder,
  onGoBackToCart,
  onGoToOrders,
  onGoToCatalog,
}) => {
  // Address selection
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    savedAddresses[0]?.id || 'custom'
  );

  // Form State
  const [customerName, setCustomerName] = useState(
    savedAddresses[0]?.fullName || currentUser?.fullName || ''
  );
  const [customerPhone, setCustomerPhone] = useState(
    savedAddresses[0]?.phone || (currentUser?.phone ? currentUser.phone.replace('+91', '').trim() : '')
  );
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || '');
  const [deliveryAddress, setDeliveryAddress] = useState(
    savedAddresses[0]?.addressLine || ''
  );
  const [locality, setLocality] = useState(
    savedAddresses[0]?.locality || selectedLocality?.name || 'Court Road'
  );
  const [pinCode, setPinCode] = useState(
    savedAddresses[0]?.pinCode || selectedLocality?.pinCode || '247001'
  );
  const [city] = useState('Saharanpur');
  const [state] = useState('Uttar Pradesh');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'pay_on_delivery'>('cod');

  // Dual Delivery Selection
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('seller_delivery');

  // Loading & Placed Order States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [formError, setFormError] = useState('');

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Delivery fee calculation
  // Seller delivery: Always ₹0
  // MattoKart Delivery: ₹50, or Free if subtotal >= 1500
  const deliveryFee =
    deliveryType === 'seller_delivery'
      ? 0
      : subtotal >= 1500
      ? 0
      : 50;

  const grandTotal = subtotal + deliveryFee;

  const handleSelectSavedAddress = (addr: SavedAddress) => {
    setSelectedAddressId(addr.id);
    setCustomerName(addr.fullName);
    setCustomerPhone(addr.phone);
    setDeliveryAddress(addr.addressLine);
    setLocality(addr.locality);
    setPinCode(addr.pinCode);
  };

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
      setFormError('Please enter your complete street address, house/shop number, and mohalla.');
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
        deliveryType,
        deliveryFee,
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
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-lg text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Order Confirmed & Placed (ऑर्डर दर्ज हुआ)
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-brand">
              Shukriya, {placedOrder.customerName}!
            </h1>
            <p className="text-sm text-slate-600 max-w-lg mx-auto">
              Your order has been transmitted directly to verified local merchants in Saharanpur. You will receive an SMS confirmation on{' '}
              <strong className="text-slate-900">{placedOrder.customerPhone}</strong>.
            </p>
          </div>

          {/* Order Details Card */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 text-left space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block">Order Number</span>
                <span className="font-bold text-slate-900 font-mono text-sm">{placedOrder.orderNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Amount to Pay (COD)</span>
                <span className="font-bold text-slate-900 text-sm">₹{formattedTotal}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Delivery Method</span>
                <span className="font-semibold text-slate-900">
                  {placedOrder.deliveryType === 'mattokart_delivery'
                    ? 'MattoKart Express'
                    : 'Seller Direct'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Estimated Timeline</span>
                <span className="font-semibold text-emerald-700">24–48 Hours</span>
              </div>
            </div>

            {/* Destination */}
            <div className="text-xs text-slate-700 space-y-1">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-orange-600" />
                Shipping Destination:
              </span>
              <p className="pl-5 text-slate-600">
                {placedOrder.deliveryAddress}, {placedOrder.locality}, {placedOrder.city}, {placedOrder.state} — {placedOrder.pinCode}
              </p>
            </div>

            {/* Ordered Items Preview */}
            <div className="pt-3 border-t border-slate-200 text-xs space-y-2">
              <span className="font-bold text-slate-900 block">Items in this Order ({placedOrder.items.length}):</span>
              <div className="divide-y divide-slate-200">
                {placedOrder.items.map((item) => (
                  <div key={item.id} className="py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{item.productName}</span>
                      <span className="text-slate-500">× {item.quantity} {item.unit}</span>
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
              className="px-6 py-3 bg-[#131921] hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Track in My Orders</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => window.print()}
              className="px-5 py-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Print Receipt</span>
            </button>

            <button
              onClick={onGoToCatalog}
              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
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
      {/* Return to cart */}
      <button
        onClick={onGoBackToCart}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-orange-600 transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Shopping Cart</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form & Options (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          <form onSubmit={handleSubmitOrder} className="space-y-6">
            {/* Step 1: Delivery Address */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-7 h-7 rounded-full bg-[#131921] text-white flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 font-brand">
                    Delivery Address & Customer Contact
                  </h2>
                  <p className="text-xs text-slate-500">
                    Direct door delivery by verified Saharanpur transport
                  </p>
                </div>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold">
                  {formError}
                </div>
              )}

              {/* Saved Address Selector */}
              {savedAddresses.length > 0 && (
                <div className="space-y-2">
                  <span className="block text-xs font-bold text-slate-700">Choose from Saved Addresses:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {savedAddresses.map((addr) => (
                      <div
                        key={addr.id}
                        onClick={() => handleSelectSavedAddress(addr)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all text-xs space-y-1 ${
                          selectedAddressId === addr.id
                            ? 'border-orange-500 bg-orange-50/40 ring-1 ring-orange-400'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{addr.fullName}</span>
                          <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded">
                            {addr.tag || 'Saved'}
                          </span>
                        </div>
                        <p className="text-slate-600 line-clamp-2">{addr.addressLine}, {addr.locality}</p>
                        <div className="text-slate-500 font-mono text-[11px]">{addr.city} - {addr.pinCode}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      setSelectedAddressId('custom');
                    }}
                    placeholder="e.g. Aman Singhal"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    10-Digit Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs font-semibold text-slate-400">+91</span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={customerPhone}
                      onChange={(e) => {
                        setCustomerPhone(e.target.value.replace(/\D/g, ''));
                        setSelectedAddressId('custom');
                      }}
                      placeholder="98970 12345"
                      className="w-full pl-11 pr-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Street Address, House/Shop No., Landmark <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={deliveryAddress}
                  onChange={(e) => {
                    setDeliveryAddress(e.target.value);
                    setSelectedAddressId('custom');
                  }}
                  placeholder="e.g. House #14, Near Ghanta Ghar, Court Road, Mohalla Hasanpur"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Saharanpur Area / Locality <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={locality}
                    onChange={handleLocalityChange}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg bg-white"
                  >
                    {SAHARANPUR_LOCALITIES.map((loc) => (
                      <option key={loc.name} value={loc.name}>
                        {loc.name} ({loc.pinCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    disabled
                    value={city}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-600"
                  />
                </div>

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
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Delivery Instructions (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Call before delivery, deliver in afternoon, or leave with security"
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            {/* Step 2: Dual Delivery System Selection */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-7 h-7 rounded-full bg-[#131921] text-white flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 font-brand">
                    Delivery Method (डिलीवरी विकल्प)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Choose how you want your items dispatched
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Option 1: Seller Direct Delivery */}
                <label
                  className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                    deliveryType === 'seller_delivery'
                      ? 'border-orange-500 bg-orange-50/40 ring-1 ring-orange-500'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="deliveryType"
                          checked={deliveryType === 'seller_delivery'}
                          onChange={() => setDeliveryType('seller_delivery')}
                          className="accent-orange-600"
                        />
                        <span className="font-bold text-slate-900 text-sm">Seller Direct Delivery</span>
                      </div>
                      <span className="text-xs font-extrabold text-emerald-700">FREE</span>
                    </div>
                    <p className="text-xs text-slate-600 pl-5">
                      The local Saharanpur shopkeeper or shop assistant delivers directly to your doorstep.
                    </p>
                  </div>
                  <div className="text-[11px] text-slate-400 pl-5 pt-2 flex items-center gap-1">
                    <Store className="w-3 h-3 text-orange-600" />
                    <span>Fulfilled by merchant</span>
                  </div>
                </label>

                {/* Option 2: MattoKart Express Fleet */}
                <label
                  className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                    deliveryType === 'mattokart_delivery'
                      ? 'border-orange-500 bg-orange-50/40 ring-1 ring-orange-500'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="deliveryType"
                          checked={deliveryType === 'mattokart_delivery'}
                          onChange={() => setDeliveryType('mattokart_delivery')}
                          className="accent-orange-600"
                        />
                        <span className="font-bold text-slate-900 text-sm">MattoKart Express Fleet</span>
                      </div>
                      <span className="text-xs font-extrabold text-slate-900">
                        {subtotal >= 1500 ? (
                          <span className="text-emerald-700">FREE (Order &gt; ₹1,500)</span>
                        ) : (
                          '₹50'
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 pl-5">
                      Fast delivery dispatched via MattoKart verified rider partner with live tracking updates.
                    </p>
                  </div>
                  <div className="text-[11px] text-slate-400 pl-5 pt-2 flex items-center gap-1">
                    <Truck className="w-3 h-3 text-emerald-600" />
                    <span>Verified Rider Delivery</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Step 3: Payment Method */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-7 h-7 rounded-full bg-[#131921] text-white flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 font-brand">
                    Payment Method
                  </h2>
                  <p className="text-xs text-slate-500">
                    Pay safely upon delivery across Saharanpur
                  </p>
                </div>
              </div>

              {/* Cash on Delivery */}
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
                  className="mt-1 accent-orange-600"
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
                  <p className="text-xs text-slate-600">
                    Pay cash or scan shopkeeper / delivery driver UPI QR code directly upon delivery at your doorstep.
                  </p>
                </div>
              </label>

              {/* Online Payment (Razorpay Ready) */}
              <div className="p-3.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 opacity-80 text-xs text-slate-500 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  <span>Online UPI, Net Banking, Cards (Razorpay Ready)</span>
                </div>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                  Coming Soon
                </span>
              </div>
            </div>

            {/* Place Order CTA Mobile */}
            <div className="block lg:hidden">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-[#ffa41c] hover:bg-[#fa8900] disabled:bg-slate-300 text-slate-950 font-black text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Generating Order...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-slate-950" />
                    <span>Place Your Order (₹{new Intl.NumberFormat('en-IN').format(grandTotal)})</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Order Summary (4 Cols) */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-md space-y-4">
            <h3 className="text-base font-bold text-slate-900 font-brand pb-3 border-b border-slate-100">
              Order Summary
            </h3>

            {/* Items Preview */}
            <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 pr-1 text-xs space-y-2">
              {cart.map((item) => (
                <div key={item.productId} className="py-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 truncate">
                    <img
                      src={(item.product.images && item.product.images[0]) || ''}
                      alt=""
                      className="w-10 h-10 rounded-lg object-contain bg-slate-50 border border-slate-200 shrink-0"
                    />
                    <div className="truncate">
                      <div className="font-semibold text-slate-900 truncate">{item.product.name}</div>
                      <div className="text-slate-400 text-[10px]">Qty: {item.quantity} • {item.product.sellerShopName}</div>
                    </div>
                  </div>
                  <span className="font-bold text-slate-900 shrink-0 font-mono">
                    ₹{new Intl.NumberFormat('en-IN').format(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Summary Lines */}
            <div className="space-y-2 pt-3 border-t border-slate-200 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items ({totalItemsCount}):</span>
                <span className="font-semibold text-slate-900">
                  ₹{new Intl.NumberFormat('en-IN').format(subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery Charge:</span>
                <span className="font-semibold text-emerald-700">
                  {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900">Order Total:</span>
                <span className="text-xl font-extrabold text-slate-900">
                  ₹{new Intl.NumberFormat('en-IN').format(grandTotal)}
                </span>
              </div>
            </div>

            {/* Desktop Place Order CTA */}
            <button
              onClick={handleSubmitOrder}
              disabled={isSubmitting}
              className="w-full py-3.5 bg-[#ffa41c] hover:bg-[#fa8900] disabled:bg-slate-300 text-slate-950 font-bold text-sm rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Generating Order...</span>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-slate-950" />
                  <span>Place Your Order</span>
                </>
              )}
            </button>

            <div className="text-[11px] text-slate-400 text-center">
              Cash on Delivery verified by MattoKart Saharanpur.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
