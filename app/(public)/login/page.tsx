import { redirect } from "next/navigation";
import Link from "next/link";
import { LogIn } from "lucide-react";

import { login } from "./actions";
import { createClient } from "@/lib/supabase/server";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({
  searchParams,
}: LoginPageProps) {
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

  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        {/* LOGO */}
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="text-2xl font-bold tracking-tight text-slate-950"
          >
            BoxRent
          </Link>

          <p className="mt-2 text-sm text-slate-500">
            Sign in to your BoxRent account
          </p>
        </div>

        {/* CARD */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <LogIn className="h-6 w-6" />
          </div>

          <h1 className="text-2xl font-bold text-slate-950">
            Welcome back
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Login to continue renting containers.
          </p>

          {params.error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {params.error}
            </div>
          )}

          <form
            action={login}
            className="mt-6 space-y-5"
          >
            <div>
              <label
                htmlFor="email"
                className="text-sm font-semibold text-slate-800"
              >
                Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-sm font-semibold text-slate-800"
                >
                  Password
                </label>

                <span className="text-xs text-slate-400">
                  Minimum 8 characters
                </span>
              </div>

              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-teal-700"
            >
              Login
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold text-teal-700 hover:text-teal-800"
            >
              Create account
            </Link>
          </p>
        </div>

        <Link
          href="/containers"
          className="mt-6 block text-center text-sm font-medium text-slate-500 hover:text-slate-950"
        >
          ← Continue browsing containers
        </Link>
      </div>
    </main>
  );
}
