"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Star, X } from "lucide-react";

import {
  MAX_CONTAINER_IMAGES,
  MAX_IMAGE_SIZE_LABEL,
  validateImageFile,
} from "@/lib/container-images";

export type StagedImage = {
  id: string;
  file: File;
  previewUrl: string;
};

type ImagePickerProps = {
  images: StagedImage[];
  primaryId: string | null;
  onImagesChange: (images: StagedImage[]) => void;
  onPrimaryChange: (id: string | null) => void;
  disabled?: boolean;
};

export default function ImagePicker({
  images,
  primaryId,
  onImagesChange,
  onPrimaryChange,
  disabled,
}: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  /*
   * Revoke object URLs that are no longer used
   * (incremental cleanup on every change).
   */
  useEffect(() => {
    const currentUrls = images.map(
      (image) => image.previewUrl
    );

    previewUrlsRef.current.forEach((url) => {
      if (!currentUrls.includes(url)) {
        URL.revokeObjectURL(url);
      }
    });

    previewUrlsRef.current = currentUrls;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images]);

  /* Revoke all remaining object URLs on unmount */
  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      previewUrlsRef.current = [];
    };
  }, []);

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }

    const newErrors: string[] = [];
    const accepted: StagedImage[] = [];
    let skippedLimit = 0;

    Array.from(files).forEach((file) => {
      if (images.length + accepted.length >= MAX_CONTAINER_IMAGES) {
        skippedLimit++;
        return;
      }

      const validationError = validateImageFile(file);

      if (validationError) {
        newErrors.push(validationError);
        return;
      }

      accepted.push({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      });
    });

    if (skippedLimit > 0) {
      newErrors.push(
        `${skippedLimit} file${skippedLimit === 1 ? "" : "s"} skipped. Maximum ${MAX_CONTAINER_IMAGES} images allowed.`
      );
    }

    setErrors(newErrors);

    if (accepted.length > 0) {
      const next = [...images, ...accepted];
      onImagesChange(next);

      /* Rule: first image becomes primary when none is selected */
      if (!primaryId) {
        onPrimaryChange(next[0].id);
      }
    }

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function removeImage(id: string) {
    const next = images.filter((image) => image.id !== id);
    onImagesChange(next);

    if (primaryId === id) {
      onPrimaryChange(next[0]?.id ?? null);
    }
  }

  const remainingSlots = MAX_CONTAINER_IMAGES - images.length;

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

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        disabled={disabled}
        onChange={(event) => handleFiles(event.target.files)}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || remainingSlots === 0}
        className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm font-semibold text-slate-500 transition hover:border-teal-600 hover:bg-teal-50/50 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <ImagePlus className="h-6 w-6" />
        <span>+ Upload Images</span>
        <span className="text-xs font-normal text-slate-400">
          JPEG, PNG, WebP • up to {MAX_IMAGE_SIZE_LABEL} each
        </span>
      </button>

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

      {images.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((image) => {
            const isPrimary = image.id === primaryId;

            return (
              <div
                key={image.id}
                className={`group relative overflow-hidden rounded-xl border-2 bg-slate-100 ${
                  isPrimary
                    ? "border-teal-600"
                    : "border-slate-200"
                }`}
              >
                <div className="aspect-square w-full">
                  <img
                    src={image.previewUrl}
                    alt="Container preview"
                    className="h-full w-full object-cover"
                  />
                </div>

                {isPrimary && (
                  <div className="absolute left-2 top-2 rounded-full bg-teal-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow">
                    Primary
                  </div>
                )}

                <div className="absolute inset-x-2 bottom-2 flex items-center justify-center gap-1.5 opacity-0 transition group-hover:opacity-100">
                  {!isPrimary && (
                    <button
                      type="button"
                      onClick={() => onPrimaryChange(image.id)}
                      disabled={disabled}
                      title="Set as primary image"
                      className="flex h-7 flex-1 items-center justify-center gap-1 rounded-lg bg-white/95 text-[10px] font-bold text-slate-700 shadow hover:bg-teal-600 hover:text-white"
                    >
                      <Star className="h-3 w-3" />
                      Primary
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => removeImage(image.id)}
                    disabled={disabled}
                    title="Remove image"
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/95 text-slate-700 shadow hover:bg-red-600 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-2 text-xs text-slate-400">
        Up to {MAX_CONTAINER_IMAGES} images • {MAX_IMAGE_SIZE_LABEL} each •
        JPEG, PNG, WebP
        {remainingSlots === 0 &&
          " • Maximum reached"}
      </p>
    </div>
  );
}
