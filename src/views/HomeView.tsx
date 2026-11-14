import React, { useState, useEffect, useRef } from 'react';
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
  ArrowRight,
  ShieldCheck,
  MessageCircle,
  Truck,
  ChevronLeft,
  ChevronRight,
  Eye,
  LayoutGrid,
  Star,
  Menu,
  Zap,
  RotateCcw,
  Headphones,
  Smartphone,
  Briefcase,
  Car,
  BookOpen,
  Palette,
  RefreshCw,
} from 'lucide-react';
import { Category, Product, Seller, SaharanpurLocality, CategoryId } from '../types';
import { ProductCard } from '../components/ProductCard';
import heroConstructionImg from '../assets/images/hero_construction_supply_1794588733284.jpg';
import promoWoodcraftImg from '../assets/images/promo_woodcraft_showcase_1794588733421.jpg';

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
  onGoToShops?: () => void;
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
  onGoToShops,
  onGoToSellerRegister,
  onOpenLocationModal,
  onSelectShopProducts,
  wishlist = [],
  onToggleWishlist,
  recentlyViewedIds = [],
}) => {
  const approvedProducts = products.filter((p) => p.status === 'approved');
  const topDeals = [...approvedProducts]
    .sort((a, b) => {
      const discA = a.originalPrice && a.originalPrice > a.price ? (a.originalPrice - a.price) / a.originalPrice : 0;
      const discB = b.originalPrice && b.originalPrice > b.price ? (b.originalPrice - b.price) / b.originalPrice : 0;
      return discB - discA || (b.sellerRating || 0) - (a.sellerRating || 0);
    })
    .slice(0, 5);
  const constructionProducts = approvedProducts.filter(
    (p) => p.categoryId === 'construction' || p.categoryId === 'tools-hardware'
  );
  const woodcraftProducts = approvedProducts.filter(
    (p) => p.isWoodcraftSpecial || p.categoryId === 'furniture'
  );
  const bestSellers = [...approvedProducts]
    .sort((a, b) => (b.sellerRating || 0) - (a.sellerRating || 0))
    .slice(0, 10);
  const activeSellers = sellers.filter((s) => s.status === 'active');

  const recentlyViewedProducts = recentlyViewedIds
    .map((id) => approvedProducts.find((p) => p.id === id))
    .filter((p): p is Product => p !== undefined);

  const categoryScrollRef = useRef<HTMLDivElement>(null);

  // Construction & Shopping Hero Banner Carousel (Matches Attached Blueprint)
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const heroBanners = [
    {
      id: 1,
      line1: 'Build Better',
      line2: 'Live Better',
      subtitle: 'Premium Construction Materials at Best Prices',
      ctaText: 'Shop Now',
      action: () => onSelectCategory('construction'),
      bannerImg: heroConstructionImg,
    },
    {
      id: 2,
      line1: 'Crafted Pure',
      line2: 'Sheesham Wood',
      subtitle: 'Saharanpur GI Mandirs & Carved Furniture Direct',
      ctaText: 'Explore Woodcraft',
      action: () => onSelectCategory('furniture'),
      bannerImg: promoWoodcraftImg,
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % heroBanners.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [heroBanners.length]);

  const getCategoryIcon = (iconName: string, sizeClass = 'w-4 h-4') => {
    switch (iconName) {
      case 'Armchair':
        return <Armchair className={sizeClass} />;
      case 'Building2':
        return <Building2 className={sizeClass} />;
      case 'Wrench':
        return <Wrench className={sizeClass} />;
      case 'Tv':
        return <Tv className={sizeClass} />;
      case 'Shirt':
        return <Shirt className={sizeClass} />;
      case 'UtensilsCrossed':
        return <UtensilsCrossed className={sizeClass} />;
      case 'ShoppingBag':
        return <ShoppingBag className={sizeClass} />;
      case 'Sprout':
        return <Sprout className={sizeClass} />;
      case 'Baby':
        return <Baby className={sizeClass} />;
      case 'Sparkles':
        return <Sparkles className={sizeClass} />;
      case 'Smartphone':
        return <Smartphone className={sizeClass} />;
      case 'Briefcase':
        return <Briefcase className={sizeClass} />;
      case 'Car':
        return <Car className={sizeClass} />;
      case 'BookOpen':
        return <BookOpen className={sizeClass} />;
      case 'Palette':
        return <Palette className={sizeClass} />;
      case 'RefreshCw':
        return <RefreshCw className={sizeClass} />;
      default:
        return <Package className={sizeClass} />;
    }
  };

  const getCategoryAccent = (id: CategoryId) => {
    switch (id) {
      case 'construction':
        return 'bg-amber-50 text-amber-600';
      case 'tools-hardware':
        return 'bg-sky-50 text-sky-700';
      case 'furniture':
        return 'bg-orange-50 text-orange-600';
      case 'electronics':
        return 'bg-indigo-50 text-indigo-600';
      case 'mobile-accessories':
        return 'bg-cyan-50 text-cyan-700';
      case 'clothing-fashion':
        return 'bg-rose-50 text-rose-600';
      case 'shoes-bags':
        return 'bg-fuchsia-50 text-fuchsia-700';
      case 'home-kitchen':
        return 'bg-emerald-50 text-emerald-600';
      case 'grocery-food':
        return 'bg-lime-50 text-lime-700';
      case 'automobile':
        return 'bg-slate-100 text-slate-800';
      case 'books-stationery':
        return 'bg-violet-50 text-violet-700';
      case 'handmade-crafts':
        return 'bg-amber-50 text-orange-700';
      case 'used-goods':
        return 'bg-teal-50 text-teal-700';
      default:
        return 'bg-slate-100 text-[#091e3a]';
    }
  };

  const getCategoryPreviewImage = (catId: CategoryId): string | undefined => {
    const match = approvedProducts.find((p) => p.categoryId === catId && p.images && p.images[0]);
    return match?.images?.[0];
  };

  const scrollCategories = (direction: 'left' | 'right') => {
    if (!categoryScrollRef.current) return;
    const offset = direction === 'left' ? -280 : 280;
    categoryScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  const activeBanner = heroBanners[currentBannerIndex];

  return (
    <div className="bg-[#f1f5f9] pb-12 space-y-5">
      {/* 1. Desktop Category Sidebar + Construction Hero Banner + 5-Item Trust Strip */}
      <section className="max-w-[1400px] mx-auto px-3 sm:px-4 pt-3">
        <div className="grid grid-cols-1 lg:grid-cols-[235px_1fr] gap-3 items-stretch">
          {/* Desktop Category Sidebar (Matches Clean White Card Sidebar) */}
          <aside className="hidden lg:flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center gap-2 bg-white">
              <Menu className="w-4 h-4 text-[#091e3a]" />
              <span className="text-sm font-extrabold text-[#091e3a] font-brand">
                All Categories
              </span>
            </div>

            <div className="flex-1 divide-y divide-slate-100 overflow-y-auto">
              {categories.slice(0, 10).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory(cat.id)}
                  className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-orange-50 hover:text-orange-600 transition-colors flex items-center justify-between gap-2 cursor-pointer group"
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${getCategoryAccent(cat.id)}`}>
                      {getCategoryIcon(cat.iconName, 'w-3.5 h-3.5')}
                    </span>
                    <span className="truncate font-medium">{cat.name}</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-500 shrink-0" />
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onGoToCatalog}
              className="w-full px-3 py-2.5 bg-slate-50 hover:bg-orange-50 border-t border-slate-100 text-xs font-bold text-[#091e3a] hover:text-orange-600 flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>More Categories</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </aside>

          {/* Right Column: Hero Banner + 5-Item Trust Feature Bar */}
          <div className="flex flex-col gap-3 min-w-0">
            {/* Construction Hero Banner (Bright Left Headline + Right Depot Photo) */}
            <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-white via-sky-50 to-sky-100 shadow-xs border border-slate-200 min-h-[240px] sm:min-h-[290px] lg:min-h-[310px] flex items-center">
              <img
                src={activeBanner.bannerImg}
                alt={`${activeBanner.line1} ${activeBanner.line2}`}
                className="absolute inset-0 w-full h-full object-cover object-right transition-opacity duration-500"
              />
              {/* Bright Left-to-Right Sky/White Scrim matching Reference */}
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 sm:via-sky-50/85 to-transparent" />

              <div className="relative z-10 px-6 sm:px-10 py-7 max-w-xl space-y-2.5 sm:space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#f97316]">
                  India Ka Apna Shopping Marketplace · Buy Anywhere. Sell Everywhere.
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black font-brand leading-[1.05] tracking-tight">
                  <span className="block text-[#091e3a]">{activeBanner.line1}</span>
                  <span className="block text-[#f97316]">{activeBanner.line2}</span>
                </h1>

                <p className="text-[#091e3a] font-bold text-sm sm:text-base max-w-md leading-snug">
                  {activeBanner.subtitle}
                </p>

                <div className="pt-1 flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={activeBanner.action}
                    className="px-5 py-2.5 rounded-lg bg-[#f97316] hover:bg-orange-600 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    <span>{activeBanner.ctaText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Dark Circular Prev/Next Controls */}
              <button
                type="button"
                onClick={() =>
                  setCurrentBannerIndex((prev) => (prev === 0 ? heroBanners.length - 1 : prev - 1))
                }
                aria-label="Previous hero slide"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#091e3a]/80 hover:bg-[#091e3a] text-white flex items-center justify-center transition-colors cursor-pointer z-20"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setCurrentBannerIndex((prev) => (prev + 1) % heroBanners.length)
                }
                aria-label="Next hero slide"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#091e3a]/80 hover:bg-[#091e3a] text-white flex items-center justify-center transition-colors cursor-pointer z-20"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Center Bottom Indicator Dots */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
                {heroBanners.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentBannerIndex(idx)}
                    aria-label={`Slide ${idx + 1}`}
                    className={`h-2.5 rounded-full transition-all cursor-pointer border border-white/60 ${
                      currentBannerIndex === idx ? 'w-2.5 bg-[#f97316]' : 'w-2.5 bg-white/80'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* 5-Feature Horizontal Trust Bar */}
            <div className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 shadow-xs grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              <button
                type="button"
                onClick={onOpenLocationModal}
                className="flex items-center gap-2.5 text-left hover:bg-slate-50 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#091e3a] flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4 text-[#f97316]" />
                </div>
                <div className="min-w-0 leading-tight">
                  <div className="text-xs font-bold text-slate-900 truncate">Fast Delivery</div>
                  <div className="text-[10px] text-slate-500 truncate">
                    Across India &amp; {selectedLocality.city || selectedLocality.name}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={onGoToCatalog}
                className="flex items-center gap-2.5 text-left hover:bg-slate-50 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0 leading-tight">
                  <div className="text-xs font-bold text-slate-900 truncate">Secure Payments</div>
                  <div className="text-[10px] text-slate-500 truncate">Cash on Delivery</div>
                </div>
              </button>

              <button
                type="button"
                onClick={onGoToCatalog}
                className="flex items-center gap-2.5 text-left hover:bg-slate-50 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div className="min-w-0 leading-tight">
                  <div className="text-xs font-bold text-slate-900 truncate">Easy Returns</div>
                  <div className="text-[10px] text-slate-500 truncate">7 Days Policy</div>
                </div>
              </button>

              <a
                href="https://wa.me/918221077674"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-left hover:bg-slate-50 p-1 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#091e3a] flex items-center justify-center shrink-0">
                  <Headphones className="w-4 h-4" />
                </div>
                <div className="min-w-0 leading-tight">
                  <div className="text-xs font-bold text-slate-900 truncate">24x7 Customer</div>
                  <div className="text-[10px] text-slate-500 truncate">Support</div>
                </div>
              </a>

              <button
                type="button"
                onClick={onGoToShops || onGoToCatalog}
                className="col-span-2 sm:col-span-1 flex items-center gap-2.5 text-left hover:bg-slate-50 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#f97316] flex items-center justify-center shrink-0">
                  <Store className="w-4 h-4" />
                </div>
                <div className="min-w-0 leading-tight">
                  <div className="text-xs font-bold text-slate-900 truncate">Pan-India Sellers</div>
                  <div className="text-[10px] text-slate-500 truncate">All 28 States &amp; 8 UTs</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Top Deals of the Day (5 cards/row desktop, 2 cards/row mobile) */}
      <section className="max-w-[1400px] mx-auto px-3 sm:px-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 fill-amber-500 shrink-0" />
            <h2 className="text-base sm:text-lg font-extrabold text-[#091e3a] font-brand">
              Top Deals of the Day
            </h2>
          </div>
          <button
            type="button"
            onClick={onGoToCatalog}
            className="text-xs font-bold text-[#091e3a] hover:text-orange-600 flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <span>View All Deals</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
          {topDeals.map((product) => (
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
      </section>

      {/* 3. Shop by Category Horizontal Carousel (Rounded Pill Cards) */}
      <section className="max-w-[1400px] mx-auto px-3 sm:px-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5 text-[#091e3a]" />
            <h2 className="text-base sm:text-lg font-extrabold text-[#091e3a] font-brand">
              Shop by Category
            </h2>
          </div>
          <button
            type="button"
            onClick={onGoToCatalog}
            className="text-xs font-bold text-[#091e3a] hover:text-orange-600 flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="relative flex items-center">
          <button
            type="button"
            onClick={() => scrollCategories('left')}
            aria-label="Scroll categories left"
            className="hidden sm:flex w-7 h-7 rounded-full bg-white border border-slate-200 hover:border-orange-400 shadow-xs items-center justify-center text-slate-700 cursor-pointer shrink-0 mr-2"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            ref={categoryScrollRef}
            className="flex-1 flex items-stretch gap-3 overflow-x-auto no-scrollbar py-0.5"
          >
            {categories.map((cat) => {
              const previewImg = getCategoryPreviewImage(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory(cat.id)}
                  className="w-32 sm:w-36 shrink-0 flex flex-col items-center group cursor-pointer"
                >
                  <div className="w-full h-16 rounded-full bg-white border border-slate-200 group-hover:border-orange-400 shadow-2xs overflow-hidden flex items-center justify-center p-1.5 transition-all">
                    {previewImg ? (
                      <img
                        src={previewImg}
                        alt={cat.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    ) : (
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center ${getCategoryAccent(cat.id)}`}>
                        {getCategoryIcon(cat.iconName, 'w-5 h-5')}
                      </div>
                    )}
                  </div>
                  <span className="mt-1.5 font-bold text-xs text-slate-900 group-hover:text-orange-600 line-clamp-1 text-center w-full px-1">
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => scrollCategories('right')}
            aria-label="Scroll categories right"
            className="hidden sm:flex w-7 h-7 rounded-full bg-white border border-slate-200 hover:border-orange-400 shadow-xs items-center justify-center text-slate-700 cursor-pointer shrink-0 ml-2"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 4. Featured Shops (Compact Horizontal 4-Card Row Matching Reference) */}
      {activeSellers.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-3 sm:px-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 sm:w-5 sm:h-5 text-[#f97316] shrink-0" />
              <h2 className="text-base sm:text-lg font-extrabold text-[#091e3a] font-brand">
                Featured Shops
              </h2>
            </div>
            <button
              type="button"
              onClick={onGoToShops || onGoToCatalog}
              className="text-xs font-bold text-[#091e3a] hover:text-orange-600 flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <span>View All Shops</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {activeSellers.slice(0, 4).map((seller) => (
              <div
                key={seller.id}
                className="bg-white border border-slate-200 rounded-xl p-2.5 hover:border-orange-300 hover:shadow-sm transition-all flex items-center gap-3"
              >
                <div className="w-20 h-16 rounded-lg overflow-hidden bg-[#091e3a] shrink-0 border border-slate-100">
                  {seller.bannerImage ? (
                    <img
                      src={seller.bannerImage}
                      alt={seller.shopName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-orange-400">
                      <Store className="w-6 h-6" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="font-bold text-xs text-slate-900 truncate" title={seller.shopName}>
                    {seller.shopName}
                  </h3>
                  <div className="text-[11px] text-slate-500 truncate">
                    {seller.city || seller.locality}, {seller.state || 'Uttar Pradesh'}
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <span className="text-[11px] font-bold text-slate-800 flex items-center gap-0.5 tabular-nums">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{seller.rating}</span>
                      <span className="text-slate-400 font-normal">({seller.reviewsCount || 85})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onSelectShopProducts
                          ? onSelectShopProducts(seller.shopName)
                          : onGoToShops
                          ? onGoToShops()
                          : onGoToCatalog()
                      }
                      className="px-2.5 py-1 rounded-md border border-slate-200 hover:border-orange-500 hover:bg-[#f97316] hover:text-white text-[#091e3a] text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <span>Visit Store</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. 3-Column Navy & Gold Promotional Strips (Exact Reference Trio) */}
      <section className="max-w-[1400px] mx-auto px-3 sm:px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Promo 1: Free Delivery (Deep Navy) */}
          <button
            type="button"
            onClick={onGoToCatalog}
            className="bg-gradient-to-r from-[#061529] to-[#122b4e] text-white rounded-xl p-4 flex items-center gap-3.5 text-left hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-400/40 flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6 text-[#f97316]" />
            </div>
            <div className="min-w-0">
              <div className="text-sm sm:text-base font-extrabold leading-tight font-brand">
                Free Delivery
              </div>
              <div className="text-xs text-slate-200">
                On Orders Above <span className="text-amber-400 font-bold">₹499</span>
              </div>
              <div className="text-xs font-bold text-amber-400 flex items-center gap-1 mt-1">
                <span>Shop Now</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </button>

          {/* Promo 2: 100% Secure Payments (Warm Gold) */}
          <button
            type="button"
            onClick={onGoToCatalog}
            className="bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-400 text-[#091e3a] rounded-xl p-4 flex items-center gap-3.5 text-left hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-[#091e3a] text-amber-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="text-sm sm:text-base font-extrabold leading-tight font-brand">
                100% Secure Payments
              </div>
              <div className="text-xs font-medium text-[#091e3a]/80">
                Cash on Delivery &amp; Verified Stores
              </div>
              <div className="text-xs font-bold text-[#091e3a] flex items-center gap-1 mt-1">
                <span>Shop Confidently</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </button>

          {/* Promo 3: 24x7 Customer Support (Royal Navy) */}
          <a
            href="https://wa.me/918221077674"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-r from-[#122b4e] to-[#061529] text-white rounded-xl p-4 flex items-center gap-3.5 text-left hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <Headphones className="w-6 h-6 text-amber-400" />
            </div>
            <div className="min-w-0">
              <div className="text-sm sm:text-base font-extrabold leading-tight font-brand">
                24x7 Customer Support
              </div>
              <div className="text-xs text-slate-200">
                We&apos;re Always Here!
              </div>
              <div className="text-xs font-bold text-amber-400 flex items-center gap-1 mt-1">
                <span>Get Help</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </a>
        </div>
      </section>

      {/* 6. Construction Materials & Hardware (5 cards/row desktop, 2 cards/row mobile) */}
      {constructionProducts.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-3 sm:px-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#091e3a] shrink-0" />
              <h2 className="text-base sm:text-lg font-extrabold text-[#091e3a] font-brand">
                Construction Materials &amp; Hardware
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onSelectCategory('construction')}
              className="text-xs font-bold text-[#091e3a] hover:text-orange-600 flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
            {constructionProducts.slice(0, 5).map((product) => (
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
        </section>
      )}

      {/* 7. Saharanpur Best Sellers & Woodcraft (5 cards/row desktop, 2 cards/row mobile) */}
      <section className="max-w-[1400px] mx-auto px-3 sm:px-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#f97316] shrink-0" />
            <h2 className="text-base sm:text-lg font-extrabold text-[#091e3a] font-brand">
              Saharanpur Woodcraft &amp; Best Sellers
            </h2>
          </div>
          <button
            type="button"
            onClick={onGoToCatalog}
            className="text-xs font-bold text-[#091e3a] hover:text-orange-600 flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <span>Browse All Products</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
          {(woodcraftProducts.length >= 5 ? bestSellers : approvedProducts)
            .slice(0, 10)
            .map((product) => (
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
      </section>

      {/* 8. Recently Viewed (5 cards/row desktop, 2 cards/row mobile) */}
      {recentlyViewedProducts.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-3 sm:px-4 space-y-2.5">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#091e3a]" />
            <h2 className="text-base font-extrabold text-[#091e3a] font-brand">
              Recently Viewed Products
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
            {recentlyViewedProducts.slice(0, 5).map((product) => (
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
        </section>
      )}

      {/* 9. Compact Seller Corner Strip */}
      <section className="max-w-[1400px] mx-auto px-3 sm:px-4">
        <div className="bg-[#091e3a] text-white rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#f97316] text-white flex items-center justify-center shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold font-brand">
                Sell Your Products on MattoKart — Seller Corner
              </h3>
              <p className="text-xs text-slate-300">
                Free 1st Year for Sellers across India (₹0 registration &amp; listing fee). Sell anywhere in India with COD &amp; courier dispatch.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={onGoToSellerRegister}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-lg bg-[#f97316] hover:bg-orange-600 text-white font-bold text-xs transition-colors cursor-pointer whitespace-nowrap text-center"
            >
              Become a Seller
            </button>
            <a
              href="https://wa.me/918221077674"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Help</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
