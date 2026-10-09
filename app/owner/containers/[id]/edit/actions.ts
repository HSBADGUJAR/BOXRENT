"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function updateContainer(
  containerId: string,
  formData: FormData
) {
  const title = String(formData.get("title") || "").trim();

  const categoryId = String(
    formData.get("category_id") || ""
  ).trim();

  const size = String(
    formData.get("size") || ""
  ).trim();

  const location = String(
    formData.get("location") || ""
  ).trim();

  const pricePerDay = Number(
    formData.get("price_per_day") || 0
  );

  const totalQuantity = Number(
    formData.get("total_quantity") || 0
  );

  const description = String(
    formData.get("description") || ""
  ).trim();

  const isAvailable =
    formData.get("is_available") === "true";

  if (
    !title ||
    !categoryId ||
    !size ||
    !location
  ) {
    redirect(
      `/owner/containers/${containerId}/edit?error=Please fill in all required fields`
    );
  }

  if (!Number.isFinite(pricePerDay) || pricePerDay <= 0) {
    redirect(
      `/owner/containers/${containerId}/edit?error=Price must be greater than zero`
    );
  }

  if (
    !Number.isInteger(totalQuantity) ||
    totalQuantity < 1
  ) {
    redirect(
      `/owner/containers/${containerId}/edit?error=Total quantity must be a positive integer`
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["owner", "admin"].includes(profile.role)) {
    redirect("/profile");
  }

  const { data: currentContainer } = await supabase
    .from("containers")
    .select("total_quantity")
    .eq("id", containerId)
    .eq("owner_id", user.id)
    .single();

  if (!currentContainer) {
    redirect(
      `/owner/containers/${containerId}/edit?error=Container not found`
    );
  }

  if (totalQuantity < currentContainer.total_quantity) {
    const { data: reservedBookings, error: reservedError } =
      await supabase
        .from("bookings")
        .select("quantity")
        .eq("container_id", containerId)
        .in("status", ["pending", "accepted", "active"]);

    if (reservedError) {
      redirect(
        `/owner/containers/${containerId}/edit?error=${encodeURIComponent(
          reservedError.message
        )}`
      );
    }

    const reservedQuantity =
      (reservedBookings ?? []).reduce(
        (sum, b) => sum + Number(b.quantity || 0),
        0
      ) || 0;

    if (totalQuantity < reservedQuantity) {
      redirect(
        `/owner/containers/${containerId}/edit?error=Quantity cannot be reduced below the number of containers already reserved for existing bookings.`
      );
    }
  }

  const { error } = await supabase
    .from("containers")
    .update({
      title,
      category_id: categoryId,
      size,
      location,
      price_per_day: pricePerDay,
      total_quantity: totalQuantity,
      description: description || null,
      is_available: isAvailable,
      updated_at: new Date().toISOString(),
    })
    .eq("id", containerId)
    .eq("owner_id", user.id);

  if (error) {
    redirect(
      `/owner/containers/${containerId}/edit?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  revalidatePath("/owner");
  revalidatePath("/containers");
  revalidatePath(`/containers/${containerId}`);

  redirect("/owner?success=Container updated successfully");
}
