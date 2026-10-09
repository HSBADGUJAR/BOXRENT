"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { CONTAINER_IMAGE_BUCKET } from "@/lib/container-images";

const DELETE_ERROR_PATH = "/owner/containers";

async function deleteContainerById(containerId: string) {
  if (!containerId) {
    throw new Error("Invalid container.");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Please sign in to delete this container.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["owner", "admin"].includes(profile.role)) {
    throw new Error("You do not have permission to delete this container.");
  }

  const { data: container } = await supabase
    .from("containers")
    .select("id")
    .eq("id", containerId)
    .eq("owner_id", user.id)
    .single();

  if (!container) {
    throw new Error("You do not have permission to delete this container.");
  }

  const { count, error: bookingCheckError } = await supabase
    .from("bookings")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("container_id", containerId)
    .in("status", ["pending", "accepted", "active"]);

  if (bookingCheckError) {
    throw new Error(`Unable to verify rental requests: ${bookingCheckError.message}`);
  }

  if ((count ?? 0) > 0) {
    throw new Error(
      "This container has active rental requests and cannot be deleted. Deactivate it instead."
    );
  }

  const { error: bookingsUpdateError } = await supabase.rpc(
    "unlink_container_bookings",
    { p_container_id: containerId }
  );

  if (bookingsUpdateError) {
    throw new Error(
      `Failed to unlink booking history: ${bookingsUpdateError.message}`
    );
  }

  const { data: storedFiles, error: listError } = await supabase.storage
    .from(CONTAINER_IMAGE_BUCKET)
    .list(`containers/${containerId}`, {
      limit: 100,
    });

  if (listError) {
    throw new Error(`Failed to access container images: ${listError.message}`);
  }

  if (storedFiles && storedFiles.length > 0) {
    const paths = storedFiles.map((file) => file.name);
    const { error: removeError } = await supabase.storage
      .from(CONTAINER_IMAGE_BUCKET)
      .remove(paths.map((name) => `containers/${containerId}/${name}`));

    if (removeError) {
      throw new Error(`Failed to delete container images: ${removeError.message}`);
    }
  }

  const { error } = await supabase
    .from("containers")
    .delete()
    .eq("id", containerId)
    .eq("owner_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/owner");
  revalidatePath("/owner/containers");
  revalidatePath("/containers");

  return true;
}

export async function deleteContainer(formData: FormData) {
  const containerId = String(formData.get("containerId") || "").trim();
  let errorMessage: string | null = null;

  try {
    await deleteContainerById(containerId);
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "Unable to delete container.";
  }

  if (errorMessage) {
    redirect(
      `${DELETE_ERROR_PATH}?error=${encodeURIComponent(errorMessage)}`
    );
  }

  redirect(`${DELETE_ERROR_PATH}?success=Container deleted successfully`);
}

export async function deleteContainerByIdDirect(containerId: string) {
  try {
    await deleteContainerById(containerId);
    return { success: true as const };
  } catch (error) {
    if (
      error instanceof Error &&
      "digest" in error &&
      typeof error.digest === "string" &&
      error.digest.startsWith("NEXT_REDIRECT;")
    ) {
      throw error;
    }

    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Unable to delete container.",
    };
  }
}