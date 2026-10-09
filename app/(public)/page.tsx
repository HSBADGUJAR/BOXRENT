import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import HomePageClient from "./HomePageClient";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "owner" || profile?.role === "admin") {
      redirect("/owner");
    }

    redirect("/containers");
  }

  return <HomePageClient />;
}
