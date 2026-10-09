"use client";

import { useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Loader2,
  Star,
  Trash2,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import {
  CONTAINER_IMAGE_BUCKET,
  MAX_CONTAINER_IMAGES,
  MAX_IMAGE_SIZE_LABEL,
  generateImageStoragePath,
  validateImageFile,
  type ContainerImageInput,
  type ManagedContainerImage,
} from "@/lib/container-images";
import {
  addContainerImages,
  cleanupContainerStorage,
  deleteContainerImage,
  reorderContainerImages,
  setPrimaryContainerImage,
} from "@/app/owner/containers/images/actions";

type ContainerImageManagerProps = {
  containerId: string;
  initialImages: ManagedContainerImage[];
};

export default function ContainerImageManager({
  containerId,
  initialImages,
}: ContainerImageManagerProps) {
  const [images, setImages] =
    useState<ManagedContainerImage[]>(initialImages);

  const [errors, setErrors] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [confirmingDelete, setConfirmingDelete] =
    useState<ManagedContainerImage | null>(null);
  const [busyActionId, setBusyActionId] = useState<
    string | null
  >(null);

  const inputRef = useRef<HTMLInputElement>(null);

  async function handleNewFiles(files: FileList | null) {
    if (!files || files.length === 0 || uploading) {
      return;
    }

    const newErrors: string[] = [];
    const valid: { id: string; file: File; path: string }[] =
      [];
    let skippedLimit = 0;

    Array.from(files).forEach((file) => {
      if (
        images.length + valid.length >=
        MAX_CONTAINER_IMAGES
      ) {
        skippedLimit++;
        return;
      }

      const validationError = validateImageFile(file);

      if (validationError) {
        newErrors.push(validationError);
        return;
      }

      const path = generateImageStoragePath(containerId, file);

      if (!path) {
        newErrors.push(
          `${file.name}: unsupported image type.`
        );
        return;
      }

      valid.push({
        id: crypto.randomUUID(),
        file,
        path,
      });
    });

    if (skippedLimit > 0) {
      newErrors.push(
        `${skippedLimit} file${skippedLimit === 1 ? "" : "s"} skipped. Maximum ${MAX_CONTAINER_IMAGES} images allowed.`
      );
    }

    setErrors(newErrors);

    if (valid.length === 0) {
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      return;
    }

    setUploading(true);
    setUploadProgress({ current: 0, total: valid.length });

    const uploadedPaths: string[] = [];
    const inputs: ContainerImageInput[] = [];
    const supabase = createClient();

    try {
      /* Upload first, then record in the database */
      for (let index = 0; index < valid.length; index++) {
        const item = valid[index];

        const { error: uploadError } = await supabase.storage
          .from(CONTAINER_IMAGE_BUCKET)
          .upload(item.path, item.file, {
            contentType: item.file.type,
            upsert: false,
            cacheControl: "3600",
          });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        uploadedPaths.push(item.path);
        inputs.push({
          storage_path: item.path,
          is_primary: false,
        });

        setUploadProgress({
          current: index + 1,
          total: valid.length,
        });
      }

      const result = await addContainerImages(
        containerId,
        inputs
      );

      if (!result.ok) {
        /* Clean up successfully uploaded orphan files */
        await cleanupContainerStorage(
          containerId,
          uploadedPaths
        ).catch(() => {});

        setErrors([result.error]);
        return;
      }

      setImages(result.data ?? images);
      setErrors([]);
    } catch {
      if (uploadedPaths.length > 0) {
        await cleanupContainerStorage(
          containerId,
          uploadedPaths
        ).catch(() => {});
      }

      setErrors([
        "Image upload failed. Please try again.",
      ]);
    } finally {
      setUploading(false);
      setUploadProgress(null);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  async function handleSetPrimary(
    image: ManagedContainerImage
  ) {
    setBusyActionId(image.id);

    const result = await setPrimaryContainerImage(image.id);

    setBusyActionId(null);

    if (!result.ok) {
      setErrors([result.error]);
      return;
    }

    setImages((current) =>
      current.map((item) => ({
        ...item,
        is_primary: item.id === image.id,
      }))
    );
    setErrors([]);
  }

  async function handleDelete(
    image: ManagedContainerImage
  ) {
    setConfirmingDelete(null);
    setBusyActionId(image.id);

    const result = await deleteContainerImage(image.id);

    setBusyActionId(null);

    if (!result.ok) {
      setErrors([result.error]);
      return;
    }

    setImages((current) =>
      current.filter((item) => item.id !== image.id)
    );
    setErrors([]);
  }

  async function handleMove(
    imageId: string,
    direction: -1 | 1
  ) {
    const index = images.findIndex(
      (image) => image.id === imageId
    );

    const targetIndex = index + direction;

    if (
      index < 0 ||
      targetIndex < 0 ||
      targetIndex >= images.length
    ) {
      return;
    }

    const previous = images;
    const next = [...images];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);

    const withOrder = next.map((image, orderIndex) => ({
      ...image,
      display_order: orderIndex,
    }));

    /* Optimistic update */
    setImages(withOrder);
    setBusyActionId(imageId);

    const result = await reorderContainerImages(
      containerId,
      withOrder.map((image) => image.id)
    );

    setBusyActionId(null);

    if (!result.ok) {
      setImages(previous);
      setErrors([result.error]);
    }
  }

  const remainingSlots =
    MAX_CONTAINER_IMAGES - images.length;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="block text-sm font-semibold text-slate-700">
          Container Images
        </label>

        <span className="text-xs font-medium text-slate-400">
          {images.length} of {MAX_CONTAINER_IMAGES}
        </span>
      </div>

      {/* UPLOAD */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        disabled={uploading || remainingSlots === 0}
        onChange={(event) => handleNewFiles(event.target.files)}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading || remainingSlots === 0}
        className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm font-semibold text-slate-500 transition hover:border-teal-600 hover:bg-teal-50/50 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {uploading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>
              Uploading {uploadProgress?.current ?? 0} of{" "}
              {uploadProgress?.total ?? 0}...
            </span>
          </>
        ) : (
          <>
            <ImagePlus className="h-5 w-5" />
            <span>+ Upload additional images</span>
            <span className="text-xs font-normal text-slate-400">
              JPEG, PNG, WebP • up to {MAX_IMAGE_SIZE_LABEL}{" "}
              each
            </span>
          </>
        )}
      </button>

      {uploading && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-teal-600 transition-all"
            style={{
              width: `${
                ((uploadProgress?.current ?? 0) /
                  Math.max(
                    1,
                    uploadProgress?.total ?? 1
                  )) *
                100
              }%`,
            }}
          />
        </div>
      )}

      {/* ERRORS */}
      {errors.length > 0 && (
        <div className="mt-3 space-y-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          {errors.map((message, index) => (
            <p
              key={`${message}-${index}`}
              className="text-xs font-medium text-red-700"
            >
              {message}
            </p>
          ))}
        </div>
      )}

      {/* EXISTING IMAGES */}
      {images.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image, index) => {
            const isPrimary = image.is_primary;
            const busy = busyActionId === image.id;

            return (
              <div
                key={image.id}
                className={`overflow-hidden rounded-xl border-2 bg-slate-100 ${
                  isPrimary
                    ? "border-teal-600"
                    : "border-slate-200"
                }`}
              >
                <div className="relative aspect-square w-full">
                  <img
                    src={image.url}
                    alt={`Container image ${index + 1}`}
                    className="h-full w-full object-cover"
                  />

                  {isPrimary && (
                    <div className="absolute left-2 top-2 rounded-full bg-teal-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow">
                      Primary
                    </div>
                  )}

                  {busy && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40">
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                    </div>
                  )}
                </div>

                {/* ACTIONS */}
                <div className="flex items-center gap-1 bg-white/95 px-1.5 py-1.5">
                  {!isPrimary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(image)}
                      disabled={busy}
                      title="Set as primary image"
                      className="flex h-7 flex-1 items-center justify-center gap-1 rounded-lg bg-slate-100 text-[10px] font-bold text-slate-700 transition hover:bg-teal-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Star className="h-3 w-3" />
                      Primary
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleMove(image.id, -1)}
                    disabled={busy || index === 0}
                    title="Move left"
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMove(image.id, 1)}
                    disabled={
                      busy || index === images.length - 1
                    }
                    title="Move right"
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(image)}
                    disabled={busy}
                    title="Delete image"
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-2 text-xs text-slate-400">
        Up to {MAX_CONTAINER_IMAGES} images •{" "}
        {MAX_IMAGE_SIZE_LABEL} each • JPEG, PNG, WebP
        {remainingSlots === 0 && " • Maximum reached"}
      </p>

      {/* DELETE CONFIRMATION */}
      {confirmingDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  Delete this image?
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Are you sure you want to delete this image?
                  This action cannot be undone.
                  {confirmingDelete.is_primary &&
                    " Your next image will automatically become the primary image."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setConfirmingDelete(null)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
              <img
                src={confirmingDelete.url}
                alt="Image to delete"
                className="max-h-40 w-full object-cover"
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmingDelete(null)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleDelete(confirmingDelete)}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
