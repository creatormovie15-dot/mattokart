import React from 'react';
import {
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react';
import { ActiveTab, LegalDocType, CategoryId } from '../types';

interface FooterProps {
  setActiveTab: (tab: ActiveTab) => void;
  onOpenLegalDoc: (doc: LegalDocType) => void;
  onSelectCategory?: (catId: CategoryId) => void;
  onSelectSearch?: (query: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  setActiveTab,
  onOpenLegalDoc,
  onSelectCategory,
  onSelectSearch,
}) => {
  return (
    <footer className="bg-[#081b33] text-slate-300 pt-10 pb-24 md:pb-8 border-t border-white/10 text-sm">
      <div className="max-w-[1400px] mx-auto px-4 space-y-7">
        {/* Main 5-Column Grid Matching Blueprint */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-7">
          {/* Column 1: Brand Summary & Quick Action Icons */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-[#f97316] to-amber-500 text-white flex items-center justify-center font-black text-lg shadow-md">
                M
              </div>
              <div className="leading-none">
                <span className="font-extrabold text-xl tracking-tight text-white font-brand">
                  Matto<span className="text-[#f97316]">Kart</span>
                </span>
                <span className="block text-[10px] font-medium text-slate-300 mt-0.5">
                  Sab Kuch, Ek Hi Jagah!
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              India Ka Apna Shopping Marketplace — Buy Anywhere. Sell Everywhere. Connecting verified sellers across all 28 States &amp; 8 UTs starting from Saharanpur (UP-11).
            </p>

            <div className="flex items-center gap-2 pt-1">
              <a
                href="tel:+918221077674"
                aria-label="Call MattoKart"
                className="w-8 h-8 rounded-full bg-[#122b4e] hover:bg-[#f97316] text-white flex items-center justify-center transition-colors"
                title="Call +91 8221077674"
              >
                <Phone className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://wa.me/918221077674"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp MattoKart"
                className="w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition-colors"
                title="WhatsApp Support"
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </a>
              <a
                href="mailto:creatormovie15@gmail.com"
                aria-label="Email MattoKart"
                className="w-8 h-8 rounded-full bg-[#122b4e] hover:bg-[#f97316] text-white flex items-center justify-center transition-colors"
                title="creatormovie15@gmail.com"
              >
                <Mail className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-2.5">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <button
                  type="button"
                  onClick={() => setActiveTab('home')}
                  className="hover:text-orange-400 transition-colors cursor-pointer"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenLegalDoc('about')}
                  className="hover:text-orange-400 transition-colors cursor-pointer"
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenLegalDoc('contact')}
                  className="hover:text-orange-400 transition-colors cursor-pointer"
                >
                  Contact Us
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenLegalDoc('privacy')}
                  className="hover:text-orange-400 transition-colors cursor-pointer"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenLegalDoc('terms')}
                  className="hover:text-orange-400 transition-colors cursor-pointer"
                >
                  Terms &amp; Conditions
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Service */}
          <div className="space-y-2.5">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">
              Customer Service
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className="hover:text-orange-400 transition-colors cursor-pointer"
                >
                  Track Order
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenLegalDoc('returns-refunds')}
                  className="hover:text-orange-400 transition-colors cursor-pointer"
                >
                  Returns &amp; Refunds
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveTab('wishlist')}
                  className="hover:text-orange-400 transition-colors cursor-pointer"
                >
                  Saved Wishlist
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveTab('enquiries')}
                  className="hover:text-orange-400 transition-colors cursor-pointer"
                >
                  Buyer Enquiries
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectCategory) onSelectCategory('construction');
                    else setActiveTab('catalog');
                  }}
                  className="hover:text-orange-400 transition-colors cursor-pointer"
                >
                  Construction Supplies
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectCategory) onSelectCategory('furniture');
                    else if (onSelectSearch) onSelectSearch('woodcraft');
                    else setActiveTab('catalog');
                  }}
                  className="hover:text-orange-400 transition-colors cursor-pointer"
                >
                  Woodcraft Catalog
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Seller Corner */}
          <div className="space-y-2.5">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">
              Seller Corner
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <button
                  type="button"
                  onClick={() => setActiveTab('seller-register')}
                  className="text-amber-400 hover:text-amber-300 font-semibold transition-colors cursor-pointer"
                >
                  Seller Registration (₹0 Fee)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveTab('seller-dashboard')}
                  className="hover:text-orange-400 transition-colors cursor-pointer"
                >
                  Seller Dashboard
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveTab('shops')}
                  className="hover:text-orange-400 transition-colors cursor-pointer"
                >
                  Featured Shops Directory
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenLegalDoc('seller-agreement')}
                  className="hover:text-orange-400 transition-colors cursor-pointer"
                >
                  Seller Agreement
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveTab('admin-dashboard')}
                  className="hover:text-orange-400 transition-colors cursor-pointer"
                >
                  Admin Control Center
                </button>
              </li>
            </ul>
          </div>

          {/* Column 5: Contact Us & Saharanpur Support */}
          <div className="space-y-2.5">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">
              Contact Us
            </h4>
            <div className="space-y-2 text-xs text-slate-300">
              <a
                href="mailto:creatormovie15@gmail.com"
                className="flex items-center gap-2 hover:text-orange-400 transition-colors break-all"
              >
                <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>creatormovie15@gmail.com</span>
              </a>
              <a
                href="tel:+918221077674"
                className="flex items-center gap-2 hover:text-orange-400 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>+91 8221077674</span>
              </a>
              <a
                href="https://wa.me/918221077674"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                <span>WhatsApp Chat</span>
              </a>
              <div className="flex items-start gap-2 text-slate-400 pt-1">
                <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                <span>Court Road Commercial Hub, Saharanpur, UP - 247001</span>
              </div>
            </div>
          </div>
        </div>

        {/* Permitted Goods & Lawful Trade Notice */}
        <div className="px-4 py-2.5 rounded-xl bg-[#0d2444] border border-white/10 text-xs text-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Permitted Goods Only:</strong> Verified Pan-India merchants &amp; artisans with Cash on Delivery, local &amp; interstate courier fulfillment.
            </span>
          </div>
          <span className="text-[11px] text-amber-300 shrink-0 font-semibold">
            Free 1st Year Seller Onboarding
          </span>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            © {new Date().getFullYear()} MattoKart. All Rights Reserved. | Sab Kuch, Ek Hi Jagah!
          </div>
          <div className="text-slate-300">
            Buy Anywhere. Sell Everywhere. · Made in India
          </div>
        </div>
      </div>
    </footer>
  );
};
