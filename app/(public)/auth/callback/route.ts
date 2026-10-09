import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } =
    new URL(request.url);

  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();

    const { error } =
      await supabase.auth.exchangeCodeForSession(
        code
      );

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role === "owner" || profile?.role === "admin") {
          return NextResponse.redirect(`${origin}/owner`);
        }
      }

      return NextResponse.redirect(`${origin}/containers`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=Unable to verify your email`
  );
}
