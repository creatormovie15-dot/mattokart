-- ============================================================================
-- MATTOKART MARKETPLACE — SUPABASE MASTER DATABASE SETUP
-- Brand: MattoKart ("Sab Kuch, Ek Hi Jagah!")
-- Location: Saharanpur, Uttar Pradesh
-- Official Contact: +91 8221077674 | creatormovie15@gmail.com
--
-- Instructions:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard
-- 2. Select your MattoKart project.
-- 3. Click on the "SQL Editor" in the left sidebar.
-- 4. Click "New Query", paste this entire file, and click "Run".
-- ============================================================================

-- Step 1: Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Step 2: Profiles Table (RBAC)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  locality TEXT DEFAULT 'Saharanpur',
  city TEXT DEFAULT 'Saharanpur',
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'seller', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Step 3: Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  hindi_name TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  description TEXT,
  subcategories JSONB NOT NULL DEFAULT '[]'::jsonb,
  item_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Step 4: Sellers Table (FREE FIRST-YEAR SELLER MODEL: ₹0)
CREATE TABLE IF NOT EXISTS public.sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_name TEXT NOT NULL,
  shop_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT NOT NULL,
  locality TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Saharanpur',
  pin_code TEXT NOT NULL,
  landmark TEXT,
  categories TEXT[] NOT NULL DEFAULT '{}',
  gst_number TEXT,
  rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00,
  reviews_count INTEGER NOT NULL DEFAULT 0,
  delivery_radius_km INTEGER NOT NULL DEFAULT 15,
  status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('active', 'pending_approval', 'suspended')),
  -- FREE FIRST YEAR MODEL: ₹0 Registration & Listing Fee
  registration_fee_status TEXT NOT NULL DEFAULT 'free_first_year' CHECK (
    registration_fee_status IN ('free_first_year', 'paid_pending_gateway', 'verified', 'unpaid', 'demo_waived')
  ),
  proposed_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  description TEXT,
  banner_image TEXT,
  shop_logo TEXT,
  -- Identity Verification & Admin Review
  identity_verification_status TEXT NOT NULL DEFAULT 'not_started' CHECK (
    identity_verification_status IN ('not_started', 'pending', 'verified', 'rejected')
  ),
  identity_verification_method TEXT CHECK (
    identity_verification_method IN ('digilocker_authorized', 'gstin_verified', 'trade_license', 'physical_inspection_saharanpur')
  ),
  verification_reference_id TEXT, -- Stores DigiLocker ref, GSTIN, or License # (NEVER raw Aadhaar!)
  verification_rejection_reason TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT unique_seller_user UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_sellers_user_id ON public.sellers(user_id);
CREATE INDEX IF NOT EXISTS idx_sellers_status ON public.sellers(status);
CREATE INDEX IF NOT EXISTS idx_sellers_locality ON public.sellers(locality);

-- Step 5: Shops Table
CREATE TABLE IF NOT EXISTS public.shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tagline TEXT DEFAULT 'Sab Kuch, Ek Hi Jagah!',
  description TEXT,
  banner_image TEXT,
  shop_logo TEXT,
  locality TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Saharanpur',
  pin_code TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp_number TEXT,
  delivery_radius_km INTEGER NOT NULL DEFAULT 15,
  rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00,
  reviews_count INTEGER NOT NULL DEFAULT 0,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT unique_shop_seller UNIQUE (seller_id)
);

CREATE INDEX IF NOT EXISTS idx_shops_seller_id ON public.shops(seller_id);
CREATE INDEX IF NOT EXISTS idx_shops_locality ON public.shops(locality);

