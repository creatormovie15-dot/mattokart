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
  Printer,
  MessageCircle,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { Order, OrderStatus } from '../types';

interface OrdersViewProps {
  orders: Order[];
  onCancelOrder: (orderId: string, reason: string) => Promise<boolean>;
  onBuyAgain: (item: Order['items'][0]) => void;
  onGoToCatalog: () => void;
}

const ORDER_STEPS: { status: OrderStatus; label: string; icon: any }[] = [
  { status: 'placed', label: 'Order Placed', icon: Clock },
  { status: 'confirmed', label: 'Confirmed by Shop', icon: CheckCircle2 },
  { status: 'processing', label: 'Packing & Ready', icon: Store },
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
  const [cancelReason, setCancelReason] = useState('Need to change delivery address');
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
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-brand">
            Your Orders (Mera Orders)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track package delivery, manage orders, and re-order items from verified Saharanpur dukaans.
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
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg max-w-md">
        <button
          onClick={() => setFilterStatus('all')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
            filterStatus === 'all'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All ({orders.length})
        </button>
        <button
          onClick={() => setFilterStatus('in_progress')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
            filterStatus === 'in_progress'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          In Progress
        </button>
        <button
          onClick={() => setFilterStatus('delivered')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
            filterStatus === 'delivered'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Delivered
        </button>
        <button
          onClick={() => setFilterStatus('cancelled')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
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
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No orders found</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            You don&apos;t have any orders under this filter. Explore authentic local Saharanpur goods.
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
            const isCancelled = order.orderStatus === 'cancelled';
            const canCancel = order.orderStatus === 'placed' || order.orderStatus === 'confirmed';
            const isExpanded = expandedOrderId === order.id;

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-all"
              >
                {/* Amazon-Style Order Header */}
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
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Amount</span>
                      <span className="font-bold text-slate-900">₹{formattedTotal}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Ship To</span>
                      <span className="font-semibold text-slate-800 truncate max-w-[150px] block" title={order.customerName}>
                        {order.customerName}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Delivery Mode</span>
                      <span className="font-semibold text-slate-800">
                        {order.deliveryType === 'mattokart_delivery' ? 'MattoKart Express' : 'Seller Direct Delivery'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-500 font-bold text-xs">
                      #{order.orderNumber}
                    </span>
                    <button
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer"
                      title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Status Bar */}
                <div className="p-5 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          isCancelled
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : order.orderStatus === 'delivered'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-900 border border-amber-200'
                        }`}
                      >
                        {isCancelled
                          ? 'Cancelled'
                          : order.orderStatus === 'delivered'
                          ? 'Delivered'
                          : order.orderStatus === 'out_for_delivery'
                          ? 'Out for Delivery'
                          : order.orderStatus === 'processing'
                          ? 'Processing at Dukaan'
                          : order.orderStatus === 'confirmed'
                          ? 'Confirmed by Merchant'
                          : 'Order Placed'}
                      </span>

                      <span className="text-xs text-slate-500">
                        Payment: <strong className="uppercase text-slate-800">{order.paymentMethod}</strong> (
                        {order.paymentStatus === 'completed' ? (
                          <span className="text-emerald-700 font-bold">Paid</span>
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

                  {/* Delivery Tracking Stepper (Only if not cancelled) */}
                  {!isCancelled && (
                    <div className="py-2">
                      <div className="relative flex items-center justify-between">
                        {/* Connecting Line */}
                        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-100 z-0" />
                        <div
                          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-600 transition-all duration-500 z-0"
                          style={{
                            width: `${(currentStep / (ORDER_STEPS.length - 1)) * 100}%`,
                          }}
                        />

                        {ORDER_STEPS.map((st, idx) => {
                          const StepIcon = st.icon;
                          const isCompleted = idx <= currentStep;
                          const isCurrent = idx === currentStep;

                          return (
                            <div key={st.status} className="relative z-10 flex flex-col items-center">
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
                                className={`text-[10px] font-bold mt-1 text-center max-w-[70px] leading-tight ${
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
                            ({order.deliveryPartnerVehicle || 'Bike'} · {order.deliveryPartnerPhone})
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        Dispatched
                      </span>
                    </div>
                  )}

                  {/* Order Items */}
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {order.items.map((item) => (
                      <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.productImage || ''}
                            alt=""
                            className="w-16 h-16 rounded-lg object-contain bg-slate-50 border border-slate-200 shrink-0"
                          />
                          <div className="space-y-1">
                            <h4 className="font-bold text-slate-900 text-sm leading-snug">
                              {item.productName}
                            </h4>
                            <div className="text-slate-500 flex items-center gap-2">
                              <span>Qty: <strong className="text-slate-800">{item.quantity} {item.unit}</strong></span>
                              <span>·</span>
                              <span>Sold by: <strong className="text-slate-800">{item.sellerShopName || 'Saharanpur Merchant'}</strong></span>
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

                  {/* Expandable Order Details & Cancel Option */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-slate-200 text-xs space-y-3 animate-in fade-in">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl">
                        <div>
                          <div className="font-bold text-slate-900 mb-1 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-orange-600" />
                            <span>Delivery Address</span>
                          </div>
                          <p className="text-slate-700">{order.deliveryAddress}</p>
                          <p className="text-slate-500">{order.locality}, {order.city} - {order.pinCode}</p>
                          <p className="text-slate-600 font-mono mt-1">Phone: {order.customerPhone}</p>
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 mb-1">Order Notes / Customer Request</div>
                          <p className="text-slate-600 italic">
                            {order.notes || 'No special delivery instructions provided.'}
                          </p>
                        </div>
                      </div>

                      {/* Cancel Order Button */}
                      {canCancel && (
                        <div className="flex justify-end pt-2">
                          <button
                            onClick={() => setCancellingOrder(order)}
                            className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Cancel this Order
                          </button>
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
              Orders can only be cancelled before they leave the shop for dispatch. Please select a reason for cancellation:
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
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
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
    </div>
  );
};
