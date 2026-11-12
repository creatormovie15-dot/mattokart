import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Building2,
  Tv,
  Shirt,
  UtensilsCrossed,
  Armchair,
  Wrench,
  ShoppingBag,
  Sprout,
  Baby,
  Package,
  Store,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Phone,
  MessageCircle,
  Truck,
  Layers,
  ChevronLeft,
  ChevronRight,
  Clock,
  Zap,
  Percent,
  Star,
  Eye,
} from 'lucide-react';
import { Category, Product, Seller, SaharanpurLocality, CategoryId } from '../types';
import { ProductCard } from '../components/ProductCard';

interface HomeViewProps {
  categories: Category[];
  products: Product[];
  sellers: Seller[];
  selectedLocality: SaharanpurLocality;
  onSelectCategory: (categoryId: CategoryId) => void;
  onViewProductDetails: (product: Product) => void;
  onContactSeller: (product: Product) => void;
  onAddToCart?: (product: Product, quantity?: number) => void;
  onBuyNow?: (product: Product, quantity?: number) => void;
  onGoToCatalog: () => void;
  onGoToSellerRegister: () => void;
  onOpenLocationModal: () => void;
  onSelectShopProducts?: (shopName: string) => void;
  wishlist?: string[];
  onToggleWishlist?: (productId: string) => void;
  recentlyViewedIds?: string[];
}

