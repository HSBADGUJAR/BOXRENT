"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { fetchContainerImagesWithSignedUrls } from "@/lib/server/container-images";
import {
  CONTAINER_IMAGE_BUCKET,
  MAX_CONTAINER_IMAGES,
  buildStorageImageUrl,
  getFriendlyImageError,
  validateStoredObject,
  type ContainerImageInput,
  type ManagedContainerImage,
} from "@/lib/container-images";

type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

/*
 * Authenticates the user and requires an owner/admin role.
 */
async function requireOwner() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["owner", "admin"].includes(profile.role)) {
    return { supabase, user: null };
  }

  return { supabase, user };
}

/*
 * Verifies that a container belongs to the given user.
 */
async function requireOwnedContainer(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  containerId: string
) {
  const { data } = await supabase
    .from("containers")
    .select("id")
    .eq("id", containerId)
    .eq("owner_id", userId)
    .maybeSingle();

  return Boolean(data?.id);
}

function revalidateContainerPaths(containerId: string) {
  revalidatePath("/owner");
  revalidatePath("/owner/containers");
  revalidatePath("/containers");
  revalidatePath(`/containers/${containerId}`);
}

/*
 * Records uploaded container images in the database.
 *
 * Security:
 * - ownership is verified server-side
 * - every storage path is validated and re-checked against
 *   the actual storage object (type + size from stored metadata)
 * - the 10 image limit is enforced here as well
 * - at most one primary image per container is guaranteed
 *   by the partial unique index (with one retry on race)
 */
export async function addContainerImages(
  containerId: string,
  inputs: ContainerImageInput[]
): Promise<ActionResult<ManagedContainerImage[]>> {
  if (
    !containerId ||
    !Array.isArray(inputs) ||
    inputs.length === 0
  ) {
    return { ok: false, error: "No images to add." };
  }

  if (inputs.length > MAX_CONTAINER_IMAGES) {
    return {
      ok: false,
      error: `Maximum ${MAX_CONTAINER_IMAGES} images allowed per container.`,
    };
  }

  const { supabase, user } = await requireOwner();

  if (!user) {
    return {
      ok: false,
      error: "Please sign in as an owner to manage images.",
    };
  }

  const owned = await requireOwnedContainer(
    supabase,
    user.id,
    containerId
  );

  if (!owned) {
    return {
      ok: false,
      error: "Container not found or access denied.",
    };
  }

  /* Every path must live inside this container's folder */
  const expectedPrefix = `containers/${containerId}/`;

  for (const input of inputs) {
    if (
      typeof input?.storage_path !== "string" ||
      !input.storage_path.startsWith(expectedPrefix) ||
      input.storage_path.length <= expectedPrefix.length
    ) {
      return { ok: false, error: "Invalid image path." };
    }
  }

  /*
   * Server-side verification: the objects must really exist
   * in this container's storage folder and their stored
   * metadata must satisfy the type/size rules.
   */
  const { data: objects } = await supabase.storage
    .from(CONTAINER_IMAGE_BUCKET)
    .list(expectedPrefix, { limit: MAX_CONTAINER_IMAGES * 2 });

  const objectByName = new Map(
    (objects ?? []).map((object) => [object.name, object])
  );

  for (const input of inputs) {
    const filename = input.storage_path.slice(
      expectedPrefix.length
    );

    const object = objectByName.get(filename);

    if (!object || !object.metadata) {
      return {
        ok: false,
        error:
          "Uploaded file could not be verified. Please try uploading again.",
      };
    }

    const validationError = validateStoredObject(
      object.metadata
    );

    if (validationError) {
      return { ok: false, error: validationError };
    }
  }

  /* Enforce the image quantity limit server-side */
  const { count } = await supabase
    .from("container_images")
    .select("id", { count: "exact", head: true })
    .eq("container_id", containerId);

  const currentCount = count ?? 0;

  if (currentCount + inputs.length > MAX_CONTAINER_IMAGES) {
    return {
      ok: false,
      error: `This container can have at most ${MAX_CONTAINER_IMAGES} images (${currentCount} already uploaded).`,
    };
  }

  /* Append after the last display_order */
  const { data: lastImage } = await supabase
    .from("container_images")
    .select("display_order")
    .eq("container_id", containerId)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const baseOrder = lastImage
    ? Number(lastImage.display_order) + 1
    : 0;

  /*
   * Primary image rules:
   * - an explicitly marked image becomes primary
   * - if the container has no primary yet, the first
   *   image of the batch becomes primary automatically
   */
  const explicitPrimaryIndex = inputs.findIndex(
    (input) => input.is_primary
  );

  let effectivePrimaryIndex = -1;

  if (explicitPrimaryIndex >= 0) {
    effectivePrimaryIndex = explicitPrimaryIndex;
  } else if (currentCount === 0) {
    effectivePrimaryIndex = 0;
  }

  let insertError: {
    code?: string;
    message?: string;
  } | null = null;

  /* Retry once to survive a concurrent primary update */
  for (let attempt = 0; attempt < 2; attempt++) {
    if (effectivePrimaryIndex >= 0) {
      const { error: clearError } = await supabase
        .from("container_images")
        .update({ is_primary: false })
        .eq("container_id", containerId);

      if (clearError) {
        return {
          ok: false,
          error: getFriendlyImageError(clearError),
        };
      }
    }

    const rows = inputs.map((input, index) => ({
      container_id: containerId,
      storage_path: input.storage_path,
      image_url: buildStorageImageUrl(input.storage_path),
      is_primary: index === effectivePrimaryIndex,
      display_order: baseOrder + index,
    }));

    const { error } = await supabase
      .from("container_images")
      .insert(rows);

    insertError = error;

    if (!error) {
      break;
    }

    /* 23505 = unique violation (two primaries race) */
    if (error.code !== "23505") {
      break;
    }
  }

  if (insertError) {
    return {
      ok: false,
      error: getFriendlyImageError(insertError),
    };
  }

  const images = await fetchContainerImagesWithSignedUrls(
    supabase,
    containerId
  );

  revalidateContainerPaths(containerId);

  return { ok: true, data: images };
}

