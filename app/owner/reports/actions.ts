"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface ReportFilters {
  from?: string;
  to?: string;
  status?: string;
}

export async function verifyOwner() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    redirect("/profile");
  }

  if (!["owner", "admin"].includes(profile.role)) {
    redirect("/profile");
  }

  return { supabase, user, role: profile.role };
}

function appendFilters(query: any, filters: ReportFilters) {
  let q = query;

  if (filters.from) {
    q = q.gte("created_at", `${filters.from}T00:00:00`);
  }

  if (filters.to) {
    q = q.lte("created_at", `${filters.to}T23:59:59.999`);
  }

  if (filters.status) {
    q = q.eq("status", filters.status);
  }

  return q;
}

export async function fetchReportData(filters: ReportFilters) {
  const { supabase, user } = await verifyOwner();

  const { data: containers } = await supabase
    .from("containers")
    .select(
      `id, title, location, container_type, size, total_quantity, price_per_day, is_available, created_at, category_id, container_categories (id, name)`
    )
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const ownerContainers = containers ?? [];

  const containerIds = ownerContainers.map((c) => c.id);

  let bookings: any[] = [];

  if (containerIds.length > 0) {
    const query = supabase
      .from("bookings")
      .select(`
        id,
        container_id,
        renter_id,
        start_date,
        end_date,
        quantity,
        price_per_day,
        total_amount,
        status,
        notes,
        created_at,
        containers (
          id,
          title,
          location,
          container_type,
          size,
          price_per_day,
          container_categories (
            id,
            name
          )
        )
      `)
      .in("container_id", containerIds)
      .order("created_at", { ascending: false });

    const filteredQuery = appendFilters(query, filters);

    const { data } = await filteredQuery;
    bookings = data ?? [];
  }

  return {
    containers: ownerContainers,
    bookings,
  };
}

export async function exportReportToCsv(
  filters: ReportFilters
): Promise<string> {
  const { supabase, user } = await verifyOwner();

  const { data: containers } = await supabase
    .from("containers")
    .select("id")
    .eq("owner_id", user.id);

  const containerIds = (containers ?? []).map((c) => c.id);

  let bookings: any[] = [];

  if (containerIds.length > 0) {
    const query = supabase
      .from("bookings")
      .select(`
        id,
        container_id,
        renter_id,
        start_date,
        end_date,
        quantity,
        price_per_day,
        total_amount,
        status,
        notes,
        created_at,
        containers (
          title,
          location,
          container_type,
          container_categories (
            name
          )
        )
      `)
      .in("container_id", containerIds)
      .order("created_at", { ascending: false });

    const filteredQuery = appendFilters(query, filters);

    const { data } = await filteredQuery;
    bookings = data ?? [];
  }

  const headers = [
    "Booking ID",
    "Container",
    "Category",
    "Location",
    "Type",
    "Renter ID",
    "Start Date",
    "End Date",
    "Quantity",
    "Price per Day",
    "Total Amount",
    "Status",
    "Created At",
  ];

  const rows = bookings.map((b) => {
    const container = Array.isArray(b.containers)
      ? b.containers[0]
      : b.containers;

    const categoryName =
      (container as any)?.container_categories?.name || "";

    return [
      b.id,
      container?.title || "",
      categoryName,
      container?.location || "",
      container?.container_type || "",
      b.renter_id,
      b.start_date,
      b.end_date,
      b.quantity,
      b.price_per_day || "",
      b.total_amount || 0,
      b.status,
      b.created_at,
    ];
  });

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row
        .map((cell) =>
          `"${String(cell ?? "").replace(/"/g, '""')}"`
        )
        .join(",")
    ),
  ].join("\n");

  return csvContent;
}
