/* ============================================================
   CONTAINER DELETION BOOKING CLEANUP
   ------------------------------------------------------------
   Allows an owner to preserve booking history by clearing the
   container reference after the container's ownership has been
   verified. The function runs with SECURITY DEFINER so the
   update can bypass booking RLS without allowing an owner to
   unlink another owner's bookings.
   ============================================================ */

CREATE OR REPLACE FUNCTION public.unlink_container_bookings(
  p_container_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_owner_id uuid;
  v_updated_count integer;
BEGIN
  IF p_container_id IS NULL THEN
    RAISE EXCEPTION 'Container ID is required';
  END IF;

  SELECT owner_id
  INTO v_owner_id
  FROM public.containers
  WHERE id = p_container_id;

  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Container not found';
  END IF;

  IF v_owner_id <> auth.uid() THEN
    RAISE EXCEPTION 'You do not have permission to unlink this container''s bookings';
  END IF;

  UPDATE public.bookings
  SET container_id = NULL
  WHERE container_id = p_container_id;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  RETURN v_updated_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.unlink_container_bookings(uuid)
  TO authenticated;
