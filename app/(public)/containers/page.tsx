import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CONTAINER_IMAGE_BUCKET, SIGNED_URL_TTL_SECONDS } from "@/lib/container-images";
import { ShieldCheck, Truck, Sparkles, ArrowLeft } from "lucide-react";
import ContainersClient from "./ContainersClient";

type ContainerItem = {
  id: string;
  title: string;
  category_id: string | null;
  container_type: string;
  size: string;
  location: string;
  price_per_day: number;
  total_quantity: number;
  description: string | null;
  is_available: boolean;
  created_at: string;
  container_categories?: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

type Category = {
  id: string;
  name: string;
  slug: string;
};

async function getContainers() {
  const supabase = await createClient();

  const { data: containers } = await supabase
    .from("containers")
    .select(`
      *,
      container_categories (
        id,
        name,
        slug
      )
    `)
    .eq("is_available", true)
    .order("created_at", { ascending: false });

  return containers ?? [];
}

async function getCategories() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("container_categories")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("name");

  return data ?? [];
}

async function getPrimaryImages(containerIds: string[]) {
  if (containerIds.length === 0) return new Map<string, string>();

  const supabase = await createClient();

  const { data: images } = await supabase
    .from("container_images")
    .select("container_id, storage_path")
    .eq("is_primary", true)
    .in("container_id", containerIds);

  if (!images || images.length === 0) return new Map<string, string>();

  const storagePaths = images.map((img) => img.storage_path);

  const { data: signed } = await supabase.storage
    .from(CONTAINER_IMAGE_BUCKET)
    .createSignedUrls(storagePaths, SIGNED_URL_TTL_SECONDS);

  const imageMap = new Map<string, string>();

  (signed ?? []).forEach((entry, index) => {
    const url = entry?.signedUrl;
    if (url) {
      imageMap.set(images[index].container_id, url);
    }
  });

  return imageMap;
}

export default async function ContainersPage() {
  const [containers, categories] = await Promise.all([getContainers(), getCategories()]);
  const primaryImages = await getPrimaryImages(containers.map((c) => c.id));

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.10),_transparent_38%)]" />
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-teal-100/70 blur-3xl" />
        <div className="absolute left-1/3 top-20 h-60 w-60 rounded-full bg-cyan-100/50 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          {/* <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-sm font-medium text-slate-600 backdrop-blur-sm transition hover:border-slate-300 hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link> */}

          <div className="grid items-end gap-10 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-teal-700">
                <Sparkles className="h-3.5 w-3.5" />
                Container Marketplace
              </div>

              <h1 className="mt-5 text-4xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
                Move your project forward.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                Browse verified containers from trusted owners,
                compare transparent daily pricing, and reserve the
                right fit without the usual booking hassle.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 font-semibold text-white">
                  <ShieldCheck className="h-4 w-4 text-teal-300" />
                  Verified listings
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 font-medium">
                  <Truck className="h-4 w-4 text-teal-600" />
                  Flexible delivery options
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-xl shadow-slate-900/5 backdrop-blur-sm lg:grid-cols-1">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-2xl font-black text-slate-950">
                  {containers.length}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Active listings
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-2xl font-black text-slate-950">
                  24/7
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Quick requests
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-2xl font-black text-slate-950">
                  100%
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Transparent pricing
                </p>
              </div>
            </div>
          </div>

          <ContainersClient />
        </div>
      </section>
    </main>
  );
}