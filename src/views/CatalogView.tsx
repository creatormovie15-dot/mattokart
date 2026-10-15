import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  SlidersHorizontal,
  X,
  ArrowUpDown,
  LayoutGrid,
  List,
  Store,
  MapPin,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Product, Category, CategoryId, SaharanpurLocality } from '../types';
import { SAHARANPUR_LOCALITIES } from '../data/mockData';
import { ProductCard } from '../components/ProductCard';

interface CatalogViewProps {
  products: Product[];
  categories: Category[];
  selectedCategory: CategoryId | 'all';
  onSelectCategory: (catId: CategoryId | 'all') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onViewProductDetails: (product: Product) => void;
  onContactSeller: (product: Product) => void;
  currentLocality: SaharanpurLocality;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  products,
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  setSearchQuery,
  onViewProductDetails,
  onContactSeller,
  currentLocality,
}) => {
  const [selectedLocalityFilter, setSelectedLocalityFilter] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number>(50000);
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [onlyWoodcraft, setOnlyWoodcraft] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating' | 'newest'>('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Must be approved
      if (p.status !== 'approved') return false;

      // Category filter
      if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) {
        return false;
      }

      // Locality filter
      if (selectedLocalityFilter !== 'all') {
        const localityTarget = selectedLocalityFilter.toLowerCase();
        const matchesSellerLoc = (p.sellerLocality || '').toLowerCase().includes(localityTarget);
        const matchesDeliveryArea =
          Array.isArray(p.deliveryAreas) &&
          p.deliveryAreas.some((a) => (a || '').toLowerCase().includes(localityTarget));
        if (!matchesSellerLoc && !matchesDeliveryArea) return false;
      }

      // Max price
      if (Number.isFinite(p.price) && p.price > maxPrice) {
        return false;
      }

      // In stock
      if (onlyInStock && !p.inStock) {
        return false;
      }

      // Woodcraft
      if (onlyWoodcraft && !p.isWoodcraftSpecial) {
        return false;
      }

      // Search query - multi-token keyword search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const searchTerms = q.split(/\s+/).filter(Boolean);
        const searchableText = `${p.name || ''} ${p.description || ''} ${p.subcategory || ''} ${p.sellerShopName || ''} ${p.sellerLocality || ''}`.toLowerCase();
        const matchesAllTerms = searchTerms.every((term) => searchableText.includes(term));
        if (!matchesAllTerms) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'price-desc') return (b.price || 0) - (a.price || 0);
      if (sortBy === 'rating') return (b.sellerRating || 0) - (a.sellerRating || 0);
      if (sortBy === 'newest') {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
      }
      // default featured
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    });
  }, [
    products,
    selectedCategory,
    selectedLocalityFilter,
    maxPrice,
    onlyInStock,
    onlyWoodcraft,
    searchQuery,
    sortBy,
  ]);

  const handleResetFilters = () => {
    onSelectCategory('all');
    setSelectedLocalityFilter('all');
    setMaxPrice(50000);
    setOnlyInStock(false);
    setOnlyWoodcraft(false);
    setSearchQuery('');
    setSortBy('featured');
  };

  const activeFiltersCount =
    (selectedCategory !== 'all' ? 1 : 0) +
    (selectedLocalityFilter !== 'all' ? 1 : 0) +
    (maxPrice < 50000 ? 1 : 0) +
    (onlyInStock ? 1 : 0) +
    (onlyWoodcraft ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  // Check if any pending listings match the search query (explaining why they are not yet public)
  const pendingSearchMatches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    const searchTerms = q.split(/\s+/).filter(Boolean);
    return products.filter((p) => {
      if (p.status === 'approved') return false;
      const searchableText = `${p.name || ''} ${p.description || ''} ${p.subcategory || ''} ${p.sellerShopName || ''} ${p.sellerLocality || ''}`.toLowerCase();
      return searchTerms.every((term) => searchableText.includes(term));
    });
  }, [products, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-orange-600 font-bold uppercase tracking-wider mb-1">
            <span>MattoKart Saharanpur Catalog</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-brand">
            {selectedCategory === 'all'
              ? 'All Products & Materials'
              : categories.find((c) => c.id === selectedCategory)?.name || 'Products'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Showing <strong className="text-slate-900">{filteredProducts.length}</strong> verified products available for local Saharanpur supply
          </p>
        </div>

        {/* Sort & View Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Mobile Filter Trigger */}
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 shadow-xs cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5 text-orange-600" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-orange-600 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-800 font-medium focus:outline-none cursor-pointer text-xs"
            >
              <option value="featured">Featured First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Top Rated Seller</option>
              <option value="newest">Recently Added</option>
            </select>
          </div>

          {/* Grid / List Switcher */}
          <div className="hidden sm:flex items-center border border-slate-300 rounded-xl overflow-hidden bg-white">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-orange-50 text-orange-600' : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-orange-50 text-orange-600' : 'text-slate-400 hover:text-slate-700'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout: Filters Sidebar + Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block space-y-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs sticky top-28">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <SlidersHorizontal className="w-4 h-4 text-orange-600" />
              <span>Filters & Categories</span>
            </div>
            {activeFiltersCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Search inside catalog */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Search Products
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Title, material, shop..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Categories Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
              Categories
            </label>
            <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
              <button
                onClick={() => onSelectCategory('all')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-orange-50 text-orange-700 font-bold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>All Categories</span>
                <span className="text-[10px] text-slate-400">{products.length}</span>
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-orange-50 text-orange-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                  <span className="text-[10px] text-slate-400">{cat.itemCount}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Saharanpur Locality Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
              Locality / Market (Saharanpur)
            </label>
            <select
              value={selectedLocalityFilter}
              onChange={(e) => setSelectedLocalityFilter(e.target.value)}
              className="w-full p-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            >
              <option value="all">All Saharanpur Localities</option>
              {SAHARANPUR_LOCALITIES.map((loc) => (
                <option key={loc.name} value={loc.name}>
                  {loc.name} ({loc.pinCode})
                </option>
              ))}
            </select>
          </div>

          {/* Price Range Slider */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
              <span className="uppercase tracking-wider">Max Price (₹)</span>
              <span className="font-mono text-orange-600 font-bold">
                ₹{new Intl.NumberFormat('en-IN').format(maxPrice)}
              </span>
            </div>
            <input
              type="range"
              min={100}
              max={50000}
              step={200}
              value={maxPrice}
              onChange={(e) => setMaxPrice(parseInt(e.target.value))}
              className="w-full accent-orange-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>₹100</span>
              <span>₹50,000+</span>
            </div>
          </div>

          {/* Checkbox toggles */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyInStock}
                onChange={(e) => setOnlyInStock(e.target.checked)}
                className="rounded accent-orange-600"
              />
              <span>In-Stock Items Only</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyWoodcraft}
                onChange={(e) => setOnlyWoodcraft(e.target.checked)}
                className="rounded accent-orange-600"
              />
              <span className="flex items-center gap-1">
                <span>Saharanpur GI Woodcraft Only</span>
                <Sparkles className="w-3 h-3 text-amber-500" />
              </span>
            </label>
          </div>
        </aside>

        {/* Products Listing Area */}
        <div className="lg:col-span-3 space-y-4">
          {/* Active filter pills */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Applied Filters:</span>

              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-white border border-slate-200 text-xs px-2.5 py-1 rounded-full text-slate-700">
                  <span>Category: {categories.find((c) => c.id === selectedCategory)?.name}</span>
                  <button onClick={() => onSelectCategory('all')} className="hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedLocalityFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-white border border-slate-200 text-xs px-2.5 py-1 rounded-full text-slate-700">
                  <span>Locality: {selectedLocalityFilter}</span>
                  <button onClick={() => setSelectedLocalityFilter('all')} className="hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {searchQuery && (
                <span className="inline-flex items-center gap-1 bg-white border border-slate-200 text-xs px-2.5 py-1 rounded-full text-slate-700">
                  <span>Search: "{searchQuery}"</span>
                  <button onClick={() => setSearchQuery('')} className="hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {onlyInStock && (
                <span className="inline-flex items-center gap-1 bg-white border border-slate-200 text-xs px-2.5 py-1 rounded-full text-slate-700">
                  <span>In-Stock Only</span>
                  <button onClick={() => setOnlyInStock(false)} className="hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {onlyWoodcraft && (
                <span className="inline-flex items-center gap-1 bg-white border border-slate-200 text-xs px-2.5 py-1 rounded-full text-slate-700">
                  <span>GI Woodcraft Only</span>
                  <button onClick={() => setOnlyWoodcraft(false)} className="hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                onClick={handleResetFilters}
                className="text-xs text-orange-600 font-bold hover:underline ml-auto"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Pending Verification Notice for Search Queries */}
          {pendingSearchMatches.length > 0 && (
            <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-900 shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-amber-950">
                  {pendingSearchMatches.length} matching item{pendingSearchMatches.length > 1 ? 's' : ''} is currently Pending Admin Verification
                </p>
                <p className="text-amber-800 leading-relaxed">
                  "{pendingSearchMatches.map((p) => p.name).join('", "')}" ({pendingSearchMatches[0].sellerShopName}) has been submitted and is currently undergoing Saharanpur merchant verification. Per marketplace security rules, listings only become visible to the public once approved by an administrator.
                </p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
                <Search className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">
                  No matching products found
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Try adjusting your filters, searching for alternate terms like "cement", "sariya", "chair", or widening your price range.
                </p>
              </div>
              <button
                onClick={handleResetFilters}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onViewDetails={onViewProductDetails}
                  onContactSeller={onContactSeller}
                />
              ))}
            </div>
          ) : (
            /* List View */
            <div className="space-y-3">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-orange-300 hover:shadow-md transition-all flex flex-col sm:flex-row gap-4 items-center justify-between"
                >
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <img
                      src={(product.images && product.images[0]) || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'}
                      alt={product.name || 'Product'}
                      className="w-24 h-24 rounded-xl object-cover shrink-0 cursor-pointer"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80';
                      }}
                      onClick={() => onViewProductDetails(product)}
                    />
                    <div className="space-y-1 min-w-0">
                      <div className="text-[11px] text-slate-400 font-medium">
                        {product.subcategory} • per {product.unit}
                      </div>
                      <h3
                        onClick={() => onViewProductDetails(product)}
                        className="font-bold text-sm text-slate-900 hover:text-orange-600 transition-colors cursor-pointer"
                      >
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <Store className="w-3.5 h-3.5 text-orange-600" />
                          {product.sellerShopName}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {product.sellerLocality}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-48 shrink-0 gap-2 border-t sm:border-t-0 pt-3 sm:pt-0">
                    <div className="text-right">
                      <div className="text-lg font-extrabold text-slate-900">
                        ₹{new Intl.NumberFormat('en-IN').format(product.price)}
                      </div>
                      <div className="text-[11px] text-emerald-800 font-medium">
                        {product.inStock ? 'In Stock' : 'Out of Stock'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onViewProductDetails(product)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-xs"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => onContactSeller(product)}
                        className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg text-xs"
                      >
                        Contact
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer Filter */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xs bg-white h-full flex flex-col p-5 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Filter Products</h3>
              <button onClick={() => setMobileFilterOpen(false)} className="p-1">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Mobile Categories */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">
                Categories
              </label>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                <button
                  onClick={() => {
                    onSelectCategory('all');
                    setMobileFilterOpen(false);
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-xs ${
                    selectedCategory === 'all' ? 'bg-orange-50 font-bold text-orange-600' : ''
                  }`}
                >
                  All Categories
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onSelectCategory(c.id);
                      setMobileFilterOpen(false);
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded-lg text-xs truncate ${
                      selectedCategory === c.id ? 'bg-orange-50 font-bold text-orange-600' : ''
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Locality */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                Saharanpur Locality
              </label>
              <select
                value={selectedLocalityFilter}
                onChange={(e) => setSelectedLocalityFilter(e.target.value)}
                className="w-full p-2 text-xs border border-slate-200 rounded-xl"
              >
                <option value="all">All Localities</option>
                {SAHARANPUR_LOCALITIES.map((loc) => (
                  <option key={loc.name} value={loc.name}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Mobile Price */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>Max Price:</span>
                <span className="font-mono text-orange-600">
                  ₹{new Intl.NumberFormat('en-IN').format(maxPrice)}
                </span>
              </div>
              <input
                type="range"
                min={100}
                max={50000}
                step={200}
                value={maxPrice}
                onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                className="w-full accent-orange-600"
              />
            </div>

            {/* Mobile Toggles */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  className="accent-orange-600"
                />
                <span>In Stock Only</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={onlyWoodcraft}
                  onChange={(e) => setOnlyWoodcraft(e.target.checked)}
                  className="accent-orange-600"
                />
                <span>Saharanpur GI Woodcraft Only</span>
              </label>
            </div>

            <div className="pt-4 mt-auto border-t border-slate-100 flex gap-2">
              <button
                onClick={() => {
                  handleResetFilters();
                  setMobileFilterOpen(false);
                }}
                className="flex-1 py-2.5 bg-slate-100 font-semibold text-xs rounded-xl"
              >
                Reset
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 py-2.5 bg-orange-600 text-white font-bold text-xs rounded-xl"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
