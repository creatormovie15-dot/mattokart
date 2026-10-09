import React from 'react';
import {
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  ShieldCheck,
  ArrowRight,
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
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-24 md:pb-12 border-t border-slate-800 text-sm">
      <div className="max-w-7xl mx-auto px-4 space-y-10">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center font-black text-xl shadow-lg">
                M
              </div>
              <div>
                <span className="font-extrabold text-2xl tracking-tight text-white font-brand">
                  MattoKart
                </span>
                <span className="block text-xs font-semibold text-orange-400">
                  Sab Kuch, Ek Hi Jagah!
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              MattoKart is the dedicated multi-vendor marketplace connecting Saharanpur's local manufacturers, master woodcraft artisans, building material distributors, and neighborhood retailers directly with buyers across western Uttar Pradesh.
            </p>

            <div className="space-y-2.5 text-xs text-slate-400 pt-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-400 shrink-0" />
                <span>Court Road Commercial Hub, Saharanpur, UP - 247001</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-orange-400 shrink-0" />
                <a
                  href="tel:+918221077674"
                  className="hover:text-orange-400 transition-colors"
                >
                  +91 8221077674
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <a
                  href="https://wa.me/918221077674"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 transition-colors"
                >
                  WhatsApp: +91 8221077674
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-orange-400 shrink-0" />
                <a
                  href="mailto:creatormovie15@gmail.com"
                  className="hover:text-orange-400 transition-colors break-all"
                >
                  creatormovie15@gmail.com
                </a>
              </div>
            </div>

            {/* Quick Contact Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <a
                href="tel:+918221077674"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-colors shadow-xs"
                title="Call MattoKart"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Us</span>
              </a>
              <a
                href="https://wa.me/918221077674"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-xs"
                title="WhatsApp MattoKart"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
              <a
                href="mailto:creatormovie15@gmail.com"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-medium transition-colors"
                title="Email MattoKart"
              >
                <Mail className="w-3.5 h-3.5 text-orange-400" />
                <span>Email Us</span>
              </a>
            </div>
          </div>

          {/* Marketplace Navigation */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">
              Marketplace
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => setActiveTab('catalog')}
                  className="hover:text-orange-400 transition-colors cursor-pointer"
                >
                  All Products
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('shops')}
                  className="hover:text-orange-400 transition-colors cursor-pointer"
                >
                  Saharanpur Verified Shops
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    if (onSelectCategory) {
                      onSelectCategory('construction');
                    } else {
                      setActiveTab('catalog');
                    }
                  }}
                  className="hover:text-orange-400 transition-colors cursor-pointer"
                >
                  Construction Materials
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    if (onSelectCategory) {
                      onSelectCategory('furniture');
                    } else if (onSelectSearch) {
                      onSelectSearch('woodcraft');
                    } else {
                      setActiveTab('catalog');
                    }
                  }}
                  className="hover:text-orange-400 transition-colors cursor-pointer"
                >
                  Saharanpur Woodcraft Special
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('enquiries')}
                  className="hover:text-orange-400 transition-colors cursor-pointer"
                >
                  Track My Enquiries
                </button>
              </li>
            </ul>
          </div>

          {/* For Sellers */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">
              For Sellers
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => setActiveTab('seller-register')}
                  className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>Become a Seller (FREE 1st Year)</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('seller-dashboard')}
                  className="hover:text-orange-400 transition-colors cursor-pointer"
                >
                  Seller Dashboard
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegalDoc('seller-agreement')}
                  className="hover:text-orange-400 transition-colors cursor-pointer"
                >
                  Seller Agreement (Draft)
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('admin-dashboard')}
                  className="hover:text-orange-400 transition-colors text-slate-400 cursor-pointer"
                >
                  Admin Moderation Portal
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Trust (Draft Pages) */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">
              Legal & Trust (Drafts)
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onOpenLegalDoc('about')}
                  className="hover:text-orange-400 transition-colors cursor-pointer"
                >
                  About MattoKart
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegalDoc('contact')}
                  className="hover:text-orange-400 transition-colors cursor-pointer"
                >
                  Contact Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegalDoc('terms')}
                  className="hover:text-orange-400 transition-colors cursor-pointer"
                >
                  Terms and Conditions
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegalDoc('privacy')}
                  className="hover:text-orange-400 transition-colors cursor-pointer"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegalDoc('returns-refunds')}
                  className="hover:text-orange-400 transition-colors cursor-pointer"
                >
                  Returns & Refunds Policy
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Permitted Goods & Anti-Prohibited Banner */}
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-xs text-slate-400 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Permitted Goods Only:</strong> MattoKart strictly enforces lawful trade. Prohibited, counterfeit, hazardous, or illegal goods are strictly disallowed.
            </span>
          </div>
          <span className="text-[11px] text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-full shrink-0">
            Legal drafts require review before public launch
          </span>
        </div>

        {/* Bottom Strip */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            © {new Date().getFullYear()} MattoKart Marketplace. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span>Saharanpur, Uttar Pradesh, India</span>
            <span>•</span>
            <span className="font-semibold text-slate-300">"Sab Kuch, Ek Hi Jagah!"</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
