import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  MapPin,
  Store,
  ChevronDown,
  Menu,
  X,
  MessageSquare,
  Sparkles,
  ArrowRight,
  LogOut,
  ShieldCheck,
  ShoppingCart,
  Package,
  Heart,
  Crown,
  Sun,
} from 'lucide-react';
import { ActiveTab, SaharanpurLocality, AuthUser, UserRole, CategoryId } from '../types';

interface HeaderProps {
  activeTab?: ActiveTab;
  setActiveTab?: (tab: ActiveTab) => void;
  selectedLocality: SaharanpurLocality;
  onOpenLocationModal: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onPerformSearch: (query: string) => void;
  enquiriesCount: number;
  cartCount?: number;
  wishlistCount?: number;
  currentUser?: AuthUser | null;
  onOpenAuthModal?: (role?: UserRole) => void;
  onLogout?: () => void;
  onSelectCategory?: (catId: CategoryId | 'all') => void;
}

export const Header: React.FC<HeaderProps> = ({
  setActiveTab,
  selectedLocality,
  onOpenLocationModal,
  searchQuery,
  setSearchQuery,
  onPerformSearch,
  enquiriesCount,
  cartCount = 0,
  wishlistCount = 0,
  currentUser,
  onOpenAuthModal,
  onLogout,
  onSelectCategory,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  const currentPath = location.pathname;
  const isWishlist = currentPath === '/wishlist';

  // Close account dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (setActiveTab) setActiveTab('catalog');
    const params = new URLSearchParams();
    if (q) params.set('search', q);
    const targetUrl = `/products${params.toString() ? `?${params.toString()}` : ''}`;
    navigate(targetUrl);
    onPerformSearch(q);
  };

  const handleNav = (path: string, tab?: ActiveTab) => {
    if (tab && setActiveTab) setActiveTab(tab);
    navigate(path);
    setMobileMenuOpen(false);
    setAccountMenuOpen(false);
  };

  const handleCategoryShortcut = (catId: CategoryId | 'all', searchTerm?: string) => {
    if (searchTerm) {
      setSearchQuery(searchTerm);
      if (setActiveTab) setActiveTab('catalog');
      navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
      onPerformSearch(searchTerm);
      return;
    }
    if (onSelectCategory) onSelectCategory(catId);
    handleNav(catId === 'all' ? '/products' : `/products?category=${encodeURIComponent(catId)}`, 'catalog');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#091e3a] text-white select-none shadow-md">
      {/* Slim Top Utility Strip (Exact Reference Match) */}
      <div className="bg-[#061529] text-[11px] text-slate-200 py-1 px-3 sm:px-4 border-b border-white/10">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-3">
          {/* Left: Location + Free First Year for Sellers */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={onOpenLocationModal}
              className="flex items-center gap-1 hover:text-orange-400 transition-colors cursor-pointer truncate"
              title="Change delivery location across India"
            >
              <MapPin className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              <span className="font-semibold text-white truncate">
                {selectedLocality?.name === 'Court Road'
                  ? 'Saharanpur, UP'
                  : selectedLocality?.state && selectedLocality.state !== 'Uttar Pradesh'
                  ? `${selectedLocality.city || selectedLocality.name}, ${selectedLocality.state.replace(' (UT)', '')}`
                  : `${selectedLocality?.name || 'Saharanpur'}, UP`}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>

            <span className="text-slate-600 hidden sm:inline">|</span>

            <button
              type="button"
              onClick={() => handleNav('/seller/register', 'seller-register')}
              className="hidden sm:flex items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold cursor-pointer whitespace-nowrap"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Free First Year for Sellers</span>
            </button>
          </div>

          {/* Right Utility Links */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 text-slate-200">
            <a
              href="https://wa.me/918221077674"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline hover:text-orange-400 transition-colors whitespace-nowrap"
            >
              Help
            </a>
            <span className="text-slate-600 hidden md:inline">|</span>

            <button
              type="button"
              onClick={() => handleNav('/orders', 'orders')}
              className="hidden sm:inline hover:text-orange-400 transition-colors cursor-pointer whitespace-nowrap"
            >
              Track Order
            </button>
            <span className="text-slate-600 hidden sm:inline">|</span>

            <button
              type="button"
              onClick={() => handleNav('/seller/register', 'seller-register')}
              className="text-slate-100 hover:text-orange-400 font-medium cursor-pointer whitespace-nowrap"
            >
              Become a Seller
            </button>
            <span className="text-slate-600">|</span>

            {/* Login / Register / Account Dropdown */}
            <div className="relative" ref={accountRef}>
              <button
                type="button"
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                className="flex items-center gap-1 hover:text-orange-400 font-medium cursor-pointer whitespace-nowrap"
              >
                <span>
                  {currentUser
                    ? `Hi, ${currentUser.fullName?.split(' ')[0] || 'User'}`
                    : 'Login / Register'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {accountMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 p-3 z-50">
                  {currentUser ? (
                    <div className="pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">
                          {(currentUser.fullName || currentUser.phone)[0].toUpperCase()}
                        </div>
                        <div className="truncate">
                          <div className="font-bold text-xs text-slate-900 truncate">
                            {currentUser.fullName || 'MattoKart Customer'}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">{currentUser.phone}</div>
                        </div>
                      </div>
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 px-2 py-0.5 rounded border border-orange-200 mt-1">
                        {currentUser.role === 'seller'
                          ? 'Seller Dukaan'
                          : currentUser.role === 'admin'
                          ? 'Administrator'
                          : 'Customer'}
                      </span>
                    </div>
                  ) : (
                    <div className="pb-3 border-b border-slate-100 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setAccountMenuOpen(false);
                          if (onOpenAuthModal) onOpenAuthModal('customer');
                        }}
                        className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
                      >
                        Login / Register via Mobile OTP
                      </button>
                      <div className="text-[11px] text-slate-500 mt-1.5">
                        Shop verified sellers across India
                      </div>
                    </div>
                  )}

                  <div className="py-2 space-y-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => handleNav('/orders', 'orders')}
                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 flex items-center justify-between text-slate-700 hover:text-slate-900 cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Package className="w-3.5 h-3.5 text-orange-600" />
                        <span>My Orders & Tracking</span>
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNav('/wishlist', 'wishlist')}
                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 flex items-center justify-between text-slate-700 hover:text-slate-900 cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Heart className="w-3.5 h-3.5 text-red-500" />
                        <span>My Wishlist</span>
                      </span>
                      {wishlistCount > 0 && (
                        <span className="font-bold text-[10px] bg-red-100 text-red-700 px-1.5 rounded-full">
                          {wishlistCount}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNav('/enquiries', 'enquiries')}
                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 flex items-center justify-between text-slate-700 hover:text-slate-900 cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Buyer Enquiries</span>
                      </span>
                      {enquiriesCount > 0 && (
                        <span className="font-bold text-[10px] bg-emerald-100 text-emerald-700 px-1.5 rounded-full">
                          {enquiriesCount}
                        </span>
                      )}
                    </button>

                    <div className="pt-2 mt-1 border-t border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                      Seller Corner & Admin
                    </div>
                    <button
                      type="button"
                      onClick={() => handleNav('/seller/register', 'seller-register')}
                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-orange-50 flex items-center gap-2 text-orange-700 font-semibold cursor-pointer"
                    >
                      <Store className="w-3.5 h-3.5 text-orange-600" />
                      <span>Become a Seller (FREE 1st Year)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNav('/seller/dashboard', 'seller-dashboard')}
                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-2 text-slate-700 hover:text-slate-900 cursor-pointer"
                    >
                      <Store className="w-3.5 h-3.5 text-slate-500" />
                      <span>Seller Corner Dashboard</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNav('/admin', 'admin-dashboard')}
                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-2 text-slate-700 hover:text-slate-900 cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Admin Control Center</span>
                    </button>
                  </div>

                  {currentUser && onLogout && (
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setAccountMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-2 py-1.5 rounded-lg text-red-600 hover:bg-red-50 flex items-center gap-2 text-xs font-semibold cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Dark Navy Header Row */}
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 py-2.5">
        <div className="flex items-center justify-between gap-3 md:gap-5">
          {/* Brand Logo */}
          <div
            onClick={() => handleNav('/', 'home')}
            className="flex items-center gap-2.5 cursor-pointer shrink-0 group py-0.5"
            title="MattoKart - Sab Kuch, Ek Hi Jagah!"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-tr from-[#f97316] to-amber-500 text-white flex items-center justify-center font-black text-xl shadow-md">
              M
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-white font-brand">
                Matto<span className="text-[#f97316]">Kart</span>
              </span>
              <span className="text-[10px] font-medium text-slate-200 tracking-wide hidden sm:block mt-0.5">
                Sab Kuch, Ek Hi Jagah!
              </span>
            </div>
          </div>

          {/* Large White Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 max-w-3xl relative flex items-center"
          >
            <div className="flex w-full rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-orange-400 bg-white shadow-sm">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search across India for products, brands, shops & cities..."
                className="flex-1 px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none min-w-0"
              />

              <button
                type="submit"
                aria-label="Search products"
                className="bg-[#f97316] hover:bg-orange-600 px-4 sm:px-5 text-white font-bold transition-colors flex items-center justify-center cursor-pointer shrink-0"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </form>

          {/* Right Action Icons (Wishlist + Cart + Mobile Menu) */}
          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            {/* Wishlist Stacked Icon + Red Count Badge */}
            <button
              type="button"
              onClick={() => handleNav('/wishlist', 'wishlist')}
              className="flex flex-col items-center justify-center text-white hover:text-orange-300 transition-colors cursor-pointer group"
              title="Saved Wishlist"
            >
              <div className="relative">
                <Heart
                  className={`w-5 h-5 sm:w-5 sm:h-5 ${
                    isWishlist ? 'text-red-400 fill-red-400' : 'text-white group-hover:text-orange-300'
                  }`}
                />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-[9px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center tabular-nums shadow-xs">
                    {wishlistCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium text-slate-200 hidden sm:block mt-0.5">
                Wishlist
              </span>
            </button>

            {/* Cart Stacked Icon + Red Count Badge */}
            <button
              type="button"
              onClick={() => handleNav('/cart', 'cart')}
              className="flex flex-col items-center justify-center text-white hover:text-orange-300 transition-colors cursor-pointer group"
              title="Shopping Cart"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5 sm:w-5 sm:h-5 text-white group-hover:text-orange-300" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-[9px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center tabular-nums shadow-xs">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium text-slate-200 hidden sm:block mt-0.5">
                Cart
              </span>
            </button>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1 text-slate-200 hover:text-white cursor-pointer"
              aria-label="Open navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Category Navigation Strip */}
      <nav className="bg-[#122b4e] text-xs font-medium text-slate-100 px-3 sm:px-4 overflow-x-auto no-scrollbar border-t border-white/10">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-3 sm:gap-5 py-2 min-w-max">
          <button
            type="button"
            onClick={() => handleCategoryShortcut('all')}
            className="flex items-center gap-1.5 hover:text-amber-300 transition-colors cursor-pointer whitespace-nowrap shrink-0 font-semibold"
          >
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span>Today&apos;s Deals</span>
          </button>

          <button
            type="button"
            onClick={() => handleNav('/seller/dashboard', 'seller-dashboard')}
            className="flex items-center gap-1.5 text-amber-300 hover:text-amber-200 transition-colors cursor-pointer whitespace-nowrap shrink-0 font-semibold"
          >
            <Store className="w-3.5 h-3.5 text-amber-400" />
            <span>Seller Corner</span>
          </button>

          <button
            type="button"
            onClick={() => handleCategoryShortcut('construction')}
            className="hover:text-orange-300 border-b-2 border-white/80 pb-0.5 font-semibold text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Construction Materials
          </button>

          <button
            type="button"
            onClick={() => handleCategoryShortcut('construction', 'TMT')}
            className="hover:text-orange-300 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Sariya &amp; Steel
          </button>

          <button
            type="button"
            onClick={() => handleCategoryShortcut('construction', 'Cement')}
            className="hover:text-orange-300 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Cement &amp; Bricks
          </button>

          <button
            type="button"
            onClick={() => handleCategoryShortcut('tools-hardware')}
            className="hover:text-orange-300 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Tools &amp; Hardware
          </button>

          <button
            type="button"
            onClick={() => handleCategoryShortcut('furniture')}
            className="hover:text-orange-300 transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-3 h-3 text-orange-400" />
            <span>Wood &amp; Furniture</span>
          </button>

          <button
            type="button"
            onClick={() => handleCategoryShortcut('electronics')}
            className="hover:text-orange-300 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Electronics
          </button>

          <button
            type="button"
            onClick={() => handleNav('/shops', 'shops')}
            className="hover:text-orange-300 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Featured Shops
          </button>

          <button
            type="button"
            onClick={() => handleCategoryShortcut('all')}
            className="flex items-center gap-0.5 hover:text-orange-300 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>More</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0e2444] border-t border-white/10 px-4 py-4 space-y-3">
          <div className="pb-3 border-b border-white/10 flex items-center justify-between">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center text-xs">
                  {(currentUser.fullName || currentUser.phone)[0].toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{currentUser.fullName || 'Customer'}</div>
                  <div className="text-[10px] text-slate-300 font-mono">{currentUser.phone}</div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onOpenAuthModal) onOpenAuthModal('customer');
                }}
                className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-lg text-center cursor-pointer"
              >
                Login / Register via Mobile OTP
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenLocationModal();
            }}
            className="w-full flex items-center justify-between p-2.5 bg-[#091e3a] rounded-lg text-xs cursor-pointer"
          >
            <span className="flex items-center gap-2 text-slate-200">
              <MapPin className="w-4 h-4 text-orange-400" />
              <span>
                Delivering to:{' '}
                <strong className="text-white">
                  {selectedLocality.name} ({selectedLocality.pinCode})
                </strong>
              </span>
            </span>
            <span className="text-[10px] text-orange-400 font-bold uppercase">Change</span>
          </button>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleNav('/', 'home')}
              className="p-2.5 bg-[#122b4e] rounded-lg text-left text-slate-100 hover:text-white cursor-pointer"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => handleNav('/products', 'catalog')}
              className="p-2.5 bg-[#122b4e] rounded-lg text-left text-slate-100 hover:text-white cursor-pointer"
            >
              All Products
            </button>
            <button
              type="button"
              onClick={() => handleNav('/orders', 'orders')}
              className="p-2.5 bg-[#122b4e] rounded-lg text-left text-slate-100 hover:text-white flex items-center justify-between cursor-pointer"
            >
              <span>Track Orders</span>
              <Package className="w-3.5 h-3.5 text-orange-400" />
            </button>
            <button
              type="button"
              onClick={() => handleNav('/wishlist', 'wishlist')}
              className="p-2.5 bg-[#122b4e] rounded-lg text-left text-slate-100 hover:text-white flex items-center justify-between cursor-pointer"
            >
              <span>Wishlist</span>
              {wishlistCount > 0 && <span className="text-orange-400 font-bold">{wishlistCount}</span>}
            </button>
            <button
              type="button"
              onClick={() => handleNav('/shops', 'shops')}
              className="p-2.5 bg-[#122b4e] rounded-lg text-left text-slate-100 hover:text-white cursor-pointer"
            >
              Featured Shops
            </button>
            <button
              type="button"
              onClick={() => handleNav('/seller/register', 'seller-register')}
              className="p-2.5 bg-orange-500/20 border border-orange-500/40 rounded-lg text-left text-orange-300 font-bold cursor-pointer"
            >
              Become a Seller
            </button>
            <button
              type="button"
              onClick={() => handleNav('/seller/dashboard', 'seller-dashboard')}
              className="p-2.5 bg-[#122b4e] rounded-lg text-left text-slate-100 hover:text-white cursor-pointer"
            >
              Seller Corner
            </button>
            <button
              type="button"
              onClick={() => handleNav('/admin', 'admin-dashboard')}
              className="p-2.5 bg-[#122b4e] rounded-lg text-left text-slate-100 hover:text-white cursor-pointer"
            >
              Admin Portal
            </button>
          </div>

          {currentUser && onLogout && (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onLogout();
              }}
              className="w-full py-2 border border-red-500/40 text-red-300 text-xs font-bold rounded-lg cursor-pointer"
            >
              Sign Out
            </button>
          )}
        </div>
      )}
    </header>
  );
};
