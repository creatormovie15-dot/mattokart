import { getSupabaseAdminClient } from './otpService';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(val?: string): boolean {
  return Boolean(val && UUID_REGEX.test(val));
}

export async function syncAdminSellerDecisionToSupabase(params: {
  sellerId: string;
  action: 'approve' | 'reject';
  adminNotes?: string;
  reason?: string;
}): Promise<void> {
  const adminClient = getSupabaseAdminClient();
  if (!adminClient || !isUuid(params.sellerId)) return;

  const nowIso = new Date().toISOString();
  if (params.action === 'approve') {
    await adminClient
      .from('sellers')
      .update({
        status: 'active',
        identity_verification_status: 'verified',
        reviewed_by: 'Admin (Saharanpur Trade HQ)',
        reviewed_at: nowIso,
        admin_notes: params.adminNotes || 'Approved by MattoKart administration.',
        updated_at: nowIso,
      })
      .eq('id', params.sellerId);

    await adminClient.from('shops').update({ is_verified: true, updated_at: nowIso }).eq('seller_id', params.sellerId);

    await adminClient.from('verification_audit_logs').insert({
      seller_id: params.sellerId,
      action: 'approve',
      performed_by: 'Admin (Saharanpur Trade HQ)',
      new_status: 'active',
      notes: params.adminNotes || 'Approved by MattoKart administration.',
    });
  } else {
    await adminClient
      .from('sellers')
      .update({
        status: 'pending_approval',
        identity_verification_status: 'rejected',
        verification_rejection_reason: params.reason || 'Incomplete business credentials or address mismatch',
        reviewed_by: 'Admin (Saharanpur Trade HQ)',
        reviewed_at: nowIso,
        updated_at: nowIso,
      })
      .eq('id', params.sellerId);

    await adminClient.from('verification_audit_logs').insert({
      seller_id: params.sellerId,
      action: 'reject',
      performed_by: 'Admin (Saharanpur Trade HQ)',
      new_status: 'rejected',
      notes: params.reason || 'Verification rejected.',
    });
  }
}

export async function syncAdminProductDecisionToSupabase(params: {
  productId: string;
  action: 'approve' | 'reject';
  reason?: string;
}): Promise<void> {
  const adminClient = getSupabaseAdminClient();
  if (!adminClient || !isUuid(params.productId)) return;

  const nowIso = new Date().toISOString();
  await adminClient
    .from('products')
    .update({
      status: params.action === 'approve' ? 'approved' : 'rejected',
      rejection_reason: params.action === 'reject' ? params.reason || 'Rejected by moderator' : null,
      updated_at: nowIso,
    })
    .eq('id', params.productId);
}

export async function syncAdminOrderStatusToSupabase(params: {
  orderId: string;
  status: string;
  sellerId?: string;
  courierName?: string;
  trackingNumber?: string;
  notes?: string;
}): Promise<{ synced: boolean; error?: string }> {
  const adminClient = getSupabaseAdminClient();
  if (!adminClient || !isUuid(params.orderId)) {
    return { synced: false };
  }

  try {
    const nowIso = new Date().toISOString();
    const orderUpdate: Record<string, any> = {
      order_status: params.status,
      updated_at: nowIso,
    };
    if (params.courierName) orderUpdate.courier_partner = params.courierName;
    if (params.trackingNumber) orderUpdate.tracking_number = params.trackingNumber;
    if (params.status === 'delivered') orderUpdate.payment_status = 'completed';
    if (params.status === 'refunded') orderUpdate.payment_status = 'refunded';
    if (params.notes) orderUpdate.notes = params.notes;

    const { error: orderErr } = await adminClient.from('orders').update(orderUpdate).eq('id', params.orderId);
    if (orderErr) {
      return { synced: false, error: orderErr.message };
    }

    const mappedDeliveryStatus =
      params.status === 'delivered'
        ? 'delivered'
        : params.status === 'out_for_delivery'
        ? 'out_for_delivery'
        : params.status === 'shipped'
        ? 'picked_up'
        : params.status === 'cancelled'
        ? 'cancelled'
        : undefined;

    const subUpdate: Record<string, any> = {
      order_status: params.status,
      updated_at: nowIso,
    };
    if (mappedDeliveryStatus) subUpdate.delivery_status = mappedDeliveryStatus;
    if (params.courierName) subUpdate.courier_name = params.courierName;
    if (params.trackingNumber) subUpdate.tracking_number = params.trackingNumber;

    let subQuery = adminClient.from('seller_orders').update(subUpdate).eq('order_id', params.orderId);
    if (params.sellerId && isUuid(params.sellerId)) {
      subQuery = subQuery.eq('seller_id', params.sellerId);
    }
    await subQuery;

    const mappedItemStatus =
      params.status === 'cancelled' || params.status === 'refunded'
        ? 'cancelled'
        : params.status === 'delivered'
        ? 'delivered'
        : params.status === 'shipped' || params.status === 'out_for_delivery'
        ? 'shipped'
        : params.status === 'packed'
        ? 'ready_for_pickup'
        : 'confirmed';

    let itemQuery = adminClient
      .from('order_items')
      .update({ item_status: mappedItemStatus })
      .eq('order_id', params.orderId);
    if (params.sellerId && isUuid(params.sellerId)) {
      itemQuery = itemQuery.eq('seller_id', params.sellerId);
    }
    await itemQuery;

    const titles: Record<string, string> = {
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

    await adminClient.from('shipment_tracking').insert({
      order_id: params.orderId,
      status: params.status,
      title: titles[params.status] || params.status,
      description:
        params.notes || (params.trackingNumber ? `Tracking / LR #: ${params.trackingNumber}` : null),
      actor_role: 'admin',
    });

    return { synced: true };
  } catch (err: any) {
    return { synced: false, error: err?.message };
  }
}
