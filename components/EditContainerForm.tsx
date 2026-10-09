"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";

import { updateContainer } from "@/app/owner/containers/[id]/edit/actions";
import ContainerImageManager from "@/components/ContainerImageManager";
import CategorySelector from "@/components/CategorySelector";
import type { ManagedContainerImage } from "@/lib/container-images";

type Container = {
  id: string;
  title: string;
  category_id: string | null;
  container_type: string;
  size: string;
  location: string;
  price_per_day: number | string;
  total_quantity: number;
  description: string | null;
  is_available: boolean;
};

type EditContainerFormProps = {
  container: Container;
  images?: ManagedContainerImage[];
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving Changes..." : "Save Changes"}
    </button>
  );
}

export default function EditContainerForm({
  container,
  images = [],
}: EditContainerFormProps) {
  const searchParams = useSearchParams();
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    container.category_id
  );

  const error = searchParams.get("error");

  return (
    <form
      action={async (formData) => {
        formData.set("category_id", selectedCategoryId || "");
        await updateContainer(container.id, formData);
      }}
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
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
          defaultValue={container.title}
          required
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
        />
      </div>

      {/* CATEGORY + SIZE */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <CategorySelector
            value={selectedCategoryId}
            onChange={setSelectedCategoryId}
            required
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
            defaultValue={container.size}
            required
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
          >
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
          defaultValue={container.location}
          required
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
        />
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
            defaultValue={container.price_per_day}
            required
            className="w-full rounded-xl border border-slate-200 py-3 pl-9 pr-4 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
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
          defaultValue={container.total_quantity}
          required
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
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
          defaultValue={container.description || ""}
          className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
        />
      </div>

      {/* IMAGES */}
      <ContainerImageManager
        containerId={container.id}
        initialImages={images}
      />

      {/* AVAILABILITY */}
      <div className="rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Listing Availability
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Turn this off if you don't want renters to request
              this container.
            </p>
          </div>

          <select
            name="is_available"
            defaultValue={
              container.is_available ? "true" : "false"
            }
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-slate-950"
          >
            <option value="true">
              Active
            </option>

            <option value="false">
              Inactive
            </option>
          </select>
        </div>
      </div>

      {/* SUBMIT */}
      <SubmitButton />
    </form>
  );
}
