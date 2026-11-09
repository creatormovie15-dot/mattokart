-- Migration: 20261011000001_dual_delivery_system.sql
-- Description: Adds Dual Delivery System (Seller Direct Delivery & MattoKart Express Fleet Delivery),
-- delivery partner management, delivery pricing configuration, and Row Level Security.

-- 1. Delivery Partners Table (MattoKart Verified Rider Fleet)
CREATE TABLE IF NOT EXISTS public.delivery_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('bike', 'scooter', 'e_rickshaw', 'tempo', 'van')),
  vehicle_number TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  total_deliveries INTEGER NOT NULL DEFAULT 0,
  rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00,
  current_locality TEXT DEFAULT 'Saharanpur Central',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_delivery_partners_is_active ON public.delivery_partners(is_active);
CREATE INDEX IF NOT EXISTS idx_delivery_partners_phone ON public.delivery_partners(phone);

-- 2. Delivery Settings Table (Configured by MattoKart Administration)
CREATE TABLE IF NOT EXISTS public.delivery_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mattokart_delivery_enabled BOOLEAN NOT NULL DEFAULT true,
  standard_delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 50.00,
  free_delivery_threshold NUMERIC(10, 2) NOT NULL DEFAULT 1500.00,
  seller_delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  serviceable_pin_codes TEXT[] NOT NULL DEFAULT ARRAY['247001', '247002', '247554', '247451'],
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Seed initial delivery settings if not present
INSERT INTO public.delivery_settings (
  mattokart_delivery_enabled,
  standard_delivery_fee,
  free_delivery_threshold,
  seller_delivery_fee,
  serviceable_pin_codes
)
SELECT true, 50.00, 1500.00, 0.00, ARRAY['247001', '247002', '247554', '247451']
WHERE NOT EXISTS (SELECT 1 FROM public.delivery_settings);

-- 3. Enhance Orders Table with Dual Delivery Fields
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_type TEXT NOT NULL DEFAULT 'seller_delivery' CHECK (delivery_type IN ('seller_delivery', 'mattokart_delivery')),
  ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS delivery_partner_id UUID REFERENCES public.delivery_partners(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS delivery_partner_name TEXT,
  ADD COLUMN IF NOT EXISTS delivery_partner_phone TEXT,
  ADD COLUMN IF NOT EXISTS delivery_partner_vehicle TEXT,
  ADD COLUMN IF NOT EXISTS delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'assigned', 'picked_up', 'out_for_delivery', 'delivered', 'failed', 'cancelled')),
  ADD COLUMN IF NOT EXISTS delivery_failure_reason TEXT,
  ADD COLUMN IF NOT EXISTS delivery_attempt_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_delivery_type ON public.orders(delivery_type);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON public.orders(delivery_status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_partner_id ON public.orders(delivery_partner_id);

-- 4. Row Level Security Policies
ALTER TABLE public.delivery_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_settings ENABLE ROW LEVEL SECURITY;

-- Delivery Settings: Read public, Write admin only
CREATE POLICY "Public can view delivery settings"
  ON public.delivery_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can update delivery settings"
  ON public.delivery_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Delivery Partners: Read active partners, Full admin control
CREATE POLICY "Public can view active delivery partners"
  ON public.delivery_partners FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage delivery partners"
  ON public.delivery_partners FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