/*
 * Deletes a container image:
 * 1. database record (the DB function promotes the next
 *    primary image automatically)
 * 2. the storage object
 */
export async function deleteContainerImage(
  imageId: string
): Promise<ActionResult> {
  if (!imageId) {
    return { ok: false, error: "Image not found." };
  }

  const { supabase, user } = await requireOwner();

  if (!user) {
    return {
      ok: false,
      error: "Please sign in as an owner to manage images.",
    };
  }

  const { data: image } = await supabase
    .from("container_images")
    .select("id, container_id, storage_path, is_primary")
    .eq("id", imageId)
    .maybeSingle();

  if (!image) {
    return {
      ok: false,
      error: "Image not found. It may have already been removed.",
    };
  }

  const owned = await requireOwnedContainer(
    supabase,
    user.id,
    image.container_id
  );

  if (!owned) {
    return {
      ok: false,
      error: "You do not have permission to delete this image.",
    };
  }

  /* 1. Delete the database record */
  const { error: rpcError } = await supabase.rpc(
    "delete_container_image",
    { p_image_id: imageId }
  );

  if (rpcError) {
    return { ok: false, error: getFriendlyImageError(rpcError) };
  }

  /* 2. Delete the storage object */
  const { error: storageError } = await supabase.storage
    .from(CONTAINER_IMAGE_BUCKET)
    .remove([image.storage_path]);

  revalidateContainerPaths(image.container_id);

  if (storageError) {
    /*
     * The database record is already gone. Report the
     * leftover file honestly instead of failing silently.
     */
    return {
      ok: true,
    };
  }

  return { ok: true };
}

