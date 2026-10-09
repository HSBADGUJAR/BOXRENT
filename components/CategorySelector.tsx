"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { createCategory } from "@/app/actions/categories";
import type { Category } from "@/lib/types";

type CategorySelectorProps = {
  value?: string | null;
  onChange: (categoryId: string) => void;
  name?: string;
  required?: boolean;
  disabled?: boolean;
};

export default function CategorySelector({
  value,
  onChange,
  name = "category_id",
  required = true,
  disabled = false,
}: CategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    const supabase = createClient();
    const { data } = await supabase
      .from("container_categories")
      .select("id, name, slug, description, is_active")
      .eq("is_active", true)
      .order("name");

    if (data) {
      setCategories(data);
    }
    setLoading(false);
  }

  const handleCreateCategory = useCallback(async () => {
    setCreateError("");
    setCreating(true);

    const formData = new FormData();
    formData.append("name", newName.trim());
    formData.append("description", newDescription.trim());

    const result = await createCategory(formData);

    if (!result.success || !result.category) {
      setCreateError(result.error || "Failed to create category");
      setCreating(false);
      return;
    }

    const newCategory: Category = {
      id: result.category.id,
      name: result.category.name,
      slug: result.category.slug,
      description: null,
      is_active: true,
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setCategories((prev) => [...prev, newCategory]);
    onChange(newCategory.id);
    setShowModal(false);
    setNewName("");
    setNewDescription("");
    setTouched(true);
    setCreating(false);
  }, [newName, newDescription, onChange]);

  const selectedCategory = categories.find((c) => c.id === value);

  return (
    <>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        Container Category
      </label>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <select
            id={name}
            name={name}
            required={required}
            disabled={disabled || loading}
            value={value || ""}
            onChange={(e) => {
              onChange(e.target.value);
              setTouched(true);
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="" disabled>
              {loading ? "Loading categories..." : "Select category"}
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {touched && !value && required && (
        <p className="mt-2 text-xs text-red-600">
          Please select a category
        </p>
      )}

      <button
        type="button"
        onClick={() => {
          setShowModal(true);
          setCreateError("");
          setNewName("");
          setNewDescription("");
        }}
        disabled={disabled}
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">
          +
        </span>
        Add New Category
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-950">
              Add New Category
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Create a new container category.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="new-category-name"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Category Name
                </label>

                <input
                  id="new-category-name"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Refrigerated Container"
                  required
                  autoFocus
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                />
              </div>

              <div>
                <label
                  htmlFor="new-category-description"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Description
                </label>

                <textarea
                  id="new-category-description"
                  value={newDescription}
                  onChange={(e) =>
                    setNewDescription(e.target.value)
                  }
                  rows={3}
                  placeholder="Optional description"
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                />
              </div>

              {createError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {createError}
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setCreateError("");
                  setNewName("");
                  setNewDescription("");
                }}
                disabled={creating}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCreateCategory}
                disabled={
                  creating ||
                  !newName.trim() ||
                  newName.trim().length < 2
                }
                className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creating
                  ? "Creating..."
                  : "Create Category"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
