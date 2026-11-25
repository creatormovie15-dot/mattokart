import { supabase, isSupabaseConfigured } from './supabaseClient';
import {
  Product,
  Seller,
  Category,
  BuyerEnquiry,
  Order,
  OrderItem,
  OrderStatus,
  DeliveryPartner,
  DeliverySettings,
  DeliveryStatus,
  DeliveryType,
  CartItem,
  SavedAddress,
  SellerSubOrder,
  OrderTrackingEvent,
} from '../types';

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
      sellerName: p.sellers?.owner_name || 'Verified Seller',
      sellerShopName: p.sellers?.shop_name || 'MattoKart Store',
      sellerLocality: p.sellers?.locality || 'India',
      sellerCity: p.seller_city || p.sellers?.city || 'Saharanpur',
      sellerState: p.seller_state || p.sellers?.state || 'Uttar Pradesh',
      sellerPinCode: p.seller_pin_code || p.sellers?.pin_code || '247001',
      sellerPhone: p.sellers?.phone || '+91 8221077674',
      sellerRating: p.sellers?.rating ? Number(p.sellers.rating) : 4.9,
      deliveryAreas: p.delivery_areas || [],
      shippingScope: p.shipping_scope || undefined,
      condition: p.condition || undefined,
      estimatedWeightKg: p.estimated_weight_kg ? Number(p.estimated_weight_kg) : undefined,
      dimensionsCm:
        p.length_cm || p.breadth_cm || p.height_cm
          ? {
              length: Number(p.length_cm || 0),
              breadth: Number(p.breadth_cm || 0),
              height: Number(p.height_cm || 0),
            }
          : undefined,
      deliveryMode: p.delivery_mode || undefined,
      sellerDeliveryFee: typeof p.seller_delivery_fee === 'number' ? Number(p.seller_delivery_fee) : undefined,
      localDeliveryAvailable: typeof p.local_delivery_available === 'boolean' ? p.local_delivery_available : undefined,
      codAvailable: typeof p.cod_available === 'boolean' ? p.cod_available : undefined,
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
    return data.map((s: any) => ({
      id: s.id,
      ownerName: s.owner_name,
      shopName: s.shop_name,
      sellerType: s.seller_type || undefined,
      phone: s.phone,
      email: s.email,
      address: s.address,
      locality: s.locality,
      district: s.district || s.city,
      city: s.city,
      state: s.state || 'Uttar Pradesh',
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
      shipsPanIndia: typeof s.ships_pan_india === 'boolean' ? s.ships_pan_india : undefined,
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

// Helper to check for valid UUID format
export const isValidUuid = (str: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
};

// 4. Submit Buyer Enquiry
export async function submitEnquiryToSupabase(enquiry: BuyerEnquiry): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from('buyer_enquiries').insert({
      product_id: isValidUuid(enquiry.productId) ? enquiry.productId : null,
      seller_id: isValidUuid(enquiry.sellerId) ? enquiry.sellerId : null,
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
export async function submitSellerApplicationToSupabase(seller: Seller, userId?: string): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) return false;
  try {
    const sellerPayload: any = {
      owner_name: seller.ownerName,
      shop_name: seller.shopName,
      phone: seller.phone,
      email: seller.email,
      address: seller.address,
      locality: seller.locality,
      city: seller.city,
      pin_code: seller.pinCode,
      landmark: seller.landmark || null,
      categories: seller.categories,
      gst_number: seller.gstNumber || null,
      status: 'pending_approval',
      registration_fee_status: 'free_first_year',
      proposed_fee: 0.00, // ₹0 Free First Year
      description: seller.description,
      delivery_radius_km: seller.deliveryRadiusKm,
      identity_verification_status: seller.identityVerificationStatus || 'pending',
      identity_verification_method: seller.identityVerificationMethod || 'gstin_verified',
      verification_reference_id: seller.verificationReferenceId || seller.gstNumber || null,
    };

    if (userId && isValidUuid(userId)) {
      sellerPayload.user_id = userId;
    }
    if (seller.id && isValidUuid(seller.id)) {
      sellerPayload.id = seller.id;
    }

    const { data: sellerRow, error } = await supabase.from('sellers').insert(sellerPayload).select().single();

    if (error || !sellerRow) {
      console.warn('[Supabase] Seller insert failed:', error?.message);
      return false;
    }

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

// 6. Save or Insert Product to Supabase
export async function saveProductToSupabase(product: Product): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!supabase || !isSupabaseConfigured) {
    return { success: false, error: 'Supabase is not configured' };
  }
  try {
    const payload: any = {
      name: product.name,
      category_id: product.categoryId,
      subcategory: product.subcategory,
      price: product.price,
      original_price: product.originalPrice || null,
      unit: product.unit,
      min_order_quantity: product.minOrderQuantity || 1,
      in_stock: product.inStock,
      stock_count: product.stockCount,
      images: product.images,
      description: product.description,
      specifications: product.specifications || {},
      delivery_areas: product.deliveryAreas || [],
      featured: Boolean(product.featured),
      is_woodcraft_special: Boolean(product.isWoodcraftSpecial),
      status: product.status || 'pending',
    };

    if (product.id && isValidUuid(product.id)) {
      payload.id = product.id;
    }
    if (product.sellerId && isValidUuid(product.sellerId)) {
      payload.seller_id = product.sellerId;
    }

    const { data, error } = await supabase.from('products').insert(payload).select().single();
    if (error) {
      console.warn('[Supabase] Failed to save product:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, id: data?.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 7. Update Product in Supabase
export async function updateProductInSupabase(product: Product): Promise<{ success: boolean; error?: string }> {
  if (!supabase || !isSupabaseConfigured) {
    return { success: false, error: 'Supabase is not configured' };
  }
  if (!isValidUuid(product.id)) {
    return { success: false, error: 'Local product ID is not a database UUID' };
  }
  try {
    const { error } = await supabase
      .from('products')
      .update({
        name: product.name,
        category_id: product.categoryId,
        subcategory: product.subcategory,
        price: product.price,
        original_price: product.originalPrice || null,
        unit: product.unit,
        in_stock: product.inStock,
        stock_count: product.stockCount,
        images: product.images,
        description: product.description,
        delivery_areas: product.deliveryAreas,
        is_woodcraft_special: product.isWoodcraftSpecial,
        status: product.status,
      })
      .eq('id', product.id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 8. Delete Product from Supabase
export async function deleteProductFromSupabase(productId: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase || !isSupabaseConfigured) {
    return { success: false, error: 'Supabase is not configured' };
  }
  if (!isValidUuid(productId)) return { success: false };
  try {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 9. Moderate Product Status in Supabase (Admin)
export async function updateProductStatusInSupabase(
  productId: string,
  status: 'approved' | 'pending' | 'rejected',
  rejectionReason?: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase || !isSupabaseConfigured) return { success: false };
  if (!isValidUuid(productId)) return { success: false };
  try {
    const { error } = await supabase
      .from('products')
      .update({
        status,
        rejection_reason: rejectionReason || null,
      })
      .eq('id', productId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 10. Update Seller Status in Supabase (Admin)
export async function updateSellerStatusInSupabase(
  sellerId: string,
  status: 'active' | 'pending_approval' | 'suspended',
  verificationStatus?: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase || !isSupabaseConfigured) return { success: false };
  if (!isValidUuid(sellerId)) return { success: false };
  try {
    const updatePayload: any = { status };
    if (verificationStatus) {
      updatePayload.identity_verification_status = verificationStatus;
    }
    const { error } = await supabase
      .from('sellers')
      .update(updatePayload)
      .eq('id', sellerId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 11. Create Order in Supabase (with Multi-Vendor seller_orders & shipment_tracking)
export async function createOrderInSupabase(
  order: Order
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!supabase || !isSupabaseConfigured) {
    return { success: false, error: 'Supabase is not configured' };
  }
  try {
    const panIndiaMeta = [
      order.city && order.state ? `Destination: ${order.city}, ${order.state}` : '',
      order.shippingZone ? `Zone: ${order.shippingZone}` : '',
      order.courierPartner ? `Courier: ${order.courierPartner}` : '',
      order.estimatedDeliveryWindow ? `ETA: ${order.estimatedDeliveryWindow}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    const combinedDeliveryNotes = [order.deliveryNotes, panIndiaMeta].filter(Boolean).join(' — ');

    const baseOrderPayload: any = {
      order_number: order.orderNumber,
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      customer_email: order.customerEmail || null,
      delivery_address: order.deliveryAddress,
      locality: order.locality,
      pin_code: order.pinCode,
      total_amount: order.totalAmount,
      payment_method: order.paymentMethod || 'cod',
      payment_status: order.paymentStatus || 'pending',
      order_status: order.orderStatus || 'placed',
      delivery_type:
        order.deliveryType === 'interstate_courier' || order.deliveryType === 'seller_transport'
          ? 'seller_delivery'
          : order.deliveryType || 'seller_delivery',
      delivery_fee: order.deliveryFee || 0,
      delivery_status: order.deliveryStatus || 'pending',
      delivery_notes: combinedDeliveryNotes || null,
      notes: order.notes || null,
    };

    if (order.id && isValidUuid(order.id)) {
      baseOrderPayload.id = order.id;
    }
    if (order.customerId && isValidUuid(order.customerId)) {
      baseOrderPayload.customer_id = order.customerId;
    }
    if (order.deliveryPartnerId && isValidUuid(order.deliveryPartnerId)) {
      baseOrderPayload.delivery_partner_id = order.deliveryPartnerId;
      baseOrderPayload.delivery_partner_name = order.deliveryPartnerName;
      baseOrderPayload.delivery_partner_phone = order.deliveryPartnerPhone;
      baseOrderPayload.delivery_partner_vehicle = order.deliveryPartnerVehicle;
    }

    const stageBOrderPayload: any = {
      ...baseOrderPayload,
      landmark: order.landmark || null,
      district: order.district || order.city || null,
      city: order.city || 'Saharanpur',
      state: order.state || 'Uttar Pradesh',
      subtotal_amount: order.subtotalAmount ?? null,
      cod_fee: order.codFee ?? 0,
      shipping_zone: order.shippingZone || null,
      courier_partner: order.courierPartner || null,
      estimated_delivery_window: order.estimatedDeliveryWindow || null,
      seller_count: order.sellerOrders?.length || 1,
    };

    let { data: orderRow, error: orderError } = await supabase
      .from('orders')
      .insert(stageBOrderPayload)
      .select()
      .single();

    // Graceful fallback if Stage B SQL migration columns aren't applied yet
    if (orderError && (orderError.code === 'PGRST204' || orderError.code === '42703')) {
      const retry = await supabase.from('orders').insert(baseOrderPayload).select().single();
      orderRow = retry.data;
      orderError = retry.error;
    }

    if (orderError || !orderRow) {
      console.warn('[Supabase] Failed to create order:', orderError?.message);
      return { success: false, error: orderError?.message };
    }

    // Insert order items
    if (order.items && order.items.length > 0) {
      const itemsPayload = order.items.map((item) => ({
        order_id: orderRow.id,
        product_id: isValidUuid(item.productId) ? item.productId : null,
        seller_id: isValidUuid(item.sellerId) ? item.sellerId : '00000000-0000-0000-0000-000000000000',
        product_name: item.productName,
        product_image: item.productImage || null,
        unit_price: item.unitPrice,
        quantity: item.quantity,
        unit: item.unit || 'piece',
        total_price: item.totalPrice,
        item_status: item.itemStatus || 'pending',
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(itemsPayload);
      if (itemsError) {
        console.warn('[Supabase] Failed to insert order items:', itemsError.message);
      }
    }

    // Best-effort insert into seller_orders & shipment_tracking (Stage B migration tables)
    let insertedSubOrders: Array<{ id: string; seller_id: string }> = [];
    if (order.sellerOrders && order.sellerOrders.length > 0) {
      try {
        const subPayloads = order.sellerOrders
          .filter((so) => isValidUuid(so.sellerId))
          .map((so) => ({
            order_id: orderRow.id,
            sub_order_number: so.subOrderNumber,
            seller_id: so.sellerId,
            seller_shop_name: so.sellerShopName,
            subtotal: so.subtotal,
            shipping_fee: so.shippingFee,
            cod_fee: so.codFee,
            total_amount: so.totalAmount,
            delivery_mode: so.deliveryMode,
            delivery_status: so.deliveryStatus,
            order_status: so.orderStatus,
            courier_name: so.courierName || null,
            tracking_number: so.trackingNumber || null,
            estimated_delivery: so.estimatedDelivery || null,
          }));

        if (subPayloads.length > 0) {
          const { data: soRows } = await supabase
            .from('seller_orders')
            .insert(subPayloads)
            .select('id, seller_id');
          if (Array.isArray(soRows)) {
            insertedSubOrders = soRows;
          }
        }
      } catch {
        // Safe fallback if Stage B SQL migration has not yet been applied
      }
    }

    if (order.trackingEvents && order.trackingEvents.length > 0) {
      try {
        const defaultSubOrderId = insertedSubOrders.length === 1 ? insertedSubOrders[0].id : null;
        const trackingPayloads = order.trackingEvents.map((ev) => ({
          order_id: orderRow.id,
          seller_order_id: defaultSubOrderId,
          status: ev.status,
          title: ev.title,
          description: ev.description || null,
          location: ev.location || null,
          actor_role: ev.actorRole || 'system',
        }));
        await supabase.from('shipment_tracking').insert(trackingPayloads);
      } catch {
        // Safe fallback if Stage B SQL migration has not yet been applied
      }
    }

    return { success: true, id: orderRow.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 12. Get Orders from Supabase (Supports Stage B seller_orders + shipment_tracking & filtering)
export async function getOrdersFromSupabase(
  customerId?: string,
  sellerId?: string
): Promise<Order[] | null> {
  if (!supabase || !isSupabaseConfigured) return null;
  try {
    let query = supabase
      .from('orders')
      .select('*, order_items(*), seller_orders(*), shipment_tracking(*)')
      .order('created_at', { ascending: false });

    if (customerId && isValidUuid(customerId)) {
      query = query.eq('customer_id', customerId);
    }

    let { data, error } = await query;

    // Fallback cleanly if Stage B tables/relations haven't been created yet
    if (error && (error.code === 'PGRST200' || error.code === '42P01')) {
      let fallbackQuery = supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });
      if (customerId && isValidUuid(customerId)) {
        fallbackQuery = fallbackQuery.eq('customer_id', customerId);
      }
      const fallbackRes = await fallbackQuery;
      data = fallbackRes.data;
      error = fallbackRes.error;
    }

    if (error || !data) return null;

    let orders: Order[] = data.map((o: any) => {
      const mappedItems: OrderItem[] = Array.isArray(o.order_items)
        ? o.order_items.map((oi: any) => ({
            id: oi.id,
            orderId: oi.order_id,
            productId: oi.product_id || '',
            sellerId: oi.seller_id,
            productName: oi.product_name,
            productImage: oi.product_image || '',
            unitPrice: Number(oi.unit_price),
            quantity: oi.quantity,
            unit: oi.unit as any,
            totalPrice: Number(oi.total_price),
            itemStatus: oi.item_status as any,
            createdAt: oi.created_at,
          }))
        : [];

      const mappedSellerOrders: SellerSubOrder[] | undefined = Array.isArray(o.seller_orders)
        ? o.seller_orders.map((so: any) => ({
            id: so.id,
            subOrderNumber: so.sub_order_number,
            orderId: so.order_id,
            sellerId: so.seller_id,
            sellerShopName: so.seller_shop_name,
            subtotal: Number(so.subtotal) || 0,
            shippingFee: Number(so.shipping_fee) || 0,
            codFee: Number(so.cod_fee) || 0,
            totalAmount: Number(so.total_amount) || 0,
            deliveryMode: so.delivery_mode as DeliveryType,
            deliveryStatus: (so.delivery_status as DeliveryStatus) || 'pending',
            orderStatus: (so.order_status as OrderStatus) || (o.order_status as OrderStatus),
            courierName: so.courier_name || undefined,
            trackingNumber: so.tracking_number || undefined,
            estimatedDelivery: so.estimated_delivery || undefined,
            items: mappedItems.filter((it) => it.sellerId === so.seller_id),
            createdAt: so.created_at,
          }))
        : undefined;

      const mappedTracking: OrderTrackingEvent[] | undefined = Array.isArray(o.shipment_tracking)
        ? [...o.shipment_tracking]
            .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            .map((ev: any) => ({
              id: ev.id,
              orderId: ev.order_id,
              status: ev.status as OrderStatus,
              title: ev.title,
              description: ev.description || undefined,
              location: ev.location || undefined,
              actorRole: ev.actor_role || 'system',
              createdAt: ev.created_at,
            }))
        : undefined;

      return {
        id: o.id,
        orderNumber: o.order_number,
        customerId: o.customer_id || undefined,
        customerName: o.customer_name,
        customerPhone: o.customer_phone,
        customerEmail: o.customer_email || undefined,
        deliveryAddress: o.delivery_address,
        landmark: o.landmark || undefined,
        locality: o.locality,
        district: o.district || o.city || undefined,
        city: o.city || 'Saharanpur',
        state: o.state || 'Uttar Pradesh',
        pinCode: o.pin_code,
        subtotalAmount: o.subtotal_amount != null ? Number(o.subtotal_amount) : undefined,
        codFee: o.cod_fee != null ? Number(o.cod_fee) : undefined,
        totalAmount: Number(o.total_amount),
        paymentMethod: o.payment_method as any,
        paymentStatus: o.payment_status as any,
        orderStatus: o.order_status as any,
        deliveryType: (o.delivery_type as DeliveryType) || 'seller_delivery',
        deliveryFee: Number(o.delivery_fee) || 0,
        shippingZone: o.shipping_zone || undefined,
        courierPartner: o.courier_partner || undefined,
        trackingNumber: o.tracking_number || undefined,
        estimatedDeliveryWindow: o.estimated_delivery_window || undefined,
        deliveryPartnerId: o.delivery_partner_id || undefined,
        deliveryPartnerName: o.delivery_partner_name || undefined,
        deliveryPartnerPhone: o.delivery_partner_phone || undefined,
        deliveryPartnerVehicle: o.delivery_partner_vehicle || undefined,
        deliveryStatus: (o.delivery_status as DeliveryStatus) || 'pending',
        deliveryFailureReason: o.delivery_failure_reason || undefined,
        deliveryAttemptCount: o.delivery_attempt_count || 0,
        deliveryNotes: o.delivery_notes || undefined,
        notes: o.notes || undefined,
        items: mappedItems,
        sellerOrders: mappedSellerOrders && mappedSellerOrders.length > 0 ? mappedSellerOrders : undefined,
        trackingEvents: mappedTracking && mappedTracking.length > 0 ? mappedTracking : undefined,
        createdAt: o.created_at,
        updatedAt: o.updated_at,
      };
    });

    // If sellerId filter is provided, filter orders to only those with items from this seller
    if (sellerId) {
      orders = orders
        .map((order) => ({
          ...order,
          items: order.items.filter((item) => item.sellerId === sellerId),
          sellerOrders: order.sellerOrders?.filter((so) => so.sellerId === sellerId),
        }))
        .filter((order) => order.items.length > 0);
    }

    return orders;
  } catch {
    return null;
  }
}

// 13. Update Order Status in Supabase (Syncs orders, seller_orders, order_items, and shipment_tracking)
export async function updateOrderStatusInSupabase(
  orderId: string,
  status: OrderStatus,
  notes?: string,
  extras?: {
    sellerId?: string;
    courierName?: string;
    trackingNumber?: string;
    actorRole?: 'customer' | 'seller' | 'admin' | 'system';
    location?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  if (!supabase || !isSupabaseConfigured) return { success: false };
  if (!isValidUuid(orderId)) return { success: false };
  try {
    const nowIso = new Date().toISOString();
    const basePayload: any = {
      order_status: status,
      updated_at: nowIso,
    };
    if (notes) basePayload.notes = notes;
    if (status === 'delivered') basePayload.payment_status = 'completed';
    if (status === 'refunded') basePayload.payment_status = 'refunded';

    const stageBPayload: any = {
      ...basePayload,
    };
    if (extras?.courierName) stageBPayload.courier_partner = extras.courierName;
    if (extras?.trackingNumber) stageBPayload.tracking_number = extras.trackingNumber;

    let { error } = await supabase.from('orders').update(stageBPayload).eq('id', orderId);
    if (error && (error.code === 'PGRST204' || error.code === '42703')) {
      const retry = await supabase.from('orders').update(basePayload).eq('id', orderId);
      error = retry.error;
    }
    if (error) return { success: false, error: error.message };

    // Sync seller_orders (best-effort if Stage B migration applied)
    try {
      const mappedDeliveryStatus =
        status === 'delivered'
          ? 'delivered'
          : status === 'out_for_delivery'
          ? 'out_for_delivery'
          : status === 'shipped'
          ? 'picked_up'
          : status === 'cancelled'
          ? 'cancelled'
          : undefined;

      const subPayload: any = {
        order_status: status,
        updated_at: nowIso,
      };
      if (mappedDeliveryStatus) subPayload.delivery_status = mappedDeliveryStatus;
      if (extras?.courierName) subPayload.courier_name = extras.courierName;
      if (extras?.trackingNumber) subPayload.tracking_number = extras.trackingNumber;

      let subQuery = supabase.from('seller_orders').update(subPayload).eq('order_id', orderId);
      if (extras?.sellerId && isValidUuid(extras.sellerId)) {
        subQuery = subQuery.eq('seller_id', extras.sellerId);
      }
      await subQuery;
    } catch {
      // Safe fallback if seller_orders does not exist yet
    }

    // Sync order_items item_status across all lifecycle stages
    const mappedItemStatus: OrderItem['itemStatus'] | undefined =
      status === 'cancelled' || status === 'refunded'
        ? 'cancelled'
        : status === 'delivered'
        ? 'delivered'
        : status === 'shipped' || status === 'out_for_delivery'
        ? 'shipped'
        : status === 'packed'
        ? 'ready_for_pickup'
        : status === 'processing' || status === 'confirmed' || status === 'payment_confirmed'
        ? 'confirmed'
        : undefined;

    if (mappedItemStatus) {
      let itemQuery = supabase
        .from('order_items')
        .update({ item_status: mappedItemStatus })
        .eq('order_id', orderId);
      if (extras?.sellerId && isValidUuid(extras.sellerId)) {
        itemQuery = itemQuery.eq('seller_id', extras.sellerId);
      }
      await itemQuery;
    }

    // Record tracking timeline entry in shipment_tracking (best-effort)
    try {
      const stageTitles: Record<OrderStatus, string> = {
        placed: 'Order Placed',
        payment_confirmed: 'Payment Confirmed',
        confirmed: 'Order Confirmed',
        processing: 'Processing Order',
        packed: 'Packed & Ready for Dispatch',
        shipped: 'Shipped / Dispatched',
        out_for_delivery: 'Out for Delivery',
        delivered: 'Delivered & COD Collected',
        cancelled: 'Order Cancelled',
        return_requested: 'Return Requested',
        refunded: 'Refund Processed',
      };

      await supabase.from('shipment_tracking').insert({
        order_id: orderId,
        status,
        title: stageTitles[status] || status,
        description:
          notes || (extras?.trackingNumber ? `Tracking / LR #: ${extras.trackingNumber}` : null),
        location: extras?.location || null,
        actor_role: extras?.actorRole || (extras?.sellerId ? 'seller' : 'system'),
      });
    } catch {
      // Safe fallback if shipment_tracking does not exist yet
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 14. Delivery Partners Operations
export async function getDeliveryPartnersFromSupabase(): Promise<DeliveryPartner[] | null> {
  if (!supabase || !isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('delivery_partners')
      .select('*')
      .order('full_name');

    if (error || !data) return null;
    return data.map((dp: any) => ({
      id: dp.id,
      fullName: dp.full_name,
      phone: dp.phone,
      vehicleType: dp.vehicle_type,
      vehicleNumber: dp.vehicle_number,
      isActive: dp.is_active,
      totalDeliveries: dp.total_deliveries,
      rating: Number(dp.rating),
      currentLocality: dp.current_locality,
      createdAt: dp.created_at,
    }));
  } catch {
    return null;
  }
}

export async function saveDeliveryPartnerToSupabase(
  partner: DeliveryPartner
): Promise<{ success: boolean; error?: string }> {
  if (!supabase || !isSupabaseConfigured) return { success: false };
  try {
    const { error } = await supabase.from('delivery_partners').insert({
      full_name: partner.fullName,
      phone: partner.phone,
      vehicle_type: partner.vehicleType,
      vehicle_number: partner.vehicleNumber,
      is_active: partner.isActive,
      current_locality: partner.currentLocality || 'Saharanpur Central',
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateDeliveryPartnerInSupabase(
  partner: DeliveryPartner
): Promise<{ success: boolean; error?: string }> {
  if (!supabase || !isSupabaseConfigured) return { success: false };
  if (!isValidUuid(partner.id)) return { success: false };
  try {
    const { error } = await supabase
      .from('delivery_partners')
      .update({
        full_name: partner.fullName,
        phone: partner.phone,
        vehicle_type: partner.vehicleType,
        vehicle_number: partner.vehicleNumber,
        is_active: partner.isActive,
        current_locality: partner.currentLocality,
        updated_at: new Date().toISOString(),
      })
      .eq('id', partner.id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 15. Assign Delivery Partner in Supabase
export async function assignDeliveryPartnerInSupabase(
  orderId: string,
  partner: DeliveryPartner
): Promise<{ success: boolean; error?: string }> {
  if (!supabase || !isSupabaseConfigured) return { success: false };
  if (!isValidUuid(orderId)) return { success: false };
  try {
    const { error } = await supabase
      .from('orders')
      .update({
        delivery_partner_id: isValidUuid(partner.id) ? partner.id : null,
        delivery_partner_name: partner.fullName,
        delivery_partner_phone: partner.phone,
        delivery_partner_vehicle: `${partner.vehicleType.toUpperCase()} (${partner.vehicleNumber})`,
        delivery_status: 'assigned',
        order_status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 16. Update Delivery Status in Supabase
export async function updateDeliveryStatusInSupabase(
  orderId: string,
  deliveryStatus: DeliveryStatus,
  notes?: string,
  failureReason?: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase || !isSupabaseConfigured) return { success: false };
  if (!isValidUuid(orderId)) return { success: false };
  try {
    const payload: any = {
      delivery_status: deliveryStatus,
      updated_at: new Date().toISOString(),
    };

    if (deliveryStatus === 'delivered') {
      payload.order_status = 'delivered';
      payload.payment_status = 'completed';
    } else if (deliveryStatus === 'out_for_delivery') {
      payload.order_status = 'out_for_delivery';
    } else if (deliveryStatus === 'picked_up') {
      payload.order_status = 'processing';
    } else if (deliveryStatus === 'failed') {
      payload.delivery_failure_reason = failureReason || 'Delivery attempt unsuccessful';
      payload.delivery_attempt_count = 1;
    }

    if (notes) payload.delivery_notes = notes;

    const { error } = await supabase.from('orders').update(payload).eq('id', orderId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 17. Customer Address Book Sync (Stage B)
export async function getAddressesFromSupabase(userId?: string): Promise<SavedAddress[] | null> {
  if (!supabase || !isSupabaseConfigured || !userId || !isValidUuid(userId)) return null;
  try {
    const { data, error } = await supabase
      .from('customer_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false });
    if (error || !data) return null;
    return data.map((a: any) => ({
      id: a.id,
      fullName: a.full_name,
      phone: a.phone,
      email: a.email || undefined,
      addressLine: a.address_line,
      landmark: a.landmark || undefined,
      locality: a.locality,
      district: a.district || undefined,
      city: a.city,
      state: a.state,
      pinCode: a.pin_code,
      isDefault: Boolean(a.is_default),
      tag: a.tag || 'Home',
    }));
  } catch {
    return null;
  }
}

export async function saveAddressToSupabase(
  address: SavedAddress,
  userId?: string
): Promise<{ success: boolean; id?: string }> {
  if (!supabase || !isSupabaseConfigured || !userId || !isValidUuid(userId)) {
    return { success: false };
  }
  try {
    const payload: any = {
      user_id: userId,
      customer_phone: address.phone,
      full_name: address.fullName,
      phone: address.phone,
      email: address.email || null,
      address_line: address.addressLine,
      landmark: address.landmark || null,
      locality: address.locality,
      district: address.district || address.city,
      city: address.city,
      state: address.state,
      pin_code: address.pinCode,
      tag: address.tag || 'Home',
      is_default: Boolean(address.isDefault),
      updated_at: new Date().toISOString(),
    };
    if (isValidUuid(address.id)) {
      payload.id = address.id;
    }
    const { data, error } = await supabase
      .from('customer_addresses')
      .upsert(payload)
      .select()
      .single();
    if (error) return { success: false };
    return { success: true, id: data?.id };
  } catch {
    return { success: false };
  }
}

export async function deleteAddressFromSupabase(addressId: string): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured || !isValidUuid(addressId)) return false;
  try {
    const { error } = await supabase.from('customer_addresses').delete().eq('id', addressId);
    return !error;
  } catch {
    return false;
  }
}

// 18. Logged-in Customer Persistent Cart Sync (Stage B)
export async function getCartFromSupabase(userId?: string): Promise<CartItem[] | null> {
  if (!supabase || !isSupabaseConfigured || !userId || !isValidUuid(userId)) return null;
  try {
    const { data: cartRow, error: cartErr } = await supabase
      .from('carts')
      .select('id, cart_items(*)')
      .eq('user_id', userId)
      .maybeSingle();
    if (cartErr || !cartRow || !Array.isArray((cartRow as any).cart_items)) return null;

    return (cartRow as any).cart_items
      .filter((ci: any) => ci.product_snapshot && ci.product_snapshot.id)
      .map((ci: any) => ({
        productId: ci.product_id,
        product: ci.product_snapshot as Product,
        quantity: Number(ci.quantity) || 1,
        selectedUnit: (ci.selected_unit || ci.product_snapshot.unit || 'piece') as any,
      }));
  } catch {
    return null;
  }
}

export async function syncCartToSupabase(
  items: CartItem[],
  userId?: string,
  customerPhone?: string
): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured || !userId || !isValidUuid(userId)) return false;
  try {
    const { data: cartRow, error: upsertErr } = await supabase
      .from('carts')
      .upsert(
        {
          user_id: userId,
          customer_phone: customerPhone || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select('id')
      .single();

    if (upsertErr || !cartRow) return false;

    await supabase.from('cart_items').delete().eq('cart_id', cartRow.id);

    if (items.length > 0) {
      const rows = items.map((it) => ({
        cart_id: cartRow.id,
        product_id: it.productId,
        seller_id: it.product.sellerId || 'seller-1',
        quantity: it.quantity,
        selected_unit: it.selectedUnit || it.product.unit || 'piece',
        unit_price: it.product.price,
        product_snapshot: it.product,
      }));
      await supabase.from('cart_items').insert(rows);
    }
    return true;
  } catch {
    return false;
  }
}