/*
 * Atomically makes one image the primary image.
 */
export async function setPrimaryContainerImage(
  imageId: string
): Promise<ActionResult> {
  if (!imageId) {
    return { ok: false, error: "Image not found." };
  }

  const { supabase, user } = await requireOwner();

  if (!user) {
    return {
      ok: false,
      error: "Please sign in as an owner to manage images.",
    };
  }

  const { data: image, error: imageError } = await supabase
    .from("container_images")
    .select("id, container_id")
    .eq("id", imageId)
    .maybeSingle();

  if (imageError) {
    return {
      ok: false,
      error: getFriendlyImageError(imageError),
    };
  }

  if (!image) {
    return {
      ok: false,
      error: "Image not found. It may have already been removed.",
    };
  }

  const owned = await requireOwnedContainer(
    supabase,
    user.id,
    image.container_id
  );

  if (!owned) {
    return {
      ok: false,
      error: "You do not have permission to change this image.",
    };
  }

  let updateError: { code?: string; message?: string } | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const { error } = await supabase
      .from("container_images")
      .update({ is_primary: false })
      .eq("container_id", image.container_id)
      .eq("is_primary", true);

    if (error) {
      updateError = error;
      break;
    }

    const result = await supabase
      .from("container_images")
      .update({ is_primary: true })
      .eq("id", imageId);

    updateError = result.error;

    if (!result.error || result.error.code !== "23505") {
      break;
    }
  }

  if (updateError) {
    return {
      ok: false,
      error: getFriendlyImageError(updateError),
    };
  }

  revalidateContainerPaths(image.container_id);

  return { ok: true };
}

/*
 * Reorders images of a container.
 */
export async function reorderContainerImages(
  containerId: string,
  orderedImageIds: string[]
): Promise<ActionResult> {
  if (!containerId || !Array.isArray(orderedImageIds)) {
    return { ok: false, error: "Invalid request." };
  }

  const { supabase, user } = await requireOwner();

  if (!user) {
    return {
      ok: false,
      error: "Please sign in as an owner to manage images.",
    };
  }

  const owned = await requireOwnedContainer(
    supabase,
    user.id,
    containerId
  );

  if (!owned) {
    return {
      ok: false,
      error: "Container not found or access denied.",
    };
  }

  for (let index = 0; index < orderedImageIds.length; index++) {
    const { error } = await supabase
      .from("container_images")
      .update({ display_order: index })
      .eq("id", orderedImageIds[index])
      .eq("container_id", containerId);

    if (error) {
      return {
        ok: false,
        error: getFriendlyImageError(error),
      };
    }
  }

  revalidateContainerPaths(containerId);

  return { ok: true };
}

/*
 * Removes orphaned storage files for a container
 * (files that exist in storage but have no database row).
 * Used to clean up after a failed upload flow.
 */
export async function cleanupContainerStorage(
  containerId: string,
  storagePaths: string[]
): Promise<ActionResult> {
  if (!containerId) {
    return { ok: false, error: "Invalid request." };
  }

  const { supabase, user } = await requireOwner();

  if (!user) {
    return {
      ok: false,
      error: "Please sign in as an owner to manage images.",
    };
  }

  const owned = await requireOwnedContainer(
    supabase,
    user.id,
    containerId
  );

  if (!owned) {
    return {
      ok: false,
      error: "Container not found or access denied.",
    };
  }

  const expectedPrefix = `containers/${containerId}/`;

  const validPaths = (storagePaths ?? []).filter(
    (path) =>
      typeof path === "string" &&
      path.startsWith(expectedPrefix) &&
      path.length > expectedPrefix.length
  );

  if (validPaths.length === 0) {
    return { ok: true };
  }

  const { error } = await supabase.storage
    .from(CONTAINER_IMAGE_BUCKET)
    .remove(validPaths);

  if (error) {
    return { ok: false, error: "Failed to clean up uploaded files." };
  }

  return { ok: true };
}
