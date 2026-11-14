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
  CartItem,
  Order,
  OrderStatus,
  OrderItem,
  ProductReview,
  SavedAddress,
  DeliveryPartner,
  DeliverySettings,
  DeliveryType,
  CategorySuggestion,
  ShippingZone,
  SellerSubOrder,
  OrderTrackingEvent,
} from './types';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_SELLERS,
  INITIAL_ENQUIRIES,
  INITIAL_ORDERS,
  SAHARANPUR_LOCALITIES,
  INITIAL_SAVED_ADDRESSES,
  INITIAL_REVIEWS,
  INITIAL_DELIVERY_PARTNERS,
  INITIAL_DELIVERY_SETTINGS,
  INITIAL_CATEGORY_SUGGESTIONS,
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
import { CartView } from './views/CartView';
import { CheckoutView, PlaceOrderPayload } from './views/CheckoutView';
import { OrdersView } from './views/OrdersView';
import { WishlistView } from './views/WishlistView';
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
  createOrderInSupabase,
  getOrdersFromSupabase,
  updateOrderStatusInSupabase,
  getAddressesFromSupabase,
  saveAddressToSupabase,
  deleteAddressFromSupabase,
  getCartFromSupabase,
  syncCartToSupabase,
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
    } else if (path === '/cart') {
      setActiveTab('cart');
    } else if (path === '/checkout') {
      setActiveTab('checkout');
    } else if (path === '/orders') {
      setActiveTab('orders');
    } else if (path === '/wishlist') {
      setActiveTab('wishlist');
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
  const [categorySuggestions, setCategorySuggestions] = useState<CategorySuggestion[]>(() =>
    safeLoad('category_suggestions', INITIAL_CATEGORY_SUGGESTIONS)
  );

  // Shopping Cart & Multi-vendor Orders State
  const [cart, setCart] = useState<CartItem[]>(() => safeLoad('cart', []));
  const [orders, setOrders] = useState<Order[]>(() => safeLoad('orders', INITIAL_ORDERS));
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Customer experience state: Wishlist, Recently Viewed, Saved Addresses, Product Reviews
  const [wishlist, setWishlist] = useState<string[]>(() =>
    safeLoad('wishlist', ['prod-1', 'prod-3'])
  );
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>(() =>
    safeLoad('recently_viewed', ['prod-1', 'prod-2', 'prod-4'])
  );
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>(() =>
    safeLoad('saved_addresses', INITIAL_SAVED_ADDRESSES)
  );
  const [productReviews, setProductReviews] = useState<ProductReview[]>(() =>
    safeLoad('reviews', Object.values(INITIAL_REVIEWS).flat())
  );

  // Dual Delivery System: MattoKart Express Fleet & Settings
  const [deliveryPartners, setDeliveryPartners] = useState<DeliveryPartner[]>(() =>
    safeLoad('delivery_partners', INITIAL_DELIVERY_PARTNERS)
  );
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings>(() =>
    safeLoad('delivery_settings', INITIAL_DELIVERY_SETTINGS)
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
        const [cloudCats, cloudProds, cloudSellers, cloudOrders] = await Promise.all([
          getCategoriesFromSupabase(),
          getProductsFromSupabase(),
          getSellersFromSupabase(),
          getOrdersFromSupabase(),
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
        if (cloudOrders && cloudOrders.length > 0) {
          setOrders((currentOrders) => {
            const cloudIds = new Set(cloudOrders.map((o) => o.id));
            const localOnly = currentOrders.filter((o) => !cloudIds.has(o.id));
            return [...localOnly, ...cloudOrders];
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

  // Hydrate logged-in user's saved addresses and cloud cart from Supabase when logged in
  useEffect(() => {
    if (!currentUser?.id || !isSupabaseConfigured) return;
    let active = true;

    const hydrateCustomerCloudState = async () => {
      try {
        const [cloudAddresses, cloudCart] = await Promise.all([
          getAddressesFromSupabase(currentUser.id),
          getCartFromSupabase(currentUser.id),
        ]);
        if (!active) return;

        if (cloudAddresses && cloudAddresses.length > 0) {
          setSavedAddresses((prev) => {
            const cloudIds = new Set(cloudAddresses.map((a) => a.id));
            const localOnly = prev.filter((a) => !cloudIds.has(a.id));
            const merged = [...cloudAddresses, ...localOnly];
            safeSave('saved_addresses', merged);
            return merged;
          });
        }

        if (cloudCart && cloudCart.length > 0) {
          setCart((prev) => {
            if (prev.length === 0) {
              safeSave('cart', cloudCart);
              return cloudCart;
            }
            const mergedMap = new Map<string, CartItem>();
            cloudCart.forEach((item) => mergedMap.set(item.productId, item));
            prev.forEach((item) => {
              const existing = mergedMap.get(item.productId);
              if (existing) {
                mergedMap.set(item.productId, {
                  ...existing,
                  quantity: Math.max(existing.quantity, item.quantity),
                });
              } else {
                mergedMap.set(item.productId, item);
              }
            });
            const merged = Array.from(mergedMap.values());
            safeSave('cart', merged);
            return merged;
          });
        }
      } catch {
        // Safe local fallback
      }
    };

    hydrateCustomerCloudState();
    return () => {
      active = false;
    };
  }, [currentUser?.id]);

  // Persist logged-in user's cart automatically to Supabase whenever cart changes
  useEffect(() => {
    if (!currentUser?.id || !isSupabaseConfigured) return;
    syncCartToSupabase(cart, currentUser.id, currentUser.phone).catch(() => {});
  }, [cart, currentUser?.id, currentUser?.phone]);

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
      case 'cart':
        navigate('/cart');
        break;
      case 'checkout':
        navigate('/checkout');
        break;
      case 'orders':
        navigate('/orders');
        break;
      case 'wishlist':
        navigate('/wishlist');
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

  const handleSelectCategory = (catId: CategoryId | 'all') => {
    setCatalogCategory(catId);
    setActiveTab('catalog');
    if (catId === 'all') {
      navigate('/products');
    } else {
      navigate(`/products?category=${encodeURIComponent(catId)}`);
    }
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

  // Wishlist handler
  const handleToggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      const updated = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
      safeSave('wishlist', updated);
      if (!exists) {
        addToast('success', 'Added to Wishlist (इच्छा सूची में जोड़ा)', 'Product saved to your wishlist.');
      } else {
        addToast('info', 'Removed from Wishlist', 'Product removed from your wishlist.');
      }
      return updated;
    });
  };

  // Product detail & Recently Viewed handler
  const handleViewProductDetail = (p: Product) => {
    setSelectedProductForDetail(p);
    setRecentlyViewedIds((prev) => {
      const filtered = prev.filter((id) => id !== p.id);
      const updated = [p.id, ...filtered].slice(0, 10);
      safeSave('recently_viewed', updated);
      return updated;
    });
  };

  // Review submission handler
  const handleAddReview = (newReview: {
    productId: string;
    userName: string;
    rating: number;
    title: string;
    comment: string;
    locality?: string;
  }) => {
    const created: ProductReview = {
      id: `rev-${Date.now()}`,
      productId: newReview.productId,
      userName: newReview.userName,
      rating: newReview.rating,
      title: newReview.title,
      comment: newReview.comment,
      verifiedPurchase: true,
      locality: newReview.locality || selectedLocality.name,
      createdAt: new Date().toISOString(),
      status: 'approved',
    };
    setProductReviews((prev) => {
      const updated = [created, ...prev];
      safeSave('reviews', updated);
      return updated;
    });
    addToast('success', 'Review Submitted (समीक्षा दर्ज)', 'Thank you for your rating & feedback!');
  };

  // MattoKart Delivery Fleet assignment by Admin
  const handleAssignDeliveryPartner = (orderId: string, partnerId: string) => {
    const partner = deliveryPartners.find((p) => p.id === partnerId);
    if (!partner) return;
    setOrders((prev) => {
      const updated = prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              deliveryType: 'mattokart_delivery' as DeliveryType,
              deliveryPartnerId: partner.id,
              deliveryPartnerName: partner.fullName,
              deliveryPartnerPhone: partner.phone,
              deliveryStatus: 'assigned' as const,
              orderStatus: (o.orderStatus === 'placed' || o.orderStatus === 'confirmed' ? 'processing' : o.orderStatus) as OrderStatus,
              updatedAt: new Date().toISOString(),
              notes: `${o.notes || ''} | MattoKart Rider Assigned: ${partner.fullName} (${partner.phone})`.trim(),
            }
          : o
      );
      safeSave('orders', updated);
      return updated;
    });
    addToast('success', 'Rider Assigned', `${partner.fullName} (${partner.vehicleNumber}) has been assigned to Order.`);
  };

  // Shopping Cart Handlers
  const handleAddToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      let updated: CartItem[];
      if (existingIndex >= 0) {
        updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
      } else {
        updated = [
          ...prev,
          {
            productId: product.id,
            product,
            quantity,
            selectedUnit: product.unit,
          },
        ];
      }
      safeSave('cart', updated);
      return updated;
    });
    addToast('success', 'Added to Cart (कार्ट में जोड़ा गया)', `${product.name} (x${quantity}) added to cart.`);
  };

  const handleBuyNow = (product: Product, quantity = 1) => {
    handleAddToCart(product, quantity);
    handleSetActiveTab('checkout');
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    setCart((prev) => {
      let updated: CartItem[];
      if (quantity <= 0) {
        updated = prev.filter((item) => item.product.id !== productId);
      } else {
        updated = prev.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        );
      }
      safeSave('cart', updated);
      return updated;
    });
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart((prev) => {
      const updated = prev.filter((item) => item.product.id !== productId);
      safeSave('cart', updated);
      return updated;
    });
    addToast('info', 'Item Removed', 'Product removed from your cart.');
  };

  const handleClearCart = () => {
    setCart([]);
    safeSave('cart', []);
    addToast('info', 'Cart Cleared', 'Your shopping cart is now empty.');
  };

  // Saved Customer Address Book Handlers (Add, Edit, Delete, Default)
  const handleSaveAddress = (addr: SavedAddress) => {
    setSavedAddresses((prev) => {
      const normalized = addr.isDefault
        ? prev.map((a) => ({ ...a, isDefault: false }))
        : [...prev];
      const existingIdx = normalized.findIndex((a) => a.id === addr.id);
      let updated: SavedAddress[];
      if (existingIdx >= 0) {
        updated = normalized.map((a) => (a.id === addr.id ? addr : a));
      } else {
        updated = [addr, ...normalized];
      }
      safeSave('saved_addresses', updated);
      return updated;
    });

    if (isSupabaseConfigured && currentUser?.id) {
      saveAddressToSupabase(addr, currentUser.id).catch(() => {});
    }

    addToast('success', 'Address Saved', `${addr.tag || 'Delivery'} address updated in your address book.`);
  };

  const handleDeleteAddress = (addressId: string) => {
    setSavedAddresses((prev) => {
      const updated = prev.filter((a) => a.id !== addressId);
      safeSave('saved_addresses', updated);
      return updated;
    });

    if (isSupabaseConfigured && currentUser?.id) {
      deleteAddressFromSupabase(addressId).catch(() => {});
    }

    addToast('info', 'Address Deleted', 'Address removed from your saved addresses.');
  };

  // Checkout & Order Placement (Multi-Vendor + Heavy Goods + COD, Zero Fake Tracking)
  const handlePlaceOrder = async (orderData: PlaceOrderPayload): Promise<Order | null> => {
    if (cart.length === 0) return null;

    // Final stock verification before order creation
    const outOfStock = cart.find(
      (item) =>
        !item.product.inStock ||
        item.product.stockCount <= 0 ||
        item.quantity > item.product.stockCount
    );
    if (outOfStock) {
      addToast(
        'error',
        'Insufficient Stock',
        `Only ${outOfStock.product.stockCount} ${outOfStock.product.unit} left for ${outOfStock.product.name}. Please update your cart.`
      );
      return null;
    }

    const nowIso = new Date().toISOString();
    const itemsTotal = orderData.subtotalAmount || cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const totalAmount = itemsTotal + (orderData.deliveryFee || 0) + (orderData.codFee || 0);
    const orderId = `ord-${Date.now()}`;
    const orderNum = `MKT-${orderData.pinCode || '247001'}-${Math.floor(1000 + Math.random() * 9000)}`;

    const orderItems: OrderItem[] = cart.map((item, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      orderId,
      productId: item.product.id,
      sellerId: item.product.sellerId,
      sellerShopName: item.product.sellerShopName,
      productName: item.product.name,
      productImage:
        (item.product.images && item.product.images[0]) ||
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
      unitPrice: item.product.price,
      quantity: item.quantity,
      unit: item.product.unit,
      totalPrice: item.product.price * item.quantity,
      itemStatus: 'pending',
      createdAt: nowIso,
    }));

    const sellerOrders: SellerSubOrder[] | undefined = orderData.sellerOrders?.map((so, idx) => ({
      ...so,
      orderId,
      subOrderNumber: `${orderNum}-S${idx + 1}`,
      trackingNumber: undefined,
      createdAt: nowIso,
    }));

    const initialTracking: OrderTrackingEvent[] = [
      {
        id: `trk-${Date.now()}`,
        orderId,
        status: 'placed',
        title: 'Order Placed (Cash on Delivery)',
        description:
          orderData.initialTrackingNote ||
          `Order #${orderNum} received for ${orderData.city}, ${orderData.state} (${orderData.pinCode}).`,
        location: `${orderData.city}, ${orderData.state}`,
        actorRole: 'customer',
        createdAt: nowIso,
      },
    ];

    const newOrder: Order = {
      id: orderId,
      orderNumber: orderNum,
      customerId: currentUser?.id || `cust-${orderData.customerPhone.replace(/\D/g, '')}`,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      customerEmail: orderData.customerEmail,
      deliveryAddress: orderData.deliveryAddress,
      landmark: orderData.landmark,
      locality: orderData.locality,
      district: orderData.district || orderData.city,
      city: orderData.city || 'Saharanpur',
      state: orderData.state || 'Uttar Pradesh',
      pinCode: orderData.pinCode,
      subtotalAmount: itemsTotal,
      codFee: orderData.codFee || 0,
      totalAmount,
      deliveryType: orderData.deliveryType || 'seller_delivery',
      deliveryFee: orderData.deliveryFee || 0,
      deliveryStatus: orderData.deliveryType === 'mattokart_delivery' ? 'requested' : 'pending',
      shippingZone: orderData.shippingZone,
      courierPartner: orderData.courierPartner,
      estimatedDeliveryWindow: orderData.estimatedDeliveryWindow,
      // Strictly no fake AWB/tracking number on order creation
      trackingNumber: undefined,
      paymentMethod: orderData.paymentMethod,
      paymentStatus: 'pending',
      orderStatus: 'placed',
      notes: orderData.notes,
      items: orderItems,
      sellerOrders,
      trackingEvents: initialTracking,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Sync to Express Backend
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder),
      });
    } catch (err) {
      console.warn('[Server] Order sync warning:', err);
    }

    // Sync to Supabase
    if (isSupabaseConfigured) {
      createOrderInSupabase(newOrder).catch((err) => {
        console.warn('[Supabase] Order creation warning:', err);
      });
    }

    // Decrement product inventory safely
    const orderedQtyByProduct = new Map<string, number>();
    cart.forEach((ci) => {
      orderedQtyByProduct.set(ci.product.id, (orderedQtyByProduct.get(ci.product.id) || 0) + ci.quantity);
    });
    setProducts((prev) => {
      const updated = prev.map((p) => {
        const bought = orderedQtyByProduct.get(p.id);
        if (!bought) return p;
        const nextStock = Math.max(0, p.stockCount - bought);
        return { ...p, stockCount: nextStock, inStock: nextStock > 0 };
      });
      safeSave('products', updated);
      return updated;
    });

    // Update orders state and clear cart
    setOrders((prev) => {
      const updated = [newOrder, ...prev];
      safeSave('orders', updated);
      return updated;
    });
    setCart([]);
    safeSave('cart', []);

    addToast(
      'success',
      'Order Placed Successfully!',
      `Order #${newOrder.orderNumber} placed for ${newOrder.city}, ${newOrder.state} (Cash on Delivery).`
    );

    return newOrder;
  };

  // Order Cancellation by Customer
  const handleCancelOrder = async (orderId: string, reason: string): Promise<boolean> => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return false;

    if (
      targetOrder.orderStatus === 'packed' ||
      targetOrder.orderStatus === 'shipped' ||
      targetOrder.orderStatus === 'out_for_delivery' ||
      targetOrder.orderStatus === 'delivered' ||
      targetOrder.orderStatus === 'refunded'
    ) {
      addToast('error', 'Cannot Cancel Order', 'This order is already packed or dispatched. Please contact support.');
      return false;
    }

    try {
      await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
    } catch (err) {
      console.warn('[Server] Cancel order warning:', err);
    }

    if (isSupabaseConfigured) {
      updateOrderStatusInSupabase(orderId, 'cancelled', reason).catch(() => {});
    }

    const nowIso = new Date().toISOString();
    setOrders((prev) => {
      const updated = prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              orderStatus: 'cancelled' as OrderStatus,
              updatedAt: nowIso,
              notes: o.notes ? `${o.notes} | Cancelled: ${reason}` : `Cancelled: ${reason}`,
              items: o.items.map((item) => ({ ...item, itemStatus: 'cancelled' as const })),
              sellerOrders: o.sellerOrders?.map((so) => ({
                ...so,
                orderStatus: 'cancelled' as OrderStatus,
                deliveryStatus: 'cancelled' as const,
              })),
              trackingEvents: [
                ...(o.trackingEvents || []),
                {
                  id: `trk-${Date.now()}`,
                  orderId: o.id,
                  status: 'cancelled' as OrderStatus,
                  title: 'Order Cancelled',
                  description: reason,
                  actorRole: 'customer' as const,
                  createdAt: nowIso,
                },
              ],
            }
          : o
      );
      safeSave('orders', updated);
      return updated;
    });

    addToast('info', 'Order Cancelled', `Order #${targetOrder.orderNumber} has been cancelled.`);
    return true;
  };

  // Customer Return Request on Delivered Order
  const handleRequestReturn = async (orderId: string, reason: string): Promise<boolean> => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder || targetOrder.orderStatus !== 'delivered') {
      addToast('error', 'Return Unavailable', 'Returns can only be requested on delivered orders.');
      return false;
    }

    try {
      await fetch(`/api/orders/${orderId}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
    } catch (err) {
      console.warn('[Server] Return order warning:', err);
    }

    if (isSupabaseConfigured) {
      updateOrderStatusInSupabase(orderId, 'return_requested', reason).catch(() => {});
    }

    const nowIso = new Date().toISOString();
    setOrders((prev) => {
      const updated = prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              orderStatus: 'return_requested' as OrderStatus,
              updatedAt: nowIso,
              notes: o.notes ? `${o.notes} | Return Requested: ${reason}` : `Return Requested: ${reason}`,
              sellerOrders: o.sellerOrders?.map((so) => ({
                ...so,
                orderStatus: 'return_requested' as OrderStatus,
              })),
              trackingEvents: [
                ...(o.trackingEvents || []),
                {
                  id: `trk-${Date.now()}`,
                  orderId: o.id,
                  status: 'return_requested' as OrderStatus,
                  title: 'Return Requested by Customer',
                  description: reason,
                  actorRole: 'customer' as const,
                  createdAt: nowIso,
                },
              ],
            }
          : o
      );
      safeSave('orders', updated);
      return updated;
    });

    addToast('success', 'Return Request Submitted', `Return ticket created for #${targetOrder.orderNumber}.`);
    return true;
  };

  // Order Status Update by Seller or Admin (Full 10-Stage Lifecycle)
  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: OrderStatus,
    notes?: string,
    extras?: { sellerId?: string; courierName?: string; trackingNumber?: string }
  ): Promise<boolean> => {
    try {
      await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          notes,
          sellerId: extras?.sellerId,
          courierName: extras?.courierName,
          trackingNumber: extras?.trackingNumber,
        }),
      });
    } catch (err) {
      console.warn('[Server] Update order status warning:', err);
    }

    if (isSupabaseConfigured) {
      updateOrderStatusInSupabase(orderId, newStatus, notes).catch(() => {});
    }

    const titles: Record<OrderStatus, string> = {
      placed: 'Order Placed',
      payment_confirmed: 'Payment Confirmed',
      confirmed: 'Order Confirmed',
      processing: 'Processing Order',
      packed: 'Packed & Ready',
      shipped: 'Shipped / Dispatched',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered & COD Collected',
      cancelled: 'Order Cancelled',
      return_requested: 'Return Requested',
      refunded: 'Refund Processed',
    };

    const nowIso = new Date().toISOString();
    setOrders((prev) => {
      const updated = prev.map((o) => {
        if (o.id !== orderId) return o;
        const nextSellerOrders = o.sellerOrders?.map((so) => {
          if (extras?.sellerId && so.sellerId !== extras.sellerId) return so;
          return {
            ...so,
            orderStatus: newStatus,
            courierName: extras?.courierName || so.courierName,
            trackingNumber: extras?.trackingNumber || so.trackingNumber,
            deliveryStatus:
              newStatus === 'delivered'
                ? ('delivered' as const)
                : newStatus === 'out_for_delivery'
                ? ('out_for_delivery' as const)
                : newStatus === 'shipped'
                ? ('picked_up' as const)
                : newStatus === 'cancelled'
                ? ('cancelled' as const)
                : so.deliveryStatus,
          };
        });

        const nextEvent: OrderTrackingEvent = {
          id: `trk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          orderId: o.id,
          status: newStatus,
          title: titles[newStatus] || newStatus,
          description:
            notes ||
            (extras?.trackingNumber ? `Tracking / LR #: ${extras.trackingNumber}` : undefined),
          location: `${o.city}, ${o.state}`,
          actorRole: extras?.sellerId ? 'seller' : 'admin',
          createdAt: nowIso,
        };

        return {
          ...o,
          orderStatus: newStatus,
          courierPartner: extras?.courierName || o.courierPartner,
          trackingNumber: extras?.trackingNumber || o.trackingNumber,
          paymentStatus:
            newStatus === 'delivered'
              ? ('completed' as const)
              : newStatus === 'refunded'
              ? ('refunded' as const)
              : o.paymentStatus,
          updatedAt: nowIso,
          notes: notes ? `${o.notes ? o.notes + ' | ' : ''}${notes}`.trim() : o.notes,
          sellerOrders: nextSellerOrders,
          trackingEvents: [...(o.trackingEvents || []), nextEvent],
          items: o.items.map((item): OrderItem => {
            if (extras?.sellerId && item.sellerId !== extras.sellerId) return item;
            const nextItemStatus: OrderItem['itemStatus'] =
              newStatus === 'cancelled' || newStatus === 'refunded'
                ? 'cancelled'
                : newStatus === 'delivered'
                ? 'delivered'
                : newStatus === 'shipped' || newStatus === 'out_for_delivery'
                ? 'shipped'
                : newStatus === 'packed'
                ? 'ready_for_pickup'
                : 'confirmed';
            return {
              ...item,
              itemStatus: nextItemStatus,
            };
          }),
        };
      });
      safeSave('orders', updated);
      return updated;
    });

    addToast('success', 'Order Status Updated', `Status changed to ${titles[newStatus] || newStatus}`);
    return true;
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
      const sellerCity = newSeller.city || 'Saharanpur';
      const sellerState = newSeller.state || 'Uttar Pradesh';
      const shippingScope = newSeller.shipsPanIndia !== false ? 'pan_india' : 'local_only';
      const sampleProd: Product = {
        id: crypto.randomUUID ? crypto.randomUUID() : `prod-${Date.now()}`,
        name: newSeller.initialProduct.name,
        categoryId: newSeller.categories[0] || 'furniture',
        subcategory: 'Marketplace Listing',
        price: newSeller.initialProduct.price,
        unit: newSeller.initialProduct.unit,
        minOrderQuantity: 1,
        inStock: true,
        stockCount: newSeller.initialProduct.stockCount || 5,
        images: [newSeller.initialProduct.imageUrl || 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80'],
        description: newSeller.initialProduct.description,
        specifications: {
          Origin: `${sellerCity}, ${sellerState}`,
          Supplier: newSeller.shopName,
        },
        sellerId: newSeller.id,
        sellerName: newSeller.ownerName,
        sellerShopName: newSeller.shopName,
        sellerLocality: newSeller.locality,
        sellerCity,
        sellerState,
        sellerPinCode: newSeller.pinCode,
        sellerPhone: newSeller.phone,
        sellerRating: 5.0,
        shippingScope,
        deliveryAreas: shippingScope === 'pan_india' ? ['All India'] : [`${sellerCity} Local`],
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
      `Application ID: ${newSeller.id}. Pending review by MattoKart verification team.`
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

  const handleSuggestCategory = (suggestion: Omit<CategorySuggestion, 'id' | 'status' | 'createdAt'>) => {
    const newSuggestion: CategorySuggestion = {
      ...suggestion,
      id: `catsug-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setCategorySuggestions((prev) => {
      const updated = [newSuggestion, ...prev];
      safeSave('category_suggestions', updated);
      return updated;
    });
    addToast(
      'success',
      'Category Suggestion Sent',
      `"${suggestion.suggestedName}" has been submitted for MattoKart admin review.`
    );
  };

  const handleApproveCategorySuggestion = (suggestionId: string) => {
    const suggestion = categorySuggestions.find((s) => s.id === suggestionId);
    if (!suggestion) return;

    const baseSlug =
      suggestion.suggestedName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '') || `custom_${Date.now()}`;
    const uniqueSlug = categories.some((c) => c.id === baseSlug)
      ? `${baseSlug}_${Math.floor(100 + Math.random() * 900)}`
      : baseSlug;

    const parsedSubs = (suggestion.sampleSubcategories || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const createdCategory: Category = {
      id: uniqueSlug as CategoryId,
      name: suggestion.suggestedName,
      hindiName: suggestion.hindiName || suggestion.suggestedName,
      description: suggestion.reason || `${suggestion.suggestedName} products from verified Indian sellers.`,
      iconName: 'Package',
      itemCount: 0,
      subcategories: parsedSubs.length > 0 ? parsedSubs : [suggestion.suggestedName],
    };

    setCategories((prev) => {
      const updated = [...prev, createdCategory];
      safeSave('categories', updated);
      return updated;
    });

    setCategorySuggestions((prev) => {
      const updated = prev.map((s) =>
        s.id === suggestionId ? { ...s, status: 'approved' as const } : s
      );
      safeSave('category_suggestions', updated);
      return updated;
    });

    addToast(
      'success',
      'Suggested Category Approved',
      `"${suggestion.suggestedName}" is now live across Pan-India MattoKart.`
    );
  };

  const handleRejectCategorySuggestion = (suggestionId: string) => {
    setCategorySuggestions((prev) => {
      const updated = prev.map((s) =>
        s.id === suggestionId ? { ...s, status: 'rejected' as const } : s
      );
      safeSave('category_suggestions', updated);
      return updated;
    });
    addToast('info', 'Suggestion Declined', 'Category request marked as rejected.');
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
        cartCount={cartCount}
        wishlistCount={wishlist.length}
        currentUser={currentUser}
        onOpenAuthModal={handleOpenAuthModal}
        onLogout={handleLogout}
        onSelectCategory={handleSelectCategory}
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
              onViewProductDetails={handleViewProductDetail}
              onContactSeller={(p) => setSelectedProductForEnquiry(p)}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
              onGoToCatalog={() => {
                setCatalogCategory('all');
                handleSetActiveTab('catalog');
              }}
              onGoToShops={() => handleSetActiveTab('shops')}
              onGoToSellerRegister={() => handleSetActiveTab('seller-register')}
              onOpenLocationModal={() => setIsLocationModalOpen(true)}
              onSelectShopProducts={handleSelectShopProducts}
              wishlist={wishlist}
              onToggleWishlist={handleToggleWishlist}
              recentlyViewedIds={recentlyViewedIds}
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
              onViewProductDetails={handleViewProductDetail}
              onContactSeller={(p) => setSelectedProductForEnquiry(p)}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
              currentLocality={selectedLocality}
              wishlist={wishlist}
              onToggleWishlist={handleToggleWishlist}
            />
          )}

          {activeTab === 'wishlist' && (
            <WishlistView
              wishlistIds={wishlist}
              products={products}
              onRemoveFromWishlist={handleToggleWishlist}
              onAddToCart={handleAddToCart}
              onGoToCatalog={() => handleSetActiveTab('catalog')}
              onViewProductDetails={handleViewProductDetail}
            />
          )}

          {activeTab === 'cart' && (
            <CartView
              cart={cart}
              selectedLocality={selectedLocality}
              currentUser={currentUser}
              onUpdateQuantity={handleUpdateCartQuantity}
              onRemoveItem={handleRemoveCartItem}
              onClearCart={handleClearCart}
              onProceedToCheckout={() => handleSetActiveTab('checkout')}
              onGoToCatalog={() => handleSetActiveTab('catalog')}
              onViewProductDetails={handleViewProductDetail}
              onOpenLocationModal={() => setIsLocationModalOpen(true)}
              onOpenAuthModal={() => handleOpenAuthModal('customer')}
            />
          )}

          {activeTab === 'checkout' && (
            <CheckoutView
              cart={cart}
              currentUser={currentUser}
              selectedLocality={selectedLocality}
              savedAddresses={savedAddresses}
              onSaveAddress={handleSaveAddress}
              onDeleteAddress={handleDeleteAddress}
              onPlaceOrder={handlePlaceOrder}
              onGoBackToCart={() => handleSetActiveTab('cart')}
              onGoToOrders={() => handleSetActiveTab('orders')}
              onGoToCatalog={() => handleSetActiveTab('catalog')}
            />
          )}

          {activeTab === 'orders' && (
            <OrdersView
              orders={
                currentUser
                  ? orders.filter(
                      (o) =>
                        o.customerId === currentUser.id ||
                        (currentUser.phone &&
                          o.customerPhone.replace(/\D/g, '').includes(currentUser.phone.replace(/\D/g, ''))) ||
                        o.id.startsWith('ord-')
                    )
                  : orders
              }
              onCancelOrder={handleCancelOrder}
              onRequestReturn={handleRequestReturn}
              onBuyAgain={(item) => {
                const matched = products.find((p) => p.id === item.productId);
                if (matched) {
                  handleAddToCart(matched, item.quantity || 1);
                  handleSetActiveTab('cart');
                } else {
                  handleAddToCart(
                    {
                      id: item.productId,
                      name: item.productName,
                      sellerId: item.sellerId,
                      sellerName: item.sellerShopName || 'Saharanpur Merchant',
                      sellerShopName: item.sellerShopName || 'Saharanpur Local Shop',
                      price: item.unitPrice,
                      images: [item.productImage],
                      categoryId: 'furniture',
                      subcategory: 'Artisan Special',
                      unit: item.unit || 'piece',
                      minOrderQuantity: 1,
                      inStock: true,
                      stockCount: 10,
                      specifications: {},
                      sellerLocality: 'Saharanpur',
                      sellerPhone: '+91 98970 12345',
                      sellerRating: 4.8,
                      deliveryAreas: ['Saharanpur Local'],
                      status: 'approved',
                      featured: false,
                      recentlyAdded: false,
                      isWoodcraftSpecial: false,
                      description: item.productName,
                      createdAt: new Date().toISOString(),
                    },
                    item.quantity || 1
                  );
                  handleSetActiveTab('cart');
                }
              }}
              onGoToCatalog={() => handleSetActiveTab('catalog')}
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
              currentUser={currentUser}
              onOpenAuthModal={() => handleOpenAuthModal('seller')}
              onSuggestCategory={handleSuggestCategory}
            />
          )}

          {activeTab === 'seller-dashboard' && (
            <SellerDashboardView
              currentSeller={currentSeller}
              allSellers={sellers}
              onSelectSeller={setCurrentSellerId}
              products={products}
              enquiries={enquiries}
              categories={categories}
              orders={orders}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onUpdateSeller={handleUpdateSeller}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onSuggestCategory={handleSuggestCategory}
            />
          )}

          {activeTab === 'admin-dashboard' && (
            <AdminDashboardView
              sellers={sellers}
              products={products}
              categories={categories}
              enquiries={enquiries}
              orders={orders}
              deliveryPartners={deliveryPartners}
              categorySuggestions={categorySuggestions}
              onApproveSeller={handleApproveSeller}
              onRejectSeller={handleRejectSeller}
              onToggleSuspendSeller={handleToggleSuspendSeller}
              onApproveProduct={handleApproveProduct}
              onRejectProduct={handleRejectProduct}
              onAddCategory={handleAddCategory}
              onApproveCategorySuggestion={handleApproveCategorySuggestion}
              onRejectCategorySuggestion={handleRejectCategorySuggestion}
              onUpdateSellerFeeStatus={handleUpdateSellerFeeStatus}
              onAdminUpdateOrderStatus={handleUpdateOrderStatus}
              onAssignDeliveryPartner={handleAssignDeliveryPartner}
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
        cartCount={cartCount}
      />

      {/* Location Selector Modal */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        selectedLocality={selectedLocality}
        onSelectLocality={(loc) => {
          setSelectedLocality(loc);
          safeSave('locality', loc);
          addToast('info', 'Location Updated', `Delivery location set to ${loc.name} (${loc.pinCode})`);
        }}
      />

      {/* Product Detail Modal with Reviews & Wishlist */}
      <ProductDetailModal
        product={selectedProductForDetail}
        onClose={() => setSelectedProductForDetail(null)}
        onOpenEnquiry={(p) => setSelectedProductForEnquiry(p)}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        isWishlisted={selectedProductForDetail ? wishlist.includes(selectedProductForDetail.id) : false}
        onToggleWishlist={handleToggleWishlist}
        reviews={productReviews.filter((r) => r.productId === selectedProductForDetail?.id)}
        onAddReview={handleAddReview}
        relatedProducts={products.filter(
          (p) =>
            p.categoryId === selectedProductForDetail?.categoryId &&
            p.id !== selectedProductForDetail?.id
        )}
        allProducts={products}
        selectedLocality={selectedLocality}
        onSelectProduct={handleViewProductDetail}
      />

      {/* Direct Buyer Enquiry Modal */}
      <EnquiryModal
        product={selectedProductForEnquiry}
        isOpen={!!selectedProductForEnquiry}
        onClose={() => setSelectedProductForEnquiry(null)}
        onSubmitEnquiry={handleSubmitEnquiry}
        currentLocality={selectedLocality}
      />

      {/* Indian Mobile OTP Login / Register Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        initialRole={authModalRole}
      />
    </div>
  );
}
