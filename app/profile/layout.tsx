import { createClient } from "@/lib/supabase/server";
import OwnerSidebar from "@/components/owner/OwnerSidebar";
import SiteNavbar from "@/components/SiteNavbar";

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isOwner = false;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    isOwner = profile?.role === "owner" || profile?.role === "admin";
  }

  if (!isOwner) {
    return (
      <>
        <SiteNavbar />
        {children}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <OwnerSidebar />

      <main className="min-h-screen w-full pt-16 lg:ml-64 lg:w-[calc(100%-16rem)] lg:pt-0">
        {children}
      </main>
    </div>
  );
}