export const HomeView: React.FC<HomeViewProps> = ({
  categories,
  products,
  sellers,
  selectedLocality,
  onSelectCategory,
  onViewProductDetails,
  onContactSeller,
  onAddToCart,
  onBuyNow,
  onGoToCatalog,
  onGoToSellerRegister,
  onOpenLocationModal,
  onSelectShopProducts,
  wishlist = [],
  onToggleWishlist,
  recentlyViewedIds = [],
}) => {
  const approvedProducts = products.filter((p) => p.status === 'approved');
  const featuredProducts = approvedProducts.filter((p) => p.featured);
  const woodcraftProducts = approvedProducts.filter((p) => p.isWoodcraftSpecial);
  const constructionProducts = approvedProducts.filter((p) => p.categoryId === 'construction' || p.categoryId === 'tools-hardware');
  const newArrivals = [...approvedProducts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 8);

  // Best sellers: high ratings / stock
  const bestSellers = [...approvedProducts].sort(
    (a, b) => (b.sellerRating || 0) - (a.sellerRating || 0)
  ).slice(0, 8);

  // Recently viewed products mapped
  const recentlyViewedProducts = recentlyViewedIds
    .map((id) => approvedProducts.find((p) => p.id === id))
    .filter((p): p is Product => p !== undefined);

  // Promotional Banner Carousel
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const heroBanners = [
    {
      id: 1,
      tag: 'SAHARANPUR GI WOODCRAFT EXPO',
      title: 'Handcrafted Sheesham Temples & Royal Furniture',
      subtitle: 'Direct from Hasanpur master artisans. Authentic seasoned wood with brass inlay.',
      badge: 'Up to 35% OFF · Direct Dukaan Price',
      ctaText: 'Shop Woodcraft Specials',
      action: () => onSelectCategory('furniture'),
      bgGradient: 'from-amber-950 via-[#131921] to-slate-900',
      accentColor: 'text-amber-400',
      bannerImg: 'https://images.unsplash.com/photo-1544457070-4cd773b4d71e?auto=format&fit=crop&w=1000&q=80',
    },
    {
      id: 2,
      tag: 'WHOLESALE BUILDING MATERIALS',
      title: 'UltraTech Cement & Kamdhenu TMT Sariya',
      subtitle: 'Fast site delivery across Saharanpur & western UP bypass highways. Tested quality.',
      badge: 'Cash on Delivery · Wholesale Rates',
      ctaText: 'Explore Building Supplies',
      action: () => onSelectCategory('construction'),
      bgGradient: 'from-slate-950 via-[#1e293b] to-zinc-900',
      accentColor: 'text-orange-400',
      bannerImg: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=1000&q=80',
    },
    {
      id: 3,
      tag: 'ZERO-FEE SELLER ONBOARDING',
      title: 'Dukaandar Bhaiyon Ke Liye Sunhara Mauka',
      subtitle: 'Join MattoKart — FREE for Your First Year! ₹0 registration fee, ₹0 product listing fee.',
      badge: 'Free First Year · Zero Commission Leads',
      ctaText: 'Register Shop in 2 Minutes',
      action: onGoToSellerRegister,
      bgGradient: 'from-orange-950 via-[#1c1917] to-slate-900',
      accentColor: 'text-amber-300',
      bannerImg: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1000&q=80',
    },
  ];

  // Auto-advance banner every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % heroBanners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroBanners.length]);

  // Category Icon helper
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Armchair':
        return <Armchair className="w-5 h-5" />;
      case 'Building2':
        return <Building2 className="w-5 h-5" />;
      case 'Wrench':
        return <Wrench className="w-5 h-5" />;
      case 'Tv':
        return <Tv className="w-5 h-5" />;
      case 'Shirt':
        return <Shirt className="w-5 h-5" />;
      case 'UtensilsCrossed':
        return <UtensilsCrossed className="w-5 h-5" />;
      case 'ShoppingBag':
        return <ShoppingBag className="w-5 h-5" />;
      case 'Sprout':
        return <Sprout className="w-5 h-5" />;
      case 'Baby':
        return <Baby className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  const activeBanner = heroBanners[currentBannerIndex];

  return (
    <div className="space-y-8 pb-16 bg-slate-50">
      {/* 1. Hero Promotional Banner Carousel */}
      <section className="relative overflow-hidden bg-slate-900 text-white">
        <div className={`relative min-h-[380px] sm:min-h-[440px] flex items-center bg-gradient-to-r ${activeBanner.bgGradient} transition-all duration-700`}>
          {/* Background image subtle overlay */}
          <div className="absolute inset-0 opacity-20 lg:opacity-30 mix-blend-overlay">
            <img src={activeBanner.bannerImg} alt="" className="w-full h-full object-cover" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full">
            <div className="lg:col-span-8 space-y-4">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-black/40 border border-white/20 text-xs font-bold uppercase tracking-wider text-amber-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{activeBanner.tag}</span>
              </div>

              {/* Title & Subtitle */}
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black font-brand tracking-tight leading-tight text-white">
                {activeBanner.title}
              </h1>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
                {activeBanner.subtitle}
              </p>

              {/* Promotional Highlight */}
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 w-fit px-3 py-1 rounded">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{activeBanner.badge}</span>
              </div>

              {/* CTA Button */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={activeBanner.action}
                  className="px-6 py-3 rounded-lg font-bold text-sm bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 shadow-lg shadow-orange-500/20 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <span>{activeBanner.ctaText}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={onGoToCatalog}
                  className="px-5 py-3 rounded-lg font-semibold text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm transition-all cursor-pointer"
                >
                  Browse All Categories
                </button>
              </div>
            </div>

            {/* Right Banner Graphic */}
            <div className="hidden lg:block lg:col-span-4">
              <div className="relative aspect-4/3 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 group">
                <img
                  src={activeBanner.bannerImg}
                  alt={activeBanner.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                  <div className="text-xs font-semibold text-white">
                    Verified Saharanpur Wholesale & Retail
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Carousel Arrows */}
          <button
            onClick={() => setCurrentBannerIndex((prev) => (prev === 0 ? heroBanners.length - 1 : prev - 1))}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-colors cursor-pointer z-20"
            aria-label="Previous banner"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentBannerIndex((prev) => (prev + 1) % heroBanners.length)}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-colors cursor-pointer z-20"
            aria-label="Next banner"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
            {heroBanners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentBannerIndex(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentBannerIndex === idx ? 'w-8 bg-orange-500' : 'w-2 bg-white/50'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 2. Amazon-Style Quad Category Feature Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: Sheesham Woodcrafts */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <h2 className="font-bold text-base text-slate-900 leading-snug">
                Saharanpur Woodcraft Special
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Mandirs, partition screens & brass inlay crafts
              </p>
              <div
                onClick={() => onSelectCategory('furniture')}
                className="mt-3 aspect-4/3 rounded-lg overflow-hidden bg-slate-100 cursor-pointer"
              >
                <img
                  src="https://images.unsplash.com/photo-1544457070-4cd773b4d71e?auto=format&fit=crop&w=600&q=80"
                  alt="Woodcraft"
                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                />
              </div>
            </div>
            <button
              onClick={() => onSelectCategory('furniture')}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
            >
              <span>See Woodcraft Collection</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: Construction Supplies */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <h2 className="font-bold text-base text-slate-900 leading-snug">
                Building & Hardware
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Cement, TMT sariya, power drills & fittings
              </p>
              <div
                onClick={() => onSelectCategory('construction')}
                className="mt-3 aspect-4/3 rounded-lg overflow-hidden bg-slate-100 cursor-pointer"
              >
                <img
                  src="https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80"
                  alt="Construction"
                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                />
              </div>
            </div>
            <button
              onClick={() => onSelectCategory('construction')}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Wholesale Site Rates</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 3: Top Verified Saharanpur Dukaans */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <h2 className="font-bold text-base text-slate-900 leading-snug">
                Verified Local Shops
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Direct contact with Court Road & Clock Tower retailers
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                {sellers.slice(0, 4).map((s) => (
                  <div
                    key={s.id}
                    onClick={() => onSelectShopProducts && onSelectShopProducts(s.shopName)}
                    className="p-2 bg-slate-50 rounded-lg border border-slate-100 hover:border-orange-300 transition-colors cursor-pointer truncate"
                  >
                    <div className="font-semibold text-slate-800 truncate">{s.shopName}</div>
                    <div className="text-[10px] text-slate-500 truncate">{s.locality}</div>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => onGoToCatalog()}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Explore All Shops</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 4: Free Seller Onboarding */}
          <div className="bg-gradient-to-br from-[#131921] to-slate-900 text-white p-5 rounded-xl shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider bg-amber-400/20 px-2 py-0.5 rounded">
                Dukaandar Onboarding
              </span>
              <h2 className="font-bold text-base text-white mt-2 leading-snug">
                Sell on MattoKart
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Expand your shop sales across Saharanpur. ₹0 registration fee for the first year.
              </p>
              <div className="mt-4 p-3 bg-white/10 rounded-lg text-xs space-y-1.5 border border-white/10">
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>₹0 Registration & Listing Fee</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Direct WhatsApp Buyer Leads</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Doorstep Pickup & Delivery</span>
                </div>
              </div>
            </div>
            <button
              onClick={onGoToSellerRegister}
              className="w-full py-2.5 rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs text-center transition-colors cursor-pointer"
            >
              Register Your Shop Now
            </button>
          </div>
        </div>
      </section>

      {/* 3. Category Carousel Ribbon */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Explore Popular Categories
            </h2>
            <button
              onClick={onGoToCatalog}
              className="text-xs font-semibold text-orange-600 hover:underline cursor-pointer"
            >
              See all ({categories.length})
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className="p-3 rounded-lg border border-slate-100 hover:border-orange-300 hover:bg-orange-50/40 text-center transition-all flex flex-col items-center justify-center group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-slate-50 group-hover:bg-orange-100 text-slate-700 group-hover:text-orange-600 flex items-center justify-center transition-colors mb-2">
                  {getCategoryIcon(cat.iconName)}
                </div>
                <div className="font-semibold text-xs text-slate-900 group-hover:text-orange-600 truncate max-w-[120px]">
                  {cat.name}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[120px]">
                  {cat.hindiName}
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Best Sellers Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Best Sellers in Saharanpur
                </h2>
                <p className="text-xs text-slate-500">Most ordered products with verified local delivery</p>
              </div>
            </div>
            <button
              onClick={onGoToCatalog}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {bestSellers.slice(0, 4).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onViewDetails={onViewProductDetails}
                onContactSeller={onContactSeller}
                onAddToCart={onAddToCart}
                onBuyNow={onBuyNow}
                isWishlisted={wishlist.includes(product.id)}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 5. Saharanpur GI Handicrafts Spotlight */}
      {woodcraftProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-r from-amber-50 via-white to-amber-50 p-5 rounded-xl border border-amber-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-amber-200/60">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Authentic Saharanpur Sheesham Woodcrafts
                  </h2>
                  <p className="text-xs text-slate-600">
                    Registered GI craft of Uttar Pradesh. Direct from Hasanpur master artisans.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onSelectCategory('furniture')}
                className="text-xs font-bold text-amber-700 hover:underline cursor-pointer"
              >
                Shop All Woodcrafts
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {woodcraftProducts.slice(0, 4).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onViewDetails={onViewProductDetails}
                  onContactSeller={onContactSeller}
                  onAddToCart={onAddToCart}
                  onBuyNow={onBuyNow}
                  isWishlisted={wishlist.includes(product.id)}
                  onToggleWishlist={onToggleWishlist}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. Trending & New Arrivals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                New Arrivals & Trending Products
              </h2>
              <p className="text-xs text-slate-500">Fresh listings added by verified Saharanpur shops this week</p>
            </div>
            <button
              onClick={onGoToCatalog}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
            >
              Browse Catalog
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {newArrivals.slice(0, 8).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onViewDetails={onViewProductDetails}
                onContactSeller={onContactSeller}
                onAddToCart={onAddToCart}
                onBuyNow={onBuyNow}
                isWishlisted={wishlist.includes(product.id)}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 7. Recently Viewed Products (Persisted) */}
      {recentlyViewedProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-slate-500" />
                <h2 className="text-base font-bold text-slate-900">
                  Recently Viewed by You
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {recentlyViewedProducts.slice(0, 6).map((product) => (
                <div
                  key={product.id}
                  onClick={() => onViewProductDetails(product)}
                  className="p-2.5 rounded-lg border border-slate-100 hover:border-orange-300 transition-all cursor-pointer bg-white group text-xs space-y-1.5"
                >
                  <div className="aspect-square rounded bg-slate-50 overflow-hidden flex items-center justify-center p-1">
                    <img
                      src={(product.images && product.images[0]) || ''}
                      alt=""
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="font-semibold text-slate-900 truncate">{product.name}</div>
                  <div className="font-extrabold text-slate-900">
                    ₹{new Intl.NumberFormat('en-IN').format(product.price)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 8. Trust & Local Fulfillment Guarantees */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-6 text-slate-700">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div className="text-xs space-y-0.5">
              <div className="font-bold text-slate-900">Fast Doorstep Delivery</div>
              <p className="text-slate-500 leading-relaxed">
                Direct dispatch from local shops across Court Road, Hasanpur, Delhi Road & Bajoria Road.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-xs space-y-0.5">
              <div className="font-bold text-slate-900">Cash on Delivery (COD)</div>
              <p className="text-slate-500 leading-relaxed">
                Pay cash or scan shopkeeper UPI QR code only upon receiving your items safely.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div className="text-xs space-y-0.5">
              <div className="font-bold text-slate-900">Verified Local Merchants</div>
              <p className="text-slate-500 leading-relaxed">
                Authentic Saharanpur traders and manufacturers with physical dukaans you can visit.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div className="text-xs space-y-0.5">
              <div className="font-bold text-slate-900">Direct WhatsApp Enquiry</div>
              <p className="text-slate-500 leading-relaxed">
                Chat with shopkeepers directly to discuss custom dimensions or bulk site orders.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
