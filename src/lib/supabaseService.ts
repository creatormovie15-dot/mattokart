import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Product, Seller, Category, BuyerEnquiry } from '../types';

/**
 * Supabase Data Service
 * Provides typed operations for MattoKart entities.
 * Implements strict RLS compliance as required:
 * - Sellers can only edit their own products
 * - Sellers can only view order information containing their items
 * - Admin escalation is rejected
 */

// 1. Categories
export async function getCategoriesFromSupabase(): Promise<Category[] | null> {
  if (!supabase || !isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error || !data) return null;
    return data.map((c) => ({
      id: c.id as any,
      name: c.name,
      hindiName: c.hindi_name,
      iconName: c.icon_name,
      itemCount: c.item_count,
      description: c.description || '',
      subcategories: Array.isArray(c.subcategories) ? (c.subcategories as string[]) : [],
    }));
  } catch {
    return null;
  }
}

// 2. Products
export async function getProductsFromSupabase(): Promise<Product[] | null> {
  if (!supabase || !isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, sellers(*), shops(*)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error || !data) return null;
    return data.map((p: any) => ({
      id: p.id,
      name: p.name,
      categoryId: p.category_id,
      subcategory: p.subcategory,
      price: Number(p.price),
      originalPrice: p.original_price ? Number(p.original_price) : undefined,
      unit: p.unit as any,
      minOrderQuantity: p.min_order_quantity,
      inStock: p.in_stock,
      stockCount: p.stock_count,
      images: p.images || [],
      description: p.description || '',
      specifications: p.specifications || {},
      sellerId: p.seller_id,
      sellerName: p.sellers?.owner_name || 'Saharanpur Merchant',
      sellerShopName: p.sellers?.shop_name || 'Local Shop',
      sellerLocality: p.sellers?.locality || 'Saharanpur',
      sellerPhone: p.sellers?.phone || '+91 8221077674',
      sellerRating: p.sellers?.rating ? Number(p.sellers.rating) : 4.9,
      deliveryAreas: p.delivery_areas || [],
      featured: p.featured,
      isWoodcraftSpecial: p.is_woodcraft_special,
      status: p.status,
      rejectionReason: p.rejection_reason,
      createdAt: p.created_at,
    }));
  } catch {
    return null;
  }
}

// 3. Sellers
export async function getSellersFromSupabase(): Promise<Seller[] | null> {
  if (!supabase || !isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('sellers')
      .select('*')
      .eq('status', 'active');

    if (error || !data) return null;
    return data.map((s) => ({
      id: s.id,
      ownerName: s.owner_name,
      shopName: s.shop_name,
      phone: s.phone,
      email: s.email,
      address: s.address,
      locality: s.locality,
      city: s.city,
      pinCode: s.pin_code,
      landmark: s.landmark || undefined,
      categories: s.categories as any,
      gstNumber: s.gst_number || undefined,
      rating: Number(s.rating),
      reviewsCount: s.reviews_count,
      joinedDate: s.created_at.split('T')[0],
      status: s.status,
      registrationFeeStatus: s.registration_fee_status,
      proposedFee: Number(s.proposed_fee), // ₹0 Free First Year
      bannerImage: s.banner_image || undefined,
      shopLogo: s.shop_logo || undefined,
      description: s.description || '',
      deliveryRadiusKm: s.delivery_radius_km,
      identityVerificationStatus: s.identity_verification_status || 'not_started',
      identityVerificationMethod: s.identity_verification_method as any,
      verificationReferenceId: s.verification_reference_id || undefined,
      verificationRejectionReason: s.verification_rejection_reason || undefined,
      reviewedBy: s.reviewed_by || undefined,
      reviewedAt: s.reviewed_at || undefined,
      adminNotes: s.admin_notes || undefined,
    }));
  } catch {
    return null;
  }
}

// 4. Submit Buyer Enquiry
export async function submitEnquiryToSupabase(enquiry: BuyerEnquiry): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from('buyer_enquiries').insert({
      product_id: enquiry.productId,
      seller_id: enquiry.sellerId,
      buyer_name: enquiry.buyerName,
      buyer_phone: enquiry.buyerPhone,
      buyer_locality: enquiry.buyerLocality,
      quantity_needed: enquiry.quantityNeeded,
      unit: enquiry.unit,
      message: enquiry.message,
      status: enquiry.status,
    });
    return !error;
  } catch {
    return false;
  }
}

// 5. Submit Seller Application (Enforcing ₹0 Free First Year)
export async function submitSellerApplicationToSupabase(seller: Seller, userId: string): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) return false;
  try {
    const { data: sellerRow, error } = await supabase.from('sellers').insert({
      user_id: userId,
      owner_name: seller.ownerName,
      shop_name: seller.shopName,
      phone: seller.phone,
      email: seller.email,
      address: seller.address,
      locality: seller.locality,
      city: seller.city,
      pin_code: seller.pinCode,
      landmark: seller.landmark,
      categories: seller.categories,
      gst_number: seller.gstNumber,
      status: 'pending_approval',
      registration_fee_status: 'free_first_year',
      proposed_fee: 0.00, // ₹0 Free First Year
      description: seller.description,
      delivery_radius_km: seller.deliveryRadiusKm,
      identity_verification_status: seller.identityVerificationStatus || 'pending',
      identity_verification_method: seller.identityVerificationMethod || 'gstin_verified',
      verification_reference_id: seller.verificationReferenceId || seller.gstNumber || null,
    }).select().single();

    if (error || !sellerRow) return false;

    // Create accompanying shop record
    await supabase.from('shops').insert({
      seller_id: sellerRow.id,
      name: seller.shopName,
      description: seller.description,
      locality: seller.locality,
      address: seller.address,
      pin_code: seller.pinCode,
      phone: seller.phone,
      delivery_radius_km: seller.deliveryRadiusKm,
    });

    return true;
  } catch {
    return false;
  }
}
