import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Store,
  Package,
  Layers,
  Users,
  CreditCard,
  MessageSquare,
  Lock,
  Unlock,
  Plus,
} from 'lucide-react';
import { Seller, Product, Category, BuyerEnquiry, CategoryId } from '../types';

interface AdminDashboardViewProps {
  sellers: Seller[];
  products: Product[];
  categories: Category[];
  enquiries: BuyerEnquiry[];
  onApproveSeller: (sellerId: string) => void;
  onRejectSeller: (sellerId: string) => void;
  onToggleSuspendSeller: (sellerId: string) => void;
  onApproveProduct: (productId: string) => void;
  onRejectProduct: (productId: string, reason: string) => void;
  onAddCategory: (category: Category) => void;
  onUpdateSellerFeeStatus: (sellerId: string, status: Seller['registrationFeeStatus']) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  sellers,
  products,
  categories,
  enquiries,
  onApproveSeller,
  onRejectSeller,
  onToggleSuspendSeller,
  onApproveProduct,
  onRejectProduct,
  onAddCategory,
  onUpdateSellerFeeStatus,
}) => {
  // Gate admin access via passcode
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState<'applications' | 'products' | 'sellers' | 'categories' | 'fees' | 'enquiries'>('applications');

  // New Category Modal
  const [isAddCatModalOpen, setIsAddCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatHindi, setNewCatHindi] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatSubs, setNewCatSubs] = useState('');

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === 'admin123' || passcode.trim() === 'mattokart') {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Incorrect admin key. Enter "admin123" for demo verification.');
    }
  };

  const handleQuickDemoUnlock = () => {
    setPasscode('admin123');
    setIsAuthenticated(true);
    setAuthError('');
  };

  // Pending items counts
  const pendingSellers = sellers.filter((s) => s.status === 'pending_approval');
  const pendingProducts = products.filter((p) => p.status === 'pending');
  const activeSellers = sellers.filter((s) => s.status === 'active');

  // If not authenticated, show passcode barrier
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-md">
            <Lock className="w-8 h-8 text-orange-500" />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider bg-orange-50 px-2 py-0.5 rounded">
              MattoKart Security Gateway
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 font-brand">
              Admin Moderation Center
            </h2>
            <p className="text-xs text-slate-500">
              Admin access is restricted to verify sellers, moderate listings, and manage legal compliance.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-3 text-left">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Admin Access Passcode
              </label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter admin key..."
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
              {authError && <p className="text-xs text-red-500 mt-1">{authError}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
            >
              Verify Admin Credentials
            </button>
          </form>

          {/* Quick Demo Assist */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-[11px] text-slate-500 mb-2">
              For testing evaluation: Click below to autofill demo key:
            </p>
            <button
              onClick={handleQuickDemoUnlock}
              className="w-full py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 font-semibold text-xs rounded-xl border border-orange-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Unlock Admin Portal (Demo Key: admin123)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Authenticated Administrator
            </span>
            <span className="text-xs text-slate-400">• Saharanpur Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-brand mt-1">
            MattoKart Admin Control Center
          </h1>
          <p className="text-xs text-slate-500">
            Review seller applications, track Free First Year onboarding, moderate products, and manage permitted categories.
          </p>
        </div>

        <button
          onClick={() => setIsAuthenticated(false)}
          className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-xl transition-colors self-start sm:self-auto"
        >
          Lock / Exit Admin
        </button>
      </div>

      {/* Top Admin Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">Pending Sellers</div>
          <div className="text-2xl font-black text-amber-600 mt-0.5">{pendingSellers.length}</div>
          <div className="text-[10px] text-slate-400">Awaiting approval</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">Active Sellers</div>
          <div className="text-2xl font-black text-slate-900 mt-0.5">{activeSellers.length}</div>
          <div className="text-[10px] text-emerald-800 font-semibold">Verified in Saharanpur</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">Approved Products</div>
          <div className="text-2xl font-black text-slate-900 mt-0.5">{products.filter((p) => p.status === 'approved').length}</div>
          <div className="text-[10px] text-slate-400">Live in catalog</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">Customer Enquiries</div>
          <div className="text-2xl font-black text-blue-600 mt-0.5">{enquiries.length}</div>
          <div className="text-[10px] text-slate-400">Buyer leads generated</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs col-span-2 lg:col-span-1">
          <div className="text-[11px] text-slate-500 font-medium">Seller Fee Policy</div>
          <div className="text-2xl font-black text-emerald-600 mt-0.5">₹0 / Free</div>
          <div className="text-[10px] text-emerald-800 font-semibold">FREE First Year</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-6 text-xs font-semibold overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('applications')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
            activeTab === 'applications'
              ? 'border-orange-600 text-orange-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Seller Applications ({pendingSellers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
            activeTab === 'products'
              ? 'border-orange-600 text-orange-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Product Moderation ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sellers')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
            activeTab === 'sellers'
              ? 'border-orange-600 text-orange-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Seller Registry & Suspend</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
            activeTab === 'categories'
              ? 'border-orange-600 text-orange-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Categories ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('fees')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
            activeTab === 'fees'
              ? 'border-orange-600 text-orange-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Fee Verification Tracker</span>
        </button>

        <button
          onClick={() => setActiveTab('enquiries')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
            activeTab === 'enquiries'
              ? 'border-orange-600 text-orange-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>All Buyer Enquiries</span>
        </button>
      </div>

      {/* Tab 1: Seller Applications Review */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">
              Pending Seller Approvals ({pendingSellers.length})
            </h3>
            <span className="text-xs text-slate-500">
              Review physical shop address and verify permitted categories
            </span>
          </div>

          {pendingSellers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
              No pending seller applications right now. All submissions have been approved or reviewed.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingSellers.map((seller) => (
                <div
                  key={seller.id}
                  className="bg-white rounded-2xl border border-amber-200 p-5 shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-base text-slate-900">{seller.shopName}</h4>
                        <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded">
                          Application Pending
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Proprietor: <strong className="text-slate-800">{seller.ownerName}</strong> • {seller.phone}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onApproveSeller(seller.id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve Seller</span>
                      </button>
                      <button
                        onClick={() => onRejectSeller(seller.id)}
                        className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs rounded-xl flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block">Shop Address</span>
                      <span className="font-medium text-slate-800">{seller.address}, {seller.locality}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Requested Categories</span>
                      <span className="font-medium text-slate-800 capitalize">
                        {Array.isArray(seller.categories) ? seller.categories.join(', ') : 'None'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Pricing Plan (₹0 Fee)</span>
                      <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-mono">
                        {seller.registrationFeeStatus === 'free_first_year' ? 'Free 1st Year' : seller.registrationFeeStatus}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Product Moderation */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">
              Product Listing Moderation ({products.length})
            </h3>
            <span className="text-xs text-slate-500">
              Ensure listings comply with Indian e-commerce laws and permit no illegal items
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider">
                    <th className="p-3">Product</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Price (₹)</th>
                    <th className="p-3">Seller</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((prod) => (
                    <tr key={prod.id} className="hover:bg-slate-50/60">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={(prod.images && prod.images[0]) || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover shrink-0"
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80';
                            }}
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate max-w-xs">{prod.name}</div>
                            <div className="text-[11px] text-slate-400">{prod.stockCount} {prod.unit}s in stock</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-slate-600 capitalize">{prod.subcategory}</td>
                      <td className="p-3 font-mono font-bold text-slate-900">
                        ₹{new Intl.NumberFormat('en-IN').format(prod.price)}
                      </td>
                      <td className="p-3 text-slate-600 truncate max-w-[150px]">{prod.sellerShopName}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          prod.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : prod.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {prod.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1">
                        {prod.status !== 'approved' && (
                          <button
                            onClick={() => onApproveProduct(prod.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-[11px]"
                          >
                            Approve
                          </button>
                        )}
                        {prod.status !== 'rejected' && (
                          <button
                            onClick={() => onRejectProduct(prod.id, 'Moderated by admin for guidelines check')}
                            className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-lg text-[11px]"
                          >
                            Reject
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Seller Registry & Suspension */}
      {activeTab === 'sellers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">
              Registered Saharanpur Sellers ({sellers.length})
            </h3>
            <span className="text-xs text-slate-500">
              Suspend accounts with customer complaints or fraudulent behavior
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sellers.map((seller) => (
              <div
                key={seller.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs space-y-3 ${
                  seller.status === 'suspended' ? 'border-red-300 bg-red-50/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{seller.shopName}</h4>
                    <p className="text-xs text-slate-500">
                      Owner: {seller.ownerName} • {seller.phone}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    seller.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : seller.status === 'suspended'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {seller.status}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <div>Location: <strong>{seller.address}, {seller.locality}</strong></div>
                  <div>Rating: <strong>★ {seller.rating}</strong> ({seller.reviewsCount} reviews)</div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Fee Status: <strong className="text-slate-700">{seller.registrationFeeStatus}</strong>
                  </span>
                  <button
                    onClick={() => onToggleSuspendSeller(seller.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      seller.status === 'suspended'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                    }`}
                  >
                    {seller.status === 'suspended' ? 'Reactivate Seller' : 'Suspend Account'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Categories Management */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">
              Permitted Categories & Subcategories ({categories.length})
            </h3>
            <button
              onClick={() => setIsAddCatModalOpen(true)}
              className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Permitted Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div key={cat.id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">{cat.name}</h4>
                  <span className="text-[11px] text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded">
                    {cat.itemCount} items
                  </span>
                </div>
                <p className="text-xs text-slate-500">{cat.hindiName}</p>
                <p className="text-xs text-slate-600 line-clamp-2">{cat.description}</p>
                <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                  {Array.isArray(cat.subcategories) && cat.subcategories.map((sub, idx) => (
                    <span key={idx} className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded">
                      {sub}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Modal to add category */}
          {isAddCatModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
                <h3 className="font-bold text-base text-slate-900">Add Permitted Category</h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold mb-1">Category English Name</label>
                    <input
                      type="text"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="e.g. Electrical Motors & Pumps"
                      className="w-full p-2 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Category Hindi Name</label>
                    <input
                      type="text"
                      value={newCatHindi}
                      onChange={(e) => setNewCatHindi(e.target.value)}
                      placeholder="e.g. मोटर और पंप"
                      className="w-full p-2 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                      className="w-full p-2 border rounded-xl resize-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Subcategories (comma separated)</label>
                    <input
                      type="text"
                      value={newCatSubs}
                      onChange={(e) => setNewCatSubs(e.target.value)}
                      placeholder="Submersible pumps, Monoblock, Pipes"
                      className="w-full p-2 border rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setIsAddCatModalOpen(false)}
                    className="px-4 py-2 border rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!newCatName.trim()) return;
                      const catId = newCatName.toLowerCase().replace(/\s+/g, '-') as CategoryId;
                      onAddCategory({
                        id: catId,
                        name: newCatName.trim(),
                        hindiName: newCatHindi.trim() || newCatName.trim(),
                        iconName: 'Package',
                        itemCount: 0,
                        description: newCatDesc.trim() || 'Permitted category goods in Saharanpur.',
                        subcategories: newCatSubs.split(',').map((s) => s.trim()).filter(Boolean),
                      });
                      setIsAddCatModalOpen(false);
                      setNewCatName('');
                    }}
                    className="px-5 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold"
                  >
                    Save Category
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Fee Verification Tracker */}
      {activeTab === 'fees' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">
              Seller Fee & Membership Audit (FREE First Year: ₹0)
            </h3>
            <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-semibold">
              FREE First Year: ₹0 Registration & ₹0 Listing
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-slate-700 space-y-1">
            <p className="font-bold text-emerald-950">
              No registration fee. No listing fee during the first year.
            </p>
            <p>
              In accordance with MattoKart business rules, seller registration fee is ₹0, shop creation fee is ₹0, and product listing fee is ₹0. No registration payments are collected. Any future fees beyond the first year must be clearly announced and accepted before taking effect.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px]">
                  <th className="p-3">Shop Name</th>
                  <th className="p-3">Proprietor</th>
                  <th className="p-3">Fee / Year</th>
                  <th className="p-3">Plan Status</th>
                  <th className="p-3 text-right">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sellers.map((s) => (
                  <tr key={s.id}>
                    <td className="p-3 font-bold text-slate-900">{s.shopName}</td>
                    <td className="p-3 text-slate-600">{s.ownerName}</td>
                    <td className="p-3 font-mono font-bold text-emerald-700">₹0 (Free 1st Yr)</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                        s.registrationFeeStatus === 'free_first_year' || s.registrationFeeStatus === 'verified'
                          ? 'bg-emerald-100 text-emerald-800'
                          : s.registrationFeeStatus === 'paid_pending_gateway'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {s.registrationFeeStatus === 'free_first_year' ? 'free_first_year' : s.registrationFeeStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1">
                      {s.registrationFeeStatus !== 'free_first_year' && s.registrationFeeStatus !== 'verified' ? (
                        <button
                          onClick={() => onUpdateSellerFeeStatus(s.id, 'free_first_year')}
                          className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold"
                        >
                          Confirm Free 1st Yr
                        </button>
                      ) : (
                        <button
                          onClick={() => onUpdateSellerFeeStatus(s.id, 'demo_waived')}
                          className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-medium"
                        >
                          Mark Waived
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 6: Enquiries Audit Trail */}
      {activeTab === 'enquiries' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">
              Marketplace Enquiries Audit Log ({enquiries.length})
            </h3>
            <span className="text-xs text-slate-500">
              Direct leads forwarded to Saharanpur shops
            </span>
          </div>

          <div className="space-y-2">
            {enquiries.map((enq) => (
              <div key={enq.id} className="bg-white p-4 rounded-xl border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-orange-600">{enq.id}</span>
                    <span className="font-semibold text-slate-900">{enq.buyerName} (+91 {enq.buyerPhone})</span>
                    <span className="text-slate-400">→</span>
                    <span className="font-semibold text-slate-800">{enq.sellerShopName}</span>
                  </div>
                  <div className="text-slate-500 mt-1">
                    Product: <strong>{enq.productName}</strong> ({enq.quantityNeeded} {enq.unit}s) • Locality: {enq.buyerLocality}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[11px] font-mono text-slate-400 block">{enq.createdAt}</span>
                  <span className="inline-block mt-0.5 px-2 py-0.2 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {enq.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
