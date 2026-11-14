export type CategoryId =
  | 'construction'
  | 'furniture'
  | 'electronics'
  | 'mobile-accessories'
  | 'fashion'
  | 'clothing-fashion'
  | 'shoes-bags'
  | 'home-kitchen'
  | 'grocery-food'
  | 'agriculture'
  | 'tools-hardware'
  | 'automobile'
  | 'beauty-care'
  | 'toys-baby'
  | 'books-stationery'
  | 'handmade-crafts'
  | 'used-goods'
  | 'other-permitted'
  | (string & {});

export interface Category {
  id: CategoryId;
  name: string;
  hindiName: string;
  iconName: string;
  itemCount: number;
  description: string;
  subcategories: string[];
}

export interface CategorySuggestion {
  id: string;
  suggestedName: string;
  hindiName?: string;
  sampleSubcategories: string;
  reason: string;
  suggestedBySellerId?: string;
  suggestedByShopName: string;
  sellerState?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export type UnitType = 'piece' | 'kg' | 'bag' | 'quintal' | 'meter' | 'set' | 'box' | 'pair' | 'sq.ft' | 'litre' | 'pack';

export type ShippingScope = 'local_only' | 'state_regional' | 'pan_india';

export type ProductCondition = 'new' | 'used_good' | 'refurbished';

export interface Product {
  id: string;
  name: string;
  categoryId: CategoryId;
  subcategory: string;
  price: number;
  originalPrice?: number;
  unit: UnitType;
  minOrderQuantity?: number;
  inStock: boolean;
  stockCount: number;
  images: string[];
  description: string;
  specifications: Record<string, string>;
  sellerId: string;
  sellerName: string;
  sellerShopName: string;
  sellerLocality: string;
  sellerCity?: string;
  sellerState?: string;
  sellerPinCode?: string;
  sellerPhone: string;
  sellerRating: number;
  deliveryAreas: string[];
  shippingScope?: ShippingScope;
  estimatedWeightKg?: number;
  dimensionsCm?: { length: number; breadth: number; height: number };
  deliveryMode?: 'standard_courier' | 'seller_transport' | 'both';
  sellerDeliveryFee?: number;
  localDeliveryAvailable?: boolean;
  codAvailable?: boolean;
  condition?: ProductCondition;
  featured?: boolean;
  recentlyAdded?: boolean;
  isWoodcraftSpecial?: boolean;
  status: 'approved' | 'pending' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
}

export type UserRole = 'customer' | 'seller' | 'admin' | 'delivery_partner';

export type DeliveryType = 'seller_delivery' | 'mattokart_delivery' | 'interstate_courier' | 'seller_transport';

export type ShippingZone = 'local' | 'intercity' | 'interstate';

export type DeliveryStatus =
  | 'pending'
  | 'requested'
  | 'confirmed'
  | 'assigned'
  | 'picked_up'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed'
  | 'cancelled';

export interface DeliveryPartner {
  id: string;
  fullName: string;
  phone: string;
  vehicleType: 'bike' | 'scooter' | 'e_rickshaw' | 'tempo' | 'van';
  vehicleNumber: string;
  isActive: boolean;
  totalDeliveries: number;
  rating: number;
  currentLocality?: string;
  createdAt: string;
}

export interface DeliverySettings {
  mattokartDeliveryEnabled: boolean;
  standardDeliveryFee: number;
  freeDeliveryThreshold: number;
  sellerDeliveryFee: number;
  serviceablePinCodes: string[];
}

export type IdentityVerificationStatus = 'not_started' | 'pending' | 'verified' | 'rejected';

export type IdentityVerificationMethod =
  | 'digilocker_authorized'
  | 'gstin_verified'
  | 'trade_license'
  | 'udyam_msme'
  | 'physical_inspection_saharanpur';

export type SellerType = 'shopkeeper' | 'wholesaler' | 'manufacturer' | 'artisan' | 'individual';

export interface AuthUser {
  id: string;
  phone: string;
  fullName?: string;
  email?: string;
  role: UserRole;
  sellerId?: string;
  token?: string;
}

export interface Seller {
  id: string;
  ownerName: string;
  shopName: string;
  sellerType?: SellerType;
  phone: string;
  email: string;
  address: string;
  locality: string;
  district?: string;
  city: string;
  state?: string;
  pinCode: string;
  landmark?: string;
  categories: CategoryId[];
  gstNumber?: string;
  rating: number;
  reviewsCount: number;
  joinedDate: string;
  status: 'active' | 'pending_approval' | 'suspended';
  registrationFeeStatus: 'free_first_year' | 'paid_pending_gateway' | 'verified' | 'unpaid' | 'demo_waived';
  proposedFee: number; // 0 (Free First Year - No registration or listing fee)
  bannerImage?: string;
  shopLogo?: string;
  description: string;
  deliveryRadiusKm: number;
  shipsPanIndia?: boolean;
  // Identity Verification (All India Vendor KYC)
  identityVerificationStatus: IdentityVerificationStatus;
  identityVerificationMethod?: IdentityVerificationMethod;
  verificationReferenceId?: string; // DigiLocker ref, GSTIN, Udyam, or Trade license (NEVER raw Aadhaar!)
  verificationRejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  adminNotes?: string;
  initialProduct?: {
    name: string;
    price: number;
    unit: UnitType;
    description: string;
    imageUrl?: string;
    stockCount?: number;
  };
}

export interface VerificationAuditLog {
  id: string;
  sellerId: string;
  shopName: string;
  previousStatus: string;
  newStatus: string;
  action: 'submit' | 'approve' | 'reject' | 'suspend' | 'request_inspection';
  performedBy: string;
  timestamp: string;
  notes?: string;
}

export interface BuyerEnquiry {
  id: string;
  productId: string;
  productName: string;
  productPrice: number;
  productImage: string;
  sellerId: string;
  sellerShopName: string;
  sellerPhone: string;
  buyerName: string;
  buyerPhone: string;
  buyerLocality: string;
  quantityNeeded: number;
  unit: UnitType;
  message: string;
  status: 'pending' | 'seller_contacted' | 'resolved' | 'cancelled';
  createdAt: string;
}

export interface SaharanpurLocality {
  name: string;
  pinCode: string;
  city?: string;
  district?: string;
  state?: string;
  areaType: 'Urban Market' | 'Commercial Hub' | 'Industrial Zone' | 'Sub-division / Tehsil' | 'Pan-India City';
}

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  selectedUnit: UnitType;
}

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'payment_confirmed'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'return_requested'
  | 'refunded';

