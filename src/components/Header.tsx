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
  Layers,
  ShoppingBag,
  Phone,
  User,
  LogOut,
  ShieldCheck,
  ShoppingCart,
  Package,
  Heart,
  Grid,
  TrendingUp,
  Percent,
  CheckCircle2,
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
  activeTab,
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
  const [searchCategory, setSearchCategory] = useState<string>('all');
  const accountRef = useRef<HTMLDivElement>(null);

  const currentPath = location.pathname;
  const isHome = currentPath === '/' || currentPath === '';
  const isProducts = currentPath.startsWith('/products') || currentPath.startsWith('/catalog');
  const isShops = currentPath === '/shops';
  const isSeller = currentPath.startsWith('/seller');
  const isAdmin = currentPath.startsWith('/admin');
  const isOrders = currentPath === '/orders';
  const isCart = currentPath === '/cart' || currentPath === '/checkout';
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
    if (searchCategory !== 'all') {
      params.set('category', searchCategory);
      if (onSelectCategory) onSelectCategory(searchCategory as CategoryId);
    }
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

  return (
    <header className="sticky top-0 z-40 bg-[#131921] text-white select-none">
      {/* Top Strip: Official Marketplace Announcement */}
      <div className="bg-[#0f1111] text-[11px] text-slate-300 py-1 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 truncate">
            <span className="text-amber-400 font-bold tracking-wide">
              MERA SAHARANPUR, MERA MATTOKART:
            </span>
            <span className="truncate">
              Direct dukaandar prices, authentic Sheesham woodcrafts, building supplies & ₹0 registration fee for local merchants.
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-4 shrink-0 text-slate-400">
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-orange-400" />
              <a href="tel:+918221077674" className="hover:text-white transition-colors">
                +91 8221077674
              </a>
            </span>
            <span className="text-slate-600">|</span>
            <button
              onClick={() => handleNav('/seller/register', 'seller-register')}
              className="text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
            >
              Sell on MattoKart (Free 1st Year)
            </button>
          </div>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="max-w-7xl mx-auto px-4 py-2.5">
        <div className="flex items-center justify-between gap-3 md:gap-4">
          {/* Brand Logo */}
          <div
            onClick={() => handleNav('/', 'home')}
            className="flex items-center gap-2 cursor-pointer shrink-0 group py-1"
            title="MattoKart - Sab Kuch, Ek Hi Jagah!"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-600 text-white flex items-center justify-center font-black text-xl shadow-md group-hover:scale-105 transition-transform">
              M
            </div>
            <div className="flex flex-col leading-none">
              <div className="flex items-baseline gap-1">
                <span className="font-extrabold text-2xl tracking-tight text-white font-brand">
                  Matto<span className="text-orange-500">Kart</span>
                </span>
                <span className="text-[9px] font-bold text-orange-400 tracking-wider uppercase border border-orange-500/40 px-1 rounded hidden sm:inline-block">
                  UP-11
                </span>
              </div>
              <span className="text-[10px] font-medium text-slate-400 tracking-wide mt-0.5 hidden sm:block">
                Sab Kuch, Ek Hi Jagah!
              </span>
            </div>
          </div>

          {/* Delivery Location Selector */}
          <button
            onClick={onOpenLocationModal}
            className="hidden lg:flex items-center gap-2 px-2.5 py-1.5 hover:ring-1 hover:ring-white rounded-md text-left transition-all shrink-0 cursor-pointer"
            title="Change delivery location in Saharanpur"
          >
            <MapPin className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
            <div className="leading-tight">
              <div className="text-[11px] text-slate-300">Deliver to</div>
              <div className="font-bold text-xs text-white flex items-center gap-0.5">
                <span className="max-w-[110px] truncate">{selectedLocality?.name || 'Saharanpur'}</span>
                <span className="text-slate-400 font-mono text-[11px]">({selectedLocality?.pinCode || '247001'})</span>
              </div>
            </div>
          </button>

          {/* Amazon-Style Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 max-w-2xl relative flex items-center"
          >
            <div className="flex w-full rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 shadow-inner bg-white">
              {/* Category dropdown */}
              <select
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                className="hidden sm:block bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs px-2.5 py-2.5 border-r border-slate-300 focus:outline-none cursor-pointer font-medium"
              >
                <option value="all">All Categories</option>
                <option value="furniture">Woodcraft & Furniture</option>
                <option value="construction">Construction Materials</option>
                <option value="tools-hardware">Tools & Hardware</option>
                <option value="electronics">Electronics & Solar</option>
                <option value="clothing-fashion">Fashion & Clothing</option>
                <option value="grocery-food">Grocery & Local Mandi</option>
                <option value="home-kitchen">Home & Kitchen</option>
              </select>

              {/* Input field */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Sheesham mandir, UltraTech cement, TMT sariya, power tools..."
                className="flex-1 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />

              {/* Search button */}
              <button
                type="submit"
                aria-label="Search products"
                className="bg-orange-500 hover:bg-orange-600 px-5 text-slate-950 font-bold transition-colors flex items-center justify-center cursor-pointer"
              >
                <Search className="w-4 h-4 text-slate-950" />
              </button>
            </div>
          </form>

          {/* Right Header Navigation */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2 shrink-0">
            {/* Account & Sign In Dropdown */}
            <div className="relative" ref={accountRef}>
              <button
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                className="flex flex-col text-left px-2.5 py-1.5 hover:ring-1 hover:ring-white rounded-md transition-all cursor-pointer"
              >
                <span className="text-[11px] text-slate-300 flex items-center gap-1">
                  <span>Namaste, {currentUser ? currentUser.fullName?.split(' ')[0] || 'User' : 'Sign in'}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </span>
                <span className="font-bold text-xs text-white">
                  Account & Lists
                </span>
              </button>

              {/* Dropdown Menu */}
              {accountMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95">
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
                        Active Role: {currentUser.role === 'seller' ? 'Seller Dukaan' : currentUser.role === 'admin' ? 'Administrator' : 'Customer'}
                      </span>
                    </div>
                  ) : (
                    <div className="pb-3 border-b border-slate-100 text-center">
                      <button
                        onClick={() => {
                          setAccountMenuOpen(false);
                          if (onOpenAuthModal) onOpenAuthModal('customer');
                        }}
                        className="w-full py-2 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-slate-950 font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
                      >
                        Sign in via Mobile OTP
                      </button>
                      <div className="text-[11px] text-slate-500 mt-1.5">
                        New customer? Start shopping in Saharanpur
                      </div>
                    </div>
                  )}

                  {/* Navigation Links */}
                  <div className="py-2 space-y-0.5 text-xs">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                      Your Account
                    </div>
                    <button
                      onClick={() => handleNav('/orders', 'orders')}
                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 flex items-center justify-between text-slate-700 hover:text-slate-900 cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Package className="w-3.5 h-3.5 text-orange-600" />
                        <span>Your Orders & Tracking</span>
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                    </button>
                    <button
                      onClick={() => handleNav('/wishlist', 'wishlist')}
                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 flex items-center justify-between text-slate-700 hover:text-slate-900 cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Heart className="w-3.5 h-3.5 text-red-500" />
                        <span>Your Wishlist</span>
                      </span>
                      {wishlistCount > 0 && (
                        <span className="font-bold text-[10px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded-full">
                          {wishlistCount}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => handleNav('/enquiries', 'enquiries')}
                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 flex items-center justify-between text-slate-700 hover:text-slate-900 cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Buyer Enquiries</span>
                      </span>
                      {enquiriesCount > 0 && (
                        <span className="font-bold text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded-full">
                          {enquiriesCount}
                        </span>
                      )}
                    </button>

                    <div className="pt-2 border-t border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                      Portals & Moderation
                    </div>
                    <button
                      onClick={() => handleNav('/seller/dashboard', 'seller-dashboard')}
                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-2 text-slate-700 hover:text-slate-900 cursor-pointer"
                    >
                      <Store className="w-3.5 h-3.5 text-amber-600" />
                      <span>Seller Dukaan Dashboard</span>
                    </button>
                    <button
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
                        onClick={() => {
                          setAccountMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-2 py-1.5 rounded-lg text-red-600 hover:bg-red-50 flex items-center gap-2 text-xs font-semibold cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out of MattoKart</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Returns & Orders */}
            <button
              onClick={() => handleNav('/orders', 'orders')}
              className="flex flex-col text-left px-2.5 py-1.5 hover:ring-1 hover:ring-white rounded-md transition-all cursor-pointer"
              title="View your orders and track live status"
            >
              <span className="text-[11px] text-slate-300">Returns</span>
              <span className="font-bold text-xs text-white">& Orders</span>
            </button>

            {/* Wishlist Icon */}
            <button
              onClick={() => handleNav('/wishlist', 'wishlist')}
              className="relative flex items-center gap-1.5 px-2.5 py-1.5 hover:ring-1 hover:ring-white rounded-md transition-all cursor-pointer"
              title="Your Saved Wishlist"
            >
              <div className="relative">
                <Heart className={`w-5 h-5 ${isWishlist ? 'text-red-500 fill-red-500' : 'text-slate-200'}`} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-red-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </div>
            </button>

            {/* Shopping Cart Button */}
            <button
              onClick={() => handleNav('/cart', 'cart')}
              className="flex items-center gap-2 px-3 py-1.5 hover:ring-1 hover:ring-white rounded-md transition-all cursor-pointer"
              title="Shopping Cart (शॉपिंग कार्ट)"
            >
              <div className="relative">
                <ShoppingCart className="w-6 h-6 text-white" />
                <span className="absolute -top-1 left-2.5 bg-orange-500 text-slate-950 font-black text-xs min-w-4 h-4 px-1 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              </div>
              <span className="font-bold text-xs text-white hidden lg:inline-block">
                Cart
              </span>
            </button>
          </div>

          {/* Mobile Right Icons */}
          <div className="flex md:hidden items-center gap-1">
            <button
              onClick={() => handleNav('/wishlist', 'wishlist')}
              className="p-1.5 text-slate-200 hover:text-white relative cursor-pointer"
              title="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-600 text-white text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </button>
            <button
              onClick={() => handleNav('/cart', 'cart')}
              className="p-1.5 text-slate-200 hover:text-white relative cursor-pointer"
              title="Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-orange-500 text-slate-950 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-slate-200 hover:text-white cursor-pointer"
              aria-label="Open navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Sub Navigation Strip: Categories & Quick Links (Amazon Style) */}
      <nav className="bg-[#232f3e] text-xs font-medium text-slate-200 px-4 overflow-x-auto scrollbar-none border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-4 py-1.5 min-w-max">
          {/* All Categories Drawer Trigger */}
          <button
            onClick={() => handleNav('/products', 'catalog')}
            className="flex items-center gap-1.5 px-2.5 py-1 hover:ring-1 hover:ring-white rounded transition-all cursor-pointer font-bold text-white"
          >
            <Menu className="w-4 h-4" />
            <span>All Categories</span>
          </button>

          <button
            onClick={() => {
              if (onSelectCategory) onSelectCategory('furniture');
              handleNav('/products?category=furniture', 'catalog');
            }}
            className="px-2 py-1 hover:ring-1 hover:ring-white rounded transition-all cursor-pointer flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-300 font-semibold">Saharanpur Woodcraft</span>
          </button>

          <button
            onClick={() => {
              if (onSelectCategory) onSelectCategory('construction');
              handleNav('/products?category=construction', 'catalog');
            }}
            className="px-2 py-1 hover:ring-1 hover:ring-white rounded transition-all cursor-pointer"
          >
            Construction & Steel
          </button>

          <button
            onClick={() => {
              if (onSelectCategory) onSelectCategory('tools-hardware');
              handleNav('/products?category=tools-hardware', 'catalog');
            }}
            className="px-2 py-1 hover:ring-1 hover:ring-white rounded transition-all cursor-pointer"
          >
            Tools & Hardware
          </button>

          <button
            onClick={() => {
              if (onSelectCategory) onSelectCategory('electronics');
              handleNav('/products?category=electronics', 'catalog');
            }}
            className="px-2 py-1 hover:ring-1 hover:ring-white rounded transition-all cursor-pointer"
          >
            Electronics & Solar
          </button>

          <button
            onClick={() => {
              if (onSelectCategory) onSelectCategory('clothing-fashion');
              handleNav('/products?category=clothing-fashion', 'catalog');
            }}
            className="px-2 py-1 hover:ring-1 hover:ring-white rounded transition-all cursor-pointer"
          >
            Fashion & Handloom
          </button>

          <button
            onClick={() => {
              if (onSelectCategory) onSelectCategory('grocery-food');
              handleNav('/products?category=grocery-food', 'catalog');
            }}
            className="px-2 py-1 hover:ring-1 hover:ring-white rounded transition-all cursor-pointer"
          >
            Grocery & Food
          </button>

          <button
            onClick={() => handleNav('/shops', 'shops')}
            className="px-2 py-1 hover:ring-1 hover:ring-white rounded transition-all cursor-pointer"
          >
            Verified Local Shops
          </button>

          <button
            onClick={() => handleNav('/seller/register', 'seller-register')}
            className="ml-auto px-2.5 py-1 text-amber-300 hover:text-white hover:ring-1 hover:ring-amber-400 rounded transition-all cursor-pointer font-bold flex items-center gap-1"
          >
            <Store className="w-3.5 h-3.5 text-amber-400" />
            <span>Join MattoKart (FREE 1st Year)</span>
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#1f2833] border-t border-slate-700 px-4 py-4 space-y-4 animate-in slide-in-from-top-2">
          {/* User Sign In Quick Row */}
          <div className="pb-3 border-b border-slate-700 flex items-center justify-between">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-500 text-slate-950 font-bold flex items-center justify-center text-xs">
                  {(currentUser.fullName || currentUser.phone)[0].toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{currentUser.fullName || 'Customer'}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{currentUser.phone}</div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onOpenAuthModal) onOpenAuthModal('customer');
                }}
                className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold text-xs rounded-lg text-center"
              >
                Sign In via Indian Mobile OTP
              </button>
            )}
          </div>

          {/* Quick Location Bar */}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenLocationModal();
            }}
            className="w-full flex items-center justify-between p-2.5 bg-slate-800/80 rounded-lg text-xs"
          >
            <span className="flex items-center gap-2 text-slate-300">
              <MapPin className="w-4 h-4 text-orange-400" />
              <span>Delivering to: <strong className="text-white">{selectedLocality.name} ({selectedLocality.pinCode})</strong></span>
            </span>
            <span className="text-[10px] text-orange-400 font-bold uppercase">Change</span>
          </button>

          {/* Navigation Links */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleNav('/', 'home')}
              className="p-2.5 bg-slate-800 rounded-lg text-left text-slate-200 hover:text-white"
            >
              Home Marketplace
            </button>
            <button
              onClick={() => handleNav('/products', 'catalog')}
              className="p-2.5 bg-slate-800 rounded-lg text-left text-slate-200 hover:text-white"
            >
              All Products
            </button>
            <button
              onClick={() => handleNav('/orders', 'orders')}
              className="p-2.5 bg-slate-800 rounded-lg text-left text-slate-200 hover:text-white flex items-center justify-between"
            >
              <span>My Orders</span>
              <Package className="w-3.5 h-3.5 text-orange-400" />
            </button>
            <button
              onClick={() => handleNav('/wishlist', 'wishlist')}
              className="p-2.5 bg-slate-800 rounded-lg text-left text-slate-200 hover:text-white flex items-center justify-between"
            >
              <span>My Wishlist</span>
              {wishlistCount > 0 && <span className="text-red-400 font-bold">{wishlistCount}</span>}
            </button>
            <button
              onClick={() => handleNav('/shops', 'shops')}
              className="p-2.5 bg-slate-800 rounded-lg text-left text-slate-200 hover:text-white"
            >
              Saharanpur Dukaans
            </button>
            <button
              onClick={() => handleNav('/seller/register', 'seller-register')}
              className="p-2.5 bg-amber-500/20 border border-amber-500/40 rounded-lg text-left text-amber-300 font-bold"
            >
              Become a Seller (FREE)
            </button>
            <button
              onClick={() => handleNav('/seller/dashboard', 'seller-dashboard')}
              className="p-2.5 bg-slate-800 rounded-lg text-left text-slate-200 hover:text-white"
            >
              Seller Dashboard
            </button>
            <button
              onClick={() => handleNav('/admin', 'admin-dashboard')}
              className="p-2.5 bg-slate-800 rounded-lg text-left text-slate-200 hover:text-white"
            >
              Admin Portal
            </button>
          </div>

          {currentUser && onLogout && (
            <div className="pt-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="w-full py-2 border border-red-500/40 text-red-400 text-xs font-bold rounded-lg"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
