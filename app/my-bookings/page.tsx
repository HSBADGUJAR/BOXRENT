
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Container,
  MapPin,
  Package,
} from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    accepted: "border-emerald-200 bg-emerald-50 text-emerald-800",
    active: "border-teal-200 bg-teal-50 text-teal-800",
    completed: "border-stone-200 bg-stone-100 text-stone-700",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold capitalize ${
        styles[status] || "border-stone-200 bg-stone-100 text-stone-700"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export default async function MyBookingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Please login to view your bookings");
  }

  await supabase.rpc("sync_booking_statuses");

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(`
      id,
      container_id,
      start_date,
      end_date,
      quantity,
      price_per_day,
      total_amount,
      status,
      created_at,
      containers (
        id,
        title,
        container_type,
        size,
        location,
        image_url,
        container_categories (
          id,
          name
        )
      )
    `)
    .eq("renter_id", user.id)
    .in("status", ["accepted", "active", "completed"])
    .order("start_date", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen bg-[#fbfaf7] px-5 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h1 className="text-lg font-bold text-red-700">
              Unable to load bookings
            </h1>

            <p className="mt-2 text-sm text-red-600">
              {error.message}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const allBookings = bookings || [];

const acceptedBookings = allBookings.filter(
  (booking) => booking.status === "accepted"
);

const activeBookings = allBookings.filter(
  (booking) => booking.status === "active"
);

const completedBookings = allBookings.filter(
  (booking) => booking.status === "completed"
);

  const summaryItems = [
    { label: "Total bookings", value: allBookings.length, icon: Package, tone: "stone" },
    { label: "Upcoming", value: acceptedBookings.length, icon: Clock3, tone: "emerald" },
    { label: "Active", value: activeBookings.length, icon: Container, tone: "teal" },
    { label: "Completed", value: completedBookings.length, icon: CheckCircle2, tone: "slate" },
  ];

  const summaryTones: Record<string, string> = {
    stone: "bg-stone-100 text-stone-700",
    emerald: "bg-emerald-50 text-emerald-800",
    teal: "bg-teal-50 text-teal-800",
    slate: "bg-slate-100 text-slate-700",
  };

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-8 sm:px-6 sm:py-10">
          <Link
            href="/containers"
            className="inline-flex items-center gap-2 text-sm font-semibold text-stone-500 transition hover:text-emerald-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Browse containers
          </Link>

          <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                Renter portal
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-stone-950 sm:text-4xl">
                My bookings
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-stone-600 sm:text-base">
                Review upcoming, active, and completed container rentals.
              </p>
            </div>
            <Link
              href="/containers"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-800"
            >
              Find a container
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-7 sm:px-6 sm:py-9">
        <section aria-label="Booking summary" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {summaryItems.map(({ label, value, icon: Icon, tone }) => (
            <div key={label} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-stone-600 sm:text-sm">{label}</p>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${summaryTones[tone]}`}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-black text-stone-950 sm:text-3xl">{value}</p>
            </div>
          ))}
        </section>

        <section className="mt-8" aria-label="Your bookings">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-stone-950">Booking history</h2>
            <p className="text-sm text-stone-500">
              {allBookings.length} {allBookings.length === 1 ? "booking" : "bookings"}
            </p>
          </div>
          {allBookings.length === 0 ? (
            <div className="rounded-3xl border border-stone-200 bg-white px-6 py-14 text-center shadow-sm sm:px-12">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <Container className="h-7 w-7" />
              </div>
              <h2 className="mt-5 text-xl font-bold text-stone-950">No confirmed bookings</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-600">
                Accepted requests will appear here once an owner confirms your rental.
              </p>
              <Link
                href="/my-requests"
                className="mt-6 inline-flex items-center gap-2 rounded-xl border border-stone-200 px-5 py-3 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
              >
                View my requests
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {allBookings.map((booking) => {
                const container = Array.isArray(booking.containers)
                  ? booking.containers[0]
                  : booking.containers;

                const categoryName =
                  (container as any)?.container_categories
                    ?.name || container?.container_type;

                return (
                  <div
                    key={booking.id}
                    className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex flex-col gap-4 border-b border-stone-100 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                          <Container className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-lg font-bold text-stone-950">
                            {container?.title || "Container"}
                            </h3>
                            <StatusBadge status={booking.status} />
                          </div>
                          <p className="mt-1.5 text-sm text-stone-600">
                            {categoryName} · {container?.size}
                          </p>
                          <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-stone-500">
                            <MapPin className="h-3.5 w-3.5" />
                            {container?.location}
                          </p>
                        </div>
                      </div>
                      <Link
                        href={`/containers/${booking.container_id}`}
                        className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-emerald-800 transition hover:text-emerald-950"
                      >
                        View container
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>

                    <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
                      <BookingDetail icon={CalendarDays} label="Start date" value={booking.start_date} />
                      <BookingDetail icon={CalendarDays} label="End date" value={booking.end_date} />
                      <BookingDetail icon={Package} label="Quantity" value={`${booking.quantity} container${booking.quantity === 1 ? "" : "s"}`} />
                      <div className="rounded-xl bg-emerald-50/70 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Total amount</p>
                        <p className="mt-1 text-lg font-black text-stone-950">
                          ₹{Number(booking.total_amount).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-stone-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                      <p className="text-sm font-semibold text-stone-600">
                        ₹{Number(booking.price_per_day).toLocaleString("en-IN")} / day
                      </p>
                      <p className="inline-flex items-center gap-2 text-xs text-stone-500">
                        <Clock3 className="h-3.5 w-3.5" />
                        Booking reference: {booking.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function BookingDetail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-stone-50 p-4">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-stone-500" />
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</p>
        <p className="mt-1 text-sm font-bold text-stone-900">{value}</p>
      </div>
    </div>
  );
}
