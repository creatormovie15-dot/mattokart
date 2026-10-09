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
} from 'lucide-react';
import { Product, Seller, BuyerEnquiry, Category, UnitType, CategoryId } from '../types';

interface SellerDashboardViewProps {
  currentSeller: Seller;
  products: Product[];
  enquiries: BuyerEnquiry[];
  categories: Category[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateSeller: (seller: Seller) => void;
}

export const SellerDashboardView: React.FC<SellerDashboardViewProps> = ({
  currentSeller,
  products,
  enquiries,
  categories,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateSeller,
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'enquiries' | 'profile'>('products');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Filter seller's own data
  const sellerProducts = products.filter((p) => p.sellerId === currentSeller.id);
  const sellerEnquiries = enquiries.filter((e) => e.sellerId === currentSeller.id);

  // Form states for Add / Edit Product
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState<CategoryId>('furniture');
  const [prodSubcategory, setProdSubcategory] = useState('Wooden Mandir');
  const [prodPrice, setProdPrice] = useState<number>(1000);
  const [prodOriginalPrice, setProdOriginalPrice] = useState<number | undefined>(1200);
  const [prodUnit, setProdUnit] = useState<UnitType>('piece');
  const [prodStock, setProdStock] = useState<number>(10);
  const [prodDescription, setProdDescription] = useState('');
  const [prodDeliveryAreas, setProdDeliveryAreas] = useState('Saharanpur City, Court Road, Delhi Road');
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
    setProdCategory('furniture');
    setProdSubcategory('Wooden Mandir');
    setProdPrice(1000);
    setProdOriginalPrice(1200);
    setProdUnit('piece');
    setProdStock(10);
    setProdDescription('');
    setProdDeliveryAreas('Saharanpur City, Court Road, Delhi Road');
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
    setProdDescription(p.description);
    setProdDeliveryAreas(Array.isArray(p.deliveryAreas) ? p.deliveryAreas.join(', ') : 'Saharanpur Local');
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

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const image = prodImageUrl.trim() || sampleImages[0].url;
    const areas = prodDeliveryAreas
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    if (editingProduct) {
      const updated: Product = {
        ...editingProduct,
        name: prodName.trim(),
        categoryId: prodCategory,
        subcategory: prodSubcategory,
        price: Number(prodPrice),
        originalPrice: prodOriginalPrice ? Number(prodOriginalPrice) : undefined,
        unit: prodUnit,
        stockCount: Number(prodStock),
        inStock: Number(prodStock) > 0,
        description: prodDescription.trim(),
        deliveryAreas: areas.length > 0 ? areas : ['Saharanpur Local'],
        images: [image],
        isWoodcraftSpecial: prodIsWoodcraft,
      };
      onUpdateProduct(updated);
    } else {
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        name: prodName.trim(),
        categoryId: prodCategory,
        subcategory: prodSubcategory,
        price: Number(prodPrice),
        originalPrice: prodOriginalPrice ? Number(prodOriginalPrice) : undefined,
        unit: prodUnit,
        minOrderQuantity: 1,
        inStock: Number(prodStock) > 0,
        stockCount: Number(prodStock),
        images: [image],
        description: prodDescription.trim(),
        specifications: {
          'Origin': 'Saharanpur, UP',
          'Supplier': currentSeller.shopName,
        },
        sellerId: currentSeller.id,
        sellerName: currentSeller.ownerName,
        sellerShopName: currentSeller.shopName,
        sellerLocality: currentSeller.locality,
        sellerPhone: currentSeller.phone,
        sellerRating: currentSeller.rating,
        deliveryAreas: areas.length > 0 ? areas : ['Saharanpur Local'],
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
            <span className="text-xs text-slate-500 font-medium">{currentSeller.locality}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-brand flex items-center gap-2">
            <span>{currentSeller.shopName}</span>
          </h1>
          <p className="text-xs text-slate-500">
            Proprietor: <strong className="text-slate-700">{currentSeller.ownerName}</strong> ({currentSeller.phone})
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
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

        {/* Free First Year Status */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Seller Plan & Membership</div>
            <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>FREE First Year (₹0)</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                ₹0 Registration
              </span>
            </div>
            <div className="text-[10px] text-slate-500">No listing fee during the first year</div>
          </div>
        </div>

        {/* Total Enquiries */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Buyer Inquiries Received</div>
            <div className="text-sm font-bold text-slate-900">
              {sellerEnquiries.length} Enquiries
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
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
          className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
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
      </div>

      {/* Tab 1: Products */}
      {activeTab === 'products' && (
        <div className="space-y-4">
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
              <span className="text-slate-400 block">Address in Saharanpur</span>
              <span className="font-medium text-slate-800">{currentSeller.address}, {currentSeller.locality} ({currentSeller.pinCode})</span>
            </div>
            <div>
              <span className="text-slate-400 block">Contact Phone & WhatsApp</span>
              <span className="font-mono text-slate-800">{currentSeller.phone}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Delivery Coverage Radius</span>
              <span className="font-medium text-slate-800">{currentSeller.deliveryRadiusKm} Kilometers</span>
            </div>
          </div>
        </div>
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

              {/* Delivery Areas */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Delivery Coverage (comma-separated localities)
                </label>
                <input
                  type="text"
                  value={prodDeliveryAreas}
                  onChange={(e) => setProdDeliveryAreas(e.target.value)}
                  placeholder="Court Road, Delhi Road, Hasanpur, Deoband"
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
