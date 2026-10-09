"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import {
  CONTAINER_IMAGE_BUCKET,
  generateImageStoragePath,
  type ContainerImageInput,
} from "@/lib/container-images";
import { createContainer } from "@/app/owner/containers/new/actions";
import {
  addContainerImages,
  cleanupContainerStorage,
} from "@/app/owner/containers/images/actions";
import ImagePicker, {
  type StagedImage,
} from "@/components/ImagePicker";
import CategorySelector from "@/components/CategorySelector";

export default function AddContainerForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const formError = searchParams.get("error");

  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    string | null
  >(null);

  const [stagedImages, setStagedImages] = useState<
    StagedImage[]
  >([]);

  const [primaryId, setPrimaryId] = useState<string | null>(
    null
  );

  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const submittingRef = useRef(false);

  async function handleSubmit(formData: FormData) {
    if (submittingRef.current) {
      return;
    }

    submittingRef.current = true;
    setSubmitError("");
    setIsSubmitting(true);

    if (!selectedCategoryId) {
      setSubmitError("Please select a category");
      setIsSubmitting(false);
      submittingRef.current = false;
      return;
    }

    try {
      formData.set("category_id", selectedCategoryId);
      formData.set("idempotency_key", idempotencyKey);
      const result = await createContainer(formData);
      const containerId = result.id;

      if (stagedImages.length > 0) {
        const supabase = createClient();

        const uploadedPaths: string[] = [];
        const inputs: ContainerImageInput[] = [];

        try {
          for (const staged of stagedImages) {
            const path = generateImageStoragePath(
              containerId,
              staged.file
            );

            if (!path) {
              throw new Error(
                "An image could not be prepared for upload."
              );
            }

            const { error: uploadError } = await supabase.storage
              .from(CONTAINER_IMAGE_BUCKET)
              .upload(path, staged.file, {
                contentType: staged.file.type,
                upsert: false,
                cacheControl: "3600",
              });

            if (uploadError) {
              throw uploadError;
            }

            uploadedPaths.push(path);
            inputs.push({
              storage_path: path,
              is_primary: staged.id === primaryId,
            });
          }

          const addResult = await addContainerImages(
            containerId,
            inputs
          );

          if (!addResult.ok) {
            await cleanupContainerStorage(
              containerId,
              uploadedPaths
            ).catch(() => {});

            router.push(
              `/owner/containers/${containerId}/edit?error=${encodeURIComponent(
                `Container added, but its images could not be saved: ${addResult.error}`
              )}`
            );

            return;
          }
        } catch {
          if (uploadedPaths.length > 0) {
            await cleanupContainerStorage(
              containerId,
              uploadedPaths
            ).catch(() => {});
          }

          router.push(
            `/owner/containers/${containerId}/edit?error=${encodeURIComponent(
              "Container added, but image upload failed. You can add images from the edit page."
            )}`
          );

          return;
        }
      }

      router.push("/owner?success=Container added successfully");
    } finally {
      setIsSubmitting(false);
      submittingRef.current = false;
    }
  }

  return (
    <form
      action={handleSubmit}
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      {(formError || submitError) && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {submitError || formError}
        </div>
      )}

      {/* TITLE */}
      <div>
        <label
          htmlFor="title"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Container Title
        </label>

        <input
          id="title"
          name="title"
          type="text"
          placeholder="20ft Standard Shipping Container"
          required
          disabled={isSubmitting}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      {/* CATEGORY + SIZE */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <CategorySelector
            value={selectedCategoryId}
            onChange={setSelectedCategoryId}
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label
            htmlFor="size"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Size
          </label>

          <select
            id="size"
            name="size"
            required
            defaultValue=""
            disabled={isSubmitting}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="" disabled>
              Select size
            </option>

            <option value="20ft">20ft</option>

            <option value="40ft">40ft</option>
          </select>
        </div>
      </div>

      {/* LOCATION */}
      <div>
        <label
          htmlFor="location"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Location
        </label>

        <input
          id="location"
          name="location"
          type="text"
          placeholder="Surat, Gujarat"
          required
          disabled={isSubmitting}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 disabled:cursor-not-allowed disabled:opacity-60"
        />

        <p className="mt-2 text-xs text-slate-400">
          Enter the city or area where the container is
          currently located.
        </p>
      </div>

      {/* PRICE */}
      <div>
        <label
          htmlFor="price_per_day"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Price per Day
        </label>

        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
            ₹
          </span>

          <input
            id="price_per_day"
            name="price_per_day"
            type="number"
            min="1"
            step="0.01"
            placeholder="500"
            required
            disabled={isSubmitting}
            className="w-full rounded-xl border border-slate-200 py-3 pl-9 pr-4 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>
      </div>

      {/* TOTAL QUANTITY */}
      <div>
        <label
          htmlFor="total_quantity"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Total Container Quantity
        </label>

        <input
          id="total_quantity"
          name="total_quantity"
          type="number"
          min="1"
          step="1"
          placeholder="10"
          required
          disabled={isSubmitting}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 disabled:cursor-not-allowed disabled:opacity-60"
        />

        <p className="mt-2 text-xs text-slate-400">
          How many physical containers of this type do you have available for rental?
        </p>
      </div>

      {/* DESCRIPTION */}
      <div>
        <label
          htmlFor="description"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Description
        </label>

        <textarea
          id="description"
          name="description"
          rows={5}
          placeholder="Describe the condition, features and suitable use of your container..."
          disabled={isSubmitting}
          className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 disabled:cursor-not-allowed disabled:opacity-60"
        />

        <p className="mt-2 text-xs text-slate-400">
          Give renters useful information about the container.
        </p>
      </div>

      {/* IMAGES */}
      <ImagePicker
        images={stagedImages}
        primaryId={primaryId}
        onImagesChange={setStagedImages}
        onPrimaryChange={setPrimaryId}
        disabled={isSubmitting}
      />

      {/* INFO */}
      <div className="rounded-xl bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-800">
          Listing visibility
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          Your container will be created as active and can
          immediately appear in the renter marketplace.
          The primary image is shown on container cards.
        </p>
      </div>

      {/* SUBMIT */}
      <button
        type="submit"
        disabled={isSubmitting || !selectedCategoryId}
        className="w-full rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Adding Container..." : "Add Container"}
      </button>
    </form>
  );
}
