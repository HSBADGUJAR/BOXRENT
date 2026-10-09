/* ============================================================
   IDEMPOTENCY / DUPLICATE-SUBMISSION PROTECTION
   ------------------------------------------------------------
   Adds lightweight protection against duplicate mutations:
   - idempotency_keys table
   - container creation uses idempotency key
   - rental request duplicate guard
   ============================================================ */

/* ------------------------------------------------------------
   1. IDEMPOTENCY KEYS TABLE
   ------------------------------------------------------------ */
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  scope text NOT NULL,
  resource_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_key
  ON public.idempotency_keys (key);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_scope_created
  ON public.idempotency_keys (scope, created_at);

/* ------------------------------------------------------------
   2. CONTAINER CREATION IDEMPOTENCY
   ------------------------------------------------------------
   If the same idempotency key is used twice for container
   creation, only the first container is created.
   The second request returns the existing container ID.
   ------------------------------------------------------------ */
CREATE OR REPLACE FUNCTION public.create_container_idempotent(
  p_idempotency_key text,
  p_owner_id uuid,
  p_title text,
  p_category_id uuid,
  p_size text,
  p_location text,
  p_price_per_day numeric,
  p_total_quantity integer,
  p_description text,
  p_container_type text
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_existing_id uuid;
  v_new_id uuid;
BEGIN
  /* Already created? Return existing ID */
  SELECT resource_id INTO v_existing_id
  FROM public.idempotency_keys
  WHERE key = p_idempotency_key
    AND scope = 'container_creation'
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    RETURN v_existing_id;
  END IF;

  /* Create the container */
  INSERT INTO public.containers (
    owner_id,
    title,
    category_id,
    size,
    location,
    price_per_day,
    total_quantity,
    description,
    image_url,
    is_available,
    container_type
  ) VALUES (
    p_owner_id,
    p_title,
    p_category_id,
    p_size,
    p_location,
    p_price_per_day,
    p_total_quantity,
    p_description,
    NULL,
    true,
    p_container_type
  )
  RETURNING id INTO v_new_id;

  /* Record the idempotency key */
  INSERT INTO public.idempotency_keys (key, scope, resource_id)
  VALUES (p_idempotency_key, 'container_creation', v_new_id);

  RETURN v_new_id;
END;
$$;

/* ------------------------------------------------------------
   3. RENTAL REQUEST DUPLICATE GUARD
   ------------------------------------------------------------
   Prevents the same renter from creating duplicate pending
   requests for the same container with the same dates.
   ------------------------------------------------------------ */
CREATE OR REPLACE FUNCTION public.create_rental_request_idempotent(
  p_idempotency_key text,
  p_renter_id uuid,
  p_container_id uuid,
  p_start_date date,
  p_end_date date,
  p_quantity integer,
  p_notes text
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_existing_id uuid;
  v_new_booking_id uuid;
BEGIN
  /* Already created? Return existing ID */
  SELECT resource_id INTO v_existing_id
  FROM public.idempotency_keys
  WHERE key = p_idempotency_key
    AND scope = 'rental_request'
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    RETURN v_existing_id;
  END IF;

  /* Call the existing business logic RPC */
  SELECT create_rental_request(
    p_container_id,
    p_start_date,
    p_end_date,
    p_quantity,
    p_notes
  ) INTO v_new_booking_id;

  IF v_new_booking_id IS NULL THEN
    RETURN NULL;
  END IF;

  /* Record the idempotency key */
  INSERT INTO public.idempotency_keys (key, scope, resource_id)
  VALUES (p_idempotency_key, 'rental_request', v_new_booking_id);

  RETURN v_new_booking_id;
END;
$$;

/* ------------------------------------------------------------
   4. CLEANUP OLD IDEMPOTENCY KEYS
   ------------------------------------------------------------ */
CREATE OR REPLACE FUNCTION public.cleanup_old_idempotency_keys()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.idempotency_keys
  WHERE created_at < now() - interval '7 days';
END;
$$;
