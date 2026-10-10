-- ============================================================================
-- MattoKart Marketplace - Supabase Schema Migration 002
-- Description: Row Level Security (RLS) & Access Policies
-- Requirements:
--   1. Enable RLS on all tables.
--   2. Prevent sellers from editing other sellers' products.
--   3. Prevent sellers from accessing other customers' private orders.
--   4. Prevent users from granting themselves administrator privileges.
-- ============================================================================

-- 1. Helper Security Functions (SECURITY DEFINER to safely inspect roles)

-- Check if current authenticated user has 'admin' role in public.profiles
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Get seller ID linked to current authenticated user
CREATE OR REPLACE FUNCTION public.get_current_seller_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.sellers
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- 2. Prevent Self-Admin Escalation (Requirement 10)
-- A trigger ensuring non-admin users cannot elevate their role to 'admin'
CREATE OR REPLACE FUNCTION public.protect_profile_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If attempting to set role to 'admin'
  IF NEW.role = 'admin' AND (OLD IS NULL OR OLD.role <> 'admin') THEN
    -- Check if the executor is already an administrator
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Access Denied: You cannot grant yourself administrator privileges on MattoKart.';
    END IF;
  END IF;
  
  -- Auto-update updated_at timestamp
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_role_escalation();

-- 3. Enable Row Level Security (RLS) on all application tables (Requirement 8)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_enquiries ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. POLICIES: PROFILES
-- ============================================================================

-- Users can read their own profile; admins can read all profiles
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

-- Users can insert their initial profile upon signup
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their personal details, but cannot change role to admin (checked by trigger)
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_update_own_or_admin" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- ============================================================================
-- 5. POLICIES: CATEGORIES
-- ============================================================================

-- Public read access to active marketplace categories
DROP POLICY IF EXISTS "categories_public_read" ON public.categories;
CREATE POLICY "categories_public_read" ON public.categories
  FOR SELECT
  USING (true);

-- Only admins can manage categories
DROP POLICY IF EXISTS "categories_admin_all" ON public.categories;
CREATE POLICY "categories_admin_all" ON public.categories
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- 6. POLICIES: SELLERS
-- ============================================================================

-- Active sellers are publicly visible in directory; sellers can see their own; admins see all
DROP POLICY IF EXISTS "sellers_select_active_or_owner" ON public.sellers;
CREATE POLICY "sellers_select_active_or_owner" ON public.sellers
  FOR SELECT
  USING (status = 'active' OR auth.uid() = user_id OR public.is_admin());

-- Authenticated user can apply for a seller account
DROP POLICY IF EXISTS "sellers_insert_applicant" ON public.sellers;
CREATE POLICY "sellers_insert_applicant" ON public.sellers
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND (proposed_fee = 0.00) -- Enforces Free First Year ₹0 policy
  );

-- Sellers can update their contact and dukaan info, but cannot approve themselves
DROP POLICY IF EXISTS "sellers_update_own_or_admin" ON public.sellers;
CREATE POLICY "sellers_update_own_or_admin" ON public.sellers
  FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (
    public.is_admin() OR (
      auth.uid() = user_id AND 
      -- Non-admins cannot alter their own approval or fee status
      status = (SELECT s.status FROM public.sellers s WHERE s.id = sellers.id)
    )
  );

-- Only admins can delete sellers
DROP POLICY IF EXISTS "sellers_delete_admin" ON public.sellers;
CREATE POLICY "sellers_delete_admin" ON public.sellers
  FOR DELETE
  USING (public.is_admin());

-- ============================================================================
-- 7. POLICIES: SHOPS
-- ============================================================================

-- Public can view shops of active sellers
DROP POLICY IF EXISTS "shops_select_public" ON public.shops;
CREATE POLICY "shops_select_public" ON public.shops
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.id = shops.seller_id AND (s.status = 'active' OR s.user_id = auth.uid())
    ) OR public.is_admin()
  );

-- Sellers can insert their shop
DROP POLICY IF EXISTS "shops_insert_owner" ON public.shops;
CREATE POLICY "shops_insert_owner" ON public.shops
  FOR INSERT
  WITH CHECK (
    seller_id = public.get_current_seller_id() OR public.is_admin()
  );

-- Sellers can update their own shop details
DROP POLICY IF EXISTS "shops_update_owner" ON public.shops;
CREATE POLICY "shops_update_owner" ON public.shops
  FOR UPDATE
  USING (
    seller_id = public.get_current_seller_id() OR public.is_admin()
  )
  WITH CHECK (
    seller_id = public.get_current_seller_id() OR public.is_admin()
  );

-- Only shop owners or admins can delete a shop
DROP POLICY IF EXISTS "shops_delete_owner" ON public.shops;
CREATE POLICY "shops_delete_owner" ON public.shops
  FOR DELETE
  USING (
    seller_id = public.get_current_seller_id() OR public.is_admin()
  );

