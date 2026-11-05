import React from 'react';
import { Home, Grid, ShoppingCart, Package, ShieldCheck } from 'lucide-react';
import { ActiveTab } from '../types';

interface MobileNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  enquiriesCount: number;
  cartCount?: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  setActiveTab,
  enquiriesCount,
  cartCount = 0,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-1 py-1 shadow-lg">
      <div className="grid grid-cols-5 items-center text-center">
        {/* Home */}
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center py-1 transition-colors cursor-pointer ${
            activeTab === 'home' ? 'text-orange-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Home</span>
        </button>

        {/* Catalog */}
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex flex-col items-center justify-center py-1 transition-colors cursor-pointer ${
            activeTab === 'catalog' ? 'text-orange-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Grid className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Products</span>
        </button>

        {/* Shopping Cart */}
        <button
          onClick={() => setActiveTab('cart')}
          className={`relative flex flex-col items-center justify-center py-1 transition-colors cursor-pointer ${
            activeTab === 'cart' || activeTab === 'checkout'
              ? 'text-orange-600 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className="relative">
            <ShoppingCart className="w-5 h-5 mb-0.5" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black flex items-center justify-center shadow-xs">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px]">Cart</span>
        </button>

        {/* Orders Tracking */}
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex flex-col items-center justify-center py-1 transition-colors cursor-pointer ${
            activeTab === 'orders' ? 'text-orange-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Package className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Orders</span>
        </button>

        {/* Seller/Admin Hub */}
        <button
          onClick={() => {
            if (activeTab === 'seller-dashboard') {
              setActiveTab('admin-dashboard');
            } else {
              setActiveTab('seller-dashboard');
            }
          }}
          className={`flex flex-col items-center justify-center py-1 transition-colors cursor-pointer ${
            activeTab === 'seller-dashboard' || activeTab === 'admin-dashboard'
              ? 'text-orange-600 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">
            {activeTab === 'admin-dashboard' ? 'Admin' : 'Seller'}
          </span>
        </button>
      </div>
    </nav>
  );
};
