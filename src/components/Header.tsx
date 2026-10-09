import React, { useState } from 'react';
import {
  Search,
  MapPin,
  Store,
  ChevronDown,
  Menu,
  X,
  MessageSquare,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Layers,
  ShoppingBag,
  Info
} from 'lucide-react';
import { ActiveTab, SaharanpurLocality } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedLocality: SaharanpurLocality;
  onOpenLocationModal: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onPerformSearch: (query: string) => void;
  enquiriesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedLocality,
  onOpenLocationModal,
  searchQuery,
  setSearchQuery,
  onPerformSearch,
  enquiriesCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPerformSearch(searchQuery);
  };

  const getRoleLabel = () => {
    if (activeTab === 'seller-dashboard') return 'Seller Portal';
    if (activeTab === 'admin-dashboard') return 'Admin Portal';
    return 'Buyer Mode';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Top Banner for Saharanpur Local Launch */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white text-xs py-1.5 px-4 font-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 truncate">
            <span className="bg-white/20 text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full">
              Saharanpur Special
            </span>
            <span className="truncate">
              Dukaandar Bhaiyon ke liye sunhara mauka! Register your shop on MattoKart for just{' '}
              <strong className="underline underline-offset-2">₹199 / Year</strong>.
            </span>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={() => {
                setActiveTab('seller-register');
                setMobileMenuOpen(false);
              }}
              className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold bg-white text-orange-700 px-2.5 py-0.5 rounded-full hover:bg-orange-50 transition-colors shadow-xs"
            >
              Register Shop <ArrowRight className="w-3 h-3" />
            </button>

            {/* Quick Mode Toggle for Testing / Evaluation */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-1.5 bg-black/25 hover:bg-black/35 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-white/20 transition-all cursor-pointer"
                title="Switch view between Buyer, Seller, and Admin"
              >
                <span>{getRoleLabel()}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {roleMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-1.5 w-56 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 p-1.5 z-50 text-xs"
                  onClick={() => setRoleMenuOpen(false)}
                >
                  <div className="px-2.5 py-1 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Switch App View
                  </div>
                  <button
                    onClick={() => setActiveTab('home')}
                    className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-800 transition-colors ${
                      activeTab === 'home' || activeTab === 'catalog'
                        ? 'bg-orange-600/30 text-orange-300 font-semibold'
                        : 'text-slate-200'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-orange-400" />
                    <span>Buyer Marketplace</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('seller-dashboard')}
                    className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-800 transition-colors ${
                      activeTab === 'seller-dashboard'
                        ? 'bg-amber-600/30 text-amber-300 font-semibold'
                        : 'text-slate-200'
                    }`}
                  >
                    <Store className="w-3.5 h-3.5 text-amber-400" />
                    <span>Seller Dashboard</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('admin-dashboard')}
                    className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-800 transition-colors ${
                      activeTab === 'admin-dashboard'
                        ? 'bg-emerald-600/30 text-emerald-300 font-semibold'
                        : 'text-slate-200'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Admin Control Center</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Nav Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3 md:gap-6">
          {/* Brand Logo & Tagline */}
          <div
            className="flex items-center gap-3 cursor-pointer shrink-0 select-none group"
            onClick={() => setActiveTab('home')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-500 text-white flex items-center justify-center font-black text-xl shadow-md shadow-orange-500/30 group-hover:scale-105 transition-transform">
              M
            </div>
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1.5">
                <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-orange-600 via-amber-600 to-slate-900 bg-clip-text text-transparent font-brand">
                  MattoKart
                </span>
                <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider bg-orange-100 px-1.5 py-0.2 rounded hidden sm:inline-block">
                  Saharanpur
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-500 -mt-1 hidden sm:block">
                Sab Kuch, Ek Hi Jagah!
              </span>
            </div>
          </div>

          {/* Location Selector Pill */}
          <button
            onClick={onOpenLocationModal}
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-orange-50 hover:border-orange-300 border border-slate-200/80 rounded-full text-xs font-medium text-slate-700 transition-all shrink-0 group cursor-pointer"
            title="Click to change Saharanpur locality or PIN code"
          >
            <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <div className="text-[10px] text-slate-600 leading-none">Delivering to</div>
              <div className="font-semibold text-slate-900 group-hover:text-orange-950 flex items-center gap-1 leading-tight">
                <span className="truncate max-w-[130px]">{selectedLocality?.name || 'Saharanpur'}</span>
                <span className="text-slate-600 font-mono text-[11px]">({selectedLocality?.pinCode || '247001'})</span>
                <ChevronDown className="w-3 h-3 text-slate-600" />
              </div>
            </div>
          </button>

          {/* Global Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 max-w-xl relative"
          >
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cement, woodcraft, sariya, clothes, rice, local shops..."
                className="w-full pl-10 pr-20 py-2.5 text-sm bg-slate-100/80 border border-slate-200 rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 placeholder:text-slate-400 transition-all"
              />
              <button
                type="submit"
                className="absolute right-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-full text-xs font-semibold transition-colors cursor-pointer"
              >
                Search
              </button>
            </div>
          </form>

          {/* Action CTAs Desktop */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            {/* My Enquiries */}
            <button
              onClick={() => setActiveTab('enquiries')}
              className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'enquiries'
                  ? 'bg-orange-50 text-orange-600 border border-orange-200'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
              title="My Direct Buyer Enquiries"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Enquiries</span>
              {enquiriesCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-orange-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {enquiriesCount}
                </span>
              )}
            </button>

            {/* Become a Seller Button */}
            <button
              onClick={() => setActiveTab('seller-register')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-all shadow-xs cursor-pointer"
            >
              <Store className="w-4 h-4 text-slate-950" />
              <span>Sell on MattoKart</span>
              <span className="bg-slate-900 text-amber-300 text-[10px] px-1.5 py-0.5 rounded-sm font-mono">
                ₹199/yr
              </span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-1">
            <button
              onClick={onOpenLocationModal}
              className="p-2 text-slate-700 hover:text-orange-600"
              title="Select Location"
            >
              <MapPin className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-orange-600"
              aria-label="Open menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Sub Nav Bar Desktop */}
        <div className="hidden md:flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 text-xs text-slate-600 font-medium">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('home')}
              className={`hover:text-orange-600 transition-colors cursor-pointer ${
                activeTab === 'home' ? 'text-orange-600 font-bold' : ''
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              className={`flex items-center gap-1 hover:text-orange-600 transition-colors cursor-pointer ${
                activeTab === 'catalog' ? 'text-orange-600 font-bold' : ''
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Products & Categories</span>
            </button>
            <button
              onClick={() => setActiveTab('shops')}
              className={`flex items-center gap-1 hover:text-orange-600 transition-colors cursor-pointer ${
                activeTab === 'shops' ? 'text-orange-600 font-bold' : ''
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Saharanpur Shops</span>
            </button>
            <button
              onClick={() => {
                onPerformSearch('woodcraft');
              }}
              className="flex items-center gap-1 text-amber-700 hover:text-amber-800 font-semibold cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Saharanpur Woodcraft GI</span>
            </button>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <button
              onClick={() => setActiveTab('legal')}
              className="hover:text-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Info className="w-3.5 h-3.5" />
              <span>About & Help</span>
            </button>
            <span className="text-slate-300">|</span>
            <span className="text-[11px] text-emerald-800 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-700 animate-pulse" />
              Verified Local Sellers in Saharanpur
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-4 shadow-xl">
          {/* Location Banner */}
          <button
            onClick={() => {
              onOpenLocationModal();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-between p-3 bg-orange-50/80 rounded-xl border border-orange-200/70 text-left"
          >
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-orange-600 shrink-0" />
              <div>
                <div className="text-[11px] text-slate-500">Delivery Locality</div>
                <div className="font-semibold text-slate-900 text-xs">
                  {selectedLocality?.name || 'Saharanpur'} ({selectedLocality?.pinCode || '247001'})
                </div>
              </div>
            </div>
            <span className="text-xs text-orange-600 font-semibold">Change</span>
          </button>

          {/* Navigation Links */}
          <div className="space-y-1.5 text-sm font-medium">
            <button
              onClick={() => {
                setActiveTab('home');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left p-2.5 rounded-lg flex items-center justify-between ${
                activeTab === 'home' ? 'bg-orange-50 text-orange-600 font-bold' : 'text-slate-700'
              }`}
            >
              <span>Home</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={() => {
                setActiveTab('catalog');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left p-2.5 rounded-lg flex items-center justify-between ${
                activeTab === 'catalog' ? 'bg-orange-50 text-orange-600 font-bold' : 'text-slate-700'
              }`}
            >
              <span>Browse Products & Categories</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={() => {
                setActiveTab('shops');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left p-2.5 rounded-lg flex items-center justify-between ${
                activeTab === 'shops' ? 'bg-orange-50 text-orange-600 font-bold' : 'text-slate-700'
              }`}
            >
              <span>Saharanpur Local Shops</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={() => {
                setActiveTab('enquiries');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left p-2.5 rounded-lg flex items-center justify-between ${
                activeTab === 'enquiries' ? 'bg-orange-50 text-orange-600 font-bold' : 'text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>My Enquiries</span>
                {enquiriesCount > 0 && (
                  <span className="bg-orange-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                    {enquiriesCount}
                  </span>
                )}
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Seller / Admin CTAs */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <button
              onClick={() => {
                setActiveTab('seller-register');
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs"
            >
              <Store className="w-4 h-4" />
              <span>Register as a Seller (₹199 / Year)</span>
            </button>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  setActiveTab('seller-dashboard');
                  setMobileMenuOpen(false);
                }}
                className="py-2 px-3 text-center text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg"
              >
                Seller Portal
              </button>
              <button
                onClick={() => {
                  setActiveTab('admin-dashboard');
                  setMobileMenuOpen(false);
                }}
                className="py-2 px-3 text-center text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg"
              >
                Admin Center
              </button>
            </div>
            <button
              onClick={() => {
                setActiveTab('legal');
                setMobileMenuOpen(false);
              }}
              className="w-full text-center py-2 text-xs text-slate-500 hover:text-slate-800"
            >
              About MattoKart & Legal Guidelines
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
