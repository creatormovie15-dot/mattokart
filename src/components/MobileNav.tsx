import React from 'react';
import { Home, Grid, Store, MessageSquare, ShieldCheck } from 'lucide-react';
import { ActiveTab } from '../types';

interface MobileNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  enquiriesCount: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  setActiveTab,
  enquiriesCount,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 shadow-lg">
      <div className="grid grid-cols-5 items-center">
        {/* Home */}
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center py-1 transition-colors ${
            activeTab === 'home' ? 'text-orange-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Home</span>
        </button>

        {/* Catalog */}
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex flex-col items-center justify-center py-1 transition-colors ${
            activeTab === 'catalog' ? 'text-orange-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Grid className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Products</span>
        </button>

        {/* Shops */}
        <button
          onClick={() => setActiveTab('shops')}
          className={`flex flex-col items-center justify-center py-1 transition-colors ${
            activeTab === 'shops' ? 'text-orange-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Store className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Shops</span>
        </button>

        {/* Enquiries */}
        <button
          onClick={() => setActiveTab('enquiries')}
          className={`relative flex flex-col items-center justify-center py-1 transition-colors ${
            activeTab === 'enquiries' ? 'text-orange-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5 mb-0.5" />
            {enquiriesCount > 0 && (
              <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-orange-600 text-white text-[9px] font-bold flex items-center justify-center">
                {enquiriesCount}
              </span>
            )}
          </div>
          <span className="text-[10px]">Enquiries</span>
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
          className={`flex flex-col items-center justify-center py-1 transition-colors ${
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
