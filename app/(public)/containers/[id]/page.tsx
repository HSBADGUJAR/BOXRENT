"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RentalRequestForm from "@/components/RentalRequestForm";
import ImageGallery from "@/components/ImageGallery";
import {
  ArrowLeft,
  CheckCircle2,
  Container,
  MapPin,
  ShieldCheck,
  Truck,
  Thermometer,
  Ruler,
  Weight,
  DoorOpen,
  Wind,
  Sun,
  ChevronDown,
  ChevronUp,
  Info,
  AlertCircle,
  Calendar,
  Package,
  Lock,
  Home,
} from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/client";
import { CONTAINER_IMAGE_BUCKET } from "@/lib/container-images";

type ContainerItem = {
  id: string;
  title: string;
  category_id: string | null;
  container_type: string;
  size: string;
  location: string;
  price_per_day: number;
  description: string | null;
  is_available: boolean;
  created_at: string;
  container_images: {
    id: string;
    storage_path: string;
    is_primary: boolean;
    display_order: number;
  }[] | null;
  container_categories?: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

type GalleryImage = {
  id: string;
  storage_path: string;
  url: string;
};

export default function ContainerDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const successMessage = searchParams.get("success");
  const errorMessage = searchParams.get("error");
  const id = params.id as string;

  const [container, setContainer] = useState<ContainerItem | null>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: true,
    specifications: true,
    features: true,
  });

  useEffect(() => {
    if (!id) return;
    fetchContainer();
  }, [id]);

  async function fetchContainer() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("containers")
      .select(
        `
        *,
        container_images (
          id,
          storage_path,
          is_primary,
          display_order
        ),
        container_categories (
          id,
          name,
          slug
        )
      `
      )
      .eq("id", id)
      .eq("is_available", true)
      .single();

    if (error) {
      console.error("Supabase container error:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });

      setError("Container could not be found.");
      setContainer(null);
      setGalleryImages([]);
    } else {
      setContainer(data);

      const rawImages = (data.container_images ?? [])
        .slice()
        .sort(
          (
            a: { is_primary: boolean; display_order: number },
            b: { is_primary: boolean; display_order: number }
          ) => {
            if (a.is_primary !== b.is_primary) {
              return a.is_primary ? -1 : 1;
            }
            return a.display_order - b.display_order;
          }
        );

      let galleryImagesResult: GalleryImage[] = [];

      if (rawImages.length > 0) {
        const client = createClient();
        const paths = rawImages.map((img: { storage_path: string }) => img.storage_path);

        const { data: signed } = await client.storage
          .from(CONTAINER_IMAGE_BUCKET)
          .createSignedUrls(paths, 60 * 60 * 24);

        galleryImagesResult = (signed ?? [])
          .map((entry, index) => ({
            id: rawImages[index].id,
            storage_path: rawImages[index].storage_path,
            url: entry?.signedUrl ?? "",
          }))
          .filter((img: GalleryImage) => img.url);
      }

      setGalleryImages(galleryImagesResult);
    }

    setLoading(false);
  }

  if (loading) {
    return <LoadingState />;
  }

  if (error || !container) {
    return <NotFoundState />;
  }

  const categoryName = container.container_categories?.name || container.container_type;

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900 antialiased">
      {/* Top navigation bar */}
      <section className="sticky top-0 z-40 border-b border-stone-200 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-stone-500">
            <Link
              href="/containers"
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 transition hover:bg-stone-100 hover:text-stone-900"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">All containers</span>
            </Link>
            <div className="mx-1 h-4 w-px bg-stone-200" />
            <span className="max-w-[180px] truncate font-medium text-stone-900 sm:max-w-xs">
              {container.title}
            </span>
          </nav>
        </div>
      </section>

      {/* Title block */}
      <section className="relative overflow-hidden border-b border-stone-200 bg-gradient-to-br from-white via-stone-50 to-emerald-50/30">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-emerald-100/60 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-teal-100/50 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="max-w-3xl">
            <div className="mb-5 flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500">
              <span className="h-px w-8 bg-stone-300" />
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">
                <CheckCircle2 className="h-3 w-3" />
                {categoryName}
              </span>
            </div>

            <h1 className="text-4xl font-black tracking-[-0.05em] text-stone-950 sm:text-5xl lg:text-[3.25rem] lg:leading-[1.05]">
              {container.title}
            </h1>

            <p className="mt-4 text-base leading-7 text-stone-600">
              A practical, ready-to-use container with transparent pricing and a simple rental process.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2.5 text-sm text-stone-600">
              <span className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/80 px-3.5 py-2 shadow-sm">
                <MapPin className="h-4 w-4 text-emerald-700" />
                <span className="font-semibold text-stone-900">{container.location}</span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/80 px-3.5 py-2 shadow-sm">
                <Ruler className="h-4 w-4 text-emerald-700" />
                <span className="font-semibold text-stone-900">{container.size}</span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-2 font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Available now
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid items-start gap-6 lg:grid-cols-[1.5fr_1fr] lg:gap-8">
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            {/* 1. Image gallery */}
            <div className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-[0_24px_70px_-42px_rgba(24,39,35,0.35)]">
              <ImageGallery
                images={galleryImages}
                title={container.title}
                isAvailable={container.is_available}
                containerType={categoryName}
                fallback={<ContainerVisual />}
              />
            </div>

            {/* 2. Info stats */}
            <div className="grid gap-3 sm:grid-cols-3">
              <InfoStat label="Rental basis" value="Daily rate" />
              <InfoStat label="Container type" value={categoryName} />
              <InfoStat label="Location" value={container.location.split(",")[0]} />
            </div>

            {/* 3. Container summary */}
            <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                Container summary
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-stone-950 sm:text-3xl">
                Everything you need to know
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
                Review the container details below and submit a rental request when you&apos;re ready.
              </p>
            </div>

            {/* 4. Container overview */}
            <AccordionSection
              title="Container overview"
              subtitle="Thoughtful storage designed for practical use"
              icon={Info}
              isOpen={expandedSections.overview}
              onToggle={() =>
                setExpandedSections({ ...expandedSections, overview: !expandedSections.overview })
              }
            >
              <p className="leading-7 text-stone-600 sm:text-base">
                {container.description || "No description has been provided for this container yet."}
              </p>
            </AccordionSection>

            {/* 5. Specifications */}
            <AccordionSection
              title="Specifications"
              subtitle="Essential details at a glance"
              icon={Package}
              isOpen={expandedSections.specifications}
              onToggle={() =>
                setExpandedSections({
                  ...expandedSections,
                  specifications: !expandedSections.specifications,
                })
              }
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <SpecRow
                  icon={<Container className="h-5 w-5" />}
                  label="Category"
                  value={categoryName}
                />
                <SpecRow
                  icon={<Ruler className="h-5 w-5" />}
                  label="Size"
                  value={container.size}
                />
                <SpecRow
                  icon={<MapPin className="h-5 w-5" />}
                  label="Location"
                  value={container.location}
                />
                <SpecRow
                  icon={<CheckCircle2 className="h-5 w-5" />}
                  label="Availability"
                  value={container.is_available ? "Available" : "Unavailable"}
                  status={container.is_available ? "available" : "unavailable"}
                />
              </div>
            </AccordionSection>

            {/* 6. Features */}
            <AccordionSection
              title="Features"
              subtitle="Built for dependable everyday use"
              icon={ShieldCheck}
              isOpen={expandedSections.features}
              onToggle={() =>
                setExpandedSections({ ...expandedSections, features: !expandedSections.features })
              }
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <FeatureRow
                  icon={<Thermometer className="h-5 w-5" />}
                  title="Weather ready"
                  description="Protection from sun, rain, and dust"
                />
                <FeatureRow
                  icon={<Wind className="h-5 w-5" />}
                  title="Ventilation"
                  description="Comfortable airflow design"
                />
                <FeatureRow
                  icon={<DoorOpen className="h-5 w-5" />}
                  title="Easy access"
                  description="Efficient loading entry"
                />
                <FeatureRow
                  icon={<Sun className="h-5 w-5" />}
                  title="UV protection"
                  description="Reliable outdoor durability"
                />
                <FeatureRow
                  icon={<Weight className="h-5 w-5" />}
                  title="Heavy duty"
                  description="Constructed for regular use"
                />
                <FeatureRow
                  icon={<Lock className="h-5 w-5" />}
                  title="Secure access"
                  description="Practical locking setup"
                />
              </div>
            </AccordionSection>
          </div>

          {/* RIGHT COLUMN: form (sticky) + trust below it */}
          <aside className="lg:sticky lg:top-24">
            <div className="space-y-6">
              <BookingCard
                container={container}
                categoryName={categoryName}
                successMessage={successMessage}
                errorMessage={errorMessage}
              />
              <TrustCard />
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