export type PaymentMethod = 'cod' | 'pay_on_delivery' | 'upi_on_delivery' | 'offline_direct';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface OrderTrackingEvent {
  id: string;
  orderId: string;
  sellerOrderId?: string;
  status: OrderStatus;
  title: string;
  description?: string;
  location?: string;
  actorRole: 'customer' | 'seller' | 'admin' | 'courier' | 'system';
  createdAt: string;
}

export interface SellerSubOrder {
  id: string;
  orderId: string;
  subOrderNumber: string;
  sellerId: string;
  sellerShopName: string;
  sellerCity?: string;
  sellerState?: string;
  sellerPinCode?: string;
  subtotal: number;
  shippingFee: number;
  codFee: number;
  totalAmount: number;
  deliveryMode: DeliveryType;
  deliveryStatus: DeliveryStatus;
  orderStatus: OrderStatus;
  courierName?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  notes?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  sellerId: string;
  sellerShopName?: string;
  productName: string;
  productImage: string;
  unitPrice: number;
  quantity: number;
  unit: UnitType;
  totalPrice: number;
  itemStatus: 'pending' | 'confirmed' | 'ready_for_pickup' | 'packed' | 'shipped' | 'delivered' | 'cancelled' | 'return_requested' | 'refunded';
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: string;
  landmark?: string;
  locality: string;
  district?: string;
  city: string;
  state?: string;
  pinCode: string;
  subtotalAmount?: number;
  codFee?: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  notes?: string;
  items: OrderItem[];
  sellerOrders?: SellerSubOrder[];
  trackingEvents?: OrderTrackingEvent[];
  // Dual & Pan-India Delivery System Fields
  deliveryType?: DeliveryType;
  shippingZone?: ShippingZone;
  courierPartner?: string;
  trackingNumber?: string;
  estimatedDeliveryWindow?: string;
  deliveryFee?: number;
  deliveryPartnerId?: string;
  deliveryPartnerName?: string;
  deliveryPartnerPhone?: string;
  deliveryPartnerVehicle?: string;
  deliveryStatus?: DeliveryStatus;
  deliveryFailureReason?: string;
  deliveryAttemptCount?: number;
  deliveryNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ProductReview {
  id: string;
  productId: string;
  userName: string;
  rating: number; // 1 to 5
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  locality?: string;
  createdAt: string;
  status?: 'pending' | 'approved' | 'rejected';
}

export interface SavedAddress {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  addressLine: string;
  landmark?: string;
  locality: string;
  district?: string;
  city: string;
  state: string;
  pinCode: string;
  isDefault?: boolean;
  tag?: 'Home' | 'Work' | 'Shop';
}

export type ActiveTab =
  | 'home'
  | 'catalog'
  | 'shops'
  | 'enquiries'
  | 'cart'
  | 'checkout'
  | 'orders'
  | 'wishlist'
  | 'account'
  | 'delivery-portal'
  | 'seller-register'
  | 'seller-dashboard'
  | 'admin-dashboard'
  | 'legal';

export type LegalDocType =
  | 'about'
  | 'contact'
  | 'privacy'
  | 'terms'
  | 'seller-agreement'
  | 'returns-refunds';
