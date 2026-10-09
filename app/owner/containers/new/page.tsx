import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import AddContainerForm from "@/components/AddContainerForm";

export default async function NewContainerPage() {
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

  if (!profile || !["owner", "admin"].includes(profile.role)) {
    redirect("/profile");
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6 lg:px-8">
          <Link
            href="/owner"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div> */}

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-semibold text-teal-700">
            Owner Dashboard
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Add a Container
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Add your container so renters can discover and request it.
          </p>
        </div>

        <AddContainerForm />
      </div>
    </main>
  );
}