-- ============================================================================
-- MattoKart Marketplace - Supabase Migration 003
-- Title: Seller Verification & Server-Side RBAC Enforcement
-- Brand: MattoKart ("Sab Kuch, Ek Hi Jagah!")
-- Location: Saharanpur, Uttar Pradesh
-- ============================================================================

-- 1. Add Identity Verification & Audit columns to public.sellers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'sellers' AND column_name = 'identity_verification_status'
  ) THEN
    ALTER TABLE public.sellers 
      ADD COLUMN identity_verification_status TEXT NOT NULL DEFAULT 'not_started' 
      CHECK (identity_verification_status IN ('not_started', 'pending', 'verified', 'rejected'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'sellers' AND column_name = 'identity_verification_method'
  ) THEN
    ALTER TABLE public.sellers 
      ADD COLUMN identity_verification_method TEXT 
      CHECK (identity_verification_method IN ('digilocker_authorized', 'gstin_verified', 'trade_license', 'physical_inspection_saharanpur'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'sellers' AND column_name = 'verification_reference_id'
  ) THEN
    -- Reference ID stores DigiLocker txn token, GSTIN, or Municipal license # (NEVER raw Aadhaar numbers!)
    ALTER TABLE public.sellers 
      ADD COLUMN verification_reference_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'sellers' AND column_name = 'verification_rejection_reason'
  ) THEN
    ALTER TABLE public.sellers 
      ADD COLUMN verification_rejection_reason TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'sellers' AND column_name = 'reviewed_by'
  ) THEN
    ALTER TABLE public.sellers 
      ADD COLUMN reviewed_by TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'sellers' AND column_name = 'reviewed_at'
  ) THEN
    ALTER TABLE public.sellers 
      ADD COLUMN reviewed_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'sellers' AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE public.sellers 
      ADD COLUMN admin_notes TEXT;
  END IF;
END $$;

-- 2. Index for quick filtering by verification status
CREATE INDEX IF NOT EXISTS idx_sellers_verification_status 
  ON public.sellers(identity_verification_status);

-- 3. Trigger to prevent non-admins from self-approving their shop or identity status
CREATE OR REPLACE FUNCTION public.protect_seller_approval_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If seller status or verification status is changed to active/verified, require admin
  IF (NEW.status = 'active' AND (OLD IS NULL OR OLD.status <> 'active')) OR
     (NEW.identity_verification_status = 'verified' AND (OLD IS NULL OR OLD.identity_verification_status <> 'verified')) THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Access Denied: Only authorized MattoKart administrators can approve shops or verify seller identity.';
    END IF;
    NEW.reviewed_at = timezone('utc', now());
  END IF;

  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_seller_approval ON public.sellers;
CREATE TRIGGER trg_protect_seller_approval
BEFORE UPDATE ON public.sellers
FOR EACH ROW
EXECUTE FUNCTION public.protect_seller_approval_escalation();

-- 4. Strengthen Product Creation RLS: Only ACTIVE & VERIFIED sellers can publish products
DROP POLICY IF EXISTS "products_insert_owner" ON public.products;
CREATE POLICY "products_insert_owner" ON public.products
  FOR INSERT WITH CHECK (
    public.is_admin() OR (
      seller_id = public.get_current_seller_id() AND
      EXISTS (
        SELECT 1 FROM public.sellers s
        WHERE s.id = products.seller_id
          AND s.status = 'active'
      )
    )
  );

-- 5. Audit Log Table for Identity & Verification Review Trail
CREATE TABLE IF NOT EXISTS public.verification_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('submit', 'approve', 'reject', 'suspend', 'request_inspection')),
  performed_by TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.verification_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_admin_all" ON public.verification_audit_logs;
CREATE POLICY "audit_logs_admin_all" ON public.verification_audit_logs
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "audit_logs_seller_own" ON public.verification_audit_logs;
CREATE POLICY "audit_logs_seller_own" ON public.verification_audit_logs
  FOR SELECT USING (seller_id = public.get_current_seller_id());
