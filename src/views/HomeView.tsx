import React from 'react';
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
  onGoToCatalog: () => void;
  onGoToSellerRegister: () => void;
  onOpenLocationModal: () => void;
  onSelectShopProducts?: (shopName: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  categories,
  products,
  sellers,
  selectedLocality,
  onSelectCategory,
  onViewProductDetails,
  onContactSeller,
  onGoToCatalog,
  onGoToSellerRegister,
  onOpenLocationModal,
  onSelectShopProducts,
}) => {
  const featuredProducts = products.filter((p) => p.featured && p.status === 'approved');
  const recentProducts = products.filter((p) => p.recentlyAdded && p.status === 'approved');
  const woodcraftProducts = products.filter((p) => p.isWoodcraftSpecial && p.status === 'approved');

  // Category Icon helper
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Armchair':
        return <Armchair className="w-6 h-6" />;
      case 'Building2':
        return <Building2 className="w-6 h-6" />;
      case 'Wrench':
        return <Wrench className="w-6 h-6" />;
      case 'Tv':
        return <Tv className="w-6 h-6" />;
      case 'Shirt':
        return <Shirt className="w-6 h-6" />;
      case 'UtensilsCrossed':
        return <UtensilsCrossed className="w-6 h-6" />;
      case 'ShoppingBag':
        return <ShoppingBag className="w-6 h-6" />;
      case 'Sprout':
        return <Sprout className="w-6 h-6" />;
      case 'Baby':
        return <Baby className="w-6 h-6" />;
      default:
        return <Package className="w-6 h-6" />;
    }
  };

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-orange-950 to-slate-900 text-white rounded-3xl mx-4 sm:mx-6 mt-4 p-6 sm:p-10 lg:p-12 shadow-2xl border border-orange-500/20">
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -top-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-5">
          {/* Location badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-orange-200">
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            <span>Serving Saharanpur & Surrounding Tehsils</span>
            <button
              onClick={onOpenLocationModal}
              className="text-white font-bold underline hover:text-orange-300 ml-1 cursor-pointer"
            >
              {selectedLocality.name} ({selectedLocality.pinCode})
            </button>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-brand leading-tight">
            MattoKart
            <span className="block text-2xl sm:text-3xl lg:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-orange-200 mt-1 font-semibold">
              Sab Kuch, Ek Hi Jagah!
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
            Explore authentic Saharanpur Sheesham woodcrafts, heavy construction materials (TMT Sariya & Cement), electronics, fashion, and groceries from trusted local retailers with direct WhatsApp enquiry and doorstep supply.
          </p>

          {/* Quick CTA Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onGoToCatalog}
              className="px-6 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>Explore Marketplace</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onGoToSellerRegister}
              className="px-5 py-3.5 rounded-xl font-semibold text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Store className="w-4 h-4 text-amber-400" />
              <span>Join MattoKart — FREE for Your First Year</span>
            </button>
          </div>

          {/* Highlights pills */}
          <div className="pt-4 flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>100% Local Saharanpur Sellers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Direct WhatsApp & Call Connect</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>No Middleman Brokerage</span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-brand">
              Browse Categories
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Verified product categories available in Saharanpur
            </p>
          </div>

          <button
            onClick={onGoToCatalog}
            className="text-xs sm:text-sm font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className="group p-4 bg-white rounded-2xl border border-slate-200/90 hover:border-orange-400 hover:shadow-lg transition-all duration-300 text-left flex flex-col justify-between cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white flex items-center justify-center transition-colors mb-3 shadow-xs">
                {getCategoryIcon(cat.iconName)}
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                  {cat.name}
                </h3>
                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                  {cat.hindiName}
                </p>
                <div className="mt-2 text-[10px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md inline-block">
                  {cat.itemCount} items
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Saharanpur GI Woodcraft Heritage Spotlight */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-amber-950 text-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl border border-amber-600/30 overflow-hidden relative">
          <div className="relative z-10 space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-200 border border-amber-400/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>World-Famous Heritage</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold font-brand text-amber-50">
              Saharanpur Sheesham & Teak Woodcraft
            </h2>

            <p className="text-amber-200/90 text-xs sm:text-sm leading-relaxed">
              Saharanpur is celebrated globally as the "Sheesham Wood City" with official GI (Geographical Indication) status. Buy master-crafted jali partitions, royal pooja mandirs, and dining suites directly from Hasanpur and Court Road carvers at true manufacturer rates.
            </p>

            <div className="pt-2">
              <button
                onClick={() => onSelectCategory('furniture')}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-400 hover:bg-amber-300 text-amber-950 transition-colors shadow-md flex items-center gap-2 cursor-pointer"
              >
                <span>Browse Woodcraft Collection</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick preview cards */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {woodcraftProducts.slice(0, 3).map((prod) => (
              <div
                key={prod.id}
                onClick={() => onViewProductDetails(prod)}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 flex items-center gap-3 cursor-pointer hover:bg-white/20 transition-all"
              >
                <img
                  src={(prod.images && prod.images[0]) || 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=400&q=80'}
                  alt={prod.name || 'Woodcraft'}
                  className="w-16 h-16 rounded-xl object-cover shrink-0"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=400&q=80';
                  }}
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white truncate">{prod.name}</h4>
                  <div className="text-amber-300 font-extrabold text-sm mt-0.5">
                    ₹{new Intl.NumberFormat('en-IN').format(prod.price)}
                  </div>
                  <div className="text-[10px] text-amber-200/80 truncate">
                    {prod.sellerShopName}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-brand">
                Featured Products
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Handpicked verified supplies & bestselling items in Saharanpur
            </p>
          </div>

          <button
            onClick={onGoToCatalog}
            className="text-xs sm:text-sm font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
          >
            <span>See All ({products.length})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onViewDetails={onViewProductDetails}
              onContactSeller={onContactSeller}
            />
          ))}
        </div>
      </section>

      {/* "Why Sell on MattoKart" Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2 space-y-3">
              <span className="bg-black/20 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Join MattoKart — FREE for Your First Year
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-brand">
                Saharanpur ke Dukaandar bane Digital — 100% Free Setup!
              </h2>
              <p className="text-orange-100 text-xs sm:text-sm leading-relaxed">
                Connect your physical shop on Court Road, Delhi Road, Hasanpur, Bajoria Road, or Nehru Market with thousands of digital buyers across Saharanpur. <strong className="text-white underline underline-offset-2">No registration fee. No listing fee during the first year.</strong> Get direct WhatsApp enquiries without hefty middleman commissions.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/15">
                  <div className="font-extrabold text-base text-amber-300">₹0 Fee</div>
                  <div className="text-[11px] text-orange-100">Free First Year (Registration ₹0)</div>
                </div>
                <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/15">
                  <div className="font-extrabold text-base text-amber-300">₹0 Listing</div>
                  <div className="text-[11px] text-orange-100">Zero Listing & Shop Creation Fee</div>
                </div>
                <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/15 col-span-2 sm:col-span-1">
                  <div className="font-extrabold text-base text-amber-300">Direct WhatsApp</div>
                  <div className="text-[11px] text-orange-100">Instant Customer Leads</div>
                </div>
              </div>
              <p className="text-[11px] text-orange-200/90 italic">
                * Transparency pledge: No registration fee. No listing fee during the first year. Any future policies will be announced in advance and require your explicit consent.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center bg-white text-slate-900 p-6 rounded-2xl shadow-xl space-y-3 text-center">
              <Store className="w-10 h-10 text-orange-600" />
              <h3 className="font-bold text-base text-slate-900">
                Register Your Shop Today
              </h3>
              <p className="text-xs text-slate-500">
                Setup your digital storefront in less than 3 minutes.
              </p>
              <button
                onClick={onGoToSellerRegister}
                className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-orange-600/30 cursor-pointer"
              >
                Start Seller Registration
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Saharanpur Shops */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-orange-600" />
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-brand">
                Popular Saharanpur Dukaanein
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Verified local shops ready for direct dispatch & warehouse pickup
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sellers.slice(0, 6).map((seller) => (
            <div
              key={seller.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 hover:border-orange-300 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={seller.shopLogo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'}
                      alt={seller.shopName || 'Shop'}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80';
                      }}
                    />
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 leading-tight">
                        {seller.shopName}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {seller.ownerName}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-lg shrink-0">
                    ★ {seller.rating}
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                  {seller.description}
                </p>

                <div className="space-y-1.5 text-xs text-slate-500 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                    <span className="truncate">{seller.locality}, Saharanpur</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Delivers within {seller.deliveryRadiusKm} km</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-100 mt-4">
                <a
                  href={`tel:${seller.phone.replace(/\s+/g, '')}`}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-orange-600 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-orange-600" />
                  <span>{seller.phone}</span>
                </a>

                <button
                  onClick={() => {
                    if (onSelectShopProducts) {
                      onSelectShopProducts(seller.shopName);
                    } else {
                      onGoToCatalog();
                    }
                  }}
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>View Products</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recently Added Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-brand">
            Recently Added Products
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Fresh arrivals from Saharanpur wholesalers & artisans
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {recentProducts.slice(0, 4).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onViewDetails={onViewProductDetails}
              onContactSeller={onContactSeller}
            />
          ))}
        </div>
      </section>

      {/* How MattoKart Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-slate-100 rounded-3xl p-6 sm:p-10 border border-slate-200">
          <div className="text-center max-w-xl mx-auto mb-8 space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-brand">
              How MattoKart Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Transparent, fast local commerce in 3 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 font-extrabold text-lg flex items-center justify-center mx-auto">
                1
              </div>
              <h3 className="font-bold text-base text-slate-900">
                Browse or Search Local Stock
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Filter by category, price in ₹, and locality (Court Road, Delhi Road, Clock Tower, Deoband). Check real-time stock and prices.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 font-extrabold text-lg flex items-center justify-center mx-auto">
                2
              </div>
              <h3 className="font-bold text-base text-slate-900">
                Send Direct Enquiry / WhatsApp
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Submit an instant enquiry with your mobile number or tap to open WhatsApp with pre-filled product details. No middlemen.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 font-extrabold text-lg flex items-center justify-center mx-auto">
                3
              </div>
              <h3 className="font-bold text-base text-slate-900">
                Local Fast Delivery or Pickup
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Confirm order directly with the verified local shopkeeper. Receive trailer, auto, or courier dispatch right at your doorstep.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
