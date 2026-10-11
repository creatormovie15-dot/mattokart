export type CategoryId =
  | 'construction'
  | 'electronics'
  | 'fashion'
  | 'clothing-fashion'
  | 'home-kitchen'
  | 'furniture'
  | 'tools-hardware'
  | 'grocery-food'
  | 'beauty-care'
  | 'toys-baby'
  | 'agriculture'
  | 'other-permitted';

export interface Category {
  id: CategoryId;
  name: string;
  hindiName: string;
  iconName: string;
  itemCount: number;
  description: string;
  subcategories: string[];
}

export type UnitType = 'piece' | 'kg' | 'bag' | 'quintal' | 'meter' | 'set' | 'box' | 'pair' | 'sq.ft';

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
  sellerPhone: string;
  sellerRating: number;
  deliveryAreas: string[];
  featured?: boolean;
  recentlyAdded?: boolean;
  isWoodcraftSpecial?: boolean;
  status: 'approved' | 'pending' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
}

export type UserRole = 'customer' | 'seller' | 'admin';

export type IdentityVerificationStatus = 'not_started' | 'pending' | 'verified' | 'rejected';

export type IdentityVerificationMethod =
  | 'digilocker_authorized'
  | 'gstin_verified'
  | 'trade_license'
  | 'physical_inspection_saharanpur';

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
  phone: string;
  email: string;
  address: string;
  locality: string;
  city: string;
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
  // Identity Verification (Saharanpur Vendor KYC)
  identityVerificationStatus: IdentityVerificationStatus;
  identityVerificationMethod?: IdentityVerificationMethod;
  verificationReferenceId?: string; // DigiLocker ref, GSTIN, or Municipal license # (NEVER raw Aadhaar!)
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
  areaType: 'Urban Market' | 'Commercial Hub' | 'Industrial Zone' | 'Sub-division / Tehsil';
}

export type ActiveTab =
  | 'home'
  | 'catalog'
  | 'shops'
  | 'enquiries'
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
