import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Package,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import RequestActions from "@/components/RequestActions";

type RequestPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function RequestDetailsPage({
  params,
}: RequestPageProps) {
  const { id } = await params;

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

  const { data: booking } = await supabase
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
        container_type,
        size,
        location,
        price_per_day,
        container_categories (
          id,
          name
        )
      )
    `)
    .eq("id", id)
    .single();

  if (!booking) {
    notFound();
  }

  const container = Array.isArray(booking.containers)
    ? booking.containers[0]
    : booking.containers;

  const categoryName =
    (container as any)?.container_categories?.name ||
    container?.container_type;

  // Extra ownership check.
  if (!container) {
    notFound();
  }

  const { data: ownedContainer } = await supabase
    .from("containers")
    .select("id")
    .eq("id", booking.container_id)
    .eq("owner_id", user.id)
    .single();

  if (!ownedContainer) {
    redirect("/owner/requests");
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6 lg:px-8">
          <Link
            href="/owner/requests"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Requests
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-teal-700">
              Rental Request
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
              Request Details
            </h1>
          </div>

          <StatusBadge status={booking.status} />
        </div>

        {/* CONTAINER */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
              <Package className="h-6 w-6 text-slate-700" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-950">
                {container.title}
              </h2>

              <p className="text-sm text-slate-500">
                {categoryName} · {container.size}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <InfoItem
              icon={<MapPin className="h-4 w-4" />}
              label="Location"
              value={container.location}
            />

            <InfoItem
              icon={<CalendarDays className="h-4 w-4" />}
              label="Rental Period"
              value={`${booking.start_date} → ${booking.end_date}`}
            />

            <InfoItem
              label="Quantity"
              value={String(booking.quantity)}
            />

            <InfoItem
              label="Price per Day"
              value={`₹${Number(
                booking.price_per_day
              ).toLocaleString("en-IN")}`}
            />
          </div>
        </div>

        {/* RENTER */}
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">
            Renter Information
          </h2>

          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Renter ID
            </p>

            <p className="mt-1 break-all text-sm text-slate-600">
              {booking.renter_id}
            </p>
          </div>

          {booking.notes && (
            <div className="mt-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Notes
              </p>

              <p className="mt-2 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                {booking.notes}
              </p>
            </div>
          )}
        </div>

        {/* TOTAL */}
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">
              Total Rental Amount
            </span>

            <span className="text-2xl font-bold text-slate-950">
              ₹
              {Number(
                booking.total_amount
              ).toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* ACTIONS */}
       <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
  <h2 className="text-lg font-bold text-slate-950">
    Request Actions
  </h2>

  <RequestActions
    bookingId={booking.id}
    status={booking.status}
  />
</div>
      </div>
    </main>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
        {icon}
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-700">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const styles: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700",
    accepted: "bg-green-50 text-green-700",
    rejected: "bg-red-50 text-red-700",
    cancelled: "bg-slate-100 text-slate-600",
    completed: "bg-teal-50 text-teal-800",
  };

  return (
    <span
      className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${
        styles[status] || styles.pending
      }`}
    >
      {status}
    </span>
  );
}
