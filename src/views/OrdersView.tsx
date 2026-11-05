import React, { useState } from 'react';
import {
  Package,
  Calendar,
  MapPin,
  Store,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  AlertCircle,
  ArrowRight,
  ShoppingBag,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Order, OrderStatus, Product } from '../types';

interface OrdersViewProps {
  orders: Order[];
  onCancelOrder: (orderId: string, reason: string) => Promise<boolean>;
  onBuyAgain: (item: Order['items'][0]) => void;
  onGoToCatalog: () => void;
}

const ORDER_STEPS: { status: OrderStatus; label: string; icon: any }[] = [
  { status: 'placed', label: 'Order Placed', icon: Clock },
  { status: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { status: 'processing', label: 'Processing in Shop', icon: Store },
  { status: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
  { status: 'delivered', label: 'Delivered', icon: Package },
];

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  onCancelOrder,
  onBuyAgain,
  onGoToCatalog,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'in_progress' | 'delivered' | 'cancelled'>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Cancellation modal state
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('Found better price elsewhere');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  const filteredOrders = orders.filter((order) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'cancelled') return order.orderStatus === 'cancelled';
    if (filterStatus === 'delivered') return order.orderStatus === 'delivered';
    if (filterStatus === 'in_progress') {
      return (
        order.orderStatus === 'placed' ||
        order.orderStatus === 'confirmed' ||
        order.orderStatus === 'processing' ||
        order.orderStatus === 'out_for_delivery'
      );
    }
    return true;
  });

  const getStepIndex = (status: OrderStatus): number => {
    switch (status) {
      case 'placed':
        return 0;
      case 'confirmed':
        return 1;
      case 'processing':
        return 2;
      case 'out_for_delivery':
        return 3;
      case 'delivered':
        return 4;
      case 'cancelled':
        return -1;
      default:
        return 0;
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-brand">
            My Orders (Mera Orders)
          </h1>
          <p className="text-xs text-slate-500">
            Track order delivery status, view invoices, or re-order from verified Saharanpur shops.
          </p>
        </div>

        <button
          onClick={onGoToCatalog}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <span>Shop More Items</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl max-w-md">
        <button
          onClick={() => setFilterStatus('all')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            filterStatus === 'all'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All ({orders.length})
        </button>
        <button
          onClick={() => setFilterStatus('in_progress')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            filterStatus === 'in_progress'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          In Progress
        </button>
        <button
          onClick={() => setFilterStatus('delivered')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            filterStatus === 'delivered'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Delivered
        </button>
        <button
          onClick={() => setFilterStatus('cancelled')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            filterStatus === 'cancelled'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Cancelled
        </button>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No orders found</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            You don&apos;t have any orders matching the selected filter.
          </p>
          <button
            onClick={onGoToCatalog}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Explore Catalog
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const formattedTotal = new Intl.NumberFormat('en-IN').format(order.totalAmount);
            const currentStep = getStepIndex(order.orderStatus);
            const isCancelled = order.orderStatus === 'cancelled';
            const canCancel = order.orderStatus === 'placed' || order.orderStatus === 'confirmed';
            const isExpanded = expandedOrderId === order.id;

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:border-slate-300 transition-all"
              >
                {/* Order Top Bar */}
                <div className="bg-slate-50/90 px-5 py-3.5 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-4 text-slate-600">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Order Placed</span>
                      <span className="font-semibold text-slate-800">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Total Amount</span>
                      <span className="font-bold text-slate-900">₹{formattedTotal}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Deliver To</span>
                      <span className="font-semibold text-slate-800 truncate max-w-[140px] block">
                        {order.customerName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-500 font-bold">
                      #{order.orderNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                        isCancelled
                          ? 'bg-red-100 text-red-800'
                          : order.orderStatus === 'delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {order.orderStatus.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Progress Tracker (Amazon-Style Visual Steps) */}
                {!isCancelled ? (
                  <div className="p-5 border-b border-slate-100 bg-white">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Truck className="w-4 h-4 text-orange-600" />
                      <span>Delivery Tracker: Local Saharanpur Courier</span>
                    </div>

                    <div className="relative flex items-center justify-between max-w-2xl mx-auto px-4">
                      {/* Connecting line */}
                      <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-200 z-0" />
                      <div
                        className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 transition-all duration-500 z-0"
                        style={{
                          width: `${Math.min(100, Math.max(0, (currentStep / (ORDER_STEPS.length - 1)) * 100))}%`,
                        }}
                      />

                      {ORDER_STEPS.map((step, idx) => {
                        const Icon = step.icon;
                        const isDone = currentStep >= idx;
                        const isCurrent = currentStep === idx;

                        return (
                          <div key={step.status} className="relative z-10 flex flex-col items-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                                isDone
                                  ? 'bg-emerald-600 text-white'
                                  : isCurrent
                                  ? 'bg-amber-500 text-white ring-4 ring-amber-100'
                                  : 'bg-white border-2 border-slate-300 text-slate-400'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <span
                              className={`text-[10px] mt-1.5 font-medium whitespace-nowrap hidden sm:block ${
                                isDone ? 'text-slate-900 font-bold' : 'text-slate-400'
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-red-50/70 border-b border-red-200 text-xs text-red-800 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>
                      This order was cancelled. {order.notes ? `(${order.notes})` : ''}
                    </span>
                  </div>
                )}

                {/* Ordered Items List */}
                <div className="p-5 divide-y divide-slate-100">
                  {order.items.map((item) => {
                    const lineTotal = new Intl.NumberFormat('en-IN').format(item.totalPrice);
                    const unitPrice = new Intl.NumberFormat('en-IN').format(item.unitPrice);

                    return (
                      <div
                        key={item.id}
                        className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3.5 flex-1">
                          <img
                            src={item.productImage || ''}
                            alt=""
                            className="w-16 h-16 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                          />
                          <div className="space-y-0.5">
                            <h4 className="font-bold text-slate-900 text-sm leading-snug">
                              {item.productName}
                            </h4>
                            <div className="text-xs text-slate-500 flex items-center gap-2">
                              <span>₹{unitPrice} per {item.unit}</span>
                              <span>•</span>
                              <span>Qty: {item.quantity}</span>
                              {item.sellerShopName && (
                                <>
                                  <span>•</span>
                                  <span className="text-orange-700 font-medium">{item.sellerShopName}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                          <span className="font-extrabold text-slate-900 text-base font-mono">
                            ₹{lineTotal}
                          </span>

                          <button
                            type="button"
                            onClick={() => onBuyAgain(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Buy Again</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Order Footer & Actions */}
                <div className="bg-slate-50/70 px-5 py-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      Delivering to: <strong>{order.locality}, {order.pinCode}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Cancellation Button */}
                    {canCancel && (
                      <button
                        type="button"
                        onClick={() => setCancellingOrder(order)}
                        className="px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 border border-red-200 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        Cancel Order
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isExpanded ? 'Hide Details' : 'View Full Details'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="p-5 bg-slate-50 border-t border-slate-200 text-xs space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="font-bold text-slate-700 block mb-1">Customer & Contact</span>
                        <p className="text-slate-600">{order.customerName}</p>
                        <p className="text-slate-600">{order.customerPhone}</p>
                        {order.customerEmail && <p className="text-slate-600">{order.customerEmail}</p>}
                      </div>
                      <div>
                        <span className="font-bold text-slate-700 block mb-1">Delivery Address</span>
                        <p className="text-slate-600">{order.deliveryAddress}</p>
                        <p className="text-slate-600">{order.locality}, Saharanpur, UP — {order.pinCode}</p>
                      </div>
                      <div>
                        <span className="font-bold text-slate-700 block mb-1">Payment Information</span>
                        <p className="text-slate-600 font-medium uppercase">Method: {order.paymentMethod}</p>
                        <p className="text-slate-600">Status: <span className="capitalize">{order.paymentStatus}</span></p>
                        {order.notes && <p className="text-slate-500 mt-1 italic">Note: &quot;{order.notes}&quot;</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {cancellingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Cancel Order #{cancellingOrder.orderNumber}?
                </h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to cancel this order?
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Reason for Cancellation
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
              >
                <option value="Ordered by mistake">Ordered by mistake</option>
                <option value="Found better price in Saharanpur local market">Found better price in Saharanpur local market</option>
                <option value="Delivery time is too long">Delivery time is too long</option>
                <option value="Need to change shipping address or items">Need to change shipping address or items</option>
                <option value="Other reason">Other reason</option>
              </select>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setCancellingOrder(null)}
                disabled={isSubmittingCancel}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isSubmittingCancel}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                {isSubmittingCancel ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
