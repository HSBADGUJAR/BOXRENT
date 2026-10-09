"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createRentalRequest(
  containerId: string,
  formData: FormData
) {
  const startDate = String(
    formData.get("start_date") || ""
  ).trim();

  const endDate = String(
    formData.get("end_date") || ""
  ).trim();

  const quantity = Number(
    formData.get("quantity") || 1
  );

  const notes = String(
    formData.get("notes") || ""
  ).trim();

  const idempotencyKey = String(
    formData.get("idempotency_key") || ""
  ).trim();

  if (!startDate || !endDate) {
    redirect(
      `/containers/${containerId}?error=Please select rental dates`
    );
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    redirect(
      `/containers/${containerId}?error=Quantity must be at least 1`
    );
  }

  if (!idempotencyKey) {
    redirect(
      `/containers/${containerId}?error=Missing idempotency key`
    );
  }

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    redirect(
      `/containers/${containerId}?error=Invalid rental dates`
    );
  }

  if (end < start) {
    redirect(
      `/containers/${containerId}?error=End date cannot be before start date`
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/login?error=Please login before requesting a container`
    );
  }

  const { data: bookingId, error } = await supabase.rpc(
    "create_rental_request_idempotent",
    {
      p_idempotency_key: idempotencyKey,
      p_renter_id: user.id,
      p_container_id: containerId,
      p_start_date: startDate,
      p_end_date: endDate,
      p_quantity: quantity,
      p_notes: notes || null,
    }
  );

  if (error) {
    redirect(
      `/containers/${containerId}?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  if (!bookingId) {
    redirect(
      `/containers/${containerId}?error=Unable to create rental request`
    );
  }

  redirect(
    `/containers/${containerId}?success=Rental request submitted successfully`
  );
}
