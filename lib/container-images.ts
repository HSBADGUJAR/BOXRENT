/*
 * Shared constants, types and helpers for the
 * container multi-image feature.
 */

export const CONTAINER_IMAGE_BUCKET = "container-images";

/* Maximum number of images per container */
export const MAX_CONTAINER_IMAGES = 10;

/* Maximum file size per image (5 MB) */
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGE_SIZE_LABEL = "5 MB";

/* Allowed MIME types */
export const ALLOWED_IMAGE_MIME_TYPES: readonly string[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

/* Signed URLs generated on the server for owner previews */
export const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24; // 24 hours

export type ContainerImage = {
  id: string;
  container_id: string;
  storage_path: string;
  image_url: string | null;
  is_primary: boolean;
  display_order: number;
  created_at: string;
};

/* Payload accepted by the addContainerImages server action */
export type ContainerImageInput = {
  storage_path: string;
  is_primary: boolean;
};

/* Image record returned to owner UI (includes a viewable URL) */
export type ManagedContainerImage = {
  id: string;
  storage_path: string;
  is_primary: boolean;
  display_order: number;
  created_at: string;
  url: string;
};

export type GalleryImage = {
  id: string;
  storage_path: string;
  url: string;
};

/*
 * Builds the direct public object URL.
 * Only use for images that are publicly readable
 * (images of available containers, per RLS).
 */
export function buildStorageImageUrl(storagePath: string): string {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(
    /\/$/,
    ""
  );

  return `${base}/storage/v1/object/public/${CONTAINER_IMAGE_BUCKET}/${storagePath}`;
}

function mimeToExtension(mimeType: string): string | null {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return null;
  }
}

/*
 * Generates a safe, unique storage path.
 * User-provided file names are NEVER used.
 *
 * Format: containers/{container_id}/{uuid}.{ext}
 */
export function generateImageStoragePath(
  containerId: string,
  file: File
): string | null {
  const extension = mimeToExtension(file.type);

  if (!extension) {
    return null;
  }

  const uniqueId = crypto.randomUUID();

  return `containers/${containerId}/${uniqueId}.${extension}`;
}

/*
 * Client-side validation of a picked file.
 * Returns a friendly error message, or null when valid.
 */
export function validateImageFile(file: File): string | null {
  if (!file.type) {
    return `${file.name}: file type could not be determined.`;
  }

  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
    return `${file.name}: only JPEG, PNG and WebP images are allowed.`;
  }

  if (file.size === 0) {
    return `${file.name}: file is empty.`;
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return `${file.name}: image must be ${MAX_IMAGE_SIZE_LABEL} or smaller.`;
  }

  return null;
}

/*
 * Server-side re-validation of a storage object's metadata.
 * Never trust the client: the actual stored bytes decide.
 */
export function validateStoredObject(
  metadata: { mimetype?: unknown; size?: unknown } | null | undefined
): string | null {
  const mimetype =
    (metadata as { mimetype?: unknown } | undefined)?.mimetype;
  const size = (metadata as { size?: unknown } | undefined)?.size;

  if (typeof mimetype !== "string" || !ALLOWED_IMAGE_MIME_TYPES.includes(mimetype)) {
    return "Uploaded file is not a supported image.";
  }

  if (typeof size !== "number" || size <= 0) {
    return "Uploaded file could not be verified.";
  }

  if (size > MAX_IMAGE_SIZE_BYTES) {
    return `Image must be ${MAX_IMAGE_SIZE_LABEL} or smaller.`;
  }

  return null;
}

/* Maps Supabase errors to user-friendly messages */
export function getFriendlyImageError(error: {
  code?: string;
  message?: string;
}): string {
  const message = (error?.message || "").toLowerCase();

  if (error?.code === "23505" || message.includes("duplicate")) {
    return "This image is already marked as primary.";
  }

  if (message.includes("not found")) {
    return "Image not found. It may have already been removed.";
  }

  if (message.includes("access denied") || message.includes("permission")) {
    return "You do not have permission to modify this image.";
  }

  if (message.includes("row-level security") || message.includes("rls")) {
    return "You do not have permission to modify this image.";
  }

  return "Something went wrong. Please try again.";
}
