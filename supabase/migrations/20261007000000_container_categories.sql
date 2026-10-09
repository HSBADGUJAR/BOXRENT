/* ============================================================
   CONTAINER CATEGORIES
   ------------------------------------------------------------
   Adds a dedicated categories table for containers:
   - container_categories table
   - category_id on containers
   - RLS policies
   - Default seed categories
   - Safe migration of existing container_type data
   ============================================================ */

/* ------------------------------------------------------------
   1. CATEGORIES TABLE
   ------------------------------------------------------------ */
CREATE TABLE IF NOT EXISTS public.container_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

/* Case-insensitive unique category names */
CREATE UNIQUE INDEX IF NOT EXISTS idx_container_categories_name_lower
  ON public.container_categories (LOWER(name));

/* Fast slug lookups */
CREATE INDEX IF NOT EXISTS idx_container_categories_slug
  ON public.container_categories (slug);

/* Fast active category lookups */
CREATE INDEX IF NOT EXISTS idx_container_categories_active
  ON public.container_categories (is_active)
  WHERE is_active = true;

/* Auto-update updated_at */
CREATE OR REPLACE FUNCTION public.set_container_category_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_container_categories_updated_at ON public.container_categories;
CREATE TRIGGER trg_container_categories_updated_at
  BEFORE UPDATE ON public.container_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.set_container_category_updated_at();

/* ------------------------------------------------------------
   2. ADD category_id TO containers
   ------------------------------------------------------------ */
ALTER TABLE public.containers
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.container_categories(id);

CREATE INDEX IF NOT EXISTS idx_containers_category_id
  ON public.containers (category_id);

/* ------------------------------------------------------------
   3. MIGRATE EXISTING DATA
   ------------------------------------------------------------ */
DO $$
DECLARE
  v_dry_storage uuid;
  v_high_cube uuid;
  v_refrigerated uuid;
  v_open_top uuid;
BEGIN
  /* Find or create categories for existing container_type values */
  SELECT id INTO v_dry_storage FROM public.container_categories WHERE LOWER(name) = 'dry storage container' LIMIT 1;
  IF v_dry_storage IS NULL THEN
    INSERT INTO public.container_categories (name, slug, description, is_active, created_by)
    VALUES ('Dry Storage Container', 'dry-storage-container', 'Standard dry storage shipping container', true, auth.uid())
    RETURNING id INTO v_dry_storage;
  END IF;

  SELECT id INTO v_high_cube FROM public.container_categories WHERE LOWER(name) = 'high cube container' LIMIT 1;
  IF v_high_cube IS NULL THEN
    INSERT INTO public.container_categories (name, slug, description, is_active, created_by)
    VALUES ('High Cube Container', 'high-cube-container', 'High cube container with extra vertical space', true, auth.uid())
    RETURNING id INTO v_high_cube;
  END IF;

  SELECT id INTO v_refrigerated FROM public.container_categories WHERE LOWER(name) = 'refrigerated container' LIMIT 1;
  IF v_refrigerated IS NULL THEN
    INSERT INTO public.container_categories (name, slug, description, is_active, created_by)
    VALUES ('Refrigerated Container', 'refrigerated-container', 'Temperature-controlled refrigerated container', true, auth.uid())
    RETURNING id INTO v_refrigerated;
  END IF;

  SELECT id INTO v_open_top FROM public.container_categories WHERE LOWER(name) = 'open top container' LIMIT 1;
  IF v_open_top IS NULL THEN
    INSERT INTO public.container_categories (name, slug, description, is_active, created_by)
    VALUES ('Open Top Container', 'open-top-container', 'Open top container for oversized cargo', true, auth.uid())
    RETURNING id INTO v_open_top;
  END IF;

  /* Migrate existing containers */
  UPDATE public.containers
  SET category_id = CASE LOWER(container_type)
    WHEN '20ft' THEN v_dry_storage
    WHEN '40ft' THEN v_dry_storage
    WHEN '40ft high cube' THEN v_high_cube
    WHEN 'reefer' THEN v_refrigerated
    WHEN 'open top' THEN v_open_top
    ELSE v_dry_storage
  END
  WHERE category_id IS NULL
    AND container_type IS NOT NULL;
END;
$$;

/* ------------------------------------------------------------
   4. DEFAULT SEED CATEGORIES (safe to re-run)
   ------------------------------------------------------------ */
INSERT INTO public.container_categories (name, slug, description, is_active, created_by)
VALUES
  ('Dry Storage Container', 'dry-storage-container', 'Standard dry storage shipping container', true, auth.uid()),
  ('Refrigerated Container', 'refrigerated-container', 'Temperature-controlled refrigerated container', true, auth.uid()),
  ('High Cube Container', 'high-cube-container', 'High cube container with extra vertical space', true, auth.uid()),
  ('Open Top Container', 'open-top-container', 'Open top container for oversized cargo', true, auth.uid()),
  ('Flat Rack Container', 'flat-rack-container', 'Flat rack container for heavy and oversized cargo', true, auth.uid()),
  ('Tank Container', 'tank-container', 'Tank container for liquids and gases', true, auth.uid()),
  ('Office Container', 'office-container', 'Office container for site accommodation', true, auth.uid()),
  ('Storage Container', 'storage-container', 'General purpose storage container', true, auth.uid())
ON CONFLICT (slug) DO NOTHING;

/* ------------------------------------------------------------
   5. RLS POLICIES
   ------------------------------------------------------------ */
ALTER TABLE public.container_categories ENABLE ROW LEVEL SECURITY;

/* Public/renters: read active categories */
CREATE POLICY container_categories_public_select ON public.container_categories
  FOR SELECT TO public
  USING (is_active = true);

/* Authenticated users: read all categories (for owner dropdowns) */
CREATE POLICY container_categories_authenticated_select ON public.container_categories
  FOR SELECT TO authenticated
  USING (true);

/* Only owners/admins can create categories */
CREATE POLICY container_categories_owner_insert ON public.container_categories
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('owner', 'admin')
    )
  );

/* Only owners/admins can update categories */
CREATE POLICY container_categories_owner_update ON public.container_categories
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('owner', 'admin')
    )
  );

/* Prevent deletion of categories - use deactivation instead */
CREATE POLICY container_categories_no_delete ON public.container_categories
  FOR DELETE TO authenticated
  USING (false);
