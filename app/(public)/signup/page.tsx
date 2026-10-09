import { redirect } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Container,
  DollarSign,
  Eye,
  Lock,
  Mail,
  ShieldCheck,
  TrendingUp,
  User,
  UserPlus,
  Users,
} from "lucide-react";

import { signup } from "../login/actions";
import { createClient } from "@/lib/supabase/server";

type SignupPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
    source?: string;
  }>;
};

export default async function SignupPage({
  searchParams,
}: SignupPageProps) {
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

  const isFromListContainer = params.source === "list-container";

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-teal-50/30" />
      
      {isFromListContainer ? (
        <>
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-teal-200/50 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-teal-100/50 blur-3xl" />
          
          {/* Container visual elements in background */}
          <div className="absolute top-20 left-10 opacity-5 hidden lg:block">
            <ContainerVisual className="h-64 w-64 rotate-[-15deg]" />
          </div>
          <div className="absolute bottom-20 right-10 opacity-5 hidden lg:block">
            <ContainerVisual className="h-48 w-48 rotate-[15deg]" />
          </div>
        </>
      ) : (
        <>
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-teal-200/30 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-teal-100/30 blur-3xl" />
        </>
      )}

      <div className="relative flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="relative w-full max-w-6xl">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_0.95fr] lg:gap-14">
            {/* LEFT PANEL - Marketing content for owner signup */}
            {isFromListContainer && (
              <div className="relative z-10 text-center lg:text-left lg:pt-8">
                <Link
                  href="/"
                  className="inline-flex items-center gap-3 text-2xl font-black tracking-tight text-slate-950"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-900/15">
                    <Container className="h-5 w-5 text-teal-300" />
                  </span>
                  BoxRent
                </Link>

                <div className="mt-8 max-w-2xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-700 shadow-sm">
                    <TrendingUp className="h-4 w-4" />
                    Built for container owners
                  </div>

                  <h1 className="mt-6 text-4xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
                    Turn idle containers
                    <span className="block text-teal-700">
                      into steady income
                    </span>
                  </h1>

                  <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">
                    List your shipping containers, connect with verified
                    renters, and manage bookings from one secure workspace.
                  </p>

                  <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    {[
                      { icon: <DollarSign className="h-5 w-5" />, title: "Set your own prices", desc: "Full control over daily rental rates" },
                      { icon: <Users className="h-5 w-5" />, title: "Verified renters", desc: "Pre-screened businesses only" },
                      { icon: <ShieldCheck className="h-5 w-5" />, title: "Secure payments", desc: "Protected transactions and contracts" },
                      { icon: <TrendingUp className="h-5 w-5" />, title: "Grow your revenue", desc: "Turn unused assets into profit" },
                    ].map((item) => (
                      <div
                        key={item.title}
                        className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                          {item.icon}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-950">{item.title}</h3>
                          <p className="mt-1 text-sm leading-5 text-slate-500">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row">
                    <Link
                      href="#"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-3.5 font-semibold text-white transition hover:bg-teal-700 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                    >
                      Calculate potential earnings
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/containers"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 font-semibold text-slate-700 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                    >
                      Browse marketplace
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* RIGHT PANEL - Signup Form */}
            <div className="relative z-10">
              <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white/95 shadow-[0_24px_80px_-32px_rgba(15,118,110,0.28)] backdrop-blur-sm sm:p-2">
                <div className="rounded-[22px] bg-white p-6 sm:p-8">
                  <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    {!isFromListContainer && (
                      <div className="text-left">
                        <Link
                          href="/"
                          className="inline-flex items-center gap-2 text-xl font-black tracking-tight text-slate-950"
                        >
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white">
                            <Container className="h-4 w-4 text-teal-300" />
                          </span>
                          BoxRent
                        </Link>
                        <p className="mt-2 text-sm text-slate-500">
                          Create your renter account
                        </p>
                      </div>
                    )}

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                      <UserPlus className="h-6 w-6" />
                    </div>
                  </div>

                  <div className="pt-6">
                    <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                      {isFromListContainer ? "Owner onboarding" : "Renter onboarding"}
                    </div>

                    <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                      {isFromListContainer
                        ? "Create your owner account"
                        : "Create your account"}
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {isFromListContainer
                        ? "Start listing containers in minutes."
                        : "Join BoxRent and start renting containers."}
                    </p>

                    <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      Secure account setup · No payment required
                    </div>

                    {params.error && (
                      <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                        <span>{params.error}</span>
                      </div>
                    )}

                    {params.success && (
                      <div className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                        <span>{params.success}</span>
                      </div>
                    )}

                    <form
                      action={signup}
                      className="mt-6 space-y-4"
                      noValidate
                    >
                      <div className="grid gap-4 sm:grid-cols-2">
                        {/* Full Name Field */}
                        <div className="sm:col-span-2">
                          <label
                            htmlFor="full_name"
                            className="mb-2 block text-sm font-semibold text-slate-800"
                          >
                            Full name
                          </label>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                            <input
                              id="full_name"
                              name="full_name"
                              type="text"
                              required
                              autoComplete="name"
                              placeholder="Your full name"
                              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm text-slate-900 outline-none transition hover:border-slate-300 focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-100"
                            />
                          </div>
                        </div>

                        {/* Email Field */}
                        <div className="sm:col-span-2">
                          <label
                            htmlFor="email"
                            className="mb-2 block text-sm font-semibold text-slate-800"
                          >
                            Email address
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                            <input
                              id="email"
                              name="email"
                              type="email"
                              required
                              autoComplete="email"
                              placeholder="you@example.com"
                              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm text-slate-900 outline-none transition hover:border-slate-300 focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-100"
                            />
                          </div>
                        </div>

                        {/* Password Field with Strength Meter */}
                        <div className="sm:col-span-2">
                          <label
                            htmlFor="password"
                            className="mb-2 block text-sm font-semibold text-slate-800"
                          >
                            Password
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                            <input
                              id="password"
                              name="password"
                              type="password"
                              required
                              minLength={8}
                              autoComplete="new-password"
                              placeholder="Minimum 8 characters"
                              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm text-slate-900 outline-none transition hover:border-slate-300 focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-100"
                            />
                          </div>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full w-0 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-300" />
                          </div>
                          <p className="mt-1.5 text-xs text-slate-400">
                            Password strength: <span className="font-semibold text-slate-500">Too weak</span>
                          </p>
                        </div>

                        {/* Confirm Password Field */}
                        <div className="sm:col-span-2">
                          <label
                            htmlFor="confirm_password"
                            className="mb-2 block text-sm font-semibold text-slate-800"
                          >
                            Confirm password
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                            <input
                              id="confirm_password"
                              name="confirm_password"
                              type="password"
                              required
                              minLength={8}
                              autoComplete="new-password"
                              placeholder="Re-enter your password"
                              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm text-slate-900 outline-none transition hover:border-slate-300 focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-100"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Terms & Conditions */}
                      <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                        <input
                          id="terms"
                          name="terms"
                          type="checkbox"
                          required
                          className="mt-0.5 h-4 w-4 cursor-pointer rounded border-slate-300 text-teal-700 focus:ring-2 focus:ring-teal-500"
                        />
                        <label htmlFor="terms" className="text-sm leading-5 text-slate-600">
                          I agree to the{" "}
                          <Link href="/terms" className="font-semibold text-teal-700 underline-offset-2 hover:text-teal-800 hover:underline">
                            Terms of Service
                          </Link>{" "}
                          and{" "}
                          <Link href="/privacy" className="font-semibold text-teal-700 underline-offset-2 hover:text-teal-800 hover:underline">
                            Privacy Policy
                          </Link>
                        </label>
                      </div>

                      <button
                        type="submit"
                        className="group flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-teal-700 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isFromListContainer
                          ? "Start listing containers"
                          : "Create Account"}
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                      </button>
                    </form>

                    <div className="relative mt-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="bg-white px-4 text-slate-500">
                          Already have an account?
                        </span>
                      </div>
                    </div>

                    <Link
                      href="/login"
                      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Login to your account
                    </Link>

                    {!isFromListContainer && (
                      <div className="mt-7 border-t border-slate-200 pt-6">
                        <p className="mb-3 text-center text-sm font-medium text-slate-500">
                          Or continue as an owner
                        </p>
                        <Link
                          href="/signup?source=list-container"
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-5 py-3 text-sm font-semibold text-teal-700 transition hover:border-teal-300 hover:bg-teal-100 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                        >
                          <Container className="h-4 w-4" />
                          List your container
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    )}

                    <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Your data is encrypted and secure</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function ContainerVisual({ className }: { className?: string }) {
  return (
    <div className={className}>
      {/* Container body */}
      <div className="relative h-full w-full rounded-lg border border-slate-400/40 bg-gradient-to-b from-slate-500 to-slate-700 shadow-2xl">
        {/* Corrugation */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent 0px, transparent 15px, rgba(255,255,255,0.12) 16px, rgba(0,0,0,0.18) 18px)",
          }}
        />

        {/* Top rail */}
        <div className="absolute left-0 right-0 top-0 h-4 bg-slate-800/80" />

        {/* Bottom rail */}
        <div className="absolute bottom-0 left-0 right-0 h-5 bg-slate-900/90" />

        {/* Corner posts */}
        <div className="absolute bottom-0 left-0 top-0 w-6 bg-slate-800/90" />
        <div className="absolute bottom-0 right-0 top-0 w-6 bg-slate-800/90" />

        {/* Logo */}
        <div className="absolute left-8 top-8">
          <p className="text-xl font-black tracking-widest text-white/90">
            BOXRENT
          </p>
          <p className="mt-1 text-[9px] tracking-[0.35em] text-slate-300">
            CARGO • STORAGE • LOGISTICS
          </p>
        </div>

        {/* Container number */}
        <div className="absolute bottom-8 left-8 font-mono text-xs tracking-widest text-white/60">
          BXRU 204581
        </div>

        {/* Door section */}
        <div className="absolute bottom-5 right-8 top-5 flex w-32 gap-2 border-l border-slate-900/40 pl-3">
          <div className="flex-1 rounded-sm border border-slate-900/40 bg-slate-600/50" />
          <div className="flex-1 rounded-sm border border-slate-900/40 bg-slate-600/50" />

          {/* Lock bars */}
          <div className="absolute left-1/2 top-1/2 h-24 w-1 -translate-x-1/2 -translate-y-1/2 bg-slate-300/50" />
          <div className="absolute left-1/2 top-1/2 h-24 w-1 -translate-x-[1px] -translate-y-1/2 bg-slate-300/50" />
        </div>

        {/* Warning badge */}
        <div className="absolute bottom-9 right-[175px] flex h-9 w-9 items-center justify-center rounded-sm bg-yellow-400 text-[8px] font-black text-slate-900">
          ⚠
        </div>
      </div>

      {/* Container shadow */}
      <div className="mx-auto mt-4 h-5 w-[85%] rounded-full bg-black/30 blur-xl" />
    </div>
  );
}