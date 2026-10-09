/* ============================================================
   CONTAINER IMAGES FEATURE
   ------------------------------------------------------------
   Adds multi-image support for containers:
   - container_images table (many images per container)
   - Exactly ONE primary image per container (partial unique index)
   - Private storage bucket "container-images"
   - Table + storage RLS policies
   - Atomic DB functions for primary-image management
   ============================================================ */

/* ------------------------------------------------------------
   1. TABLE
   ------------------------------------------------------------ */
CREATE TABLE IF NOT EXISTS public.container_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  container_id uuid NOT NULL REFERENCES public.containers (id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  image_url text,
  is_primary boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

/* Fast lookup of all images of a container */
CREATE INDEX IF NOT EXISTS idx_container_images_container_id
  ON public.container_images (container_id);

/* Fast ordered reads (gallery order) */
CREATE INDEX IF NOT EXISTS idx_container_images_container_order
  ON public.container_images (container_id, display_order);

/*
  RULE: A container can have at most ONE primary image.
  A partial unique index is enforced by Postgres itself, so even
  concurrent requests can never produce two primary images.
*/
CREATE UNIQUE INDEX IF NOT EXISTS idx_container_images_one_primary
  ON public.container_images (container_id)
  WHERE is_primary;

/* ------------------------------------------------------------
   2. TABLE RLS
   ------------------------------------------------------------ */
ALTER TABLE public.container_images ENABLE ROW LEVEL SECURITY;

/* Owners: full access to images that belong to their own containers */
CREATE POLICY container_images_owner_select ON public.container_images
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.containers c
      WHERE c.id = container_images.container_id
        AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY container_images_owner_insert ON public.container_images
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.containers c
      WHERE c.id = container_images.container_id
        AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY container_images_owner_update ON public.container_images
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.containers c
      WHERE c.id = container_images.container_id
        AND c.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.containers c
      WHERE c.id = container_images.container_id
        AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY container_images_owner_delete ON public.container_images
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.containers c
      WHERE c.id = container_images.container_id
        AND c.owner_id = auth.uid()
    )
  );

/*
  Renters / public: may only READ images that belong to containers
  that are currently available (mirrors the marketplace visibility rule).
*/
CREATE POLICY container_images_public_select ON public.container_images
  FOR SELECT TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.containers c
      WHERE c.id = container_images.container_id
        AND c.is_available = true
    )
  );

/* ------------------------------------------------------------
   3. STORAGE BUCKET (private) + STORAGE RLS
   ------------------------------------------------------------ */
INSERT INTO storage.buckets (id, name, public)
SELECT 'container-images', 'container-images', false
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'container-images'
);

/*
  Objects live at: containers/{container_id}/{unique_filename}
  The bucket stays private. Access is granted per-policy:
  - owners: upload/read/delete inside their own container folders
  - public: read objects that belong to available containers
*/

CREATE POLICY container_images_storage_owner_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'container-images'
    AND (storage.foldername(name))[1] = 'containers'
    AND EXISTS (
      SELECT 1 FROM public.containers c
      WHERE c.id::text = (storage.foldername(name))[2]
        AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY container_images_storage_owner_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'container-images'
    AND (storage.foldername(name))[1] = 'containers'
    AND EXISTS (
      SELECT 1 FROM public.containers c
      WHERE c.id::text = (storage.foldername(name))[2]
        AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY container_images_storage_owner_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'container-images'
    AND (storage.foldername(name))[1] = 'containers'
    AND EXISTS (
      SELECT 1 FROM public.containers c
      WHERE c.id::text = (storage.foldername(name))[2]
        AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY container_images_storage_public_select ON storage.objects
  FOR SELECT TO public
  USING (
    bucket_id = 'container-images'
    AND (storage.foldername(name))[1] = 'containers'
    AND EXISTS (
      SELECT 1 FROM public.containers c
      WHERE c.id::text = (storage.foldername(name))[2]
        AND c.is_available = true
    )
  );

/* ------------------------------------------------------------
   4. ATOMIC PRIMARY-IMAGE FUNCTIONS
   ------------------------------------------------------------ */

/*
  Atomically makes one image the primary image.
  - clears any existing primary of the same container
  - sets the target image as primary
  Ownership is verified here (defense in depth on top of RLS).
*/
CREATE OR REPLACE FUNCTION public.set_container_primary_image(p_image_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_container_id uuid;
BEGIN
  SELECT ci.container_id INTO v_container_id
  FROM public.container_images ci
  JOIN public.containers c ON c.id = ci.container_id
  WHERE ci.id = p_image_id
    AND c.owner_id = auth.uid();

  IF v_container_id IS NULL THEN
    RAISE EXCEPTION 'Image not found or access denied';
  END IF;

  UPDATE public.container_images
  SET is_primary = false
  WHERE container_id = v_container_id
    AND is_primary = true;

  UPDATE public.container_images
  SET is_primary = true
  WHERE id = p_image_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_container_primary_image(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_container_primary_image(uuid) TO authenticated;

/*
  Atomically deletes an image row.
  - if the deleted image was primary, the next image
    (by display_order, then created_at) becomes primary
  - if no images remain, the container simply has no primary
  Returns the container id so the caller can clean up storage.
*/
CREATE OR REPLACE FUNCTION public.delete_container_image(p_image_id uuid)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_container_id uuid;
  v_was_primary boolean;
BEGIN
  SELECT ci.container_id, ci.is_primary
  INTO v_container_id, v_was_primary
  FROM public.container_images ci
  JOIN public.containers c ON c.id = ci.container_id
  WHERE ci.id = p_image_id
    AND c.owner_id = auth.uid();

  IF v_container_id IS NULL THEN
    RAISE EXCEPTION 'Image not found or access denied';
  END IF;

  DELETE FROM public.container_images
  WHERE id = p_image_id;

  IF v_was_primary THEN
    UPDATE public.container_images
    SET is_primary = true
    WHERE id = (
      SELECT ci2.id
      FROM public.container_images ci2
      WHERE ci2.container_id = v_container_id
      ORDER BY ci2.display_order ASC, ci2.created_at ASC, ci2.id ASC
      LIMIT 1
    );
  END IF;

  RETURN v_container_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_container_image(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_container_image(uuid) TO authenticated;