/* ------------------------------- Booking card ------------------------------- */

function BookingCard({
  container,
  categoryName,
  successMessage,
  errorMessage,
}: {
  container: ContainerItem;
  categoryName: string;
  successMessage: string | null;
  errorMessage: string | null;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-[0_30px_80px_-40px_rgba(24,39,35,0.35)]">
      <div className="border-b border-stone-200 bg-gradient-to-br from-emerald-50/70 to-white p-6 sm:p-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
          {categoryName}
        </p>
        <div className="mt-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
              Rental price
            </p>
            <div className="mt-1 flex items-end gap-1">
              <span className="text-[2.25rem] font-black leading-none tracking-[-0.04em] text-stone-950">
                ₹{Number(container.price_per_day).toLocaleString("en-IN")}
              </span>
              <span className="pb-0.5 text-sm text-stone-500">/ day</span>
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
            <Calendar className="h-5 w-5" />
          </div>
        </div>
        <p className="mt-3 text-xs text-stone-600">
          Flexible dates and quick owner confirmation.
        </p>
      </div>

      <div className="p-6 sm:p-7">
        {successMessage && (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-3 w-3 text-emerald-700" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-900">Request submitted</p>
                <p className="mt-1 text-sm text-emerald-700">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-3 w-3 text-red-700" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-900">Request could not be sent</p>
                <p className="mt-1 text-sm text-red-700">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        <RentalRequestForm
          containerId={container.id}
          pricePerDay={Number(container.price_per_day)}
        />

        {/* <div className="mt-6 flex items-center justify-center gap-2 text-xs text-stone-400">
          <Lock className="h-3.5 w-3.5" />
          <span>No payment required before submitting your request</span>
        </div> */}
      </div>
    </div>
  );
}

/* ---------------------------------- Atoms ----------------------------------- */

function InfoStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white/80 p-3.5 shadow-sm backdrop-blur-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-bold text-stone-950">{value}</p>
    </div>
  );
}

