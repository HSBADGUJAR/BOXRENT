
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function cancelRentalRequest(
  bookingId: string
) {
  if (!bookingId) {
    redirect("/my-requests?error=Invalid request");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      "/login?error=Please login to cancel your request"
    );
  }

  const { data, error } = await supabase.rpc(
    "cancel_rental_request",
    {
      p_booking_id: bookingId,
    }
  );

  if (error) {
    redirect(
      `/my-requests?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  if (!data) {
    redirect(
      "/my-requests?error=Unable to cancel request"
    );
  }

  revalidatePath("/my-requests");
  revalidatePath("/my-bookings");
  revalidatePath("/containers");

  redirect(
    "/my-requests?success=Rental request cancelled successfully"
  );
}
