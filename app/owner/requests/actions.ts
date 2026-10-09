
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Verify that the current user is an owner or admin.
 */
async function verifyOwner() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Please login first");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    redirect("/profile?error=Profile not found");
  }

  if (profile.role !== "owner" && profile.role !== "admin") {
    redirect("/containers?error=You do not have permission");
  }

  return {
    supabase,
    user,
    role: profile.role,
  };
}

/**
 * Accept or reject a rental request.
 *
 * Important:
 * - Acceptance uses accept_rental_request() RPC.
 * - Rejection uses reject_rental_request() RPC.
 * - No direct booking UPDATE is performed here.
 */
export async function updateRequestStatus(
  bookingId: string,
  status: "accepted" | "rejected"
) {
  if (!bookingId) {
    redirect("/owner/requests?error=Invalid request");
  }

  const { supabase } = await verifyOwner();

  /**
   * ACCEPT REQUEST
   */
  if (status === "accepted") {
    const { data, error } = await supabase.rpc(
      "accept_rental_request",
      {
        p_booking_id: bookingId,
      }
    );

    if (error) {
      redirect(
        `/owner/requests/${bookingId}?error=${encodeURIComponent(
          error.message
        )}`
      );
    }

    if (!data) {
      redirect(
        `/owner/requests/${bookingId}?error=Unable to accept request`
      );
    }

    /**
     * Refresh all pages affected by the booking status.
     */
    revalidatePath("/owner");
    revalidatePath("/owner/requests");
    revalidatePath(`/owner/requests/${bookingId}`);
    revalidatePath("/my-requests");
    revalidatePath("/my-bookings");
    revalidatePath("/containers");

    redirect(
      `/owner/requests/${bookingId}?success=Rental request accepted successfully`
    );
  }

  /**
   * REJECT REQUEST
   */
  if (status === "rejected") {
    const { data, error } = await supabase.rpc(
      "reject_rental_request",
      {
        p_booking_id: bookingId,
      }
    );

    if (error) {
      redirect(
        `/owner/requests/${bookingId}?error=${encodeURIComponent(
          error.message
        )}`
      );
    }

    if (!data) {
      redirect(
        `/owner/requests/${bookingId}?error=Unable to reject request`
      );
    }

    /**
     * Refresh all pages affected by the booking status.
     */
    revalidatePath("/owner");
    revalidatePath("/owner/requests");
    revalidatePath(`/owner/requests/${bookingId}`);
    revalidatePath("/my-requests");
    revalidatePath("/my-bookings");
    revalidatePath("/containers");

    redirect(
      `/owner/requests/${bookingId}?success=Rental request rejected successfully`
    );
  }

  /**
   * This should never be reached because TypeScript
   * restricts status to "accepted" | "rejected".
   */
  redirect(
    `/owner/requests/${bookingId}?error=Invalid request status`
  );
}
