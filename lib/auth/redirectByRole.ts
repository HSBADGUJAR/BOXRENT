import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function redirectByRole(origin?: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/profile");
  }

  const base = origin || "";

  if (profile.role === "owner") {
    redirect(`${base}/owner`);
  }

  if (profile.role === "admin") {
    redirect(`${base}/owner`);
  }

  redirect(`${base}/containers`);
}
