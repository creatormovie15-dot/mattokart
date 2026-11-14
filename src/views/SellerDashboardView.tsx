import React, { useState } from 'react';
import {
  Store,
  Plus,
  Package,
  MessageSquare,
  UserCheck,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  X,
  Phone,
  MessageCircle,
  Sparkles,
  ShieldCheck,
  Lock,
  AlertCircle,
  ExternalLink,
  ShoppingBag,
  Truck,
  Check,
  MapPin,
} from 'lucide-react';
import {
  Product,
  Seller,
  BuyerEnquiry,
  Category,
  CategorySuggestion,
  UnitType,
  CategoryId,
  Order,
  OrderStatus,
  ShippingScope,
  ProductCondition,
} from '../types';
import { IdentityVerificationCard } from '../components/IdentityVerificationCard';
import { checkProhibitedProduct } from '../data/indiaData';

interface SellerDashboardViewProps {
  currentSeller: Seller;
  allSellers?: Seller[];
  onSelectSeller?: (sellerId: string) => void;
  products: Product[];
  enquiries: BuyerEnquiry[];
  categories: Category[];
  orders?: Order[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateSeller: (seller: Seller) => void;
  onUpdateOrderStatus?: (
    orderId: string,
    status: OrderStatus,
    notes?: string,
    extras?: { sellerId?: string; courierName?: string; trackingNumber?: string }
  ) => Promise<boolean>;
  onSuggestCategory?: (suggestion: Omit<CategorySuggestion, 'id' | 'status' | 'createdAt'>) => void;
}

export const SellerDashboardView: React.FC<SellerDashboardViewProps> = ({
  currentSeller,
  allSellers,
  onSelectSeller,
  products,
  enquiries,
  categories,
  orders = [],
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateSeller,
  onUpdateOrderStatus,
  onSuggestCategory,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'enquiries' | 'profile' | 'kyc'>('orders');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showSuggestCatBox, setShowSuggestCatBox] = useState(false);
  const [sugName, setSugName] = useState('');
  const [sugHindi, setSugHindi] = useState('');
  const [sugSubs, setSugSubs] = useState('');
  const [sugReason, setSugReason] = useState('');
  const [sugSent, setSugSent] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'active' | 'delivered' | 'returns'>('all');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [dispatchCourierMap, setDispatchCourierMap] = useState<Record<string, string>>({});
  const [dispatchTrackingMap, setDispatchTrackingMap] = useState<Record<string, string>>({});

  // Filter seller's own data (Strict RLS: seller only accesses orders with their items)
  const sellerProducts = products.filter((p) => p.sellerId === currentSeller.id);
  const sellerEnquiries = enquiries.filter((e) => e.sellerId === currentSeller.id);
  const sellerOrders = orders.filter((o) => o.items.some((item) => item.sellerId === currentSeller.id));
  const pendingOrdersCount = sellerOrders.filter((o) => {
    const sub = o.sellerOrders?.find((so) => so.sellerId === currentSeller.id);
    const st = sub?.orderStatus || o.orderStatus;
    return st === 'placed' || st === 'payment_confirmed' || st === 'confirmed';
  }).length;

  // Form states for Add / Edit Product
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState<CategoryId>('furniture');
  const [prodSubcategory, setProdSubcategory] = useState('Wooden Mandir');
  const [prodPrice, setProdPrice] = useState<number>(1000);
  const [prodOriginalPrice, setProdOriginalPrice] = useState<number | undefined>(1200);
  const [prodUnit, setProdUnit] = useState<UnitType>('piece');
  const [prodStock, setProdStock] = useState<number>(10);
  const [prodMinOrderQty, setProdMinOrderQty] = useState<number>(1);
  const [prodDescription, setProdDescription] = useState('');
  const [prodDeliveryAreas, setProdDeliveryAreas] = useState(
    currentSeller.shipsPanIndia !== false ? 'All India Courier & Local Pickup' : `${currentSeller.city} Local`
  );
  const [prodShippingScope, setProdShippingScope] = useState<ShippingScope>(
    currentSeller.shipsPanIndia !== false ? 'pan_india' : 'local_only'
  );
  const [prodCondition, setProdCondition] = useState<ProductCondition>('new');
  const [prodWeightKg, setProdWeightKg] = useState<number>(1.5);
  const [prodDimL, setProdDimL] = useState<number>(30);
  const [prodDimB, setProdDimB] = useState<number>(20);
  const [prodDimH, setProdDimH] = useState<number>(15);
  const [prodDeliveryMode, setProdDeliveryMode] = useState<'standard_courier' | 'seller_transport' | 'both'>('standard_courier');
  const [prodSellerDeliveryFee, setProdSellerDeliveryFee] = useState<number>(0);
  const [prodLocalDeliveryAvailable, setProdLocalDeliveryAvailable] = useState<boolean>(true);
  const [prodCodAvailable, setProdCodAvailable] = useState<boolean>(true);
  const [prodImageUrl, setProdImageUrl] = useState('');
  const [prodIsWoodcraft, setProdIsWoodcraft] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Preset sample product images for quick testing
  const sampleImages = [
    { label: 'Sheesham Furniture', url: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80' },
    { label: 'Teak Mandir', url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80' },
    { label: 'Cement Bags', url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80' },
    { label: 'Steel TMT Sariya', url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80' },
    { label: 'Electronics & Inverter', url: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=800&q=80' },
    { label: 'Handloom Sarees', url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80' },
    { label: 'Desi Gur & Grocery', url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80' },
    { label: 'Power Tools', url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80' },
  ];

  const resetProductForm = () => {
    setProdName('');
    setProdCategory(currentSeller.categories[0] || 'furniture');
    setProdSubcategory('General');
    setProdPrice(1000);
    setProdOriginalPrice(1200);
    setProdUnit('piece');
    setProdStock(10);
    setProdMinOrderQty(1);
    setProdDescription('');
    setProdDeliveryAreas(
      currentSeller.shipsPanIndia !== false ? 'All India Courier & Local Pickup' : `${currentSeller.city} Local`
    );
    setProdShippingScope(currentSeller.shipsPanIndia !== false ? 'pan_india' : 'local_only');
    setProdCondition('new');
    setProdWeightKg(1.5);
    setProdDimL(30);
    setProdDimB(20);
    setProdDimH(15);
    setProdDeliveryMode('standard_courier');
    setProdSellerDeliveryFee(0);
    setProdLocalDeliveryAvailable(true);
    setProdCodAvailable(true);
    setProdImageUrl('');
    setProdIsWoodcraft(false);
    setFormErrors({});
    setEditingProduct(null);
  };

  const handleOpenAddModal = () => {
    resetProductForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdCategory(p.categoryId);
    setProdSubcategory(p.subcategory);
    setProdPrice(p.price);
    setProdOriginalPrice(p.originalPrice);
    setProdUnit(p.unit);
    setProdStock(p.stockCount);
    setProdMinOrderQty(p.minOrderQuantity || 1);
    setProdDescription(p.description);
    setProdDeliveryAreas(Array.isArray(p.deliveryAreas) ? p.deliveryAreas.join(', ') : `${currentSeller.city} Local`);
    setProdShippingScope(p.shippingScope || 'pan_india');
    setProdCondition(p.condition || 'new');
    setProdWeightKg(p.estimatedWeightKg || 1.5);
    setProdDimL(p.dimensionsCm?.length || 30);
    setProdDimB(p.dimensionsCm?.breadth || 20);
    setProdDimH(p.dimensionsCm?.height || 15);
    setProdDeliveryMode(p.deliveryMode || 'standard_courier');
    setProdSellerDeliveryFee(p.sellerDeliveryFee || 0);
    setProdLocalDeliveryAvailable(p.localDeliveryAvailable !== false);
    setProdCodAvailable(p.codAvailable !== false);
    setProdImageUrl((p.images && p.images[0]) || '');
    setProdIsWoodcraft(!!p.isWoodcraftSpecial);
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!prodName.trim()) errors.name = 'Product name is required';
    if (!prodPrice || prodPrice <= 0) errors.price = 'Valid price in ₹ is required';
    if (!prodDescription.trim()) errors.desc = 'Product description is required';

    const prohibited = checkProhibitedProduct(prodName, prodDescription);
    if (prohibited.blocked) {
      errors.name = prohibited.message || 'Prohibited product blocked under Indian law.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const image = prodImageUrl.trim() || sampleImages[0].url;
    const areas = prodDeliveryAreas
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    if (currentSeller.status !== 'active') {
      setFormErrors({
        desc: 'Access Denied: Only approved sellers may publish products on MattoKart. Your shop application is currently Pending Admin Review.',
      });
      return;
    }

    const cleanDimensions = {
      length: Math.max(1, Number(prodDimL) || 10),
      breadth: Math.max(1, Number(prodDimB) || 10),
      height: Math.max(1, Number(prodDimH) || 10),
    };

    if (editingProduct) {
      const updated: Product = {
        ...editingProduct,
        name: prodName.trim(),
        categoryId: prodCategory,
        subcategory: prodSubcategory,
        price: Number(prodPrice),
        originalPrice: prodOriginalPrice ? Number(prodOriginalPrice) : undefined,
        unit: prodUnit,
        minOrderQuantity: Math.max(1, Number(prodMinOrderQty) || 1),
        stockCount: Number(prodStock),
        inStock: Number(prodStock) > 0,
        description: prodDescription.trim(),
        deliveryAreas: areas.length > 0 ? areas : ['All India'],
        shippingScope: prodShippingScope,
        condition: prodCondition,
        estimatedWeightKg: Math.max(0.2, Number(prodWeightKg) || 1),
        dimensionsCm: cleanDimensions,
        deliveryMode: prodDeliveryMode,
        sellerDeliveryFee: Math.max(0, Number(prodSellerDeliveryFee) || 0),
        localDeliveryAvailable: prodLocalDeliveryAvailable,
        codAvailable: prodCodAvailable,
        sellerCity: currentSeller.city,
        sellerState: currentSeller.state || 'Uttar Pradesh',
        sellerPinCode: currentSeller.pinCode,
        images: [image],
        isWoodcraftSpecial: prodIsWoodcraft,
      };
      onUpdateProduct(updated);
    } else {
      const newProd: Product = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `prod-${Date.now()}`,
        name: prodName.trim(),
        categoryId: prodCategory,
        subcategory: prodSubcategory,
        price: Number(prodPrice),
        originalPrice: prodOriginalPrice ? Number(prodOriginalPrice) : undefined,
        unit: prodUnit,
        minOrderQuantity: Math.max(1, Number(prodMinOrderQty) || 1),
        inStock: Number(prodStock) > 0,
        stockCount: Number(prodStock),
        images: [image],
        description: prodDescription.trim(),
        specifications: {
          Origin: `${currentSeller.city}, ${currentSeller.state || 'Uttar Pradesh'}`,
          Supplier: currentSeller.shopName,
          Condition: prodCondition === 'used_good' ? 'Pre-owned (Verified)' : prodCondition === 'refurbished' ? 'Refurbished' : 'Brand New',
        },
        sellerId: currentSeller.id,
        sellerName: currentSeller.ownerName,
        sellerShopName: currentSeller.shopName,
        sellerLocality: currentSeller.locality,
        sellerCity: currentSeller.city,
        sellerState: currentSeller.state || 'Uttar Pradesh',
        sellerPinCode: currentSeller.pinCode,
        sellerPhone: currentSeller.phone,
        sellerRating: currentSeller.rating,
        deliveryAreas: areas.length > 0 ? areas : ['All India'],
        shippingScope: prodShippingScope,
        condition: prodCondition,
        estimatedWeightKg: Math.max(0.2, Number(prodWeightKg) || 1),
        dimensionsCm: cleanDimensions,
        deliveryMode: prodDeliveryMode,
        sellerDeliveryFee: Math.max(0, Number(prodSellerDeliveryFee) || 0),
        localDeliveryAvailable: prodLocalDeliveryAvailable,
        codAvailable: prodCodAvailable,
        featured: false,
        recentlyAdded: true,
        isWoodcraftSpecial: prodIsWoodcraft,
        status: 'approved',
        createdAt: new Date().toISOString().split('T')[0],
      };
      onAddProduct(newProd);
    }

    setIsAddModalOpen(false);
    resetProductForm();
  };

  const handleSubmitCategorySuggestion = () => {
    if (!sugName.trim() || !onSuggestCategory) return;
    onSuggestCategory({
      suggestedName: sugName.trim(),
      hindiName: sugHindi.trim() || undefined,
      sampleSubcategories: sugSubs.trim() || sugName.trim(),
      reason: sugReason.trim() || `Requested from Seller Portal (${currentSeller.city})`,
      suggestedBySellerId: currentSeller.id,
      suggestedByShopName: currentSeller.shopName,
      sellerState: currentSeller.state || 'Uttar Pradesh',
    });
    setSugSent(true);
    setSugName('');
    setSugHindi('');
    setSugSubs('');
    setSugReason('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
              Seller Control Center
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">
              {currentSeller.locality}, {currentSeller.city}, {currentSeller.state || 'Uttar Pradesh'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-brand flex items-center gap-2">
            <span>{currentSeller.shopName}</span>
          </h1>
          <p className="text-xs text-slate-500">
            Proprietor: <strong className="text-slate-700">{currentSeller.ownerName}</strong> ({currentSeller.phone})
            {currentSeller.shipsPanIndia !== false && (
              <span className="ml-2 inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-[10px]">
                Pan-India Dispatch Enabled
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {allSellers && allSellers.length > 1 && onSelectSeller && (
            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl text-xs border border-slate-200">
              <span className="text-slate-500 font-medium">Switch Shop:</span>
              <select
                value={currentSeller.id}
                onChange={(e) => onSelectSeller(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-800 text-xs"
              >
                {allSellers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.shopName} ({s.status === 'active' ? 'Approved' : 'Pending'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {currentSeller.status === 'active' ? (
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 text-amber-900 px-3.5 py-2 rounded-xl text-xs font-semibold">
              <Lock className="w-4 h-4 text-amber-700" />
              <span>Listing Restricted (Pending Admin Approval)</span>
            </div>
          )}
        </div>
      </div>

      {/* Verification & Fee Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            currentSeller.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
          }`}>
            {currentSeller.status === 'active' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Account Status</div>
            <div className="text-sm font-bold text-slate-900">
              {currentSeller.status === 'active' ? 'Approved & Live' : 'Pending Verification'}
            </div>
          </div>
        </div>

        {/* Total Customer Orders */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Customer Orders</div>
            <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>{sellerOrders.length} Orders</span>
              {pendingOrdersCount > 0 && (
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded-full">
                  {pendingOrdersCount} New
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Free First Year Status */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Seller Plan & Membership</div>
            <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>FREE First Year (₹0)</span>
            </div>
            <div className="text-[10px] text-slate-500">₹0 listing fee during first year</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'orders'
              ? 'border-orange-600 text-orange-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Customer Orders ({sellerOrders.length})</span>
          {pendingOrdersCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-orange-600 text-white text-[10px] font-bold flex items-center justify-center">
              {pendingOrdersCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'products'
              ? 'border-orange-600 text-orange-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>My Listed Products ({sellerProducts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('enquiries')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'enquiries'
              ? 'border-orange-600 text-orange-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Customer Enquiries ({sellerEnquiries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'profile'
              ? 'border-orange-600 text-orange-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Shop Profile & Coverage</span>
        </button>

        <button
          onClick={() => setActiveTab('kyc')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'kyc'
              ? 'border-orange-600 text-orange-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-orange-500" />
          <span>
            Identity KYC (
            <span className="capitalize">{currentSeller.identityVerificationStatus || 'Pending'}</span>)
          </span>
        </button>
      </div>

      {/* Tab 0: Customer Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-5">
          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl max-w-2xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setOrderFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                orderFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Orders ({sellerOrders.length})
            </button>
            <button
              type="button"
              onClick={() => setOrderFilter('pending')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                orderFilter === 'pending'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              New / Pending ({pendingOrdersCount})
            </button>
            <button
              type="button"
              onClick={() => setOrderFilter('active')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                orderFilter === 'active'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Packing & In Transit (
              {
                sellerOrders.filter((o) => {
                  const st = o.sellerOrders?.find((so) => so.sellerId === currentSeller.id)?.orderStatus || o.orderStatus;
                  return st === 'processing' || st === 'packed' || st === 'shipped' || st === 'out_for_delivery';
                }).length
              }
              )
            </button>
            <button
              type="button"
              onClick={() => setOrderFilter('delivered')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                orderFilter === 'delivered'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Delivered (
              {
                sellerOrders.filter((o) => {
                  const st = o.sellerOrders?.find((so) => so.sellerId === currentSeller.id)?.orderStatus || o.orderStatus;
                  return st === 'delivered';
                }).length
              }
              )
            </button>
            <button
              type="button"
              onClick={() => setOrderFilter('returns')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                orderFilter === 'returns'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Returns & Cancelled
            </button>
          </div>

          {/* Filtered Orders List */}
          {(() => {
            const displayOrders = sellerOrders.filter((order) => {
              const sub = order.sellerOrders?.find((so) => so.sellerId === currentSeller.id);
              const effectiveStatus = sub?.orderStatus || order.orderStatus;
              if (orderFilter === 'all') return true;
              if (orderFilter === 'pending') {
                return effectiveStatus === 'placed' || effectiveStatus === 'payment_confirmed' || effectiveStatus === 'confirmed';
              }
              if (orderFilter === 'active') {
                return (
                  effectiveStatus === 'processing' ||
                  effectiveStatus === 'packed' ||
                  effectiveStatus === 'shipped' ||
                  effectiveStatus === 'out_for_delivery'
                );
              }
              if (orderFilter === 'delivered') return effectiveStatus === 'delivered';
              if (orderFilter === 'returns') {
                return (
                  effectiveStatus === 'cancelled' ||
                  effectiveStatus === 'return_requested' ||
                  effectiveStatus === 'refunded'
                );
              }
              return true;
            });

            if (displayOrders.length === 0) {
              return (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">No orders matching this filter</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    When customers place orders for items from {currentSeller.shopName}, only your shop&apos;s items and fulfillment controls appear here.
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-4">
                {displayOrders.map((order) => {
                  const relevantItems = order.items.filter((item) => item.sellerId === currentSeller.id);
                  const sellerSubOrder = order.sellerOrders?.find((so) => so.sellerId === currentSeller.id);
                  const effectiveStatus: OrderStatus = sellerSubOrder?.orderStatus || order.orderStatus;
                  const sellerItemsTotal = relevantItems.reduce((sum, item) => sum + item.totalPrice, 0);
                  const sellerShipping = sellerSubOrder?.shippingFee ?? 0;
                  const sellerCodFee = sellerSubOrder?.codFee ?? 0;
                  const sellerGrandTotal = sellerItemsTotal + sellerShipping + sellerCodFee;
                  const formattedTotal = new Intl.NumberFormat('en-IN').format(sellerGrandTotal);
                  const isUpdating = updatingOrderId === order.id;

                  const courierDraft =
                    dispatchCourierMap[order.id] ??
                    sellerSubOrder?.courierName ??
                    (sellerSubOrder?.deliveryMode === 'seller_transport'
                      ? 'Seller-Managed Transport / Tempo'
                      : order.courierPartner || '');
                  const trackingDraft =
                    dispatchTrackingMap[order.id] ?? sellerSubOrder?.trackingNumber ?? '';

                  const handleStatusUpdate = async (
                    newStatus: OrderStatus,
                    reason?: string,
                    extras?: { courierName?: string; trackingNumber?: string }
                  ) => {
                    setUpdatingOrderId(order.id);
                    try {
                      if (onUpdateOrderStatus) {
                        await onUpdateOrderStatus(order.id, newStatus, reason, {
                          sellerId: currentSeller.id,
                          courierName: extras?.courierName,
                          trackingNumber: extras?.trackingNumber,
                        });
                      }
                    } finally {
                      setUpdatingOrderId(null);
                    }
                  };

                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs space-y-4 p-5"
                    >
                      {/* Top Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 text-sm">
                            #{sellerSubOrder?.subOrderNumber || order.orderNumber}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                              effectiveStatus === 'placed' || effectiveStatus === 'payment_confirmed'
                                ? 'bg-amber-100 text-amber-900'
                                : effectiveStatus === 'confirmed' || effectiveStatus === 'processing'
                                ? 'bg-purple-100 text-purple-900'
                                : effectiveStatus === 'packed'
                                ? 'bg-indigo-100 text-indigo-900'
                                : effectiveStatus === 'shipped'
                                ? 'bg-sky-100 text-sky-900'
                                : effectiveStatus === 'out_for_delivery'
                                ? 'bg-orange-100 text-orange-900'
                                : effectiveStatus === 'delivered'
                                ? 'bg-emerald-100 text-emerald-800'
                                : effectiveStatus === 'refunded'
                                ? 'bg-teal-100 text-teal-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {effectiveStatus.replace(/_/g, ' ')}
                          </span>
                          {sellerSubOrder && (
                            <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                              {sellerSubOrder.deliveryMode === 'seller_transport'
                                ? 'Seller Heavy Transport'
                                : sellerSubOrder.deliveryMode === 'mattokart_delivery'
                                ? 'MattoKart Local Express'
                                : 'Standard Courier'}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-slate-500">
                          <span>
                            Placed:{' '}
                            <strong className="text-slate-800">
                              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </strong>
                          </span>
                          <span>
                            Your Shop Payout:{' '}
                            <strong className="text-slate-900 text-sm font-mono font-bold">
                              ₹{formattedTotal}
                            </strong>
                            {sellerShipping > 0 && (
                              <span className="text-[11px] text-slate-400 ml-1">
                                (incl. ₹{sellerShipping} ship)
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Customer Delivery Details (Strict RLS: Visible only for orders containing items from this seller) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs">
                        <div>
                          <div className="font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                            <UserCheck className="w-3.5 h-3.5 text-orange-600" />
                            <span>Customer & Delivery Contact:</span>
                          </div>
                          <div className="font-bold text-slate-900 text-sm">{order.customerName}</div>
                          <div className="font-mono text-slate-600 flex items-center gap-1.5 mt-0.5">
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <a href={`tel:${order.customerPhone}`} className="hover:underline text-emerald-800 font-semibold">
                              {order.customerPhone}
                            </a>
                          </div>
                        </div>

                        <div>
                          <div className="font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                            <MapPin className="w-3.5 h-3.5 text-orange-600" />
                            <span>Delivery Destination:</span>
                          </div>
                          <p className="text-slate-800 font-medium">
                            {order.deliveryAddress}
                            {order.landmark ? ` (Near ${order.landmark})` : ''}
                          </p>
                          <p className="text-slate-500">
                            {order.locality}, {order.city}
                            {order.district && order.district !== order.city ? ` (${order.district})` : ''}
                            {order.state ? `, ${order.state}` : ''} — PIN {order.pinCode} •{' '}
                            <span className="text-emerald-700 font-semibold uppercase">{order.paymentMethod.replace(/_/g, ' ')}</span>
                          </p>
                          {(sellerSubOrder?.courierName || sellerSubOrder?.trackingNumber) && (
                            <p className="text-[11px] text-blue-800 font-medium mt-0.5">
                              Carrier: {sellerSubOrder.courierName || 'Seller Dispatch'}{' '}
                              {sellerSubOrder.trackingNumber ? `· LR / Tracking: ${sellerSubOrder.trackingNumber}` : ''}
                            </p>
                          )}
                          {order.notes && (
                            <p className="text-[11px] text-amber-800 mt-1 italic">
                              Customer note: &quot;{order.notes}&quot;
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Items sold strictly by this seller */}
                      <div className="space-y-2">
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Items Ordered from Your Shop ({relevantItems.length})
                        </div>
                        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                          {relevantItems.map((item) => (
                            <div key={item.id} className="p-3 flex items-center justify-between text-xs bg-white">
                              <div className="flex items-center gap-3">
                                <img
                                  src={item.productImage || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80'}
                                  alt={item.productName}
                                  className="w-12 h-12 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                                />
                                <div>
                                  <div className="font-bold text-slate-900 text-sm">{item.productName}</div>
                                  <div className="text-slate-500">
                                    ₹{new Intl.NumberFormat('en-IN').format(item.unitPrice)} × {item.quantity} {item.unit}
                                  </div>
                                </div>
                              </div>
                              <span className="font-bold text-slate-900 text-sm font-mono">
                                ₹{new Intl.NumberFormat('en-IN').format(item.totalPrice)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Seller Dispatch Inputs when Packed */}
                      {effectiveStatus === 'packed' && (
                        <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">
                              Transporter / Courier Name
                            </label>
                            <input
                              type="text"
                              value={courierDraft}
                              onChange={(e) =>
                                setDispatchCourierMap((prev) => ({ ...prev, [order.id]: e.target.value }))
                              }
                              placeholder="e.g. VRL Logistics / Self Tempo / DTDC"
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">
                              LR / Bilty / Tracking Number (Optional for local)
                            </label>
                            <input
                              type="text"
                              value={trackingDraft}
                              onChange={(e) =>
                                setDispatchTrackingMap((prev) => ({ ...prev, [order.id]: e.target.value }))
                              }
                              placeholder="Enter genuine LR or courier tracking number"
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono"
                            />
                          </div>
                        </div>
                      )}

                      {/* Seller 10-Stage Action Controls */}
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                        <div className="text-xs text-slate-500">
                          Current Stage:{' '}
                          <span className="font-semibold text-slate-800 capitalize">
                            {effectiveStatus.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {(effectiveStatus === 'placed' || effectiveStatus === 'payment_confirmed' || effectiveStatus === 'confirmed') && (
                            <>
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleStatusUpdate('processing', 'Accepted by seller and moved to processing')}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Accept & Process</span>
                              </button>
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleStatusUpdate('cancelled', 'Rejected by seller: item out of stock or unserviceable')}
                                className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs rounded-xl border border-red-200 transition-colors cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {effectiveStatus === 'processing' && (
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleStatusUpdate('packed', 'Items packed and ready for pickup/dispatch')}
                              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <Package className="w-3.5 h-3.5" />
                              <span>Mark Packed</span>
                            </button>
                          )}

                          {effectiveStatus === 'packed' && (
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() =>
                                handleStatusUpdate(
                                  'shipped',
                                  courierDraft
                                    ? `Dispatched via ${courierDraft}${trackingDraft ? ` (Ref: ${trackingDraft})` : ''}`
                                    : 'Dispatched by seller',
                                  {
                                    courierName: courierDraft.trim() || undefined,
                                    trackingNumber: trackingDraft.trim() || undefined,
                                  }
                                )
                              }
                              className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Mark Shipped / Dispatched</span>
                            </button>
                          )}

                          {effectiveStatus === 'shipped' && (
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleStatusUpdate('out_for_delivery', 'Shipment arrived in buyer city and out for delivery')}
                              className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Mark Out for Delivery</span>
                            </button>
                          )}

                          {effectiveStatus === 'out_for_delivery' && (
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleStatusUpdate('delivered', 'Delivered to customer and COD collected')}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Mark Delivered & COD Collected</span>
                            </button>
                          )}

                          {effectiveStatus === 'return_requested' && (
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleStatusUpdate('refunded', 'Return verified and refund settled by seller')}
                              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve Return & Refund</span>
                            </button>
                          )}

                          {effectiveStatus === 'delivered' && (
                            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                              ✓ Fulfilled & Delivered
                            </span>
                          )}

                          {effectiveStatus === 'refunded' && (
                            <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-3 py-1 rounded-lg border border-teal-200">
                              ✓ Return Settled & Refunded
                            </span>
                          )}

                          {effectiveStatus === 'cancelled' && (
                            <span className="text-xs font-semibold text-red-700 bg-red-50 px-3 py-1 rounded-lg border border-red-200">
                              Cancelled
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* Tab 1: Products */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Suggest New Category Bar */}
          {onSuggestCategory && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-slate-900">Need a product category that isn&apos;t listed yet?</span>
                  <span className="text-slate-500 ml-2">Suggest any lawful category for admin approval.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSuggestCatBox(!showSuggestCatBox)}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:border-orange-400 text-orange-700 font-bold rounded-lg cursor-pointer"
                >
                  {showSuggestCatBox ? 'Close Form' : '+ Suggest New Category'}
                </button>
              </div>
              {showSuggestCatBox && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200">
                  <input
                    type="text"
                    value={sugName}
                    onChange={(e) => setSugName(e.target.value)}
                    placeholder="Category Name *"
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg"
                  />
                  <input
                    type="text"
                    value={sugHindi}
                    onChange={(e) => setSugHindi(e.target.value)}
                    placeholder="Hindi Name (Optional)"
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg"
                  />
                  <input
                    type="text"
                    value={sugSubs}
                    onChange={(e) => setSugSubs(e.target.value)}
                    placeholder="Subcategories (comma-sep)"
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={sugReason}
                      onChange={(e) => setSugReason(e.target.value)}
                      placeholder="Reason"
                      className="flex-1 min-w-0 px-3 py-2 bg-white border border-slate-200 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={handleSubmitCategorySuggestion}
                      disabled={!sugName.trim()}
                      className="px-3 py-2 bg-orange-600 text-white font-bold rounded-lg disabled:opacity-50 cursor-pointer shrink-0"
                    >
                      Send
                    </button>
                  </div>
                  {sugSent && (
                    <div className="sm:col-span-4 text-emerald-700 font-bold">
                      ✓ Category suggestion submitted for Admin review!
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {currentSeller.status !== 'active' && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900 shadow-xs">
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-sm text-amber-950">
                  Product Listing Permission Restricted (Pending Admin Approval)
                </p>
                <p className="text-amber-800 leading-relaxed text-[11px]">
                  Under MattoKart safety policies, new shops remain Pending until an authorized administrator verifies the credentials. Only approved and verified sellers may publish live listings. You can view or submit business verification under the <strong>Identity KYC</strong> tab.
                </p>
              </div>
            </div>
          )}
          {sellerProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
              <Package className="w-12 h-12 text-slate-300 mx-auto" />
              <div>
                <h3 className="text-base font-bold text-slate-900">No products listed yet</h3>
                <p className="text-xs text-slate-500">
                  List your first item to start receiving enquiries from Saharanpur buyers.
                </p>
              </div>
              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl"
              >
                Add Product Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sellerProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <img
                        src={(prod.images && prod.images[0]) || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'}
                        alt={prod.name || 'Product'}
                        className="w-20 h-20 rounded-xl object-cover border border-slate-200 shrink-0"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                          {prod.subcategory}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 truncate mt-1">
                          {prod.name}
                        </h4>
                        <div className="text-base font-extrabold text-slate-900 mt-1">
                          ₹{new Intl.NumberFormat('en-IN').format(prod.price)}{' '}
                          <span className="text-xs font-normal text-slate-500">/ {prod.unit}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Stock: <strong>{prod.stockCount} {prod.unit}s</strong></span>
                      <span className={`px-2 py-0.5 rounded-full font-semibold ${
                        prod.inStock ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {prod.inStock ? 'Available' : 'Out of stock'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleOpenEditModal(prod)}
                      className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg flex items-center justify-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => onDeleteProduct(prod.id)}
                      className="py-1.5 px-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                      title="Delete Listing"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Enquiries */}
      {activeTab === 'enquiries' && (
        <div className="space-y-3">
          {sellerEnquiries.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500">
              No customer enquiries received yet. When buyers enquire about your products, they will appear here.
            </div>
          ) : (
            sellerEnquiries.map((enq) => {
              const cleanPhone = enq.buyerPhone.replace(/\D/g, '');
              const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
                `Namaste ${enq.buyerName}! This is ${currentSeller.ownerName} from ${currentSeller.shopName}. We received your enquiry for "${enq.productName}" on MattoKart.`
              )}`;

              return (
                <div
                  key={enq.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                        {enq.id}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500">{enq.createdAt}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-xs"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Reply on WhatsApp</span>
                      </a>
                      <a
                        href={`tel:${enq.buyerPhone}`}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                        title="Call Customer"
                      >
                        <Phone className="w-3.5 h-3.5 text-orange-600" />
                      </a>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="text-slate-400">Buyer Information</div>
                      <div className="font-bold text-slate-900 text-sm mt-0.5">{enq.buyerName}</div>
                      <div className="text-slate-600 font-mono">+91 {enq.buyerPhone}</div>
                      <div className="text-slate-600">Locality: <strong>{enq.buyerLocality}</strong></div>
                    </div>

                    <div>
                      <div className="text-slate-400">Enquired Product</div>
                      <div className="font-bold text-slate-900 text-sm mt-0.5">{enq.productName}</div>
                      <div className="text-slate-600">
                        Quantity: <strong>{enq.quantityNeeded} {enq.unit}s</strong>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs text-slate-700">
                    <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block mb-0.5">
                      Buyer Message
                    </span>
                    "{enq.message}"
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 3: Shop Profile */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 max-w-2xl">
          <h3 className="font-bold text-base text-slate-900">Shop Profile & Address</h3>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block">Shop / Business Name</span>
              <span className="font-bold text-slate-900 text-sm">{currentSeller.shopName}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Proprietor Full Name</span>
              <span className="font-medium text-slate-800">{currentSeller.ownerName}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Registered Shop Address</span>
              <span className="font-medium text-slate-800">
                {currentSeller.address}, {currentSeller.locality}, {currentSeller.city}, {currentSeller.state || 'Uttar Pradesh'} ({currentSeller.pinCode})
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Contact Phone & WhatsApp</span>
              <span className="font-mono text-slate-800">{currentSeller.phone}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Shipping Coverage</span>
              <span className="font-medium text-slate-800">
                {currentSeller.shipsPanIndia !== false ? 'All-India Courier Dispatch + Local Delivery' : `${currentSeller.deliveryRadiusKm} Kilometers Local Radius`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Identity Verification (KYC) */}
      {activeTab === 'kyc' && (
        <IdentityVerificationCard
          seller={currentSeller}
          onUpdateSeller={onUpdateSeller}
        />
      )}

      {/* Modal: Add / Edit Product */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">
                {editingProduct ? 'Edit Product Listing' : 'Add New Permitted Product'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  resetProductForm();
                }}
                className="p-1 hover:bg-slate-200 rounded-full"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 overflow-y-auto space-y-4">
              {/* Product Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="e.g. Pure Teak Wood Dining Chair with Hand Carving"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
                {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
              </div>

              {/* Category & Subcategory */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Permitted Category *
                  </label>
                  <select
                    value={prodCategory}
                    onChange={(e) => {
                      const cat = e.target.value as CategoryId;
                      setProdCategory(cat);
                      const matched = categories.find((c) => c.id === cat);
                      if (matched && matched.subcategories.length > 0) {
                        setProdSubcategory(matched.subcategories[0]);
                      }
                    }}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subcategory *
                  </label>
                  <input
                    type="text"
                    value={prodSubcategory}
                    onChange={(e) => setProdSubcategory(e.target.value)}
                    placeholder="e.g. Cement, Jali, Inverters"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Price, Original Price, Unit, Stock */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={prodPrice}
                    onChange={(e) => setProdPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl font-mono"
                  />
                  {formErrors.price && <p className="text-xs text-red-500 mt-1">{formErrors.price}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    MRP / Old Price (₹)
                  </label>
                  <input
                    type="number"
                    value={prodOriginalPrice || ''}
                    onChange={(e) => setProdOriginalPrice(e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="Optional"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit Type *
                  </label>
                  <select
                    value={prodUnit}
                    onChange={(e) => setProdUnit(e.target.value as UnitType)}
                    className="w-full px-2 py-2 text-sm border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="piece">per piece</option>
                    <option value="kg">per kg</option>
                    <option value="bag">per bag</option>
                    <option value="quintal">per quintal</option>
                    <option value="meter">per meter</option>
                    <option value="set">per set</option>
                    <option value="box">per box</option>
                    <option value="pair">per pair</option>
                    <option value="sq.ft">per sq.ft</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    In Stock Units *
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={prodStock}
                    onChange={(e) => setProdStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              {/* Image Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Image URL or Quick Preset
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="url"
                    value={prodImageUrl}
                    onChange={(e) => setProdImageUrl(e.target.value)}
                    placeholder="Paste image web URL..."
                    className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                {/* Preset Thumbnails */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {sampleImages.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setProdImageUrl(s.url)}
                      className={`text-[10px] px-2 py-1 rounded-lg border transition-colors ${
                        prodImageUrl === s.url
                          ? 'border-orange-500 bg-orange-50 font-bold text-orange-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description & Specifications *
                </label>
                <textarea
                  rows={3}
                  value={prodDescription}
                  onChange={(e) => setProdDescription(e.target.value)}
                  placeholder="Describe material grade, dimensions, usage tips, and warranty..."
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl resize-none"
                />
                {formErrors.desc && <p className="text-xs text-red-500 mt-1">{formErrors.desc}</p>}
              </div>

              {/* Pan-India Shipping Scope, Condition & Weight */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Shipping Scope *
                  </label>
                  <select
                    value={prodShippingScope}
                    onChange={(e) => setProdShippingScope(e.target.value as ShippingScope)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="pan_india">Pan-India Courier</option>
                    <option value="state_regional">State / Regional Only</option>
                    <option value="local_only">Local City Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Item Condition *
                  </label>
                  <select
                    value={prodCondition}
                    onChange={(e) => setProdCondition(e.target.value as ProductCondition)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="new">Brand New</option>
                    <option value="used_good">Second-hand / Used</option>
                    <option value="refurbished">Refurbished</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Weight per Unit (Kg)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min={0.2}
                    value={prodWeightKg}
                    onChange={(e) => setProdWeightKg(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Min Order Qty
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={prodMinOrderQty}
                    onChange={(e) => setProdMinOrderQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              {/* Heavy Goods & Dimensions Config (Stage B) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-800">
                  Fulfillment, Dimensions & Heavy Goods Transport
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Length (cm)</label>
                    <input
                      type="number"
                      min={1}
                      value={prodDimL}
                      onChange={(e) => setProdDimL(Number(e.target.value) || 1)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Breadth (cm)</label>
                    <input
                      type="number"
                      min={1}
                      value={prodDimB}
                      onChange={(e) => setProdDimB(Number(e.target.value) || 1)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Height (cm)</label>
                    <input
                      type="number"
                      min={1}
                      value={prodDimH}
                      onChange={(e) => setProdDimH(Number(e.target.value) || 1)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Delivery Mode</label>
                    <select
                      value={prodDeliveryMode}
                      onChange={(e) =>
                        setProdDeliveryMode(e.target.value as 'standard_courier' | 'seller_transport' | 'both')
                      }
                      className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="standard_courier">Standard Courier</option>
                      <option value="seller_transport">Seller Heavy Transport</option>
                      <option value="both">Both Courier & Transport</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Seller Ship Fee (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={prodSellerDeliveryFee}
                      onChange={(e) => setProdSellerDeliveryFee(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prodLocalDeliveryAvailable}
                      onChange={(e) => setProdLocalDeliveryAvailable(e.target.checked)}
                      className="rounded accent-orange-600"
                    />
                    <span>Local City / District Delivery Available</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prodCodAvailable}
                      onChange={(e) => setProdCodAvailable(e.target.checked)}
                      className="rounded accent-orange-600"
                    />
                    <span>Cash on Delivery (COD) Eligible</span>
                  </label>
                </div>
              </div>

              {/* Delivery Areas */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Delivery Coverage Summary
                </label>
                <input
                  type="text"
                  value={prodDeliveryAreas}
                  onChange={(e) => setProdDeliveryAreas(e.target.value)}
                  placeholder="All India Courier, Delhi NCR, UP, Maharashtra"
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
                />
              </div>

              {/* GI Woodcraft checkbox */}
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={prodIsWoodcraft}
                  onChange={(e) => setProdIsWoodcraft(e.target.checked)}
                  className="rounded accent-orange-600"
                />
                <span className="flex items-center gap-1">
                  <span>Mark as Saharanpur GI Certified Woodcraft Specialty</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                </span>
              </label>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  {editingProduct ? 'Save Changes' : 'Publish Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
