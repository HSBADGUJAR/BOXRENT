"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Container,
  MapPin,
  Menu,
  Search,
  ShieldCheck,
  Truck,
  X,
  Star,
  Clock3,
  BadgeCheck,
  CircleDollarSign,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/client";
import { CONTAINER_IMAGE_BUCKET } from "@/lib/container-images";

/* -------------------------------------------------------
   TYPES
------------------------------------------------------- */

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

type PrimaryImageMap = Map<string, string>;

/* -------------------------------------------------------
   CATEGORIES (static UI for browsing by type)
------------------------------------------------------- */

const categories = [
  {
    type: "20FT",
    title: "20ft Standard",
    description: "General cargo & storage",
  },
  {
    type: "40FT",
    title: "40ft High Cube",
    description: "Extra height & capacity",
  },
  {
    type: "REEFER",
    title: "Refrigerated",
    description: "Temperature controlled",
  },
  {
    type: "OPEN",
    title: "Open Top",
    description: "Oversized cargo",
  },
];

/* -------------------------------------------------------
   SMALL CONTAINER CARD IMAGE
------------------------------------------------------- */

function ContainerThumbnail({ type }: { type: string }) {
  return (
    <div className="flex h-48 items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 px-5">
      <div className="relative w-full max-w-[280px]">
        <div className="absolute bottom-[-8px] left-[5%] h-4 w-[90%] rounded-full bg-black/20 blur-md" />

        <div className="relative h-28 overflow-hidden rounded-sm border-4 border-slate-700 bg-gradient-to-b from-teal-600 to-teal-900 shadow-xl">
          {/* Rails */}
          <div className="absolute left-0 right-0 top-0 h-3 bg-slate-600" />
          <div className="absolute bottom-0 left-0 right-0 h-4 border-t-2 border-slate-900 bg-slate-700" />

          {/* Corrugation */}
          <div className="absolute inset-x-5 bottom-4 top-3 grid grid-cols-10 gap-[2px]">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="border-x border-teal-950/70 bg-teal-500/20"
              />
            ))}
          </div>

          {/* Posts */}
          <div className="absolute bottom-0 left-0 top-0 w-5 bg-slate-500/80" />
          <div className="absolute bottom-0 right-0 top-0 w-5 bg-slate-500/80" />

          <span className="absolute left-8 top-6 text-[8px] font-black tracking-widest text-white">
            BOXRENT
          </span>

          <span className="absolute bottom-5 left-8 font-mono text-[7px] text-white/80">
            BXRU 204581
          </span>

          <span className="absolute right-8 top-6 text-[7px] font-bold text-white">
            {type}
          </span>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   MAIN PAGE
------------------------------------------------------- */

