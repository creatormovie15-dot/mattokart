import React, { useState } from 'react';
import {
  X,
  MapPin,
  Store,
  Phone,
  MessageCircle,
  Truck,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ShoppingCart,
  Zap,
  Plus,
  Minus,
  Heart,
  Star,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { Product, ProductReview } from '../types';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onOpenEnquiry: (product: Product) => void;
  onAddToCart?: (product: Product, quantity: number) => void;
  onBuyNow?: (product: Product, quantity: number) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: string) => void;
  reviews?: ProductReview[];
  onAddReview?: (review: { productId: string; userName: string; rating: number; title: string; comment: string; locality?: string }) => void;
  relatedProducts?: Product[];
  onSelectProduct?: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onOpenEnquiry,
  onAddToCart,
  onBuyNow,
  isWishlisted = false,
  onToggleWishlist,
  reviews = [],
  onAddReview,
  relatedProducts = [],
  onSelectProduct,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState<number>(() =>
    product?.minOrderQuantity ? Math.max(1, product.minOrderQuantity) : 1
  );

  // Review form states
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newTitle, setNewTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newLocality, setNewLocality] = useState('Saharanpur');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  if (!product) return null;

  const fallbackImg =
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80';
  const images = Array.isArray(product.images) && product.images.length > 0 ? product.images : [fallbackImg];
  const safeImg = images[activeImageIndex] || images[0] || fallbackImg;
  const deliveryAreas = Array.isArray(product.deliveryAreas) ? product.deliveryAreas : ['Saharanpur Local Area'];

  const formattedPrice = Number.isFinite(product.price)
    ? new Intl.NumberFormat('en-IN').format(product.price)
    : '0';
  const formattedOriginalPrice =
    product.originalPrice && Number.isFinite(product.originalPrice)
      ? new Intl.NumberFormat('en-IN').format(product.originalPrice)
      : null;
  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  // WhatsApp enquiry link
  const cleanPhone = (product.sellerPhone || '').replace(/\D/g, '');
  const encodedMsg = encodeURIComponent(
    `Namaste! I am interested in purchasing "${product.name}" (Price: ₹${formattedPrice} / ${product.unit}) listed on MattoKart Saharanpur. Please share delivery time.`
  );
  const whatsappUrl = `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${encodedMsg}`;

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newComment.trim() || !newTitle.trim()) return;

    if (onAddReview) {
      onAddReview({
        productId: product.id,
        userName: newUserName.trim(),
        rating: newRating,
        title: newTitle.trim(),
        comment: newComment.trim(),
        locality: newLocality.trim() || 'Saharanpur',
      });
    }

    setReviewSubmitted(true);
    setTimeout(() => {
      setShowReviewForm(false);
      setReviewSubmitted(false);
      setNewTitle('');
      setNewComment('');
      setNewUserName('');
    }, 1800);
  };

  const productReviews = reviews.filter((r) => r.productId === product.id);
  const avgRating =
    productReviews.length > 0
      ? (productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length).toFixed(1)
      : (product.sellerRating || 4.8).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Amazon-Style Modal Top Bar */}
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 text-xs text-slate-500 truncate">
            <span className="font-bold text-slate-900">MattoKart</span>
            <span>&gt;</span>
            <span className="capitalize">{product.categoryId.replace('-', ' & ')}</span>
            <span>&gt;</span>
            <span className="truncate text-slate-700 font-medium">{product.subcategory}</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-8">
          {/* Main 2-Column Product Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Image Gallery (5 Cols) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-50 border border-slate-200 p-4 flex items-center justify-center shadow-inner">
                <img
                  src={safeImg}
                  alt={product.name}
                  className="w-full h-full object-contain"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== fallbackImg) target.src = fallbackImg;
                  }}
                />

                {product.isWoodcraftSpecial && (
                  <div className="absolute top-3 left-3 bg-[#131921] text-amber-300 text-xs font-bold px-2.5 py-1 rounded shadow-md flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Saharanpur GI Craft
                  </div>
                )}

                {/* Wishlist Button */}
                <button
                  type="button"
                  onClick={() => onToggleWishlist && onToggleWishlist(product.id)}
                  className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all cursor-pointer ${
                    isWishlisted ? 'bg-red-50 text-red-600' : 'bg-white text-slate-400 hover:text-red-500'
                  }`}
                  title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-600 text-red-600' : ''}`} />
                </button>
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all p-1 bg-white cursor-pointer ${
                        activeImageIndex === idx
                          ? 'border-orange-500 ring-2 ring-orange-400/40'
                          : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              )}

              {/* Verified Seller Dukaan Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                    <Store className="w-4 h-4 text-orange-600" />
                    <span>{product.sellerShopName}</span>
                  </span>
                  <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                    Verified Dukaan
                  </span>
                </div>
                <div className="text-slate-600">
                  Proprietor: <strong className="text-slate-800">{product.sellerName}</strong>
                </div>
                <div className="text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{product.sellerLocality}, Saharanpur, UP</span>
                </div>
                <div className="pt-2 border-t border-slate-200 text-slate-600">
                  <div className="font-semibold text-slate-800 mb-1">Service & Delivery Coverage:</div>
                  <div className="flex flex-wrap gap-1">
                    {deliveryAreas.map((area, idx) => (
                      <span key={idx} className="bg-white border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Title, Pricing, Actions & Purchase Module (7 Cols) */}
            <div className="lg:col-span-7 space-y-5">
              {/* Product Header */}
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                  {product.name}
                </h1>
                <div className="text-xs text-slate-500 mt-1">
                  Brand / Shop: <span className="font-semibold text-orange-600">{product.sellerShopName}</span>
                </div>

                {/* Rating Bar */}
                <div className="flex items-center gap-2 mt-2 text-xs">
                  <div className="flex items-center text-amber-500">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  </div>
                  <span className="font-bold text-slate-900">{avgRating} out of 5</span>
                  <span className="text-slate-400">·</span>
                  <a href="#reviews" className="text-orange-600 hover:underline">
                    {productReviews.length || 24} customer ratings
                  </a>
                </div>
              </div>

              {/* Price Block */}
              <div className="py-3 border-y border-slate-100 space-y-1">
                <div className="flex items-baseline gap-2">
                  {discountPercent > 0 && (
                    <span className="text-xl font-bold text-red-600">-{discountPercent}%</span>
                  )}
                  <span className="text-sm font-medium text-slate-600">₹</span>
                  <span className="text-3xl font-extrabold text-slate-900 -ml-1">
                    {formattedPrice}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">/ {product.unit}</span>
                </div>

                {formattedOriginalPrice && (
                  <div className="text-xs text-slate-500">
                    M.R.P.: <span className="line-through">₹{formattedOriginalPrice}</span>
                    <span className="text-emerald-700 font-semibold ml-2">Inclusive of all local taxes</span>
                  </div>
                )}
              </div>

              {/* Stock Status Indicator */}
              <div className="space-y-1">
                <div className="text-sm font-bold">
                  {product.inStock ? (
                    <span className="text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      In Stock ({product.stockCount} {product.unit}s available)
                    </span>
                  ) : (
                    <span className="text-red-600 font-bold">Currently Out of Stock</span>
                  )}
                </div>
                <div className="text-xs text-slate-500">
                  Direct dispatch from <strong>{product.sellerShopName}</strong> godown in {product.sellerLocality}.
                </div>
              </div>

              {/* Purchase Box (Amazon Yellow/Orange Buttons) */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                {/* Quantity Stepper */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Quantity ({product.unit}s):
                  </span>
                  <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-xs">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(product.minOrderQuantity || 1, q - 1))}
                      disabled={!product.inStock || quantity <= (product.minOrderQuantity || 1)}
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                      title="Decrease"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-4 py-1 text-sm font-bold text-slate-900 min-w-[36px] text-center font-mono">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(product.stockCount || 999, q + 1))}
                      disabled={!product.inStock || quantity >= (product.stockCount || 999)}
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                      title="Increase"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-200">
                  <span>Subtotal ({quantity} {product.unit}{quantity > 1 ? 's' : ''}):</span>
                  <span className="text-base font-extrabold text-slate-900">
                    ₹{new Intl.NumberFormat('en-IN').format((product.price || 0) * quantity)}
                  </span>
                </div>

                {/* Primary Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (onAddToCart) onAddToCart(product, quantity);
                      onClose();
                    }}
                    disabled={!product.inStock}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm bg-[#ffd814] hover:bg-[#f7ca00] text-slate-950 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onBuyNow) {
                        onBuyNow(product, quantity);
                      } else if (onAddToCart) {
                        onAddToCart(product, quantity);
                      }
                      onClose();
                    }}
                    disabled={!product.inStock}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm bg-[#ffa41c] hover:bg-[#fa8900] text-slate-950 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    <Zap className="w-4 h-4 fill-slate-950" />
                    <span>Buy Now</span>
                  </button>
                </div>

                {/* Direct WhatsApp Inquiry */}
                <div className="pt-2 border-t border-slate-200">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp Enquiry with {product.sellerShopName}</span>
                  </a>
                </div>
              </div>

              {/* Product Specifications Table */}
              <div className="space-y-2">
                <h3 className="font-bold text-sm text-slate-900">Product Specifications</h3>
                <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                  <div className="grid grid-cols-2 p-2 bg-slate-50 border-b border-slate-100">
                    <span className="text-slate-500">Material / Category</span>
                    <span className="font-semibold text-slate-800 capitalize">{product.categoryId}</span>
                  </div>
                  <div className="grid grid-cols-2 p-2 border-b border-slate-100">
                    <span className="text-slate-500">Subcategory</span>
                    <span className="font-semibold text-slate-800">{product.subcategory}</span>
                  </div>
                  <div className="grid grid-cols-2 p-2 bg-slate-50 border-b border-slate-100">
                    <span className="text-slate-500">Unit of Sale</span>
                    <span className="font-semibold text-slate-800">{product.unit}</span>
                  </div>
                  {product.specifications &&
                    Object.entries(product.specifications).map(([key, val]) => (
                      <div key={key} className="grid grid-cols-2 p-2 border-b border-slate-100 last:border-b-0">
                        <span className="text-slate-500 capitalize">{key}</span>
                        <span className="font-semibold text-slate-800">{val}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Product Description */}
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-slate-900">About this Item</h3>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                  {product.description || 'Authentic product sourced directly from verified local manufacturers in Saharanpur, Uttar Pradesh.'}
                </p>
              </div>
            </div>
          </div>

          {/* Customer Reviews Section */}
          <div id="reviews" className="pt-6 border-t border-slate-200 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Customer Ratings & Reviews</h3>
                <p className="text-xs text-slate-500">Verified buyer feedback from Saharanpur orders</p>
              </div>

              <button
                type="button"
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="px-4 py-2 border border-slate-300 hover:border-slate-400 bg-white text-slate-800 text-xs font-bold rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
              >
                {showReviewForm ? 'Cancel Review' : 'Write a Product Review'}
              </button>
            </div>

            {/* Write Review Form */}
            {showReviewForm && (
              <form onSubmit={handleSubmitReview} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="font-bold text-xs text-slate-900">Share your experience with this product</div>

                {reviewSubmitted ? (
                  <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold">
                    ✓ Shukriya! Your review has been submitted and published.
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Your Full Name</label>
                        <input
                          type="text"
                          required
                          value={newUserName}
                          onChange={(e) => setNewUserName(e.target.value)}
                          placeholder="e.g. Ramesh Chandra"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Your Saharanpur Area</label>
                        <input
                          type="text"
                          value={newLocality}
                          onChange={(e) => setNewLocality(e.target.value)}
                          placeholder="e.g. Court Road"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Star Rating</label>
                        <select
                          value={newRating}
                          onChange={(e) => setNewRating(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                        >
                          <option value={5}>★★★★★ (5 Stars - Excellent)</option>
                          <option value={4}>★★★★☆ (4 Stars - Good)</option>
                          <option value={3}>★★★☆☆ (3 Stars - Average)</option>
                          <option value={2}>★★☆☆☆ (2 Stars - Below Average)</option>
                          <option value={1}>★☆☆☆☆ (1 Star - Poor)</option>
                        </select>
                      </div>
                    </div>

                    <div className="text-xs">
                      <label className="block text-slate-700 font-semibold mb-1">Review Headline</label>
                      <input
                        type="text"
                        required
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="e.g. Top quality Sheesham finish and timely delivery"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>

                    <div className="text-xs">
                      <label className="block text-slate-700 font-semibold mb-1">Detailed Review</label>
                      <textarea
                        required
                        rows={3}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write details about the build quality, delivery experience, and value for money..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>

                    <button
                      type="submit"
                      className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      Submit Review
                    </button>
                  </>
                )}
              </form>
            )}

            {/* Existing Reviews List */}
            <div className="space-y-3">
              {productReviews.length === 0 ? (
                <div className="text-xs text-slate-500 py-3 italic">
                  Be the first to write a verified customer review for this product!
                </div>
              ) : (
                productReviews.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-xl border border-slate-100 bg-white space-y-1.5 text-xs shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 font-bold text-slate-700 flex items-center justify-center text-[10px]">
                          {rev.userName[0]}
                        </div>
                        <span className="font-semibold text-slate-900">{rev.userName}</span>
                        {rev.locality && <span className="text-slate-400">({rev.locality})</span>}
                      </div>
                      <span className="text-[10px] text-slate-400">{rev.createdAt}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="flex text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                          />
                        ))}
                      </div>
                      <span className="font-bold text-slate-800">{rev.title}</span>
                      {rev.verifiedPurchase && (
                        <span className="text-emerald-700 text-[10px] font-semibold bg-emerald-50 px-1.5 py-0.2 rounded">
                          Verified Purchase
                        </span>
                      )}
                    </div>

                    <p className="text-slate-600 leading-relaxed">{rev.comment}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Related Products Strip */}
          {relatedProducts.length > 0 && (
            <div className="pt-6 border-t border-slate-200 space-y-4">
              <h3 className="font-bold text-sm text-slate-900">Similar Products from Saharanpur Dukaans</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {relatedProducts.slice(0, 4).map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => onSelectProduct && onSelectProduct(rel)}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-orange-400 transition-all cursor-pointer bg-white group text-xs space-y-1.5"
                  >
                    <div className="aspect-square rounded-lg bg-slate-50 overflow-hidden">
                      <img
                        src={(rel.images && rel.images[0]) || fallbackImg}
                        alt=""
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="font-semibold text-slate-900 truncate">{rel.name}</div>
                    <div className="font-extrabold text-slate-900">
                      ₹{new Intl.NumberFormat('en-IN').format(rel.price)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
