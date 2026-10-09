"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function createContainer(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const categoryId = String(
    formData.get("category_id") || ""
  ).trim();
  const size = String(formData.get("size") || "").trim();
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

  const idempotencyKey = String(
    formData.get("idempotency_key") || ""
  ).trim();

  if (
    !title ||
    !categoryId ||
    !size ||
    !location
  ) {
    redirect(
      "/owner/containers/new?error=Please fill in all required fields"
    );
  }

  if (!idempotencyKey) {
    redirect(
      "/owner/containers/new?error=Missing idempotency key"
    );
  }

  if (!Number.isFinite(pricePerDay) || pricePerDay <= 0) {
    redirect(
      "/owner/containers/new?error=Price must be greater than zero"
    );
  }

  if (
    !Number.isInteger(totalQuantity) ||
    totalQuantity < 1
  ) {
    redirect(
      "/owner/containers/new?error=Total quantity must be a positive integer"
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      "/login?error=Please login before adding a container"
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["owner", "admin"].includes(profile.role)) {
    redirect("/profile");
  }

  const { data: category } = await supabase
    .from("container_categories")
    .select("name")
    .eq("id", categoryId)
    .single();

  const categoryName = category?.name || "";

  const { data: containerId, error } = await supabase.rpc(
    "create_container_idempotent",
    {
      p_idempotency_key: idempotencyKey,
      p_owner_id: user.id,
      p_title: title,
      p_category_id: categoryId,
      p_size: size,
      p_location: location,
      p_price_per_day: pricePerDay,
      p_total_quantity: totalQuantity,
      p_description: description || null,
      p_container_type: categoryName,
    }
  );

  if (error || !containerId) {
    redirect(
      `/owner/containers/new?error=${encodeURIComponent(
        error?.message || "Unable to create container"
      )}`
    );
  }

  return { id: containerId };
}
