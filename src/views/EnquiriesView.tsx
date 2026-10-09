import React from 'react';
import {
  MessageSquare,
  Store,
  Phone,
  MessageCircle,
  Calendar,
  Package,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { BuyerEnquiry } from '../types';

interface EnquiriesViewProps {
  enquiries: BuyerEnquiry[];
  onGoToCatalog: () => void;
}

export const EnquiriesView: React.FC<EnquiriesViewProps> = ({
  enquiries,
  onGoToCatalog,
}) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-wider mb-1">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Buyer Enquiries Tracker</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-brand">
            My Direct Shop Enquiries
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Track communications with Saharanpur shopkeepers and vendors
          </p>
        </div>

        <button
          onClick={onGoToCatalog}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <span>Browse More Products</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Enquiries List */}
      {enquiries.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto">
            <MessageSquare className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">No Enquiries Sent Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Whenever you send an enquiry for cement, sariya, Sheesham woodcraft, or electronics, it will appear here for easy follow-up.
            </p>
          </div>
          <button
            onClick={onGoToCatalog}
            className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl"
          >
            Start Browsing Products
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {enquiries.map((enq) => {
            const cleanPhone = (enq.sellerPhone || '').replace(/\D/g, '');
            const whatsappUrl = `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${encodeURIComponent(
              `Namaste! Following up on enquiry #${enq.id} for "${enq.productName || 'Product'}" on MattoKart.`
            )}`;
            const fallbackImg =
              'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80';

            return (
              <div
                key={enq.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 hover:border-orange-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-md border border-orange-200/60">
                      {enq.id}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {enq.createdAt}
                    </span>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold self-start sm:self-auto ${
                    enq.status === 'resolved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : enq.status === 'seller_contacted'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {enq.status === 'resolved'
                      ? 'Completed'
                      : enq.status === 'seller_contacted'
                      ? 'Seller Responded'
                      : 'Enquiry Sent'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <img
                    src={enq.productImage || fallbackImg}
                    alt={enq.productName || 'Product'}
                    className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = fallbackImg;
                    }}
                  />
                  <div className="flex-1 space-y-1">
                    <h3 className="font-bold text-slate-900 text-sm">
                      {enq.productName}
                    </h3>
                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3">
                      <span>
                        Price: <strong>₹{new Intl.NumberFormat('en-IN').format(enq.productPrice)} / {enq.unit}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Quantity: <strong>{enq.quantityNeeded} {enq.unit}s</strong>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-700">
                        <Store className="w-3 h-3 text-orange-600" />
                        <strong>{enq.sellerShopName}</strong>
                      </span>
                    </div>

                    <div className="pt-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                      <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block mb-0.5">
                        Your Message Note:
                      </span>
                      "{enq.message}"
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="text-slate-500">
                    Delivery Locality: <strong>{enq.buyerLocality}</strong>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Chat on WhatsApp</span>
                    </a>
                    <a
                      href={`tel:${enq.sellerPhone.replace(/\s+/g, '')}`}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-orange-600" />
                      <span>Call Seller</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