function AccordionSection({
  title,
  subtitle,
  icon: Icon,
  children,
  isOpen,
  onToggle,
}: {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 p-6 text-left sm:p-7"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
              {title}
            </p>
            <h3 className="mt-0.5 text-lg font-bold tracking-[-0.02em] text-stone-950">
              {subtitle}
            </h3>
          </div>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-500 transition">
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>
      {isOpen && <div className="border-t border-stone-200 p-6 sm:p-7">{children}</div>}
    </div>
  );
}

function SpecRow({
  icon,
  label,
  value,
  status,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  status?: "available" | "unavailable";
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-stone-50/60 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-stone-700 shadow-sm">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-stone-500">{label}</p>
        <p
          className={`mt-0.5 truncate font-semibold ${
            status === "available"
              ? "text-emerald-700"
              : status === "unavailable"
                ? "text-red-700"
                : "text-stone-950"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function FeatureRow({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group flex items-start gap-4 rounded-2xl border border-stone-200 bg-white p-4 transition hover:border-emerald-200 hover:bg-emerald-50/30">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition group-hover:scale-105">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-bold text-stone-950">{title}</h3>
        <p className="mt-0.5 text-xs leading-5 text-stone-500">{description}</p>
      </div>
    </div>
  );
}

/* -------------------------------- Trust card -------------------------------- */

function TrustCard() {
  const trustItems = [
    {
      icon: <ShieldCheck className="h-5 w-5" />,
      title: "Verified owners",
      description: "All container owners are identity-verified",
    },
    {
      icon: <Lock className="h-5 w-5" />,
      title: "Secure payments",
      description: "Payment only after owner confirmation",
    },
    {
      icon: <Truck className="h-5 w-5" />,
      title: "Delivery available",
      description: "Optional delivery to your location",
    },
    {
      icon: <Home className="h-5 w-5" />,
      title: "Damage protection",
      description: "Coverage for unexpected issues",
    },
  ];

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-7">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
        Why rent with us
      </p>
      <h2 className="mt-2 text-xl font-bold tracking-[-0.03em] text-stone-950">
        Rent with confidence
      </h2>

      <div className="mt-5 space-y-3">
        {trustItems.map((item, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              {item.icon}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-stone-950">{item.title}</h3>
              <p className="text-xs text-stone-500">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------- Visual / states ---------------------------- */

function ContainerVisual() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-700 via-slate-600 to-slate-900">
      <div className="relative h-[40%] w-[60%] max-w-2xl">
        <div className="absolute -bottom-4 left-[5%] h-6 w-[90%] rounded-full bg-black/50 blur-xl" />

        <div className="relative h-full overflow-hidden rounded-lg border border-slate-500/40 bg-gradient-to-b from-slate-500 to-slate-700 shadow-2xl">
          <div
            className="absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, transparent 0px, transparent 15px, rgba(255,255,255,0.12) 16px, rgba(0,0,0,0.15) 18px)",
            }}
          />

          <div className="absolute left-0 right-0 top-0 h-4 bg-slate-800/80" />
          <div className="absolute bottom-0 left-0 right-0 h-5 bg-slate-900/90" />
          <div className="absolute bottom-0 left-0 top-0 w-6 bg-slate-800/90" />
          <div className="absolute bottom-0 right-0 top-0 w-6 bg-slate-800/90" />

          <div className="absolute left-8 top-6">
            <p className="text-xl font-black tracking-widest text-white/90">BOXRENT</p>
            <p className="mt-1 text-[8px] tracking-[0.3em] text-slate-300">
              CARGO • STORAGE • LOGISTICS
            </p>
          </div>

          <div className="absolute bottom-8 left-8 font-mono text-xs tracking-widest text-white/60">
            BXRU 204581
          </div>

          <div className="absolute bottom-5 right-8 top-5 flex w-28 gap-2 border-l border-slate-900/30 pl-3">
            <div className="flex-1 rounded-sm border border-slate-900/40 bg-slate-600/60" />
            <div className="flex-1 rounded-sm border border-slate-900/40 bg-slate-600/60" />
            <div className="absolute left-1/2 top-1/2 h-24 w-1 -translate-x-1/2 -translate-y-1/2 bg-slate-300/50" />
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <main className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 h-6 w-48 animate-pulse rounded bg-stone-200" />
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-4">
            <div className="h-[420px] animate-pulse rounded-3xl bg-stone-200" />
            <div className="h-24 animate-pulse rounded-3xl bg-stone-200" />
            <div className="h-32 animate-pulse rounded-3xl bg-stone-200" />
            <div className="h-32 animate-pulse rounded-3xl bg-stone-200" />
          </div>
          <div className="space-y-4">
            <div className="h-[560px] animate-pulse rounded-3xl bg-stone-200" />
            <div className="h-64 animate-pulse rounded-3xl bg-stone-200" />
          </div>
        </div>
      </div>
    </main>
  );
}

function NotFoundState() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="max-w-md rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-stone-100">
          <Container className="h-6 w-6 text-stone-400" />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-stone-950">Container not found</h1>
        <p className="mt-2 text-sm leading-6 text-stone-500">
          This container may no longer be available or the listing link may be incorrect.
        </p>
        <Link
          href="/containers"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-stone-950 px-5 py-3 text-sm font-semibold text-white hover:bg-stone-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Browse containers
        </Link>
      </div>
    </main>
  );
}