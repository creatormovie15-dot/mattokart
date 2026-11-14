-- ============================================================================
-- Migration: 20261113000001_stage_b_cart_checkout_cod_tracking.sql
-- Stage B: Persistent Cart, Customer Address Book, Multi-Vendor Checkout,
-- Heavy Goods Configuration, COD Charges, and 10-Stage Order Tracking.
--
-- SAFETY: Additive migration ONLY. Preserves all existing tables & records.
-- ============================================================================

-- 1. Extend public.sellers with Pan-India location & business type fields
ALTER TABLE public.sellers
  ADD COLUMN IF NOT EXISTS seller_type TEXT DEFAULT 'shopkeeper',
  ADD COLUMN IF NOT EXISTS district TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'Uttar Pradesh',
  ADD COLUMN IF NOT EXISTS ships_pan_india BOOLEAN NOT NULL DEFAULT true;

-- 2. Extend public.products with Heavy Goods, Dimensions, COD & Local Delivery Config
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS seller_city TEXT DEFAULT 'Saharanpur',
  ADD COLUMN IF NOT EXISTS seller_state TEXT DEFAULT 'Uttar Pradesh',
  ADD COLUMN IF NOT EXISTS seller_pin_code TEXT DEFAULT '247001',
  ADD COLUMN IF NOT EXISTS shipping_scope TEXT NOT NULL DEFAULT 'pan_india',
  ADD COLUMN IF NOT EXISTS condition TEXT NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS estimated_weight_kg NUMERIC(10, 2) DEFAULT 1.00,
  ADD COLUMN IF NOT EXISTS length_cm NUMERIC(8, 2),
  ADD COLUMN IF NOT EXISTS breadth_cm NUMERIC(8, 2),
  ADD COLUMN IF NOT EXISTS height_cm NUMERIC(8, 2),
  ADD COLUMN IF NOT EXISTS delivery_mode TEXT NOT NULL DEFAULT 'standard_courier',
  ADD COLUMN IF NOT EXISTS seller_delivery_fee NUMERIC(10, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS local_delivery_available BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS cod_available BOOLEAN NOT NULL DEFAULT true;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_delivery_mode_check'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_delivery_mode_check
      CHECK (delivery_mode IN ('standard_courier', 'seller_transport', 'both'));
  END IF;
END $$;

-- 3. Extend public.orders with Multi-Vendor, Address, COD Fee & 10-Stage Status Support
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS landmark TEXT,
  ADD COLUMN IF NOT EXISTS district TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Saharanpur',
  ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'Uttar Pradesh',
  ADD COLUMN IF NOT EXISTS subtotal_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS cod_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS shipping_zone TEXT DEFAULT 'local',
  ADD COLUMN IF NOT EXISTS courier_partner TEXT,
  ADD COLUMN IF NOT EXISTS tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS estimated_delivery_window TEXT,
  ADD COLUMN IF NOT EXISTS seller_count INTEGER NOT NULL DEFAULT 1;

-- Safely widen orders.order_status CHECK constraint to all 10 stages
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_order_status_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_order_status_check CHECK (
    order_status IN (
      'placed',
      'confirmed',
      'payment_confirmed',
      'processing',
      'packed',
      'shipped',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'return_requested',
      'refunded'
    )
  );

-- Safely widen orders.delivery_type CHECK constraint for Pan-India & Heavy Goods
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_delivery_type_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_delivery_type_check CHECK (
    delivery_type IN ('seller_delivery', 'mattokart_delivery', 'interstate_courier', 'seller_transport')
  );

-- 4. Customer Address Book (public.customer_addresses)
CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_phone TEXT,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address_line TEXT NOT NULL,
  landmark TEXT,
  locality TEXT NOT NULL,
  district TEXT,
  city TEXT NOT NULL DEFAULT 'Saharanpur',
  state TEXT NOT NULL DEFAULT 'Uttar Pradesh',
  pin_code TEXT NOT NULL,
  tag TEXT NOT NULL DEFAULT 'Home' CHECK (tag IN ('Home', 'Work', 'Shop')),
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_customer_addresses_user_id ON public.customer_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_phone ON public.customer_addresses(customer_phone);

-- 5. Persistent Shopping Carts (public.carts & public.cart_items)
CREATE TABLE IF NOT EXISTS public.carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_phone TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  selected_unit TEXT NOT NULL DEFAULT 'piece',
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  product_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT unique_cart_product UNIQUE (cart_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON public.cart_items(cart_id);

-- 6. Multi-Vendor Seller Sub-Orders (public.seller_orders)
-- Isolates each seller's portion of a multi-vendor customer order cleanly.
CREATE TABLE IF NOT EXISTS public.seller_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  sub_order_number TEXT NOT NULL UNIQUE,
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  seller_shop_name TEXT NOT NULL,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
  shipping_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (shipping_fee >= 0),
  cod_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (cod_fee >= 0),
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
  delivery_mode TEXT NOT NULL DEFAULT 'seller_delivery' CHECK (
    delivery_mode IN ('seller_delivery', 'mattokart_delivery', 'interstate_courier', 'seller_transport')
  ),
  delivery_status TEXT NOT NULL DEFAULT 'pending',
  order_status TEXT NOT NULL DEFAULT 'placed' CHECK (
    order_status IN (
      'placed',
      'confirmed',
      'payment_confirmed',
      'processing',
      'packed',
      'shipped',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'return_requested',
      'refunded'
    )
  ),
  courier_name TEXT,
  tracking_number TEXT,
  estimated_delivery TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_seller_orders_order_id ON public.seller_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_seller_orders_seller_id ON public.seller_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_orders_status ON public.seller_orders(order_status);

-- 7. Order & Shipment Tracking Timeline Events (public.shipment_tracking)
CREATE TABLE IF NOT EXISTS public.shipment_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  seller_order_id UUID REFERENCES public.seller_orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  actor_role TEXT NOT NULL DEFAULT 'system' CHECK (actor_role IN ('customer', 'seller', 'admin', 'courier', 'system')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_shipment_tracking_order_id ON public.shipment_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_shipment_tracking_seller_order_id ON public.shipment_tracking(seller_order_id);

-- 8. Row Level Security Policies (Strict Customer / Seller / Admin Isolation)
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_tracking ENABLE ROW LEVEL SECURITY;

-- Customer Addresses Policies
DROP POLICY IF EXISTS "customer_addresses_own_all" ON public.customer_addresses;
CREATE POLICY "customer_addresses_own_all" ON public.customer_addresses
  FOR ALL USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- Carts & Cart Items Policies
DROP POLICY IF EXISTS "carts_own_all" ON public.carts;
CREATE POLICY "carts_own_all" ON public.carts
  FOR ALL USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "cart_items_own_all" ON public.cart_items;
CREATE POLICY "cart_items_own_all" ON public.cart_items
  FOR ALL USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.carts c
      WHERE c.id = cart_items.cart_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.carts c
      WHERE c.id = cart_items.cart_id AND c.user_id = auth.uid()
    )
  );

-- Seller Orders Policies: Customer views own order sub-orders; Seller ONLY views & updates own sub-orders; Admin all
DROP POLICY IF EXISTS "seller_orders_select_party" ON public.seller_orders;
CREATE POLICY "seller_orders_select_party" ON public.seller_orders
  FOR SELECT USING (
    public.is_admin()
    OR seller_id = public.get_current_seller_id()
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = seller_orders.order_id AND o.customer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "seller_orders_insert_party" ON public.seller_orders;
CREATE POLICY "seller_orders_insert_party" ON public.seller_orders
  FOR INSERT WITH CHECK (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = seller_orders.order_id AND (o.customer_id = auth.uid() OR o.customer_id IS NULL)
    )
  );

DROP POLICY IF EXISTS "seller_orders_update_seller_or_admin" ON public.seller_orders;
CREATE POLICY "seller_orders_update_seller_or_admin" ON public.seller_orders
  FOR UPDATE USING (seller_id = public.get_current_seller_id() OR public.is_admin())
  WITH CHECK (seller_id = public.get_current_seller_id() OR public.is_admin());

-- Shipment Tracking Policies
DROP POLICY IF EXISTS "shipment_tracking_select_party" ON public.shipment_tracking;
CREATE POLICY "shipment_tracking_select_party" ON public.shipment_tracking
  FOR SELECT USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = shipment_tracking.order_id AND o.customer_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.seller_orders so
      WHERE so.id = shipment_tracking.seller_order_id AND so.seller_id = public.get_current_seller_id()
    )
  );

DROP POLICY IF EXISTS "shipment_tracking_insert_party" ON public.shipment_tracking;
CREATE POLICY "shipment_tracking_insert_party" ON public.shipment_tracking
  FOR INSERT WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.seller_orders so
      WHERE so.id = shipment_tracking.seller_order_id AND so.seller_id = public.get_current_seller_id()
    )
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = shipment_tracking.order_id AND (o.customer_id = auth.uid() OR o.customer_id IS NULL)
    )
  );