-- Step 6: Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  subcategory TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  original_price NUMERIC(12, 2),
  unit TEXT NOT NULL DEFAULT 'piece' CHECK (unit IN ('piece', 'kg', 'bag', 'quintal', 'meter', 'set', 'box', 'pair', 'sq.ft')),
  min_order_quantity INTEGER NOT NULL DEFAULT 1 CHECK (min_order_quantity >= 1),
  in_stock BOOLEAN NOT NULL DEFAULT true,
  stock_count INTEGER NOT NULL DEFAULT 10,
  images TEXT[] NOT NULL DEFAULT '{}',
  description TEXT NOT NULL DEFAULT '',
  specifications JSONB NOT NULL DEFAULT '{}'::jsonb,
  delivery_areas TEXT[] NOT NULL DEFAULT '{}',
  featured BOOLEAN NOT NULL DEFAULT false,
  is_woodcraft_special BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('approved', 'pending', 'rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_products_seller_id ON public.products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);

-- Step 7: Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  delivery_address TEXT NOT NULL,
  locality TEXT NOT NULL,
  pin_code TEXT NOT NULL,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
  payment_method TEXT NOT NULL DEFAULT 'cod' CHECK (payment_method IN ('cod', 'pay_on_delivery', 'upi_on_delivery', 'offline_direct')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  order_status TEXT NOT NULL DEFAULT 'placed' CHECK (order_status IN ('placed', 'confirmed', 'processing', 'out_for_delivery', 'delivered', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Step 8: Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_image TEXT,
  unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL DEFAULT 'piece',
  total_price NUMERIC(12, 2) NOT NULL CHECK (total_price >= 0),
  item_status TEXT NOT NULL DEFAULT 'pending' CHECK (item_status IN ('pending', 'confirmed', 'ready_for_pickup', 'shipped', 'delivered', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_seller_id ON public.order_items(seller_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- Step 9: Buyer Enquiries Table
CREATE TABLE IF NOT EXISTS public.buyer_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  buyer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  buyer_name TEXT NOT NULL,
  buyer_phone TEXT NOT NULL,
  buyer_locality TEXT NOT NULL,
  quantity_needed NUMERIC(10, 2) NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'piece',
  message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'seller_contacted', 'resolved', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_buyer_enquiries_seller_id ON public.buyer_enquiries(seller_id);
CREATE INDEX IF NOT EXISTS idx_buyer_enquiries_buyer_user ON public.buyer_enquiries(buyer_user_id);

-- ============================================================================
-- HELPER FUNCTIONS FOR SECURITY & RLS
-- ============================================================================

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

-- Protect against users promoting themselves to admin (Requirement 10)
CREATE OR REPLACE FUNCTION public.protect_profile_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'admin' AND (OLD IS NULL OR OLD.role <> 'admin') THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Access Denied: You cannot grant yourself administrator privileges on MattoKart.';
    END IF;
  END IF;
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_role_escalation();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_enquiries ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_update_own_or_admin" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- 2. Categories Policies
DROP POLICY IF EXISTS "categories_public_read" ON public.categories;
CREATE POLICY "categories_public_read" ON public.categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "categories_admin_all" ON public.categories;
CREATE POLICY "categories_admin_all" ON public.categories
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 3. Sellers Policies
DROP POLICY IF EXISTS "sellers_select_active_or_owner" ON public.sellers;
CREATE POLICY "sellers_select_active_or_owner" ON public.sellers
  FOR SELECT USING (status = 'active' OR auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "sellers_insert_applicant" ON public.sellers;
CREATE POLICY "sellers_insert_applicant" ON public.sellers
  FOR INSERT WITH CHECK (auth.uid() = user_id AND (proposed_fee = 0.00));

DROP POLICY IF EXISTS "sellers_update_own_or_admin" ON public.sellers;
CREATE POLICY "sellers_update_own_or_admin" ON public.sellers
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (
    public.is_admin() OR (
      auth.uid() = user_id AND
      status = (SELECT s.status FROM public.sellers s WHERE s.id = sellers.id)
    )
  );

DROP POLICY IF EXISTS "sellers_delete_admin" ON public.sellers;
CREATE POLICY "sellers_delete_admin" ON public.sellers
  FOR DELETE USING (public.is_admin());

-- 4. Shops Policies
DROP POLICY IF EXISTS "shops_select_public" ON public.shops;
CREATE POLICY "shops_select_public" ON public.shops
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.id = shops.seller_id AND (s.status = 'active' OR s.user_id = auth.uid())
    ) OR public.is_admin()
  );

DROP POLICY IF EXISTS "shops_insert_owner" ON public.shops;
CREATE POLICY "shops_insert_owner" ON public.shops
  FOR INSERT WITH CHECK (seller_id = public.get_current_seller_id() OR public.is_admin());

DROP POLICY IF EXISTS "shops_update_owner" ON public.shops;
CREATE POLICY "shops_update_owner" ON public.shops
  FOR UPDATE USING (seller_id = public.get_current_seller_id() OR public.is_admin())
  WITH CHECK (seller_id = public.get_current_seller_id() OR public.is_admin());

DROP POLICY IF EXISTS "shops_delete_owner" ON public.shops;
CREATE POLICY "shops_delete_owner" ON public.shops
  FOR DELETE USING (seller_id = public.get_current_seller_id() OR public.is_admin());

-- 5. Products Policies (Requirement 9: Prevents sellers from editing other sellers' products)
DROP POLICY IF EXISTS "products_select_approved_or_owner" ON public.products;
CREATE POLICY "products_select_approved_or_owner" ON public.products
  FOR SELECT USING (
    status = 'approved' 
    OR seller_id = public.get_current_seller_id() 
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "products_insert_owner" ON public.products;
CREATE POLICY "products_insert_owner" ON public.products
  FOR INSERT WITH CHECK (seller_id = public.get_current_seller_id() OR public.is_admin());

DROP POLICY IF EXISTS "products_update_owner" ON public.products;
CREATE POLICY "products_update_owner" ON public.products
  FOR UPDATE USING (seller_id = public.get_current_seller_id() OR public.is_admin())
  WITH CHECK (
    public.is_admin() OR (
      seller_id = public.get_current_seller_id() AND
      (status = 'pending' OR status = (SELECT p.status FROM public.products p WHERE p.id = products.id))
    )
  );

DROP POLICY IF EXISTS "products_delete_owner" ON public.products;
CREATE POLICY "products_delete_owner" ON public.products
  FOR DELETE USING (seller_id = public.get_current_seller_id() OR public.is_admin());

-- 6. Orders Policies (Requirement 9: Prevents sellers from accessing other customers' orders)
DROP POLICY IF EXISTS "orders_select_customer_or_involved_seller" ON public.orders;
CREATE POLICY "orders_select_customer_or_involved_seller" ON public.orders
  FOR SELECT USING (
    auth.uid() = customer_id
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.order_items oi
      WHERE oi.order_id = orders.id 
      AND oi.seller_id = public.get_current_seller_id()
    )
  );

DROP POLICY IF EXISTS "orders_insert_customer" ON public.orders;
CREATE POLICY "orders_insert_customer" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = customer_id OR customer_id IS NULL OR public.is_admin());

DROP POLICY IF EXISTS "orders_update_admin_or_involved" ON public.orders;
CREATE POLICY "orders_update_admin_or_involved" ON public.orders
  FOR UPDATE USING (
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

-- 7. Order Items Policies (Sellers ONLY see order items they fulfill)
DROP POLICY IF EXISTS "order_items_select_customer_or_seller" ON public.order_items;
CREATE POLICY "order_items_select_customer_or_seller" ON public.order_items
  FOR SELECT USING (
    public.is_admin()
    OR seller_id = public.get_current_seller_id()
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id AND o.customer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "order_items_insert_allowed" ON public.order_items;
CREATE POLICY "order_items_insert_allowed" ON public.order_items
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "order_items_update_seller_own" ON public.order_items;
CREATE POLICY "order_items_update_seller_own" ON public.order_items
  FOR UPDATE USING (seller_id = public.get_current_seller_id() OR public.is_admin())
  WITH CHECK (seller_id = public.get_current_seller_id() OR public.is_admin());

-- 8. Buyer Enquiries Policies
DROP POLICY IF EXISTS "buyer_enquiries_select_parties" ON public.buyer_enquiries;
CREATE POLICY "buyer_enquiries_select_parties" ON public.buyer_enquiries
  FOR SELECT USING (
    buyer_user_id = auth.uid()
    OR seller_id = public.get_current_seller_id()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "buyer_enquiries_insert_anyone" ON public.buyer_enquiries;
CREATE POLICY "buyer_enquiries_insert_anyone" ON public.buyer_enquiries
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "buyer_enquiries_update_seller" ON public.buyer_enquiries;
CREATE POLICY "buyer_enquiries_update_seller" ON public.buyer_enquiries
  FOR UPDATE USING (seller_id = public.get_current_seller_id() OR public.is_admin())
  WITH CHECK (seller_id = public.get_current_seller_id() OR public.is_admin());

-- ============================================================================
-- SEED DATA: INITIAL SAHARANPUR MARKETPLACE CATEGORIES
-- ============================================================================
INSERT INTO public.categories (id, name, hindi_name, icon_name, item_count, description, subcategories)
VALUES
  ('furniture', 'Furniture & Woodcraft', 'फर्नीचर और काष्ठ कला', 'Armchair', 48, 'Renowned Saharanpur Sheesham wood carved furniture, sofa sets, mandirs & decor.', '["Wooden Mandir", "Carved Dining Sets", "Sofa Sets", "Beds & Wardrobes", "Office Furniture", "Handicraft Artifacts"]'::jsonb),
  ('construction', 'Construction Materials', 'निर्माण सामग्री', 'Building2', 72, 'Quality cement, TMT Sariya rebar, red bricks, stone dust, river sand, and tiles.', '["Cement Bags", "TMT Sariya & Steel", "Red Bricks & Blocks", "Tiles & Marbles", "Sand & Stone Aggregates", "Waterproofing"]'::jsonb),
  ('tools-hardware', 'Tools & Hardware', 'टूल्स और हार्डवेयर', 'Wrench', 56, 'Woodworking carving tools, power drills, plumbing fittings, latches and heavy fasteners.', '["Power Tools", "Wood Carving Chisels", "Plumbing & Pipes", "Locks & Hinges", "Safety Gears", "Electrical Conduit"]'::jsonb),
  ('electronics', 'Electronics & Appliances', 'इलेक्ट्रॉनिक्स', 'Tv', 65, 'Inverters, tubular batteries, LED lighting, wiring, mobile accessories and cooling fans.', '["Inverters & Batteries", "LED Panels & Bulbs", "Fans & Coolers", "Wires & Cables", "Smart Accessories", "Home Appliances"]'::jsonb),
  ('clothing-fashion', 'Clothing & Fashion', 'कपड़े और फैशन', 'Shirt', 84, 'Traditional Kurtas, wholesale textiles, school uniforms, footwear and winter wear.', '["Men Kurtas & Shirts", "Ladies Suits & Sarees", "Kids Wear", "Fabrics & Wholesalers", "Footwear", "Daily Essentials"]'::jsonb),
  ('grocery-food', 'Local Grocery & Staples', 'किराना और खाद्यान्न', 'ShoppingBasket', 90, 'Saharanpur pure Shakkar/Gur, basmati rice, mustard oil, dry fruits and spices.', '["Pure Sugarcane Gur & Shakkar", "Basmati & Rice", "Pure Mustard Oil", "Pulses & Dal", "Spices & Dry Fruits", "Dairy Essentials"]'::jsonb),
  ('agriculture', 'Agriculture & Farm Inputs', 'कृषि और बागवानी', 'Tractor', 38, 'Sprayers, organic bio-fertilizers, high-yield seeds, irrigation pipes & farm equipment.', '["Crop Sprayers", "High-Yield Seeds", "Organic Manure & Bio", "Irrigation Pipes", "Tractor Spares", "Garden Tools"]'::jsonb),
  ('beauty-care', 'Personal Care & Wellness', 'पर्सनल केयर और वेलनेस', 'Sparkles', 42, 'Ayurvedic wellness remedies, herbal soaps, grooming kits and daily toiletries.', '["Ayurvedic Tonics", "Herbal Soaps & Shampoos", "Grooming & Shaving", "Health Supplements", "Oral Care"]'::jsonb),
  ('toys-baby', 'Stationery, Books & Toys', 'किताबें, स्टेशनरी और खिलौने', 'BookOpen', 35, 'School textbooks, competitive exam books, notebooks, educational wooden toys.', '["School Notebooks & Pens", "Exam Prep Books", "Handcrafted Wooden Toys", "Drawing & Craft", "Backpacks"]'::jsonb),
  ('other-permitted', 'Other Permitted Goods', 'अन्य स्वीकृत सामान', 'Package', 25, 'Permitted local trade items verified by MattoKart team for Saharanpur commerce.', '["Packaging Boxes", "Commercial Supplies", "General Utility"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  hindi_name = EXCLUDED.hindi_name,
  icon_name = EXCLUDED.icon_name,
  description = EXCLUDED.description,
  subcategories = EXCLUDED.subcategories,
  item_count = EXCLUDED.item_count;

-- Setup Complete!
