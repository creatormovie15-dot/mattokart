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
  AuthUser,
  UserRole,
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
import { AuthModal } from './components/AuthModal';
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
import { isSupabaseConfigured } from './lib/supabaseClient';
import {
  getCategoriesFromSupabase,
  getProductsFromSupabase,
  getSellersFromSupabase,
  submitEnquiryToSupabase,
  submitSellerApplicationToSupabase,
  saveProductToSupabase,
  updateProductInSupabase,
  deleteProductFromSupabase,
  updateProductStatusInSupabase,
  updateSellerStatusInSupabase,
} from './lib/supabaseService';
import { getStoredAuthUser, setStoredAuthUser, logoutUser } from './lib/authClient';

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
      } else if (q !== null && q !== undefined) {
        // When searching globally from URL without an explicit category, search across all categories
        setCatalogCategory('all');
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

  // User Authentication State (Indian Mobile OTP)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getStoredAuthUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalRole, setAuthModalRole] = useState<UserRole>('customer');

  const handleOpenAuthModal = (role: UserRole = 'customer') => {
    setAuthModalRole(role);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setStoredAuthUser(user);
    addToast(
      'success',
      `Namaste, ${user.fullName || user.phone}!`,
      `Successfully logged in as ${user.role === 'seller' ? 'Seller' : 'Customer'}.`
    );
    if (user.role === 'seller' && user.sellerId) {
      setCurrentSellerId(user.sellerId);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    addToast('info', 'Logged Out', 'You have been logged out from your MattoKart account.');
  };

  // Modals
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [selectedProductForEnquiry, setSelectedProductForEnquiry] = useState<Product | null>(null);

  // Hydrate live data from Supabase if configured and reachable
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let isMounted = true;
    const loadSupabaseData = async () => {
      try {
        const [cloudCats, cloudProds, cloudSellers] = await Promise.all([
          getCategoriesFromSupabase(),
          getProductsFromSupabase(),
          getSellersFromSupabase(),
        ]);
        if (!isMounted) return;
        if (cloudCats && cloudCats.length > 0) setCategories(cloudCats);
        if (cloudProds && cloudProds.length > 0) {
          setProducts((currentProds) => {
            const cloudIds = new Set(cloudProds.map((p) => p.id));
            // Keep local products that are not yet in Supabase (e.g. pending review or local additions)
            const localOnly = currentProds.filter(
              (p) => !cloudIds.has(p.id) && (p.status === 'pending' || p.recentlyAdded || p.id.startsWith('prod-'))
            );
            return [...localOnly, ...cloudProds];
          });
        }
        if (cloudSellers && cloudSellers.length > 0) {
          setSellers((currentSellers) => {
            const cloudIds = new Set(cloudSellers.map((s) => s.id));
            const localOnly = currentSellers.filter((s) => !cloudIds.has(s.id));
            return [...localOnly, ...cloudSellers];
          });
        }
      } catch {
        // Fallback safely to initial/local storage data
      }
    };

    loadSupabaseData();
    return () => {
      isMounted = false;
    };
  }, []);

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
    setCatalogCategory('all'); // Reset category so search finds products in all categories
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

    if (isSupabaseConfigured) {
      submitEnquiryToSupabase(newEnquiry).catch(() => {});
    }

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

    // Persist seller application to Supabase if configured
    if (isSupabaseConfigured) {
      submitSellerApplicationToSupabase(newSeller, currentUser?.id).catch((err) => {
        console.warn('[Supabase] Seller registration sync error:', err);
      });
    }

    // If initial sample product was uploaded, stage it as pending review
    if (newSeller.initialProduct) {
      const sampleProd: Product = {
        id: crypto.randomUUID ? crypto.randomUUID() : `prod-${Date.now()}`,
        name: newSeller.initialProduct.name,
        categoryId: newSeller.categories[0] || 'furniture',
        subcategory: 'Artisan Special',
        price: newSeller.initialProduct.price,
        unit: newSeller.initialProduct.unit,
        minOrderQuantity: 1,
        inStock: true,
        stockCount: newSeller.initialProduct.stockCount || 5,
        images: [newSeller.initialProduct.imageUrl || 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80'],
        description: newSeller.initialProduct.description,
        specifications: {
          'Origin': 'Saharanpur, UP',
          'Supplier': newSeller.shopName,
        },
        sellerId: newSeller.id,
        sellerName: newSeller.ownerName,
        sellerShopName: newSeller.shopName,
        sellerLocality: newSeller.locality,
        sellerPhone: newSeller.phone,
        sellerRating: 5.0,
        deliveryAreas: ['Saharanpur Local'],
        status: 'pending', // Staged pending seller approval
        createdAt: new Date().toISOString().split('T')[0],
      };
      setProducts((prev) => {
        const updated = [sampleProd, ...prev];
        safeSave('products', updated);
        return updated;
      });

      // Also persist initial sample product to Supabase if configured
      if (isSupabaseConfigured) {
        saveProductToSupabase(sampleProd).catch(() => {});
      }
    }

    addToast(
      'success',
      'Shop Registration Received',
      `Application ID: ${newSeller.id}. Pending review by MattoKart Saharanpur administration.`
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

    // Save newly created product to Supabase
    if (isSupabaseConfigured) {
      saveProductToSupabase(newProd)
        .then((res) => {
          if (res.success && res.id && res.id !== newProd.id) {
            // Update local ID with generated Supabase database UUID
            setProducts((prev) =>
              prev.map((p) => (p.id === newProd.id ? { ...p, id: res.id! } : p))
            );
          }
        })
        .catch((err) => {
          console.warn('[Supabase] Product save error:', err);
        });
    }

    addToast('success', 'Product Published!', `${newProd.name} is now listed in the catalog.`);
  };

  const handleUpdateProduct = (updatedProd: Product) => {
    setProducts((prev) => {
      const updated = prev.map((p) => (p.id === updatedProd.id ? updatedProd : p));
      safeSave('products', updated);
      return updated;
    });

    // Update product in Supabase
    if (isSupabaseConfigured) {
      updateProductInSupabase(updatedProd).catch((err) => {
        console.warn('[Supabase] Product update error:', err);
      });
    }

    addToast('info', 'Product Updated', `${updatedProd.name} details have been saved.`);
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => {
      const updated = prev.filter((p) => p.id !== productId);
      safeSave('products', updated);
      return updated;
    });

    // Delete product from Supabase
    if (isSupabaseConfigured) {
      deleteProductFromSupabase(productId).catch((err) => {
        console.warn('[Supabase] Product delete error:', err);
      });
    }

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
      const updated = prev.map((s) =>
        s.id === sellerId
          ? {
              ...s,
              status: 'active' as const,
              identityVerificationStatus: 'verified' as const,
              reviewedBy: 'Admin (Saharanpur Trade HQ)',
              reviewedAt: new Date().toISOString(),
            }
          : s
      );
      safeSave('sellers', updated);
      return updated;
    });
    // Auto-approve staged products for this approved seller
    setProducts((prev) => {
      const updated = prev.map((p) =>
        p.sellerId === sellerId && p.status === 'pending'
          ? { ...p, status: 'approved' as const }
          : p
      );
      safeSave('products', updated);
      return updated;
    });

    // Sync approval to Supabase
    if (isSupabaseConfigured) {
      updateSellerStatusInSupabase(sellerId, 'active', 'verified').catch(() => {});
    }

    addToast('success', 'Seller Approved & Verified', 'Shop is now active on MattoKart with product publishing permissions.');
  };

  const handleRejectSeller = (sellerId: string) => {
    setSellers((prev) => {
      const updated = prev.map((s) =>
        s.id === sellerId
          ? {
              ...s,
              status: 'pending_approval' as const,
              identityVerificationStatus: 'rejected' as const,
            }
          : s
      );
      safeSave('sellers', updated);
      return updated;
    });

    if (isSupabaseConfigured) {
      updateSellerStatusInSupabase(sellerId, 'pending_approval', 'rejected').catch(() => {});
    }

    addToast('info', 'Application Rejected', 'Seller application was declined.');
  };

  const handleToggleSuspendSeller = (sellerId: string) => {
    setSellers((prev) => {
      const updated = prev.map((s) => {
        if (s.id === sellerId) {
          const nextStatus = s.status === 'suspended' ? ('active' as const) : ('suspended' as const);
          if (isSupabaseConfigured) {
            updateSellerStatusInSupabase(sellerId, nextStatus).catch(() => {});
          }
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

    if (isSupabaseConfigured) {
      updateProductStatusInSupabase(productId, 'approved').catch(() => {});
    }

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

    if (isSupabaseConfigured) {
      updateProductStatusInSupabase(productId, 'rejected', reason).catch(() => {});
    }

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
