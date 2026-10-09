import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import {
  CONTAINER_IMAGE_BUCKET,
  SIGNED_URL_TTL_SECONDS,
  buildStorageImageUrl,
  type ManagedContainerImage,
} from "@/lib/container-images";

/*
 * Plain server-side helper (NO "use server" directive).
 *
 * Server components must not import "use server" modules
 * that are also imported by client components. This helper
 * is safe to import from server components, and the
 * server actions reuse it internally.
 */
export async function fetchContainerImagesWithSignedUrls(
  supabase: SupabaseClient,
  containerId: string
): Promise<ManagedContainerImage[]> {
  const { data: rows } = await supabase
    .from("container_images")
    .select(
      "id, storage_path, is_primary, display_order, created_at"
    )
    .eq("container_id", containerId)
    .order("display_order", { ascending: true });

  const images = rows ?? [];

  if (images.length === 0) {
    return [];
  }

  const paths = images.map((image) => image.storage_path);

  const { data: signed } = await supabase.storage
    .from(CONTAINER_IMAGE_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);

  const urlByPath = new Map<string, string>();

  (signed ?? []).forEach((entry, index) => {
    const url = entry?.signedUrl;

    if (url) {
      const path = entry.path ?? paths[index];

      if (path) {
        urlByPath.set(path, url);
      }
    }
  });

  return images.map((image) => ({
    id: image.id,
    storage_path: image.storage_path,
    is_primary: image.is_primary,
    display_order: image.display_order,
    created_at: image.created_at,
    url:
      urlByPath.get(image.storage_path) ??
      buildStorageImageUrl(image.storage_path),
  }));
}

/*
 * Convenience wrapper for server components:
 * authenticates the user, verifies the owner/admin
 * role and container ownership, then loads the
 * container's images with signed URLs.
 */
export async function getOwnerContainerImages(
  containerId: string
): Promise<ManagedContainerImage[]> {
  if (!containerId) {
    return [];
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["owner", "admin"].includes(profile.role)) {
    return [];
  }

  const { data: container } = await supabase
    .from("containers")
    .select("id")
    .eq("id", containerId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!container?.id) {
    return [];
  }

  return fetchContainerImagesWithSignedUrls(
    supabase,
    containerId
  );
}
