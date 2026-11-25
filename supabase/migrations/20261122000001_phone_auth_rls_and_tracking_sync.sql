-- ============================================================================
-- Migration: 20261122000001_phone_auth_rls_and_tracking_sync.sql
-- Purpose:
--   1. Support Phone-OTP authenticated users in public.profiles cleanly without
--      overwriting existing roles or deleting existing records.
--   2. Allow sellers to insert tracking events into public.shipment_tracking
--      for orders they fulfill even when seller_order_id is null or set.
--   3. Index public.sellers(phone) for fast seller account matching on login.
--
-- SAFETY: Additive migration ONLY. Never drops tables or deletes rows.
-- ============================================================================

-- 1. Fast phone lookup index for existing sellers (non-destructive)
CREATE INDEX IF NOT EXISTS idx_sellers_phone ON public.sellers(phone);

-- 2. Trigger helper: automatically provision a safe customer/seller profile
--    when a new user signs up via Supabase Phone Auth (without altering existing rows).
CREATE OR REPLACE FUNCTION public.handle_new_phone_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  safe_email TEXT;
  requested_role TEXT;
  phone_digits TEXT;
BEGIN
  phone_digits := regexp_replace(COALESCE(NEW.phone, ''), '\D', '', 'g');
  IF length(phone_digits) > 10 THEN
    phone_digits := right(phone_digits, 10);
  END IF;

  safe_email := COALESCE(
    NULLIF(trim(NEW.email), ''),
    CASE
      WHEN phone_digits <> '' THEN phone_digits || '@phone.mattokart.in'
      ELSE NEW.id::text || '@phone.mattokart.in'
    END
  );

  requested_role := CASE
    WHEN COALESCE(NEW.raw_user_meta_data->>'role', '') = 'seller' THEN 'seller'
    ELSE 'customer'
  END;

  INSERT INTO public.profiles (id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    safe_email,
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'full_name', '')), ''),
    NULLIF(trim(COALESCE(NEW.phone, '')), ''),
    requested_role
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_mattokart ON auth.users;
CREATE TRIGGER on_auth_user_created_mattokart
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_phone_auth_user();

-- 3. Strengthen shipment_tracking INSERT policy so sellers who fulfill an
--    order (via seller_orders OR order_items) can log 10-stage tracking events
--    without being blocked when seller_order_id is omitted.
DROP POLICY IF EXISTS "shipment_tracking_insert_party" ON public.shipment_tracking;
CREATE POLICY "shipment_tracking_insert_party" ON public.shipment_tracking
  FOR INSERT WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.seller_orders so
      WHERE so.order_id = shipment_tracking.order_id
        AND so.seller_id = public.get_current_seller_id()
    )
    OR EXISTS (
      SELECT 1 FROM public.order_items oi
      WHERE oi.order_id = shipment_tracking.order_id
        AND oi.seller_id = public.get_current_seller_id()
    )
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = shipment_tracking.order_id
        AND (
          o.customer_id = auth.uid()
          OR (o.customer_id IS NULL AND shipment_tracking.status = 'placed')
        )
    )
  );

-- 4. Allow involved sellers (via seller_orders or order_items) to view all
--    shipment_tracking rows for their orders cleanly.
DROP POLICY IF EXISTS "shipment_tracking_select_party" ON public.shipment_tracking;
CREATE POLICY "shipment_tracking_select_party" ON public.shipment_tracking
  FOR SELECT USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = shipment_tracking.order_id
        AND o.customer_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.seller_orders so
      WHERE so.order_id = shipment_tracking.order_id
        AND so.seller_id = public.get_current_seller_id()
    )
    OR EXISTS (
      SELECT 1 FROM public.order_items oi
      WHERE oi.order_id = shipment_tracking.order_id
        AND oi.seller_id = public.get_current_seller_id()
    )
  );

-- 5. Allow authenticated customers to cancel pre-dispatch orders or request
--    returns on delivered orders under strict RLS boundaries.
DROP POLICY IF EXISTS "orders_update_customer_cancel_return" ON public.orders;
CREATE POLICY "orders_update_customer_cancel_return" ON public.orders
  FOR UPDATE
  USING (
    auth.uid() = customer_id
    AND order_status IN ('placed', 'payment_confirmed', 'confirmed', 'processing', 'delivered')
  )
  WITH CHECK (
    auth.uid() = customer_id
    AND order_status IN ('cancelled', 'return_requested')
  );

DROP POLICY IF EXISTS "seller_orders_update_customer_cancel_return" ON public.seller_orders;
CREATE POLICY "seller_orders_update_customer_cancel_return" ON public.seller_orders
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = seller_orders.order_id
        AND o.customer_id = auth.uid()
    )
  )
  WITH CHECK (
    order_status IN ('cancelled', 'return_requested')
    AND EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = seller_orders.order_id
        AND o.customer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "order_items_update_customer_cancel" ON public.order_items;
CREATE POLICY "order_items_update_customer_cancel" ON public.order_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.customer_id = auth.uid()
    )
  )
  WITH CHECK (
    item_status = 'cancelled'
    AND EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.customer_id = auth.uid()
    )
  );

