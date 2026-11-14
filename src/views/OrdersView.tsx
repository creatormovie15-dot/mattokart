import React, { useState } from 'react';
import {
  Package,
  MapPin,
  Store,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Printer,
  MessageCircle,
  Box,
  BadgeIndianRupee,
  RefreshCw,
} from 'lucide-react';
import { Order, OrderStatus } from '../types';

interface OrdersViewProps {
  orders: Order[];
  onCancelOrder: (orderId: string, reason: string) => Promise<boolean>;
  onRequestReturn?: (orderId: string, reason: string) => Promise<boolean>;
  onBuyAgain: (item: Order['items'][0]) => void;
  onGoToCatalog: () => void;
}

const FORWARD_ORDER_STEPS: { status: OrderStatus; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { status: 'placed', label: 'Order Placed', icon: Clock },
  { status: 'payment_confirmed', label: 'Payment Confirmed', icon: CheckCircle2 },
  { status: 'processing', label: 'Processing', icon: Store },
  { status: 'packed', label: 'Packed', icon: Box },
  { status: 'shipped', label: 'Shipped', icon: Truck },
  { status: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
  { status: 'delivered', label: 'Delivered', icon: Package },
];

export const getOrderStatusMeta = (status: OrderStatus): { label: string; badgeClass: string } => {
  switch (status) {
    case 'placed':
      return { label: 'Order Placed', badgeClass: 'bg-amber-50 text-amber-900 border border-amber-200' };
    case 'payment_confirmed':
    case 'confirmed':
      return { label: status === 'payment_confirmed' ? 'Payment Confirmed' : 'Order Confirmed', badgeClass: 'bg-blue-50 text-blue-800 border border-blue-200' };
    case 'processing':
      return { label: 'Processing', badgeClass: 'bg-purple-50 text-purple-800 border border-purple-200' };
    case 'packed':
      return { label: 'Packed & Ready', badgeClass: 'bg-indigo-50 text-indigo-800 border border-indigo-200' };
    case 'shipped':
      return { label: 'Shipped', badgeClass: 'bg-sky-50 text-sky-800 border border-sky-200' };
    case 'out_for_delivery':
      return { label: 'Out for Delivery', badgeClass: 'bg-orange-50 text-orange-800 border border-orange-200' };
    case 'delivered':
      return { label: 'Delivered', badgeClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200' };
    case 'cancelled':
      return { label: 'Cancelled', badgeClass: 'bg-red-50 text-red-700 border border-red-200' };
    case 'return_requested':
      return { label: 'Return Requested', badgeClass: 'bg-rose-50 text-rose-800 border border-rose-200' };
    case 'refunded':
      return { label: 'Refunded', badgeClass: 'bg-teal-50 text-teal-800 border border-teal-200' };
    default:
      return { label: String(status).replace(/_/g, ' '), badgeClass: 'bg-slate-100 text-slate-700 border border-slate-200' };
  }
};

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  onCancelOrder,
  onRequestReturn,
  onBuyAgain,
  onGoToCatalog,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'in_progress' | 'delivered' | 'returns_cancelled'>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Cancellation modal state
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('Need to change delivery address');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  // Return request modal state
  const [returningOrder, setReturningOrder] = useState<Order | null>(null);
  const [returnReason, setReturnReason] = useState('Item damaged / defective on delivery');
  const [returnNote, setReturnNote] = useState('');
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  const filteredOrders = orders.filter((order) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'delivered') return order.orderStatus === 'delivered';
    if (filterStatus === 'returns_cancelled') {
      return (
        order.orderStatus === 'cancelled' ||
        order.orderStatus === 'return_requested' ||
        order.orderStatus === 'refunded'
      );
    }
    if (filterStatus === 'in_progress') {
      return (
        order.orderStatus === 'placed' ||
        order.orderStatus === 'payment_confirmed' ||
        order.orderStatus === 'confirmed' ||
        order.orderStatus === 'processing' ||
        order.orderStatus === 'packed' ||
        order.orderStatus === 'shipped' ||
        order.orderStatus === 'out_for_delivery'
      );
    }
    return true;
  });

  const getStepIndex = (status: OrderStatus): number => {
    switch (status) {
      case 'placed':
        return 0;
      case 'payment_confirmed':
      case 'confirmed':
        return 1;
      case 'processing':
        return 2;
      case 'packed':
        return 3;
      case 'shipped':
        return 4;
      case 'out_for_delivery':
        return 5;
      case 'delivered':
        return 6;
      default:
        return -1;
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancellingOrder) return;
    setIsSubmittingCancel(true);
    try {
      await onCancelOrder(cancellingOrder.id, cancelReason);
      setCancellingOrder(null);
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const handleConfirmReturn = async () => {
    if (!returningOrder || !onRequestReturn) return;
    setIsSubmittingReturn(true);
    try {
      const fullReason = returnNote.trim() ? `${returnReason}: ${returnNote.trim()}` : returnReason;
      await onRequestReturn(returningOrder.id, fullReason);
      setReturningOrder(null);
      setReturnNote('');
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-brand">
            Your Orders (Mera Orders)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track 10-stage package fulfillment across India, view seller-wise dispatches, and manage returns.
          </p>
        </div>

        <button
          onClick={onGoToCatalog}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#131921] hover:bg-slate-800 text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
        >
          <span>Shop More Items</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg max-w-xl">
        <button
          onClick={() => setFilterStatus('all')}
          className={`flex-1 min-w-[85px] py-1.5 px-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
            filterStatus === 'all'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All ({orders.length})
        </button>
        <button
          onClick={() => setFilterStatus('in_progress')}
          className={`flex-1 min-w-[95px] py-1.5 px-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
            filterStatus === 'in_progress'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          In Progress
        </button>
        <button
          onClick={() => setFilterStatus('delivered')}
          className={`flex-1 min-w-[85px] py-1.5 px-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
            filterStatus === 'delivered'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Delivered
        </button>
        <button
          onClick={() => setFilterStatus('returns_cancelled')}
          className={`flex-1 min-w-[120px] py-1.5 px-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
            filterStatus === 'returns_cancelled'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Returns & Cancelled
        </button>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No orders found</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            You don&apos;t have any orders under this filter. Explore products from verified sellers across India.
          </p>
          <button
            onClick={onGoToCatalog}
            className="px-5 py-2.5 bg-[#ffd814] hover:bg-[#f7ca00] text-slate-950 font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Explore Catalog
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const formattedTotal = new Intl.NumberFormat('en-IN').format(order.totalAmount);
            const currentStep = getStepIndex(order.orderStatus);
            const isExceptionStatus =
              order.orderStatus === 'cancelled' ||
              order.orderStatus === 'return_requested' ||
              order.orderStatus === 'refunded';
            const canCancel =
              order.orderStatus === 'placed' ||
              order.orderStatus === 'payment_confirmed' ||
              order.orderStatus === 'confirmed';
            const canRequestReturn = order.orderStatus === 'delivered' && Boolean(onRequestReturn);
            const isExpanded = expandedOrderId === order.id;
            const statusMeta = getOrderStatusMeta(order.orderStatus);
            const computedSubtotal =
              order.subtotalAmount ??
              order.items.reduce((sum, it) => sum + it.totalPrice, 0);

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-all"
              >
                {/* Order Header */}
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-6 text-slate-600">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Order Placed</span>
                      <span className="font-semibold text-slate-800">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Grand Total</span>
                      <span className="font-bold text-slate-900">₹{formattedTotal}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Ship To</span>
                      <span className="font-semibold text-slate-800 truncate max-w-[160px] block" title={order.customerName}>
                        {order.customerName} ({order.city})
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Delivery Mode</span>
                      <span className="font-semibold text-slate-800">
                        {order.courierPartner ||
                          (order.deliveryType === 'mattokart_delivery'
                            ? 'MattoKart Express'
                            : order.deliveryType === 'seller_transport'
                            ? 'Seller Heavy Transport'
                            : order.deliveryType === 'interstate_courier'
                            ? 'Pan-India Courier'
                            : 'Seller Direct Delivery')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-600 font-bold text-xs">
                      #{order.orderNumber}
                    </span>
                    <button
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-[11px] font-semibold text-slate-700 cursor-pointer"
                    >
                      <span>{isExpanded ? 'Hide Details' : 'Track & Details'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Status Bar & 10-Stage Tracker */}
                <div className="p-5 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${statusMeta.badgeClass}`}>
                        {statusMeta.label}
                      </span>

                      <span className="text-xs text-slate-500">
                        Payment: <strong className="uppercase text-slate-800">{order.paymentMethod.replace(/_/g, ' ')}</strong> (
                        {order.paymentStatus === 'completed' ? (
                          <span className="text-emerald-700 font-bold">Paid</span>
                        ) : order.paymentStatus === 'refunded' ? (
                          <span className="text-teal-700 font-bold">Refunded</span>
                        ) : (
                          <span className="text-amber-800 font-bold">Collect upon delivery</span>
                        )}
                        )
                      </span>
                    </div>

                    {/* Support & Print Action */}
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://wa.me/918221077674?text=${encodeURIComponent(
                          `Namaste MattoKart! I have an enquiry regarding my Order #${order.orderNumber}.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Support WhatsApp</span>
                      </a>
                      <span className="text-slate-300">|</span>
                      <button
                        onClick={() => window.print()}
                        className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-400" />
                        <span>Print Invoice</span>
                      </button>
                    </div>
                  </div>

                  {/* 7-Step Forward Delivery Stepper OR Exception Banner (Cancelled / Return / Refunded) */}
                  {!isExceptionStatus && currentStep >= 0 ? (
                    <div className="py-2 overflow-x-auto">
                      <div className="relative flex items-start justify-between min-w-[600px] px-2">
                        <div className="absolute left-6 right-6 top-4 h-1 bg-slate-100 z-0" />
                        <div
                          className="absolute left-6 top-4 h-1 bg-emerald-600 transition-all duration-500 z-0"
                          style={{
                            width: `calc(${(currentStep / (FORWARD_ORDER_STEPS.length - 1)) * 100}% - 12px)`,
                          }}
                        />

                        {FORWARD_ORDER_STEPS.map((st, idx) => {
                          const StepIcon = st.icon;
                          const isCompleted = idx <= currentStep;
                          const isCurrent = idx === currentStep;

                          return (
                            <div key={st.status} className="relative z-10 flex flex-col items-center w-20">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                  isCompleted
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-white border-2 border-slate-200 text-slate-400'
                                } ${isCurrent ? 'ring-4 ring-emerald-100 scale-110' : ''}`}
                              >
                                <StepIcon className="w-4 h-4" />
                              </div>
                              <span
                                className={`text-[10px] font-bold mt-1.5 text-center leading-tight ${
                                  isCompleted ? 'text-slate-900' : 'text-slate-400'
                                }`}
                              >
                                {st.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                        order.orderStatus === 'cancelled'
                          ? 'bg-red-50 border-red-200 text-red-900'
                          : order.orderStatus === 'return_requested'
                          ? 'bg-rose-50 border-rose-200 text-rose-900'
                          : 'bg-teal-50 border-teal-200 text-teal-900'
                      }`}
                    >
                      {order.orderStatus === 'cancelled' ? (
                        <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      ) : order.orderStatus === 'return_requested' ? (
                        <RefreshCw className="w-4 h-4 shrink-0 mt-0.5" />
                      ) : (
                        <BadgeIndianRupee className="w-4 h-4 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="font-bold">{statusMeta.label}</div>
                        <div className="text-[11px] opacity-85 mt-0.5">
                          {order.notes || 'Order lifecycle closed / updated as requested.'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Multi-Vendor Seller Fulfillment Split Cards */}
                  {order.sellerOrders && order.sellerOrders.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Seller-Wise Fulfillment ({order.sellerOrders.length} {order.sellerOrders.length === 1 ? 'Seller' : 'Sellers'})
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {order.sellerOrders.map((sub) => {
                          const subMeta = getOrderStatusMeta(sub.orderStatus);
                          return (
                            <div
                              key={sub.subOrderNumber}
                              className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-1.5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="font-bold text-slate-900 flex items-center gap-1.5 truncate">
                                  <Store className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                                  <span className="truncate">{sub.sellerShopName}</span>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${subMeta.badgeClass}`}>
                                  {subMeta.label}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-600">
                                <span className="font-mono text-slate-500">{sub.subOrderNumber}</span>
                                <span className="font-semibold text-slate-800">
                                  Items ₹{new Intl.NumberFormat('en-IN').format(sub.subtotal)} + Ship ₹{sub.shippingFee}
                                  {sub.codFee > 0 ? ` + COD ₹${sub.codFee}` : ''}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-2">
                                <span className="font-medium text-slate-800">
                                  {sub.courierName ||
                                    (sub.deliveryMode === 'seller_transport'
                                      ? 'Seller-Managed Heavy Transport'
                                      : sub.deliveryMode === 'mattokart_delivery'
                                      ? 'MattoKart Local Express'
                                      : 'Pan-India Standard Courier')}
                                </span>
                                {sub.estimatedDelivery && (
                                  <span className="text-emerald-700 font-semibold">· ETA: {sub.estimatedDelivery}</span>
                                )}
                              </div>
                              {sub.trackingNumber && (
                                <div className="text-[11px] font-mono bg-white border border-slate-200 px-2 py-1 rounded text-slate-800 inline-block">
                                  Tracking / LR #: {sub.trackingNumber}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Assigned Delivery Partner Card (If MattoKart Fleet Assigned) */}
                  {order.deliveryType === 'mattokart_delivery' && order.deliveryPartnerName && (
                    <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-blue-700" />
                        <div>
                          <span className="font-bold text-slate-900">
                            MattoKart Delivery Partner: {order.deliveryPartnerName}
                          </span>
                          <span className="text-slate-500 ml-2">
                            ({order.deliveryPartnerVehicle || 'Local Fleet'} · {order.deliveryPartnerPhone})
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        Assigned
                      </span>
                    </div>
                  )}

                  {/* Genuine Carrier / Tracking Card (Only if trackingNumber or courierPartner actually exists) */}
                  {(order.courierPartner || order.trackingNumber) && (!order.sellerOrders || order.sellerOrders.length === 0) && (
                    <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-200 text-xs flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-indigo-700" />
                        <div>
                          <span className="font-bold text-slate-900">
                            {order.courierPartner || 'Carrier Assigned'}
                          </span>
                          {order.trackingNumber && (
                            <span className="text-slate-700 ml-2 font-mono">
                              Tracking / LR #: {order.trackingNumber}
                            </span>
                          )}
                          {order.estimatedDeliveryWindow && (
                            <span className="text-emerald-700 font-semibold ml-2">
                              · ETA: {order.estimatedDeliveryWindow}
                            </span>
                          )}
                        </div>
                      </div>
                      {order.shippingZone && (
                        <span className="text-[10px] font-bold uppercase bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                          {order.shippingZone} zone
                        </span>
                      )}
                    </div>
                  )}

                  {/* Order Items */}
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {order.items.map((item) => (
                      <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.productImage || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80'}
                            alt={item.productName}
                            className="w-16 h-16 rounded-lg object-contain bg-slate-50 border border-slate-200 shrink-0"
                          />
                          <div className="space-y-1">
                            <h4 className="font-bold text-slate-900 text-sm leading-snug">
                              {item.productName}
                            </h4>
                            <div className="text-slate-500 flex flex-wrap items-center gap-2">
                              <span>Qty: <strong className="text-slate-800">{item.quantity} {item.unit}</strong></span>
                              <span>·</span>
                              <span>Sold by: <strong className="text-slate-800">{item.sellerShopName || 'Verified MattoKart Seller'}</strong></span>
                            </div>
                            <div className="font-mono font-bold text-slate-900 text-sm">
                              ₹{new Intl.NumberFormat('en-IN').format(item.totalPrice)}
                            </div>
                          </div>
                        </div>

                        {/* Buy Again Button */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => onBuyAgain(item)}
                            className="px-4 py-2 bg-[#ffd814] hover:bg-[#f7ca00] text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Buy it Again</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Quick Actions Row (Cancel / Return) */}
                  {(canCancel || canRequestReturn) && !isExpanded && (
                    <div className="flex flex-wrap justify-end gap-2">
                      {canCancel && (
                        <button
                          onClick={() => setCancellingOrder(order)}
                          className="px-3.5 py-1.5 border border-red-300 text-red-600 hover:bg-red-50 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Cancel Order
                        </button>
                      )}
                      {canRequestReturn && (
                        <button
                          onClick={() => setReturningOrder(order)}
                          className="px-3.5 py-1.5 border border-orange-300 text-orange-700 hover:bg-orange-50 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Request Return / Refund</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Expandable Order Details, Price Breakdown & Chronological Tracking Timeline */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-slate-200 text-xs space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl">
                        <div>
                          <div className="font-bold text-slate-900 mb-1 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-orange-600" />
                            <span>Delivery Address</span>
                          </div>
                          <p className="text-slate-700">{order.deliveryAddress}</p>
                          {order.landmark && (
                            <p className="text-slate-500">Landmark: {order.landmark}</p>
                          )}
                          <p className="text-slate-500">
                            {order.locality}, {order.city}
                            {order.district && order.district !== order.city ? ` (${order.district})` : ''}
                            {order.state ? `, ${order.state}` : ''} — {order.pinCode}
                          </p>
                          <p className="text-slate-700 font-mono mt-1">Mobile: {order.customerPhone}</p>
                        </div>

                        <div>
                          <div className="font-bold text-slate-900 mb-1">Price Breakdown</div>
                          <div className="space-y-1 text-slate-600">
                            <div className="flex justify-between">
                              <span>Items Subtotal:</span>
                              <span className="font-mono font-semibold text-slate-800">
                                ₹{new Intl.NumberFormat('en-IN').format(computedSubtotal)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Shipping & Transport:</span>
                              <span className="font-mono font-semibold text-slate-800">
                                {order.deliveryFee ? `₹${new Intl.NumberFormat('en-IN').format(order.deliveryFee)}` : 'FREE'}
                              </span>
                            </div>
                            {(order.codFee || 0) > 0 && (
                              <div className="flex justify-between">
                                <span>COD Handling Fee:</span>
                                <span className="font-mono font-semibold text-slate-800">
                                  ₹{new Intl.NumberFormat('en-IN').format(order.codFee || 0)}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-slate-900">
                              <span>Grand Total:</span>
                              <span className="font-mono">₹{formattedTotal}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="font-bold text-slate-900 mb-1">Order Notes & Instructions</div>
                          <p className="text-slate-600 italic">
                            {order.notes || 'No special delivery instructions provided.'}
                          </p>
                        </div>
                      </div>

                      {/* 10-Stage Chronological Tracking Timeline */}
                      {order.trackingEvents && order.trackingEvents.length > 0 && (
                        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                          <div className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                            Live Shipment & Status Timeline
                          </div>
                          <div className="space-y-2.5 border-l-2 border-emerald-200 pl-4 ml-1">
                            {order.trackingEvents.map((ev) => (
                              <div key={ev.id} className="relative">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 absolute -left-[21px] top-1 ring-2 ring-white" />
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="font-bold text-slate-900">{ev.title}</span>
                                  <span className="text-[11px] text-slate-400 font-mono">
                                    {new Date(ev.createdAt).toLocaleString('en-IN', {
                                      day: 'numeric',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                                {ev.description && (
                                  <p className="text-slate-600 text-[11px] mt-0.5">{ev.description}</p>
                                )}
                                {ev.location && (
                                  <p className="text-slate-400 text-[10px]">Location: {ev.location}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Cancel / Return Buttons */}
                      {(canCancel || canRequestReturn) && (
                        <div className="flex flex-wrap justify-end gap-2 pt-2">
                          {canCancel && (
                            <button
                              onClick={() => setCancellingOrder(order)}
                              className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                            >
                              Cancel this Order
                            </button>
                          )}
                          {canRequestReturn && (
                            <button
                              onClick={() => setReturningOrder(order)}
                              className="px-4 py-2 border border-orange-300 text-orange-700 hover:bg-orange-50 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Request Return / Refund</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Modal */}
      {cancellingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-red-600 font-bold text-base">
              <AlertCircle className="w-5 h-5" />
              <span>Cancel Order #{cancellingOrder.orderNumber}?</span>
            </div>

            <p className="text-xs text-slate-600">
              Orders can only be cancelled before they are packed/shipped from the seller. Select a reason:
            </p>

            <select
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full p-2.5 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="Need to change delivery address">Need to change delivery address</option>
              <option value="Placed order by mistake">Placed order by mistake</option>
              <option value="Found better pricing elsewhere">Found better pricing elsewhere</option>
              <option value="Expected delivery is too late">Expected delivery is too late</option>
              <option value="Ordered duplicate items">Ordered duplicate items</option>
            </select>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancellingOrder(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Keep Order
              </button>
              <button
                type="button"
                disabled={isSubmittingCancel}
                onClick={handleConfirmCancel}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSubmittingCancel ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Request Modal */}
      {returningOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-orange-700 font-bold text-base">
              <RefreshCw className="w-5 h-5" />
              <span>Request Return for #{returningOrder.orderNumber}</span>
            </div>

            <p className="text-xs text-slate-600">
              Your return request will be sent to the seller and MattoKart support team for verification and refund processing.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Return Reason</label>
              <select
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="Item damaged / defective on delivery">Item damaged / defective on delivery</option>
                <option value="Wrong product or size delivered">Wrong product or size delivered</option>
                <option value="Quality mismatch vs listing description">Quality mismatch vs listing description</option>
                <option value="Missing parts or accessories">Missing parts or accessories</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Additional Details (Optional)</label>
              <textarea
                rows={2}
                value={returnNote}
                onChange={(e) => setReturnNote(e.target.value)}
                placeholder="Describe issue or preferred pickup timing..."
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReturningOrder(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                disabled={isSubmittingReturn}
                onClick={handleConfirmReturn}
                className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSubmittingReturn ? 'Submitting...' : 'Submit Return Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
