import React, { useState, useEffect } from 'react';
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
  Printer,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  Package,
  X,
} from 'lucide-react';
import {
  CartItem,
  Order,
  SaharanpurLocality,
  AuthUser,
  SavedAddress,
  DeliveryType,
  ShippingZone,
  SellerSubOrder,
  OrderTrackingEvent,
} from '../types';
import { SAHARANPUR_LOCALITIES } from '../data/mockData';
import {
  INDIAN_STATES_UTS,
  resolveIndianPinMetadata,
  calculateMultiVendorCheckoutQuote,
} from '../data/indiaData';

export interface PlaceOrderPayload {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: string;
  landmark?: string;
  locality: string;
  district?: string;
  city: string;
  state: string;
  pinCode: string;
  paymentMethod: 'cod' | 'pay_on_delivery';
  notes?: string;
  deliveryType: DeliveryType;
  deliveryFee: number;
  subtotalAmount: number;
  codFee: number;
  shippingZone?: ShippingZone;
  courierPartner?: string;
  estimatedDeliveryWindow?: string;
  sellerOrders?: Omit<SellerSubOrder, 'orderId' | 'createdAt'>[];
  initialTrackingNote?: string;
}

interface CheckoutViewProps {
  cart: CartItem[];
  currentUser: AuthUser | null;
  selectedLocality: SaharanpurLocality;
  savedAddresses?: SavedAddress[];
  onSaveAddress?: (addr: SavedAddress) => void;
  onDeleteAddress?: (addressId: string) => void;
  onPlaceOrder: (orderData: PlaceOrderPayload) => Promise<Order | null>;
  onGoBackToCart: () => void;
  onGoToOrders: () => void;
  onGoToCatalog: () => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  cart,
  currentUser,
  selectedLocality,
  savedAddresses = [],
  onSaveAddress,
  onDeleteAddress,
  onPlaceOrder,
  onGoBackToCart,
  onGoToOrders,
  onGoToCatalog,
}) => {
  const defaultAddr = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];

  // Address selection
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    defaultAddr?.id || 'custom'
  );

  // Form State
  const [customerName, setCustomerName] = useState(
    defaultAddr?.fullName || currentUser?.fullName || ''
  );
  const [customerPhone, setCustomerPhone] = useState(
    defaultAddr?.phone || (currentUser?.phone ? currentUser.phone.replace('+91', '').trim() : '')
  );
  const [customerEmail, setCustomerEmail] = useState(
    defaultAddr?.email || currentUser?.email || ''
  );
  const [deliveryAddress, setDeliveryAddress] = useState(
    defaultAddr?.addressLine || ''
  );
  const [landmark, setLandmark] = useState(defaultAddr?.landmark || '');
  const [locality, setLocality] = useState(
    defaultAddr?.locality || selectedLocality?.name || 'Court Road'
  );
  const [district, setDistrict] = useState(
    defaultAddr?.district || defaultAddr?.city || selectedLocality?.district || selectedLocality?.city || 'Saharanpur'
  );
  const [city, setCity] = useState(
    defaultAddr?.city || selectedLocality?.city || 'Saharanpur'
  );
  const [state, setState] = useState(
    defaultAddr?.state || selectedLocality?.state || 'Uttar Pradesh'
  );
  const [pinCode, setPinCode] = useState(
    defaultAddr?.pinCode || selectedLocality?.pinCode || '247001'
  );
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'pay_on_delivery'>('cod');

  // Add / Edit Address Modal State
  const [isAddrModalOpen, setIsAddrModalOpen] = useState(false);
  const [editingAddrId, setEditingAddrId] = useState<string | null>(null);
  const [addrTag, setAddrTag] = useState<'Home' | 'Work' | 'Shop'>('Home');
  const [addrDefault, setAddrDefault] = useState<boolean>(false);
  const [addrForm, setAddrForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    addressLine: '',
    landmark: '',
    locality: '',
    district: '',
    city: '',
    state: 'Uttar Pradesh',
    pinCode: '',
  });
  const [addrError, setAddrError] = useState('');

  // Per-seller selected delivery method
  const [selectedSellerModes, setSelectedSellerModes] = useState<Record<string, DeliveryType>>({});

  // Multi-Vendor & Heavy-Goods Shipping + COD Calculation
  const quote = calculateMultiVendorCheckoutQuote(cart, pinCode, selectedSellerModes);

  useEffect(() => {
    // Sync per-seller selections when cart or PIN changes
    setSelectedSellerModes((prev) => {
      const next: Record<string, DeliveryType> = {};
      for (const sq of quote.sellerQuotes) {
        if (sq.selectedMethod) {
          next[sq.sellerId] = prev[sq.sellerId] && sq.availableMethods.some((m) => m.type === prev[sq.sellerId])
            ? prev[sq.sellerId]
            : sq.selectedMethod.type;
        }
      }
      return next;
    });
  }, [pinCode, cart.length]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [formError, setFormError] = useState('');

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSelectSavedAddress = (addr: SavedAddress) => {
    setSelectedAddressId(addr.id);
    setCustomerName(addr.fullName);
    setCustomerPhone(addr.phone);
    if (addr.email) setCustomerEmail(addr.email);
    setDeliveryAddress(addr.addressLine);
    setLandmark(addr.landmark || '');
    setLocality(addr.locality);
    setDistrict(addr.district || addr.city || 'Saharanpur');
    setCity(addr.city || 'Saharanpur');
    setState(addr.state || 'Uttar Pradesh');
    setPinCode(addr.pinCode);
  };

  const handleOpenAddAddress = () => {
    setEditingAddrId(null);
    setAddrTag('Home');
    setAddrDefault(savedAddresses.length === 0);
    setAddrForm({
      fullName: customerName || currentUser?.fullName || '',
      phone: customerPhone || '',
      email: customerEmail || '',
      addressLine: '',
      landmark: '',
      locality: '',
      district: '',
      city: '',
      state: state || 'Uttar Pradesh',
      pinCode: '',
    });
    setAddrError('');
    setIsAddrModalOpen(true);
  };

  const handleOpenEditAddress = (addr: SavedAddress, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAddrId(addr.id);
    setAddrTag(addr.tag || 'Home');
    setAddrDefault(Boolean(addr.isDefault));
    setAddrForm({
      fullName: addr.fullName,
      phone: addr.phone,
      email: addr.email || '',
      addressLine: addr.addressLine,
      landmark: addr.landmark || '',
      locality: addr.locality,
      district: addr.district || addr.city,
      city: addr.city,
      state: addr.state,
      pinCode: addr.pinCode,
    });
    setAddrError('');
    setIsAddrModalOpen(true);
  };

  const handleSaveAddressForm = () => {
    setAddrError('');
    const cleanPhone = addrForm.phone.replace(/\D/g, '');
    if (!addrForm.fullName.trim()) {
      setAddrError('Full name is required.');
      return;
    }
    if (cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) {
      setAddrError('Enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (!addrForm.addressLine.trim() || addrForm.addressLine.trim().length < 5) {
      setAddrError('Complete street/house address is required.');
      return;
    }
    if (!/^[1-9]\d{5}$/.test(addrForm.pinCode.trim())) {
      setAddrError('Enter a valid 6-digit Indian PIN code.');
      return;
    }
    if (!addrForm.city.trim() || !addrForm.state.trim()) {
      setAddrError('City, District, and State are required.');
      return;
    }

    const newAddr: SavedAddress = {
      id: editingAddrId || `addr-${Date.now()}`,
      fullName: addrForm.fullName.trim(),
      phone: cleanPhone,
      email: addrForm.email.trim() || undefined,
      addressLine: addrForm.addressLine.trim(),
      landmark: addrForm.landmark.trim() || undefined,
      locality: addrForm.locality.trim() || addrForm.city.trim(),
      district: addrForm.district.trim() || addrForm.city.trim(),
      city: addrForm.city.trim(),
      state: addrForm.state.trim(),
      pinCode: addrForm.pinCode.trim(),
      tag: addrTag,
      isDefault: addrDefault,
    };

    onSaveAddress?.(newAddr);
    handleSelectSavedAddress(newAddr);
    setIsAddrModalOpen(false);
  };

  const handlePinChange = (raw: string) => {
    const clean = raw.replace(/\D/g, '');
    setPinCode(clean);
    setSelectedAddressId('custom');
    if (clean.length === 6) {
      const meta = resolveIndianPinMetadata(clean);
      if (meta.valid && meta.state !== 'India') {
        setState(meta.state);
        if (clean.startsWith('247')) {
          setCity('Saharanpur');
          setDistrict('Saharanpur');
        }
      }
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!customerName.trim()) {
      setFormError('Please enter the customer full name.');
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) {
      setFormError('Please enter a valid 10-digit Indian mobile number (e.g. 98970 12345).');
      return;
    }

    if (customerEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) {
      setFormError('Please enter a valid email address or leave it blank.');
      return;
    }

    if (!deliveryAddress.trim() || deliveryAddress.trim().length < 6) {
      setFormError('Please enter your complete street address, house/shop number, and road.');
      return;
    }

    if (!city.trim() || !state.trim() || !district.trim()) {
      setFormError('Please specify your delivery District, City, and State.');
      return;
    }

    if (!pinCode.trim() || !/^[1-9]\d{5}$/.test(pinCode.trim())) {
      setFormError('Please enter a valid 6-digit Indian PIN code.');
      return;
    }

    if (quote.stockIssues.length > 0) {
      setFormError(quote.stockIssues[0].issue);
      return;
    }

    if (!quote.serviceable) {
      setFormError(
        quote.blockedReasons[0]?.reason ||
          'One or more items in your cart cannot be delivered to this PIN code.'
      );
      return;
    }

    if (!quote.codEligible) {
      setFormError(quote.codUnavailableReason || 'Cash on Delivery is unavailable for one or more items.');
      return;
    }

    if (cart.length === 0) {
      setFormError('Your cart is empty. Please add items before checking out.');
      return;
    }

    // Build seller-wise sub-orders (without generating fake courier tracking numbers!)
    const tempOrderId = `ord-${Date.now()}`;
    const sellerSubOrders: Omit<SellerSubOrder, 'orderId' | 'createdAt'>[] = quote.sellerQuotes.map(
      (sq, idx) => {
        const method = sq.selectedMethod!;
        const subCodFee = sq.codFee || 0;
        return {
          id: `subord-${Date.now()}-${idx + 1}`,
          subOrderNumber: `S${idx + 1}`,
          sellerId: sq.sellerId,
          sellerShopName: sq.sellerShopName,
          sellerCity: sq.sellerCity,
          sellerState: sq.sellerState,
          sellerPinCode: sq.sellerPinCode,
          subtotal: sq.subtotal,
          shippingFee: method.fee,
          codFee: subCodFee,
          totalAmount: sq.subtotal + method.fee + subCodFee,
          deliveryMode: method.type,
          deliveryStatus: method.type === 'mattokart_delivery' ? 'requested' : 'pending',
          orderStatus: 'placed',
          courierName: method.courierName,
          // Genuine tracking number is only added upon real courier booking (Stage C) or seller dispatch entry
          trackingNumber: undefined,
          estimatedDelivery: method.eta,
          items: sq.items.map((it, itemIdx) => ({
            id: `subitem-${Date.now()}-${idx}-${itemIdx}`,
            orderId: tempOrderId,
            productId: it.product.id,
            sellerId: sq.sellerId,
            sellerShopName: sq.sellerShopName,
            productName: it.product.name,
            productImage: (it.product.images && it.product.images[0]) || '',
            unitPrice: it.product.price,
            quantity: it.quantity,
            unit: it.product.unit,
            totalPrice: it.product.price * it.quantity,
            itemStatus: 'pending',
            createdAt: new Date().toISOString(),
          })),
        };
      }
    );

    const primaryMethod = quote.sellerQuotes[0]?.selectedMethod;
    const overallZone: ShippingZone = quote.sellerQuotes.some((sq) => sq.zone === 'interstate')
      ? 'interstate'
      : quote.sellerQuotes.some((sq) => sq.zone === 'intercity')
      ? 'intercity'
      : 'local';

    setIsSubmitting(true);
    try {
      const order = await onPlaceOrder({
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        customerEmail: customerEmail.trim() || undefined,
        deliveryAddress: deliveryAddress.trim(),
        landmark: landmark.trim() || undefined,
        locality: locality.trim() || city.trim(),
        district: district.trim(),
        city: city.trim(),
        state: state.trim(),
        pinCode: pinCode.trim(),
        paymentMethod,
        notes: notes.trim() || undefined,
        deliveryType: primaryMethod?.type || 'seller_delivery',
        deliveryFee: quote.totalShippingFee,
        subtotalAmount: quote.subtotal,
        codFee: quote.totalCodFee,
        shippingZone: overallZone,
        courierPartner:
          quote.sellerQuotes.length > 1
            ? `Multi-Vendor (${quote.sellerQuotes.length} Seller Dispatches)`
            : primaryMethod?.courierName,
        estimatedDeliveryWindow: quote.overallEta,
        sellerOrders: sellerSubOrders,
        initialTrackingNote: `Order placed (${paymentMethod === 'cod' ? 'Cash on Delivery' : 'Pay on Delivery'}) across ${quote.sellerQuotes.length} seller(s) for ${city.trim()}, ${state.trim()} (${pinCode.trim()}).`,
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
              Order Placed (ऑर्डर दर्ज हुआ)
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-brand">
              Shukriya, {placedOrder.customerName}!
            </h1>
            <p className="text-sm text-slate-600 max-w-lg mx-auto">
              Your multi-vendor order has been transmitted to {placedOrder.sellerOrders?.length || 1} verified MattoKart seller(s) for delivery to {placedOrder.city}, {placedOrder.state}. Updates will be sent to{' '}
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
                <span className="text-slate-500 block">Payable on Delivery</span>
                <span className="font-bold text-slate-900 text-sm">₹{formattedTotal}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Payment Mode</span>
                <span className="font-semibold text-emerald-800 uppercase">
                  {placedOrder.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Pay on Delivery'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Estimated Delivery</span>
                <span className="font-semibold text-emerald-700">
                  {placedOrder.estimatedDeliveryWindow || '2–5 Days'}
                </span>
              </div>
            </div>

            {/* Destination */}
            <div className="text-xs text-slate-700 space-y-1">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-orange-600" />
                Shipping Destination:
              </span>
              <p className="pl-5 text-slate-600">
                {placedOrder.deliveryAddress}
                {placedOrder.landmark ? ` (Near ${placedOrder.landmark})` : ''}, {placedOrder.locality}, {placedOrder.district || placedOrder.city}, {placedOrder.state} — {placedOrder.pinCode}
              </p>
            </div>

            {/* Seller-wise sub-order breakdown */}
            {placedOrder.sellerOrders && placedOrder.sellerOrders.length > 0 && (
              <div className="pt-3 border-t border-slate-200 text-xs space-y-2">
                <span className="font-bold text-slate-900 block">
                  Seller Fulfillment Breakdown ({placedOrder.sellerOrders.length} Seller{placedOrder.sellerOrders.length > 1 ? 's' : ''}):
                </span>
                <div className="space-y-2">
                  {placedOrder.sellerOrders.map((so) => (
                    <div key={so.id} className="bg-white rounded-lg border border-slate-200 p-3 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-slate-900">
                          {so.sellerShopName} <span className="font-mono text-slate-400">({placedOrder.orderNumber}-{so.subOrderNumber})</span>
                        </span>
                        <span className="text-[11px] font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded">
                          {so.courierName || so.deliveryMode.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex flex-wrap justify-between gap-2">
                        <span>Items: ₹{new Intl.NumberFormat('en-IN').format(so.subtotal)} · Shipping: {so.shippingFee === 0 ? 'FREE' : `₹${so.shippingFee}`}{so.codFee > 0 ? ` · COD Fee: ₹${so.codFee}` : ''}</span>
                        <span className="font-semibold text-slate-700">ETA: {so.estimatedDelivery}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
        {/* Left Column: Address Book, Multi-Vendor Shipping & Payment (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          <form onSubmit={handleSubmitOrder} className="space-y-6">
            {/* Step 1: Delivery Address & Saved Addresses */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#131921] text-white flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 font-brand">
                      All-India Delivery Address &amp; Contact Details
                    </h2>
                    <p className="text-xs text-slate-500">
                      Delivering across all 28 States &amp; 8 UTs with live PIN availability check
                    </p>
                  </div>
                </div>

                {onSaveAddress && (
                  <button
                    type="button"
                    onClick={handleOpenAddAddress}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 font-bold text-xs rounded-lg cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Address</span>
                  </button>
                )}
              </div>

              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Saved Address Selector with Edit / Delete */}
              {savedAddresses.length > 0 && (
                <div className="space-y-2">
                  <span className="block text-xs font-bold text-slate-700">
                    Saved Delivery Addresses ({savedAddresses.length}):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {savedAddresses.map((addr) => (
                      <div
                        key={addr.id}
                        onClick={() => handleSelectSavedAddress(addr)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all text-xs space-y-1 relative ${
                          selectedAddressId === addr.id
                            ? 'border-orange-500 bg-orange-50/40 ring-1 ring-orange-400'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-bold text-slate-900 truncate">{addr.fullName}</span>
                            {addr.isDefault && (
                              <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                                Default
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                              {addr.tag || 'Saved'}
                            </span>
                            {onSaveAddress && (
                              <button
                                type="button"
                                onClick={(e) => handleOpenEditAddress(addr, e)}
                                className="p-1 text-slate-400 hover:text-slate-700 rounded"
                                title="Edit address"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            )}
                            {onDeleteAddress && savedAddresses.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteAddress(addr.id);
                                }}
                                className="p-1 text-slate-400 hover:text-red-600 rounded"
                                title="Delete address"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-slate-600 line-clamp-2">
                          {addr.addressLine}{addr.landmark ? `, Near ${addr.landmark}` : ''}, {addr.locality}
                        </p>
                        <div className="text-slate-500 font-mono text-[11px]">
                          {addr.city}, {addr.state} — {addr.pinCode} · +91 {addr.phone}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Fields: Full Name, Mobile, Email */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
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
                    Mobile Number <span className="text-red-500">*</span>
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

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email (Order Receipt)
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => {
                      setCustomerEmail(e.target.value);
                      setSelectedAddressId('custom');
                    }}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Complete Delivery Address + Landmark */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Complete Delivery Address (House / Flat / Shop No., Street) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={deliveryAddress}
                    onChange={(e) => {
                      setDeliveryAddress(e.target.value);
                      setSelectedAddressId('custom');
                    }}
                    placeholder="e.g. House #14, Lane 3, Court Road"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => {
                      setLandmark(e.target.value);
                      setSelectedAddressId('custom');
                    }}
                    placeholder="e.g. Near Ghanta Ghar"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              </div>

              {/* State, District, City, Locality, PIN Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    State / UT <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={state}
                    onChange={(e) => {
                      const nextSt = e.target.value;
                      setState(nextSt);
                      setSelectedAddressId('custom');
                      const found = INDIAN_STATES_UTS.find((s) => s.name === nextSt);
                      if (found && found.majorDistricts.length > 0) {
                        setDistrict(found.majorDistricts[0].name);
                        setCity(found.majorDistricts[0].name);
                        setPinCode(found.majorDistricts[0].samplePin);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg bg-white"
                  >
                    {INDIAN_STATES_UTS.map((st) => (
                      <option key={st.name} value={st.name}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    District <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    list="checkout-district-suggestions"
                    value={district}
                    onChange={(e) => {
                      setDistrict(e.target.value);
                      setSelectedAddressId('custom');
                    }}
                    placeholder="e.g. Saharanpur, South Delhi"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg bg-white"
                  />
                  <datalist id="checkout-district-suggestions">
                    {(INDIAN_STATES_UTS.find((s) => s.name === state)?.majorDistricts || []).map((d) => (
                      <option key={d.name} value={d.name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    City &amp; Area / Locality <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    list="checkout-locality-suggestions"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      if (!locality) setLocality(e.target.value);
                      setSelectedAddressId('custom');
                    }}
                    placeholder="e.g. Saharanpur, Jaipur"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg bg-white"
                  />
                  {city.toLowerCase().includes('saharanpur') && (
                    <datalist id="checkout-locality-suggestions">
                      {SAHARANPUR_LOCALITIES.map((loc) => (
                        <option key={loc.name} value={loc.name} />
                      ))}
                    </datalist>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    6-Digit PIN Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={pinCode}
                    onChange={(e) => handlePinChange(e.target.value)}
                    placeholder="247001"
                    className={`w-full px-3 py-2 text-xs sm:text-sm border rounded-lg font-mono ${
                      pinCode.length === 6 && !quote.validPin
                        ? 'border-red-400 bg-red-50'
                        : 'border-slate-200'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Area / Mohalla / Colony
                  </label>
                  <input
                    type="text"
                    value={locality}
                    onChange={(e) => {
                      setLocality(e.target.value);
                      setSelectedAddressId('custom');
                    }}
                    placeholder="e.g. Court Road, Sector 18"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Delivery Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Call before delivery or gate instructions"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Multi-Vendor & Heavy Goods Delivery Method Per Seller */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#131921] text-white flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 font-brand">
                      Multi-Vendor Shipping &amp; Heavy Goods Availability
                    </h2>
                    <p className="text-xs text-slate-500">
                      Checking PIN <strong>{pinCode || '------'}</strong> ({quote.pinMeta.state}) across {quote.sellerQuotes.length} seller shipment{quote.sellerQuotes.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {quote.serviceable && (
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                    ✓ PIN Serviceable
                  </span>
                )}
              </div>

              {quote.stockIssues.length > 0 && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span>Inventory Stock Warning</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-0.5">
                    {quote.stockIssues.map((si) => (
                      <li key={si.productId}>
                        <strong>{si.productName}:</strong> {si.issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Per-Seller Shipping Cards */}
              <div className="space-y-4">
                {quote.sellerQuotes.map((sq, idx) => (
                  <div
                    key={sq.sellerId}
                    className={`rounded-xl border p-4 space-y-3 ${
                      sq.serviceable ? 'border-slate-200 bg-slate-50/40' : 'border-red-200 bg-red-50/40'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs">
                        <Store className="w-4 h-4 text-orange-600 shrink-0" />
                        <span className="font-bold text-slate-900">
                          Shipment {idx + 1}: {sq.sellerShopName}
                        </span>
                        <span className="text-slate-500">
                          ({sq.sellerCity}, {sq.sellerState} – {sq.sellerPinCode})
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[10px]">
                        {sq.containsHeavyGoods && (
                          <span className="font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-200">
                            Heavy / Oversized Goods (~{sq.totalWeightKg.toFixed(1)} kg)
                          </span>
                        )}
                        <span className="font-bold uppercase bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                          {sq.zone} zone
                        </span>
                      </div>
                    </div>

                    {/* Items summary under this seller */}
                    <div className="text-[11px] text-slate-600 flex flex-wrap gap-2">
                      {sq.items.map((it) => (
                        <span key={it.product.id} className="bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                          {it.product.name} × {it.quantity}
                        </span>
                      ))}
                    </div>

                    {!sq.serviceable ? (
                      <div className="p-3 bg-white rounded-lg border border-red-200 text-xs text-red-800 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold">Cannot deliver to PIN {pinCode}</div>
                          <p className="text-[11px] mt-0.5">{sq.unserviceableReason}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {sq.availableMethods.map((method) => {
                          const isSelected = sq.selectedMethod?.type === method.type;
                          return (
                            <label
                              key={method.type}
                              className={`p-3.5 rounded-xl border bg-white flex flex-col justify-between cursor-pointer transition-all text-xs ${
                                isSelected
                                  ? 'border-orange-500 ring-1 ring-orange-500 bg-orange-50/30'
                                  : 'border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name={`delivery-${sq.sellerId}`}
                                      checked={isSelected}
                                      onChange={() =>
                                        setSelectedSellerModes((prev) => ({
                                          ...prev,
                                          [sq.sellerId]: method.type,
                                        }))
                                      }
                                      className="accent-orange-600"
                                    />
                                    <span className="font-bold text-slate-900">{method.label}</span>
                                  </div>
                                  <span className="font-extrabold text-emerald-700 shrink-0">
                                    {method.fee === 0 ? 'FREE' : `₹${method.fee}`}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 pl-5">{method.note}</p>
                              </div>

                              <div className="pl-5 pt-2 flex items-center justify-between text-[11px] text-slate-600">
                                <span className="flex items-center gap-1">
                                  <Truck className="w-3 h-3 text-orange-600" />
                                  <span>{method.courierName}</span>
                                </span>
                                <span className="font-semibold text-emerald-700">
                                  Est: {method.estimatedDates}
                                </span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step 3: Payment Method (COD Active + Online Payment Stage C Notice) */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-7 h-7 rounded-full bg-[#131921] text-white flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 font-brand">
                    Payment Method (Cash on Delivery)
                  </h2>
                  <p className="text-xs text-slate-500">
                    COD availability &amp; handling charges verified for PIN {pinCode || '------'}
                  </p>
                </div>
              </div>

              {!quote.codEligible ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Cash on Delivery Unavailable</div>
                    <p>{quote.codUnavailableReason}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
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
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Banknote className="w-4 h-4 text-emerald-600" />
                          <span className="font-bold text-slate-900 text-sm">
                            Cash on Delivery (COD)
                          </span>
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                            Active for PIN {pinCode}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-slate-700">
                          {quote.totalCodFee === 0 ? '₹0 COD Fee' : `+₹${quote.totalCodFee} COD Charge`}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Pay exact order amount in cash upon delivery at your doorstep or construction site.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                      paymentMethod === 'pay_on_delivery'
                        ? 'border-orange-500 bg-orange-50/40 ring-1 ring-orange-500'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'pay_on_delivery'}
                      onChange={() => setPaymentMethod('pay_on_delivery')}
                      className="mt-1 accent-orange-600"
                    />
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-blue-600" />
                        <span className="font-bold text-slate-900 text-sm">
                          UPI / QR Pay on Delivery (Doorstep Scan)
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Pay via PhonePe / GPay / Paytm QR code directly when seller transport or rider hands over the package.
                      </p>
                    </div>
                  </label>
                </div>
              )}

              {/* Honest Stage C Online Gateway Notice */}
              <div className="p-3.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 opacity-85 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  <span>Online Payment (Razorpay UPI, Cards, NetBanking &amp; Wallets)</span>
                </div>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                  Enabling in Stage C (Awaiting Gateway Keys)
                </span>
              </div>
            </div>

            {/* Place Order CTA Mobile */}
            <div className="block lg:hidden">
              <button
                type="submit"
                disabled={isSubmitting || !quote.serviceable || !quote.codEligible}
                className="w-full py-4 bg-[#ffa41c] hover:bg-[#fa8900] disabled:bg-slate-300 text-slate-950 font-black text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Generating Order...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-slate-950" />
                    <span>
                      Place COD Order (₹{new Intl.NumberFormat('en-IN').format(quote.grandTotalWithCod)})
                    </span>
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
              Multi-Vendor Order Summary
            </h3>

            {/* Items Preview grouped by seller */}
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 pr-1 text-xs space-y-2">
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
                      <div className="text-slate-400 text-[10px]">
                        Qty: {item.quantity} {item.product.unit} • {item.product.sellerShopName}
                      </div>
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
                <span>Items Subtotal ({totalItemsCount}):</span>
                <span className="font-semibold text-slate-900">
                  ₹{new Intl.NumberFormat('en-IN').format(quote.subtotal)}
                </span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Shipping ({quote.sellerQuotes.length} Seller{quote.sellerQuotes.length > 1 ? 's' : ''}):</span>
                <span className="font-semibold text-emerald-700">
                  {!quote.serviceable
                    ? 'Unavailable'
                    : quote.totalShippingFee === 0
                    ? 'FREE'
                    : `₹${new Intl.NumberFormat('en-IN').format(quote.totalShippingFee)}`}
                </span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>COD Handling Fee:</span>
                <span className="font-semibold text-slate-900">
                  {quote.totalCodFee === 0 ? 'FREE (₹0)' : `₹${quote.totalCodFee}`}
                </span>
              </div>

              {quote.serviceable && (
                <div className="text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Estimated Arrival:</span>
                  <span className="font-semibold text-slate-700">{quote.overallEta}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900">Total Payable:</span>
                <span className="text-xl font-extrabold text-slate-900">
                  ₹{new Intl.NumberFormat('en-IN').format(quote.grandTotalWithCod)}
                </span>
              </div>
            </div>

            {/* Desktop Place Order CTA */}
            <button
              onClick={handleSubmitOrder}
              disabled={isSubmitting || !quote.serviceable || !quote.codEligible}
              className="w-full py-3.5 bg-[#ffa41c] hover:bg-[#fa8900] disabled:bg-slate-300 text-slate-950 font-bold text-sm rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Generating Order...</span>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-slate-950" />
                  <span>Confirm &amp; Place COD Order</span>
                </>
              )}
            </button>

            <div className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified MattoKart Multi-Vendor Checkout</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Saved Address Modal */}
      {isAddrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editingAddrId ? 'Edit Delivery Address' : 'Add New Delivery Address'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddrModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {addrError && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold">
                {addrError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  value={addrForm.fullName}
                  onChange={(e) => setAddrForm({ ...addrForm, fullName: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">10-Digit Mobile *</label>
                <input
                  type="tel"
                  maxLength={10}
                  value={addrForm.phone}
                  onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value.replace(/\D/g, '') })}
                  className="w-full p-2.5 border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-semibold mb-1">Complete Address *</label>
                <input
                  type="text"
                  value={addrForm.addressLine}
                  onChange={(e) => setAddrForm({ ...addrForm, addressLine: e.target.value })}
                  placeholder="House/Flat/Shop No., Building, Street"
                  className="w-full p-2.5 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Landmark</label>
                <input
                  type="text"
                  value={addrForm.landmark}
                  onChange={(e) => setAddrForm({ ...addrForm, landmark: e.target.value })}
                  placeholder="Near Temple / Gate"
                  className="w-full p-2.5 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Area / Locality *</label>
                <input
                  type="text"
                  value={addrForm.locality}
                  onChange={(e) => setAddrForm({ ...addrForm, locality: e.target.value })}
                  placeholder="Colony / Sector"
                  className="w-full p-2.5 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">State / UT *</label>
                <select
                  value={addrForm.state}
                  onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-lg bg-white"
                >
                  {INDIAN_STATES_UTS.map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">6-Digit PIN Code *</label>
                <input
                  type="text"
                  maxLength={6}
                  value={addrForm.pinCode}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '');
                    const meta = clean.length === 6 ? resolveIndianPinMetadata(clean) : null;
                    setAddrForm({
                      ...addrForm,
                      pinCode: clean,
                      state: meta?.valid && meta.state !== 'India' ? meta.state : addrForm.state,
                    });
                  }}
                  className="w-full p-2.5 border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">District *</label>
                <input
                  type="text"
                  value={addrForm.district}
                  onChange={(e) => setAddrForm({ ...addrForm, district: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">City *</label>
                <input
                  type="text"
                  value={addrForm.city}
                  onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
              <div className="flex items-center gap-2">
                {(['Home', 'Work', 'Shop'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setAddrTag(t)}
                    className={`px-3 py-1 rounded-full font-semibold border cursor-pointer ${
                      addrTag === t
                        ? 'bg-orange-600 text-white border-orange-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
                <input
                  type="checkbox"
                  checked={addrDefault}
                  onChange={(e) => setAddrDefault(e.target.checked)}
                  className="accent-orange-600"
                />
                <span>Set as default</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddrModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAddressForm}
                className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-lg cursor-pointer"
              >
                Save &amp; Use Address
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
