"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { redirectByRole } from "@/lib/auth/redirectByRole";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(
    formData.get("password") || ""
  );

  if (!email || !password) {
    redirect("/login?error=Please enter email and password");
  }

  const supabase = await createClient();

  const { error } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (error) {
    redirect(
      `/login?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  revalidatePath("/", "layout");
  await redirectByRole();
}

export async function signup(formData: FormData) {
  const fullName = String(
    formData.get("full_name") || ""
  ).trim();

  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();

  const password = String(
    formData.get("password") || ""
  );

  const confirmPassword = String(
    formData.get("confirm_password") || ""
  );

  if (!fullName || !email || !password) {
    redirect(
      "/signup?error=Please fill in all required fields"
    );
  }

  if (password.length < 8) {
    redirect(
      "/signup?error=Password must be at least 8 characters"
    );
  }

  if (password !== confirmPassword) {
    redirect(
      "/signup?error=Passwords do not match"
    );
  }

  const supabase = await createClient();

  const { data, error } =
    await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

  if (error) {
    redirect(
      `/signup?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  /*
   * If email confirmation is enabled,
   * Supabase returns a user but no active session.
   */
  if (data.user && !data.session) {
    redirect(
      "/signup?success=Check your email to confirm your account"
    );
  }

revalidatePath("/", "layout");
await redirectByRole();
}