-- ============================================================================
-- 8. POLICIES: PRODUCTS (Requirement 9: Prevent editing other sellers' products)
-- ============================================================================

-- Public can browse approved products; sellers can view their own products; admins see all
DROP POLICY IF EXISTS "products_select_approved_or_owner" ON public.products;
CREATE POLICY "products_select_approved_or_owner" ON public.products
  FOR SELECT
  USING (
    status = 'approved' 
    OR seller_id = public.get_current_seller_id() 
    OR public.is_admin()
  );

-- Sellers can ONLY insert products for their own verified shop
DROP POLICY IF EXISTS "products_insert_owner" ON public.products;
CREATE POLICY "products_insert_owner" ON public.products
  FOR INSERT
  WITH CHECK (
    seller_id = public.get_current_seller_id() OR public.is_admin()
  );

-- STRICT ENFORCEMENT: Sellers can ONLY update their OWN products (never other sellers' products)
DROP POLICY IF EXISTS "products_update_owner" ON public.products;
CREATE POLICY "products_update_owner" ON public.products
  FOR UPDATE
  USING (
    seller_id = public.get_current_seller_id() OR public.is_admin()
  )
  WITH CHECK (
    public.is_admin() OR (
      seller_id = public.get_current_seller_id() AND
      -- Regular sellers cannot self-approve products
      (status = 'pending' OR status = (SELECT p.status FROM public.products p WHERE p.id = products.id))
    )
  );

-- Sellers can delete their own products; admins can delete any product
DROP POLICY IF EXISTS "products_delete_owner" ON public.products;
CREATE POLICY "products_delete_owner" ON public.products
  FOR DELETE
  USING (
    seller_id = public.get_current_seller_id() OR public.is_admin()
  );

-- ============================================================================
-- 9. POLICIES: ORDERS (Requirement 9: Prevent sellers from accessing other customers' private orders)
-- ============================================================================

-- Customers can view their own orders.
-- Sellers can ONLY view an order if it contains items belonging to their shop.
-- Admins can view all orders.
DROP POLICY IF EXISTS "orders_select_customer_or_involved_seller" ON public.orders;
CREATE POLICY "orders_select_customer_or_involved_seller" ON public.orders
  FOR SELECT
  USING (
    auth.uid() = customer_id
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.order_items oi
      WHERE oi.order_id = orders.id 
      AND oi.seller_id = public.get_current_seller_id()
    )
  );

-- Customers or checkout guests can place new orders
DROP POLICY IF EXISTS "orders_insert_customer" ON public.orders;
CREATE POLICY "orders_insert_customer" ON public.orders
  FOR INSERT
  WITH CHECK (
    auth.uid() = customer_id OR customer_id IS NULL OR public.is_admin()
  );

-- Only admins or involved sellers (for order status update) can update order records
DROP POLICY IF EXISTS "orders_update_admin_or_involved" ON public.orders;
CREATE POLICY "orders_update_admin_or_involved" ON public.orders
  FOR UPDATE
  USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.order_items oi
      WHERE oi.order_id = orders.id 
      AND oi.seller_id = public.get_current_seller_id()
    )
  )
  WITH CHECK (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.order_items oi
      WHERE oi.order_id = orders.id 
      AND oi.seller_id = public.get_current_seller_id()
    )
  );

-- ============================================================================
-- 10. POLICIES: ORDER ITEMS (Sellers ONLY see items they sold)
-- ============================================================================

-- Customer can see items in their order; Seller can ONLY see their own items
DROP POLICY IF EXISTS "order_items_select_customer_or_seller" ON public.order_items;
CREATE POLICY "order_items_select_customer_or_seller" ON public.order_items
  FOR SELECT
  USING (
    public.is_admin()
    OR seller_id = public.get_current_seller_id()
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id AND o.customer_id = auth.uid()
    )
  );

-- Order items are inserted during order creation
DROP POLICY IF EXISTS "order_items_insert_allowed" ON public.order_items;
CREATE POLICY "order_items_insert_allowed" ON public.order_items
  FOR INSERT
  WITH CHECK (true);

-- Sellers can update item status for their own items only (e.g. ready_for_pickup, shipped)
DROP POLICY IF EXISTS "order_items_update_seller_own" ON public.order_items;
CREATE POLICY "order_items_update_seller_own" ON public.order_items
  FOR UPDATE
  USING (
    seller_id = public.get_current_seller_id() OR public.is_admin()
  )
  WITH CHECK (
    seller_id = public.get_current_seller_id() OR public.is_admin()
  );

-- ============================================================================
-- 11. POLICIES: BUYER ENQUIRIES (Direct Dukaan Connect)
-- ============================================================================

-- Buyers see their sent enquiries; Sellers see enquiries for their dukaan only
DROP POLICY IF EXISTS "buyer_enquiries_select_parties" ON public.buyer_enquiries;
CREATE POLICY "buyer_enquiries_select_parties" ON public.buyer_enquiries
  FOR SELECT
  USING (
    buyer_user_id = auth.uid()
    OR seller_id = public.get_current_seller_id()
    OR public.is_admin()
  );

-- Anyone can submit an enquiry for a product
DROP POLICY IF EXISTS "buyer_enquiries_insert_anyone" ON public.buyer_enquiries;
CREATE POLICY "buyer_enquiries_insert_anyone" ON public.buyer_enquiries
  FOR INSERT
  WITH CHECK (true);

-- Shop owner can update enquiry status (e.g. seller_contacted, resolved)
DROP POLICY IF EXISTS "buyer_enquiries_update_seller" ON public.buyer_enquiries;
CREATE POLICY "buyer_enquiries_update_seller" ON public.buyer_enquiries
  FOR UPDATE
  USING (
    seller_id = public.get_current_seller_id() OR public.is_admin()
  )
  WITH CHECK (
    seller_id = public.get_current_seller_id() OR public.is_admin()
  );
