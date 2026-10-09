"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Container,
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Truck,
  X,
} from "lucide-react";

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

type PrimaryImageMap = Map<string, string>;

export default function ContainersClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialCategory = searchParams.get("category") || "ALL";
  const initialSort = searchParams.get("sort") || "newest";
  const initialSearch = searchParams.get("search") || "";
  const initialType = searchParams.get("type") || "";

  const [containers, setContainers] = useState<ContainerItem[]>([]);
  const [primaryImages, setPrimaryImages] = useState<PrimaryImageMap>(new Map());
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [type, setType] = useState(initialType);
  const [sort, setSort] = useState(initialSort);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const selectedCategoryId = useMemo(() => {
    if (!type || type === "Any type") return "ALL";
    const matched = categories.find(
      (c) =>
        c.name.toLowerCase() === type.toLowerCase() ||
        c.slug.toLowerCase() === type.toLowerCase()
    );
    return matched?.id || "ALL";
  }, [type, categories]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchContainers();
  }, [selectedCategoryId, sort]);

  async function fetchCategories() {
    const client = createClient();
    const { data } = await client
      .from("container_categories")
      .select("id, name, slug")
      .eq("is_active", true)
      .order("name");

    if (data) {
      setCategories(data);
    }
    setLoading(false);
  }

  async function fetchContainers() {
    setLoading(true);

    let query = supabase
      .from("containers")
      .select(`
        *,
        container_categories (
          id,
          name,
          slug
        )
      `)
      .eq("is_available", true);

    if (selectedCategoryId !== "ALL") {
      query = query.eq("category_id", selectedCategoryId);
    }

    const { data } = await query.order("created_at", { ascending: false });

    const nextContainers = data ?? [];
    setContainers(nextContainers);

    if (nextContainers.length === 0) {
      setPrimaryImages(new Map());
      setLoading(false);
      return;
    }

    const { data: images } = await supabase
      .from("container_images")
      .select("container_id, storage_path")
      .eq("is_primary", true)
      .in(
        "container_id",
        nextContainers.map((container) => container.id)
      );

    const imageMap = new Map<string, string>();

    if (images && images.length > 0) {
      const { data: signedUrls } = await supabase.storage
        .from(CONTAINER_IMAGE_BUCKET)
        .createSignedUrls(
          images.map((image) => image.storage_path),
          60 * 60 * 24
        );

      images.forEach((image, index) => {
        const url = signedUrls?.[index]?.signedUrl;
        if (url) imageMap.set(image.container_id, url);
      });
    }

    setPrimaryImages(imageMap);
    setLoading(false);
  }

  function handleCategoryChange(newType: string) {
    setType(newType);
    const params = new URLSearchParams(searchParams.toString());

    if (newType === "ALL") {
      params.delete("type");
    } else {
      const matched = categories.find((c) => c.id === newType);
      params.set("type", matched?.name || newType);
    }

    const queryString = params.toString();
    router.push(queryString ? `/containers?${queryString}` : "/containers");
  }

  function handleSortChange(newSort: string) {
    setSort(newSort);
    const params = new URLSearchParams(searchParams.toString());

    if (newSort === "newest") {
      params.delete("sort");
    } else {
      params.set("sort", newSort);
    }

    const queryString = params.toString();
    router.push(queryString ? `/containers?${queryString}` : "/containers");
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    const params = new URLSearchParams(searchParams.toString());

    if (value.trim()) {
      params.set("search", value.trim());
    } else {
      params.delete("search");
    }

    const queryString = params.toString();
    router.push(queryString ? `/containers?${queryString}` : "/containers");
  }

  function clearFilters() {
    setSearch("");
    setType("ALL");
    setSort("newest");
    router.push("/containers");
  }

  const filteredContainers = useMemo(() => {
    let nextContainers = containers;

    if (selectedCategoryId !== "ALL") {
      nextContainers = nextContainers.filter(
        (container) => container.category_id === selectedCategoryId
      );
    }

    const searchText = search.toLowerCase();
    if (searchText) {
      nextContainers = nextContainers.filter(
        (container) =>
          container.title.toLowerCase().includes(searchText) ||
          container.location.toLowerCase().includes(searchText) ||
          (container.container_categories?.name?.toLowerCase() || "").includes(
            searchText
          ) ||
          container.container_type.toLowerCase().includes(searchText)
      );
    }

    if (sort === "price-low") {
      return [...nextContainers].sort(
        (a, b) => a.price_per_day - b.price_per_day
      );
    }

    if (sort === "price-high") {
      return [...nextContainers].sort(
        (a, b) => b.price_per_day - a.price_per_day
      );
    }

    return [...nextContainers].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [containers, search, selectedCategoryId, sort]);

  const hasActiveFilters = search || type !== "ALL" || sort !== "newest";

  if (loading) {
    return (
      <div className="mt-8 flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-teal-600" />
          <p className="mt-4 text-sm font-semibold text-slate-600">
            Loading containers...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white/90 p-2 shadow-2xl shadow-slate-900/10 backdrop-blur-sm sm:p-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Search by location, category, or container name..."
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-100"
            />
          </div>

          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="flex h-2 w-2 rounded-full bg-teal-600" />
            )}
          </button>
        </div>

        <div className="hidden items-center gap-3 pt-3 sm:flex">
          <div className="relative flex-1">
            <select
              value={type}
              onChange={(event) => handleCategoryChange(event.target.value)}
              className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-teal-600"
            >
              <option value="ALL">All Categories</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>

            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>

          <div className="relative">
            <select
              value={sort}
              onChange={(event) => handleSortChange(event.target.value)}
              className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-teal-600 sm:min-w-[180px]"
            >
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>

            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Active filters:</span>

          {search && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
              Search: "{search}"
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          )}

          {type !== "ALL" && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
              {categories.find((category) => category.id === type)?.name || type}
              <button
                type="button"
                onClick={() => handleCategoryChange("ALL")}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          )}

          {sort !== "newest" && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
              {sort === "price-low" ? "Price: Low to High" : "Price: High to Low"}
              <button
                type="button"
                onClick={() => handleSortChange("newest")}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          )}
        </div>
      )}

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mb-7 flex flex-col gap-3 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Find a container for your next project
            </h2>
          </div>

          <div className="flex items-center gap-3 text-sm text-slate-600">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-50 text-teal-700">
              <SlidersHorizontal className="h-4 w-4" />
            </div>
            <div>
              <span className="block font-semibold text-slate-900">
                {filteredContainers.length} results
              </span>
              <span className="text-xs text-slate-500">Updated for your filters</span>
            </div>
          </div>
        </div>

        {filteredContainers.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredContainers.map((container) => (
              <ContainerCard
                key={container.id}
                container={container}
                imageUrl={primaryImages.get(container.id) ?? null}
              />
            ))}
          </div>
        )}

        {filteredContainers.length === 0 && (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="grid gap-8 px-6 py-14 text-center sm:px-10 md:grid-cols-[0.9fr_1.1fr] md:text-left">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-teal-50 text-teal-700 md:mx-0">
                <Container className="h-10 w-10" />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">
                  No matches
                </p>
                <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                  We couldn&apos;t find a container that fits
                </h3>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
                  Try a different location, category, or search term. Your filters can
                  be cleared at any time.
                </p>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700"
                >
                  Clear all filters
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 sm:hidden">
            <div className="absolute right-0 top-0 h-full w-80 overflow-y-auto bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-950">Filters</h3>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-6 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Category
                  </label>
                  <select
                    value={type}
                    onChange={(event) => {
                      handleCategoryChange(event.target.value);
                      setMobileFiltersOpen(false);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-teal-600"
                  >
                    <option value="ALL">All Categories</option>
                    {categories.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Sort by
                  </label>
                  <select
                    value={sort}
                    onChange={(event) => {
                      handleSortChange(event.target.value);
                      setMobileFiltersOpen(false);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-teal-600"
                  >
                    <option value="newest">Newest</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={() => {
                      clearFilters();
                      setMobileFiltersOpen(false);
                    }}
                    className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-100"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
}

type ContainerCardProps = {
  container: ContainerItem;
  imageUrl: string | null;
};

function ContainerCard({ container, imageUrl }: ContainerCardProps) {
  const categoryName = container.container_categories?.name || container.container_type;

  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-teal-200 hover:shadow-2xl hover:shadow-teal-950/5">
      <div className="relative h-64 overflow-hidden bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={container.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <ContainerVisual />
        )}

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/70 to-transparent" />

        <div className="absolute left-4 top-4">
          <span className="inline-flex rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-slate-800 shadow-sm backdrop-blur-sm">
            {categoryName}
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="line-clamp-1 text-lg font-bold text-slate-950">
              {container.title}
            </h3>
            <div className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
              <MapPin className="h-4 w-4 shrink-0 text-teal-700" />
              <span className="line-clamp-1">{container.location}</span>
            </div>
          </div>

          <span className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700">
            {container.size}
          </span>
        </div>

        <div className="mt-5 flex items-end justify-between gap-4 border-t border-slate-100 pt-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Starting from
            </p>
            <p className="mt-1 text-2xl font-black tracking-tight text-slate-950">
              ₹{Number(container.price_per_day).toLocaleString("en-IN")}
              <span className="ml-1 text-sm font-medium text-slate-400">/day</span>
            </p>
          </div>

          <p className="text-right text-xs font-semibold text-slate-500">
            {container.total_quantity} available
          </p>
        </div>

        <Link
          href={`/containers/${container.id}`}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-700"
        >
          View details
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

function ContainerVisual() {
  return (
    <div className="absolute inset-0">
      <div className="absolute left-[8%] right-[8%] top-[25%] h-[50%] rounded-md border border-slate-400/40 bg-gradient-to-b from-slate-500 to-slate-700 shadow-2xl">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent 0px, transparent 13px, rgba(255,255,255,0.12) 14px, rgba(0,0,0,0.15) 16px)",
          }}
        />
        <div className="absolute left-0 right-0 top-0 h-3 bg-slate-800/80" />
        <div className="absolute bottom-0 left-0 right-0 h-3 bg-slate-900/80" />
        <div className="absolute left-0 top-0 h-full w-4 bg-slate-800/90" />
        <div className="absolute right-0 top-0 h-full w-4 bg-slate-800/90" />
        <div className="absolute left-6 top-5">
          <p className="text-sm font-black tracking-widest text-white/80">BOXRENT</p>
          <p className="text-[6px] tracking-[0.25em] text-slate-300">CARGO STORAGE</p>
        </div>
        <div className="absolute bottom-3 right-5 top-3 flex w-20 gap-1">
          <div className="flex-1 rounded-sm border border-slate-900/30 bg-slate-600/50" />
          <div className="flex-1 rounded-sm border border-slate-900/30 bg-slate-600/50" />
        </div>
      </div>
      <div className="absolute bottom-[15%] left-[15%] right-[15%] h-5 rounded-full bg-black/40 blur-xl" />
    </div>
  );
}
