import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, created_at")
    .eq("id", user.id)
    .single();

  const isOwner = profile?.role === "owner" || profile?.role === "admin";

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Link
          href={isOwner ? "/owner" : "/containers"}
          className="text-sm font-medium text-slate-500 hover:text-slate-950"
        >
          {isOwner ? "Back to dashboard" : "Back to containers"}
        </Link>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">
            My Account
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-950">
            Welcome, {profile?.full_name || "User"}
          </h1>

          <div className="mt-8 space-y-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-400">Email</p>
              <p className="mt-1 font-semibold text-slate-900">{user.email}</p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-400">Account type</p>
              <p className="mt-1 font-semibold capitalize text-slate-900">
                {profile?.role || "renter"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-400">User ID</p>
              <p className="mt-1 break-all font-mono text-xs text-slate-700">
                {user.id}
              </p>
            </div>
          </div>

          <form action="/logout" method="POST" className="mt-8">
            <button
              type="submit"
              className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-500"
            >
              Logout
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}