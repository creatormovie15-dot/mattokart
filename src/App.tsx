import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ActiveTab,
  Category,
  CategoryId,
  Product,
  Seller,
  BuyerEnquiry,
  SaharanpurLocality,
  LegalDocType,
} from './types';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_SELLERS,
  INITIAL_ENQUIRIES,
  SAHARANPUR_LOCALITIES,
} from './data/mockData';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { MobileNav } from './components/MobileNav';
import { LocationModal } from './components/LocationModal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { EnquiryModal } from './components/EnquiryModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';

import { HomeView } from './views/HomeView';
import { CatalogView } from './views/CatalogView';
import { ShopsView } from './views/ShopsView';
import { SellerRegisterView } from './views/SellerRegisterView';
import { SellerDashboardView } from './views/SellerDashboardView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { EnquiriesView } from './views/EnquiriesView';
import { LegalView } from './views/LegalView';

// Safe storage utilities with error immunity
const safeLoad = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(`mattokart_${key}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(fallback)) {
        return Array.isArray(parsed) && parsed.length > 0 ? (parsed as T) : fallback;
      }
      return parsed ? (parsed as T) : fallback;
    }
  } catch {
    // Graceful fallback if storage is restricted or corrupted
  }
  return fallback;
};

const safeSave = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(`mattokart_${key}`, JSON.stringify(value));
  } catch {
    // Fail silently without blocking UI
  }
};

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation & location state
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [selectedLocality, setSelectedLocality] = useState<SaharanpurLocality>(() =>
    safeLoad('locality', SAHARANPUR_LOCALITIES[0])
  );
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [catalogCategory, setCatalogCategory] = useState<CategoryId | 'all'>('all');
  const [activeLegalDoc, setActiveLegalDoc] = useState<LegalDocType>('about');

  // Synchronize state with URL routing (supports direct links, Netlify page refresh, browser back/forward)
  useEffect(() => {
    const path = location.pathname;
    if (path === '/' || path === '') {
      setActiveTab('home');
    } else if (path.startsWith('/products') || path.startsWith('/catalog')) {
      setActiveTab('catalog');
      const params = new URLSearchParams(location.search);
      const q = params.get('search');
      const cat = params.get('category');
      const special = params.get('special');
      if (q !== null && q !== undefined) {
        setSearchQuery(q);
      }
      if (cat) {
        setCatalogCategory(cat as CategoryId);
      }
      if (special === 'woodcraft') {
        setCatalogCategory('furniture');
      }
    } else if (path === '/shops') {
      setActiveTab('shops');
    } else if (path === '/seller/register') {
      setActiveTab('seller-register');
    } else if (path === '/seller/dashboard') {
      setActiveTab('seller-dashboard');
    } else if (path === '/admin' || path === '/admin-dashboard') {
      setActiveTab('admin-dashboard');
    } else if (path === '/enquiries') {
      setActiveTab('enquiries');
    } else if (path.startsWith('/legal')) {
      setActiveTab('legal');
      const parts = path.split('/');
      if (parts[2]) {
        setActiveLegalDoc(parts[2] as LegalDocType);
      }
    } else if (path === '/contact' || path === '/contact-us') {
      setActiveTab('legal');
      setActiveLegalDoc('contact');
    } else if (path === '/about') {
      setActiveTab('legal');
      setActiveLegalDoc('about');
    } else if (path === '/privacy') {
      setActiveTab('legal');
      setActiveLegalDoc('privacy');
    } else if (path === '/terms') {
      setActiveTab('legal');
      setActiveLegalDoc('terms');
    }
  }, [location.pathname, location.search]);

  // Marketplace data state (restored with safe fallback to initial Saharanpur data)
  const [categories, setCategories] = useState<Category[]>(() =>
    safeLoad('categories', INITIAL_CATEGORIES)
  );
  const [products, setProducts] = useState<Product[]>(() =>
    safeLoad('products', INITIAL_PRODUCTS)
  );
  const [sellers, setSellers] = useState<Seller[]>(() =>
    safeLoad('sellers', INITIAL_SELLERS)
  );
  const [enquiries, setEnquiries] = useState<BuyerEnquiry[]>(() =>
    safeLoad('enquiries', INITIAL_ENQUIRIES)
  );

  // Active seller profile for Seller Dashboard testing
  const [currentSellerId, setCurrentSellerId] = useState<string>('seller-1');

  // Modals
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [selectedProductForEnquiry, setSelectedProductForEnquiry] = useState<Product | null>(null);

  // Toast feedback
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, description?: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Tab switcher synchronized with URL routes
  const handleSetActiveTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    switch (tab) {
      case 'home':
        navigate('/');
        break;
      case 'catalog':
        navigate('/products');
        break;
      case 'shops':
        navigate('/shops');
        break;
      case 'seller-register':
        navigate('/seller/register');
        break;
      case 'seller-dashboard':
        navigate('/seller/dashboard');
        break;
      case 'admin-dashboard':
        navigate('/admin');
        break;
      case 'enquiries':
        navigate('/enquiries');
        break;
      case 'legal':
        navigate(`/legal/${activeLegalDoc || 'about'}`);
        break;
    }
  };

  // Handlers
  const handlePerformSearch = (query: string) => {
    const q = query.trim();
    setSearchQuery(q);
    setActiveTab('catalog');
    if (q) {
      navigate(`/products?search=${encodeURIComponent(q)}`);
    } else {
      navigate('/products');
    }
  };

  const handleSelectCategory = (catId: CategoryId) => {
    setCatalogCategory(catId);
    setActiveTab('catalog');
    navigate(`/products?category=${encodeURIComponent(catId)}`);
  };

  const handleSelectShopProducts = (shopName: string) => {
    setSearchQuery(shopName);
    setCatalogCategory('all');
    setActiveTab('catalog');
    navigate(`/products?search=${encodeURIComponent(shopName)}`);
  };

  const handleOpenLegalDoc = (doc: LegalDocType) => {
    setActiveLegalDoc(doc);
    setActiveTab('legal');
    navigate(`/legal/${doc}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Enquiry submission
  const handleSubmitEnquiry = (newEnquiry: BuyerEnquiry) => {
    setEnquiries((prev) => {
      const updated = [newEnquiry, ...prev];
      safeSave('enquiries', updated);
      return updated;
    });
    addToast(
      'success',
      'Enquiry Sent to Seller!',
      `Reference ID: ${newEnquiry.id}. The shopkeeper has received your contact details.`
    );
  };

  // Seller registration
  const handleRegisterSeller = (newSeller: Seller) => {
    setSellers((prev) => {
      const updated = [newSeller, ...prev];
      safeSave('sellers', updated);
      return updated;
    });
    setCurrentSellerId(newSeller.id);
    addToast(
      'success',
      'Shop Registration Received',
      `Application ID: ${newSeller.id}. Pending review by MattoKart admin.`
    );
  };

  // Seller Dashboard product actions
  const handleAddProduct = (newProd: Product) => {
    setProducts((prev) => {
      const updated = [newProd, ...prev];
      safeSave('products', updated);
      return updated;
    });
    setCategories((prev) => {
      const updated = prev.map((c) =>
        c.id === newProd.categoryId ? { ...c, itemCount: c.itemCount + 1 } : c
      );
      safeSave('categories', updated);
      return updated;
    });
    addToast('success', 'Product Published!', `${newProd.name} is now listed in the catalog.`);
  };

  const handleUpdateProduct = (updatedProd: Product) => {
    setProducts((prev) => {
      const updated = prev.map((p) => (p.id === updatedProd.id ? updatedProd : p));
      safeSave('products', updated);
      return updated;
    });
    addToast('info', 'Product Updated', `${updatedProd.name} details have been saved.`);
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => {
      const updated = prev.filter((p) => p.id !== productId);
      safeSave('products', updated);
      return updated;
    });
    addToast('info', 'Product Deleted', 'Listing removed from marketplace.');
  };

  const handleUpdateSeller = (updatedSeller: Seller) => {
    setSellers((prev) => {
      const updated = prev.map((s) => (s.id === updatedSeller.id ? updatedSeller : s));
      safeSave('sellers', updated);
      return updated;
    });
    addToast('success', 'Shop Profile Updated', 'Your changes have been saved.');
  };

  // Admin moderation actions
  const handleApproveSeller = (sellerId: string) => {
    setSellers((prev) => {
      const updated = prev.map((s) => (s.id === sellerId ? { ...s, status: 'active' as const } : s));
      safeSave('sellers', updated);
      return updated;
    });
    addToast('success', 'Seller Approved', 'Shop is now active on MattoKart.');
  };

  const handleRejectSeller = (sellerId: string) => {
    setSellers((prev) => {
      const updated = prev.map((s) => (s.id === sellerId ? { ...s, status: 'suspended' as const } : s));
      safeSave('sellers', updated);
      return updated;
    });
    addToast('info', 'Application Rejected', 'Seller application was declined.');
  };

  const handleToggleSuspendSeller = (sellerId: string) => {
    setSellers((prev) => {
      const updated = prev.map((s) => {
        if (s.id === sellerId) {
          const nextStatus = s.status === 'suspended' ? ('active' as const) : ('suspended' as const);
          return { ...s, status: nextStatus };
        }
        return s;
      });
      safeSave('sellers', updated);
      return updated;
    });
    addToast('info', 'Status Updated', 'Seller status toggled.');
  };

  const handleApproveProduct = (productId: string) => {
    setProducts((prev) => {
      const updated = prev.map((p) => (p.id === productId ? { ...p, status: 'approved' as const } : p));
      safeSave('products', updated);
      return updated;
    });
    addToast('success', 'Listing Approved', 'Product is now live in marketplace.');
  };

  const handleRejectProduct = (productId: string, reason: string) => {
    setProducts((prev) => {
      const updated = prev.map((p) =>
        p.id === productId ? { ...p, status: 'rejected' as const, rejectionReason: reason } : p
      );
      safeSave('products', updated);
      return updated;
    });
    addToast('error', 'Listing Rejected', 'Product has been disapproved.');
  };

  const handleAddCategory = (newCat: Category) => {
    setCategories((prev) => {
      const updated = [...prev, newCat];
      safeSave('categories', updated);
      return updated;
    });
    addToast('success', 'Category Created', `${newCat.name} added to permitted catalog.`);
  };

  const handleUpdateSellerFeeStatus = (sellerId: string, status: Seller['registrationFeeStatus']) => {
    setSellers((prev) => {
      const updated = prev.map((s) => (s.id === sellerId ? { ...s, registrationFeeStatus: status } : s));
      safeSave('sellers', updated);
      return updated;
    });
    addToast('info', 'Fee Status Updated', `Seller fee status set to ${status}.`);
  };

  const currentSeller = sellers.find((s) => s.id === currentSellerId) || sellers[0] || INITIAL_SELLERS[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 selection:bg-orange-500 selection:text-white">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Main Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={handleSetActiveTab}
        selectedLocality={selectedLocality}
        onOpenLocationModal={() => setIsLocationModalOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onPerformSearch={handlePerformSearch}
        enquiriesCount={enquiries.length}
      />

      {/* Body Views */}
      <main className="flex-1">
        <ErrorBoundary fallbackTitle="Marketplace screen recovery">
          {activeTab === 'home' && (
            <HomeView
              categories={categories}
              products={products}
              sellers={sellers}
              selectedLocality={selectedLocality}
              onSelectCategory={handleSelectCategory}
              onViewProductDetails={(p) => setSelectedProductForDetail(p)}
              onContactSeller={(p) => setSelectedProductForEnquiry(p)}
              onGoToCatalog={() => {
                setCatalogCategory('all');
                handleSetActiveTab('catalog');
              }}
              onGoToSellerRegister={() => handleSetActiveTab('seller-register')}
              onOpenLocationModal={() => setIsLocationModalOpen(true)}
              onSelectShopProducts={handleSelectShopProducts}
            />
          )}

          {activeTab === 'catalog' && (
            <CatalogView
              products={products}
              categories={categories}
              selectedCategory={catalogCategory}
              onSelectCategory={setCatalogCategory}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onViewProductDetails={(p) => setSelectedProductForDetail(p)}
              onContactSeller={(p) => setSelectedProductForEnquiry(p)}
              currentLocality={selectedLocality}
            />
          )}

          {activeTab === 'shops' && (
            <ShopsView
              sellers={sellers}
              products={products}
              onSelectShopProducts={handleSelectShopProducts}
              onGoToSellerRegister={() => handleSetActiveTab('seller-register')}
            />
          )}

          {activeTab === 'seller-register' && (
            <SellerRegisterView
              categories={categories}
              onRegisterSeller={handleRegisterSeller}
              onGoToDashboard={() => handleSetActiveTab('seller-dashboard')}
            />
          )}

          {activeTab === 'seller-dashboard' && (
            <SellerDashboardView
              currentSeller={currentSeller}
              products={products}
              enquiries={enquiries}
              categories={categories}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onUpdateSeller={handleUpdateSeller}
            />
          )}

          {activeTab === 'admin-dashboard' && (
            <AdminDashboardView
              sellers={sellers}
              products={products}
              categories={categories}
              enquiries={enquiries}
              onApproveSeller={handleApproveSeller}
              onRejectSeller={handleRejectSeller}
              onToggleSuspendSeller={handleToggleSuspendSeller}
              onApproveProduct={handleApproveProduct}
              onRejectProduct={handleRejectProduct}
              onAddCategory={handleAddCategory}
              onUpdateSellerFeeStatus={handleUpdateSellerFeeStatus}
            />
          )}

          {activeTab === 'enquiries' && (
            <EnquiriesView
              enquiries={enquiries}
              onGoToCatalog={() => handleSetActiveTab('catalog')}
            />
          )}

          {activeTab === 'legal' && <LegalView initialDoc={activeLegalDoc} />}
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <Footer
        setActiveTab={handleSetActiveTab}
        onOpenLegalDoc={handleOpenLegalDoc}
        onSelectCategory={handleSelectCategory}
        onSelectSearch={handleSelectShopProducts}
      />

      {/* Mobile Bottom Navigation */}
      <MobileNav
        activeTab={activeTab}
        setActiveTab={handleSetActiveTab}
        enquiriesCount={enquiries.length}
      />

      {/* Location Selector Modal */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        selectedLocality={selectedLocality}
        onSelectLocality={(loc) => {
          setSelectedLocality(loc);
          addToast('info', 'Location Updated', `Delivery location set to ${loc.name} (${loc.pinCode})`);
        }}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProductForDetail}
        onClose={() => setSelectedProductForDetail(null)}
        onOpenEnquiry={(p) => setSelectedProductForEnquiry(p)}
      />

      {/* Direct Buyer Enquiry Modal */}
      <EnquiryModal
        product={selectedProductForEnquiry}
        isOpen={!!selectedProductForEnquiry}
        onClose={() => setSelectedProductForEnquiry(null)}
        onSubmitEnquiry={handleSubmitEnquiry}
        currentLocality={selectedLocality}
      />
    </div>
  );
}