export default function HomePageClient() {
  const [location, setLocation] = useState("");
  const [containerType, setContainerType] = useState("Any type");
  const [containers, setContainers] = useState<ContainerItem[]>([]);
  const [primaryImages, setPrimaryImages] = useState<PrimaryImageMap>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContainers();
  }, []);

  async function fetchContainers() {
    setLoading(true);

    const { data, error } = await supabase
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
      .order("created_at", { ascending: false })
      .limit(3);

    if (error) {
      console.error("Supabase error:", error);
      setContainers([]);
      setPrimaryImages(new Map());
    } else {
      setContainers(data || []);

      const ids = (data || []).map((container) => container.id);

      if (ids.length === 0) {
        setPrimaryImages(new Map());
      } else {
        const { data: images } = await supabase
          .from("container_images")
          .select("container_id, storage_path")
          .eq("is_primary", true)
          .in("container_id", ids);

        const imageMap: PrimaryImageMap = new Map();

        if (images && images.length > 0) {
          const client = createClient();
          const paths = images.map((img) => img.storage_path);

          const { data: signed } = await client.storage
            .from(CONTAINER_IMAGE_BUCKET)
            .createSignedUrls(paths, 60 * 60 * 24);

          (signed ?? []).forEach((entry, index) => {
            const url = entry?.signedUrl;
            if (url) {
              imageMap.set(images[index].container_id, url);
            }
          });
        }

        setPrimaryImages(imageMap);
      }
    }

    setLoading(false);
  }

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (location.trim()) {
      params.set("search", location.trim());
    }

    if (containerType !== "Any type") {
      params.set("type", containerType);
    }

    const query = params.toString();

    window.location.href = query
      ? `/containers?${query}`
      : "/containers";
  };

  return (
    <main className="overflow-hidden bg-[#f8faf9]">
      {/* ==================================================
          HERO
      ================================================== */}

      <section className="relative overflow-hidden bg-[#f5f8f6]">

        {/* Background grid */}
        <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(15,118,110,.07)_1px,transparent_1px),linear-gradient(90deg,rgba(15,118,110,.07)_1px,transparent_1px)] [background-size:42px_42px]" />

        {/* Decorative circles */}
        <div className="absolute -right-32 top-20 h-96 w-96 rounded-full bg-teal-200/30 blur-3xl" />

        <div className="relative mx-auto grid min-h-[680px] max-w-[1160px] items-center gap-14 px-5 py-20 lg:grid-cols-[1.05fr_.95fr]">

          {/* Hero content */}
          <div>

            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white px-3 py-1.5 text-xs font-bold text-teal-700 shadow-sm">
              <CheckCircle2 size={15} />
              Containers when and where you need them
            </div>

            <h1 className="max-w-2xl text-5xl font-black leading-[1.02] tracking-tight text-slate-900 sm:text-6xl">
              Rent a container.
              <br />
              <span className="text-teal-700">
                Move business forward.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Find verified shipping and storage containers from local
              owners. Compare options, request a quote and arrange delivery
              in one place.
            </p>

            {/* Search box */}
            <div className="mt-9 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10">

              <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">

                {/* Location */}
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                  <MapPin
                    size={20}
                    className="shrink-0 text-teal-700"
                  />

                  <div className="w-full">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Location
                    </div>

                    <input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Surat, Gujarat"
                      className="mt-0.5 w-full bg-transparent text-sm font-medium outline-none"
                    />
                  </div>
                </div>

                {/* Container type */}
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                  <Container
                    size={20}
                    className="shrink-0 text-teal-700"
                  />

                  <div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Container
                    </div>

                    <select
                      value={containerType}
                      onChange={(e) =>
                        setContainerType(e.target.value)
                      }
                      className="mt-0.5 bg-transparent text-sm font-medium outline-none"
                    >
                      <option>Any type</option>
                      <option>20ft Standard</option>
                      <option>40ft High Cube</option>
                      <option>Refrigerated</option>
                      <option>Open Top</option>
                    </select>
                  </div>
                </div>

                {/* Search button */}
                <button
                  onClick={handleSearch}
                  className="flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-7 py-3 font-bold text-white transition hover:bg-teal-800"
                >
                  <Search size={18} />
                  Search
                </button>
              </div>
            </div>

            {/* Trust points */}
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
              <span>✓ Verified suppliers</span>
              <span>✓ Flexible rental periods</span>
              <span>✓ Delivery support</span>
            </div>
          </div>

          {/* Hero container */}
          <div className="relative hidden lg:block">

            <div className="absolute -inset-10 rounded-full bg-teal-300/20 blur-3xl" />

            <div className="relative rounded-[32px] border border-white bg-slate-950 p-6 shadow-2xl">

              <div className="rounded-2xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950 px-5 py-16">

                {containers.length > 0 ? (
                  <>
                    <ContainerThumbnail type={containers[0].container_type} />

                    <div className="mt-12 flex items-end justify-between text-white">

                      <div>
                        <p className="text-xs text-slate-400">
                          Available now
                        </p>

                        <p className="mt-1 font-bold">
                          {containers[0].title}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-slate-400">
                          From
                        </p>

                        <p className="text-xl font-black text-teal-300">
                          ₹{Number(containers[0].price_per_day).toLocaleString("en-IN")}/day
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <ContainerThumbnail type="20FT" />

                    <div className="mt-12 flex items-end justify-between text-white">

                      <div>
                        <p className="text-xs text-slate-400">
                          Available now
                        </p>

                        <p className="mt-1 font-bold">
                          20ft Standard Container
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-slate-400">
                          From
                        </p>

                        <p className="text-xl font-black text-teal-300">
                          ₹450/day
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          STATS
      ================================================== */}

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-[1160px] grid-cols-2 divide-x divide-slate-200 px-5 py-7 md:grid-cols-4">

          {[
            ["500+", "Containers listed"],
            ["120+", "Verified suppliers"],
            ["25+", "Cities covered"],
            ["4.8/5", "Average rating"],
          ].map(([value, label]) => (
            <div key={label} className="px-5 text-center">
              <p className="text-2xl font-black text-slate-900">
                {value}
              </p>

              <p className="mt-1 text-xs font-medium text-slate-500">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ==================================================
          FEATURED CONTAINERS
      ================================================== */}

      <section id="containers" className="py-20">
        <div className="mx-auto max-w-[1160px] px-5">

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

            <div>
              <p className="text-sm font-black tracking-widest text-teal-700">
                FIND THE RIGHT FIT
              </p>

              <h2 className="mt-2 text-3xl font-black text-slate-900 sm:text-4xl">
                Containers near you
              </h2>

              <p className="mt-3 max-w-xl text-slate-500">
                Browse containers from trusted suppliers and choose the
                option that fits your business.
              </p>
            </div>

            <a
              href="/containers"
              className="flex items-center gap-2 text-sm font-bold text-teal-700"
            >
              View all containers
              <ArrowRight size={16} />
            </a>
          </div>

          {/* Cards */}
          <div className="mt-10 grid gap-6 md:grid-cols-3">

            {loading ? (
              [1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                >
                  <div className="h-48 animate-pulse bg-slate-200" />
                  <div className="space-y-3 p-5">
                    <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
                    <div className="h-10 w-full animate-pulse rounded bg-slate-200" />
                  </div>
                </div>
              ))
            ) : containers.length > 0 ? (
              containers.map((container) => {
                const categoryName =
                  container.container_categories?.name || container.container_type;
                const imageUrl = primaryImages.get(container.id) ?? null;

                return (
                  <article
                    key={container.id}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
                  >
                    {/* IMAGE */}
                    <div className="relative h-48 overflow-hidden bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={container.title}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <ContainerThumbnail type={container.container_type} />
                      )}

                      {/* CATEGORY BADGE */}
                      <div className="absolute left-4 top-4">
                        <span className="inline-flex rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-slate-800 shadow">
                          {categoryName}
                        </span>
                      </div>

                      {/* AVAILABLE BADGE */}
                      <div className="absolute right-4 top-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Available
                        </span>
                      </div>
                    </div>

                    {/* DETAILS */}
                    <div className="p-5">
                      <h3 className="line-clamp-1 text-lg font-bold text-slate-950">
                        {container.title}
                      </h3>

                      <div className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="line-clamp-1">
                          {container.location}
                        </span>
                      </div>

                      <div className="mt-5 flex items-end justify-between">
                        <div>
                          <p className="text-xs text-slate-400">
                            Starting from
                          </p>

                          <p className="mt-0.5 text-xl font-bold text-slate-950">
                            ₹{Number(container.price_per_day).toLocaleString("en-IN")}
                            <span className="text-sm font-medium text-slate-400">
                              /day
                            </span>
                          </p>

                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {container.total_quantity} container{container.total_quantity !== 1 ? "s" : ""} available
                          </p>
                        </div>

                        <Link
                          href={`/containers/${container.id}`}
                          className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
                        >
                          View Details
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="col-span-3 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                  <Container className="h-7 w-7 text-slate-400" />
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-950">
                  No containers found
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                  No containers are currently available. Please check back later.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ==================================================
          CATEGORIES
      ================================================== */}

      <section className="border-y border-slate-200 bg-white py-20">
        <div className="mx-auto max-w-[1160px] px-5">

          <div className="text-center">
            <p className="text-sm font-black tracking-widest text-teal-700">
              BROWSE BY TYPE
            </p>

            <h2 className="mt-2 text-3xl font-black text-slate-900">
              Whatever your business needs
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">

            {categories.map((category) => (
              <div
                key={category.type}
                className="group rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center transition hover:border-teal-300 hover:bg-white hover:shadow-lg"
              >
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-teal-50 text-sm font-black text-teal-700 transition group-hover:bg-teal-700 group-hover:text-white">
                  {category.type}
                </div>

                <h3 className="mt-4 font-black text-slate-900">
                  {category.title}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {category.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================
          HOW IT WORKS
      ================================================== */}

      <section id="how" className="py-20">
        <div className="mx-auto max-w-[1160px] px-5">

          <div className="max-w-2xl">
            <p className="text-sm font-black tracking-widest text-teal-700">
              SIMPLE PROCESS
            </p>

            <h2 className="mt-2 text-3xl font-black text-slate-900 sm:text-4xl">
              From search to delivery
            </h2>

            <p className="mt-4 leading-7 text-slate-500">
              Finding a container shouldn't require endless calls and
              WhatsApp messages.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">

            {[
              {
                number: "01",
                icon: Search,
                title: "Search",
                description:
                  "Tell us your location, container type and rental period.",
              },
              {
                number: "02",
                icon: CheckCircle2,
                title: "Choose",
                description:
                  "Compare available containers, prices and supplier details.",
              },
              {
                number: "03",
                icon: Truck,
                title: "Rent & Deliver",
                description:
                  "Request a quote, confirm the booking and arrange delivery.",
              },
            ].map((step) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.number}
                  className="relative rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-5xl font-black text-teal-100">
                      {step.number}
                    </span>

                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-teal-50 text-teal-700">
                      <Icon size={22} />
                    </div>
                  </div>

                  <h3 className="mt-7 text-xl font-black">
                    {step.title}
                  </h3>

                  <p className="mt-2 leading-7 text-slate-500">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================================================
          OWNER SECTION
      ================================================== */}

      <section id="owners" className="bg-slate-950 py-20 text-white">
        <div className="mx-auto grid max-w-[1160px] items-center gap-12 px-5 lg:grid-cols-2">

          <div>

            <p className="text-sm font-black tracking-widest text-teal-300">
              FOR CONTAINER OWNERS
            </p>

            <h2 className="mt-3 text-4xl font-black leading-tight">
              Turn idle containers
              <br />
              into income.
            </h2>

            <p className="mt-5 max-w-xl leading-7 text-slate-400">
              List your available containers, receive rental enquiries and
              manage your inventory from one simple dashboard.
            </p>

            <a
              href="/signup?source=list-container"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-slate-900 transition hover:bg-teal-50"
            >
              List your container
              <ArrowRight size={17} />
            </a>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">

            {[
              {
                icon: BadgeCheck,
                title: "More visibility",
                description:
                  "Reach businesses searching for containers in your area.",
              },
              {
                icon: CircleDollarSign,
                title: "Flexible pricing",
                description:
                  "Set your own rental price and availability.",
              },
              {
                icon: ShieldCheck,
                title: "Verified leads",
                description:
                  "Receive structured rental enquiries from customers.",
              },
              {
                icon: Clock3,
                title: "Easy management",
                description:
                  "Manage listings, bookings and availability easily.",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5"
                >
                  <Icon className="text-teal-300" size={23} />

                  <h3 className="mt-4 font-black">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================================================
          TRUST SECTION
      ================================================== */}

      <section className="bg-white py-16">
        <div className="mx-auto max-w-[1160px] px-5">

          <div className="grid gap-8 md:grid-cols-3">

            <div className="flex gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700">
                <ShieldCheck />
              </div>

              <div>
                <h3 className="font-black">
                  Verified suppliers
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Connect with suppliers who have been verified by our
                  marketplace.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700">
                <Star />
              </div>

              <div>
                <h3 className="font-black">
                  Transparent listings
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Compare prices, locations, container types and ratings
                  before choosing.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700">
                <Truck />
              </div>

              <div>
                <h3 className="font-black">
                  Delivery support
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Make container delivery easier with supplier and logistics
                  coordination.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ==================================================
          FAQ
      ================================================== */}

      <section id="faq" className="bg-[#f8faf9] py-20">
        <div className="mx-auto max-w-3xl px-5">

          <div className="text-center">
            <p className="text-sm font-black tracking-widest text-teal-700">
              FAQ
            </p>

            <h2 className="mt-2 text-3xl font-black text-slate-900">
              Questions, answered
            </h2>
          </div>

          <div className="mt-10 divide-y overflow-hidden rounded-2xl border border-slate-200 bg-white">

            {[
              "Can I rent a container for only a few days?",
              "Who handles container delivery?",
              "Can I list multiple containers?",
              "How do I request a rental quote?",
              "Can I choose a supplier near my location?",
            ].map((question) => (
              <details
                key={question}
                className="group p-5"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-bold text-slate-900">
                  {question}

                  <ChevronDown
                    size={19}
                    className="shrink-0 transition group-open:rotate-180"
                  />
                </summary>

                <p className="mt-3 pr-8 text-sm leading-6 text-slate-500">
                  Rental terms, pricing, availability and delivery can be
                  agreed with the supplier based on the selected listing
                  and your requirements.
                </p>
              </details>
            ))}

          </div>
        </div>
      </section>

      {/* ==================================================
          CTA
      ================================================== */}

    {/* CTA SECTION */}
<section className="px-4 pb-20 sm:px-6 lg:px-8">
  <div className="mx-auto max-w-7xl">
    <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-14 sm:px-10 lg:px-16 lg:py-16">
      
      {/* Background effects */}
      <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-teal-600/20 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl" />

      <div className="relative grid items-center gap-12 lg:grid-cols-2">
        
        {/* LEFT CONTENT */}
        <div className="max-w-2xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Containers available across Gujarat
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Need a container?
            <br />
            <span className="text-teal-300">
              Find it. Rent it. Done.
            </span>
          </h2>

          <p className="mt-5 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
            Find the right shipping container for your storage, logistics,
            construction, or business needs. Compare options and connect
            directly with container owners.
          </p>

          {/* Buttons */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="/containers"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-6 py-3.5 font-semibold text-white shadow-lg shadow-teal-700/20 transition hover:bg-teal-600"
            >
              Find a Container
              <ArrowRight className="h-4 w-4" />
            </a>

            <a
              href="/signup?source=list-container"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10"
            >
              List Your Container
            </a>
          </div>

          {/* Trust points */}
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Verified listings
            </div>

            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Flexible rental
            </div>

            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Direct owner contact
            </div>
          </div>
        </div>

        {/* RIGHT CONTAINER VISUAL */}
        <div className="relative hidden min-h-[300px] lg:block">
          
          {/* Glow */}
          <div className="absolute inset-10 rounded-full bg-teal-600/20 blur-3xl" />

          {/* Container */}
          <div className="absolute left-1/2 top-1/2 w-[470px] -translate-x-1/2 -translate-y-1/2 rotate-[-3deg]">
            
            {/* Main container */}
            <div className="relative h-[190px] overflow-hidden rounded-lg border border-slate-500/50 bg-gradient-to-b from-slate-500 to-slate-700 shadow-2xl">
              
              {/* Corrugated panels */}
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

              {/* Container logo */}
              <div className="absolute left-10 top-8">
                <p className="text-2xl font-black tracking-widest text-white/90">
                  BOXRENT
                </p>
                <p className="mt-1 text-[9px] tracking-[0.35em] text-slate-300">
                  CARGO • STORAGE • LOGISTICS
                </p>
              </div>

              {/* Container number */}
              <div className="absolute bottom-8 left-10 font-mono text-xs tracking-widest text-white/60">
                BXRU 204581
              </div>

              {/* Door section */}
              <div className="absolute bottom-5 right-7 top-5 flex w-32 gap-2 border-l border-slate-900/40 pl-3">
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
            <div className="mx-auto mt-5 h-5 w-[85%] rounded-full bg-black/50 blur-xl" />
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

      {/* ==================================================
          FOOTER
      ================================================== */}

      <footer className="border-t border-slate-200 bg-white py-8">

        <div className="mx-auto flex max-w-[1160px] flex-col justify-between gap-4 px-5 text-sm text-slate-500 sm:flex-row">

          <div className="flex items-center gap-2 font-bold text-slate-900">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-700 text-white">
              <Container size={16} />
            </span>

            BoxRent
          </div>

          <span>
            © 2026 BoxRent. All rights reserved.
          </span>

          <span>
            Container rental marketplace
          </span>
        </div>
      </footer>

    </main>
  );
}
