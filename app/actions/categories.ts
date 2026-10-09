"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export interface CreateCategoryResult {
  success: boolean;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  error?: string;
}

export async function createCategory(
  formData: FormData
): Promise<CreateCategoryResult> {
  const rawName = String(formData.get("name") || "").trim();
  const description = String(
    formData.get("description") || ""
  ).trim() || null;

  if (!rawName || rawName.length < 2) {
    return {
      success: false,
      error: "Category name must be at least 2 characters",
    };
  }

  if (rawName.length > 100) {
    return {
      success: false,
      error: "Category name must be 100 characters or less",
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Please login first",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["owner", "admin"].includes(profile.role)) {
    return {
      success: false,
      error: "Only owners and admins can create categories",
    };
  }

  const slug = rawName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const { data: existing } = await supabase
    .from("container_categories")
    .select("id")
    .or(
      `name.ilike.${rawName.replace(/'/g, "''")},slug.eq.${slug.replace(/'/g, "''")}`
    )
    .maybeSingle();

  if (existing) {
    return {
      success: false,
      error:
        "Category already exists. Please select the existing category.",
    };
  }

  const { data: category, error } = await supabase
    .from("container_categories")
    .insert({
      name: rawName,
      slug,
      description,
      is_active: true,
      created_by: user.id,
    })
    .select("id, name, slug")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        error:
          "Category already exists. Please select the existing category.",
      };
    }

    return {
      success: false,
      error: error?.message || "Failed to create category",
    };
  }

  if (!category) {
    return {
      success: false,
      error: "Failed to create category",
    };
  }

  revalidatePath("/");
  revalidatePath("/containers");
  revalidatePath("/owner");

  return {
    success: true,
    category: {
      id: category.id,
      name: category.name,
      slug: category.slug,
    },
  };
}
