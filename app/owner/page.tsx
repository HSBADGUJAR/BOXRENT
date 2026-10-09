import Link from "next/link";

import {
  Activity,
  ArrowRight,
  Box,
  CheckCircle2,
  ClipboardList,
  Clock3,
  IndianRupee,
  PackagePlus,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

export default async function OwnerDashboardPage() {
  const supabase = await createClient();

  /* ======================================================= */
  /* CURRENT USER                                             */
  /* ======================================================= */

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  await supabase.rpc("sync_booking_statuses");

  /* ======================================================= */
  /* OWNER CONTAINERS                                         */
  /* ======================================================= */

  const { data: containers } = await supabase
    .from("containers")
    .select(
      `id, title, location, container_type, size, total_quantity, is_available, category_id, container_categories (id, name)`
    )
    .eq("owner_id", user.id)
    .order("created_at", {
      ascending: false,
    });

  const ownerContainers = containers ?? [];

  const containerIds = ownerContainers.map(
    (container) => container.id
  );

  /* ======================================================= */
  /* BOOKINGS                                                 */
  /* ======================================================= */

  let bookings: any[] = [];

  if (containerIds.length > 0) {
    const { data } = await supabase
      .from("bookings")
      .select(`
        id,
        container_id,
        renter_id,
        start_date,
        end_date,
        quantity,
        total_amount,
        status,
        created_at,
        containers (
          id,
          title,
          location
        )
      `)
      .in("container_id", containerIds)
      .order("created_at", {
        ascending: false,
      });

    bookings = data ?? [];
  }

  /* ======================================================= */
  /* DASHBOARD STATS                                          */
  /* ======================================================= */

  const totalContainers =
    ownerContainers.length;

  const totalPhysicalContainers = ownerContainers.reduce(
    (sum, container) =>
      sum + Number(container.total_quantity || 0),
    0
  );

  const availableContainers =
    ownerContainers.filter(
      (container) => container.is_available
    ).length;

  const unavailableContainers =
    totalContainers - availableContainers;

  const pendingRequests =
    bookings.filter(
      (booking) =>
        booking.status === "pending"
    );

  const activeRentals =
    bookings.filter(
      (booking) =>
        booking.status === "active"
    );

  const acceptedBookings =
    bookings.filter(
      (booking) =>
        booking.status === "accepted"
    );

  const completedBookings =
    bookings.filter(
      (booking) =>
        booking.status === "completed"
    );

  const completedRevenue =
    completedBookings.reduce(
      (total, booking) =>
        total +
        Number(booking.total_amount || 0),
      0
    );

  const recentBookings =
    bookings.slice(0, 6);

  /* ======================================================= */
  /* CATEGORY BREAKDOWN                                       */
  /* ======================================================= */

  const categoryMap = new Map<string, { name: string; count: number }>();

  ownerContainers.forEach((container) => {
    const catName =
      (container.container_categories as any)?.name ||
      container.container_type ||
      "Uncategorized";

    const existing = categoryMap.get(catName) || {
      name: catName,
      count: 0,
    };

    existing.count += 1;
    categoryMap.set(catName, existing);
  });

  const categoryBreakdown = Array.from(categoryMap.values()).sort(
    (a, b) => b.count - a.count
  );

  /* ======================================================= */
  /* HELPERS                                                  */
  /* ======================================================= */

  function formatCurrency(amount: number) {
    return `₹${amount.toLocaleString("en-IN")}`;
  }

  function getStatusClasses(status: string) {
    switch (status) {
      case "pending":
        return "border-amber-200 bg-amber-50 text-amber-700";

      case "accepted":
        return "border-green-200 bg-green-50 text-green-700";

      case "active":
        return "border-teal-200 bg-teal-50 text-teal-800";

      case "completed":
        return "border-slate-200 bg-slate-100 text-slate-700";

      case "rejected":
        return "border-red-200 bg-red-50 text-red-700";

      case "cancelled":
        return "border-gray-200 bg-gray-100 text-gray-600";

      default:
        return "border-slate-200 bg-slate-100 text-slate-600";
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ================================================== */}
      {/* HEADER                                             */}
      {/* ================================================== */}

      <header className="border-b border-slate-200 bg-white">
        <div className="px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-500">
                Owner Portal
              </p>

              <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                Dashboard
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage your containers and rental operations.
              </p>
            </div>

            <div className="hidden items-center gap-3 sm:flex">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900">
                  Owner Account
                </p>

                <p className="max-w-[250px] truncate text-xs text-slate-500">
                  {user.email}
                </p>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">
                {user.email
                  ?.charAt(0)
                  .toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ================================================== */}
      {/* CONTENT                                             */}
      {/* ================================================== */}

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1600px]">

          {/* ================================================= */}
          {/* KPI CARDS                                         */}
          {/* ================================================= */}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            {/* Total Containers */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    Total Listings
                  </p>

                  <p className="mt-2 text-3xl font-black text-slate-950">
                    {totalContainers}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                  <Box className="h-5 w-5 text-slate-700" />
                </div>
              </div>

              <p className="mt-4 text-xs font-semibold text-slate-500">
                {totalPhysicalContainers} physical containers ·{" "}
                {availableContainers} available ·{" "}
                {unavailableContainers} unavailable
              </p>
            </div>

            {/* Pending Requests */}
            <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    Pending Requests
                  </p>

                  <p className="mt-2 text-3xl font-black text-slate-950">
                    {pendingRequests.length}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
                  <Clock3 className="h-5 w-5 text-amber-600" />
                </div>
              </div>

              <Link
                href="/owner/requests"
                className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-amber-700"
              >
                Review requests
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Active Rentals */}
            <div className="rounded-2xl border border-teal-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    Active Rentals
                  </p>

                  <p className="mt-2 text-3xl font-black text-slate-950">
                    {activeRentals.length}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50">
                  <Activity className="h-5 w-5 text-teal-700" />
                </div>
              </div>

              <p className="mt-4 text-xs font-semibold text-teal-700">
                Currently active rentals
              </p>
            </div>

            {/* Revenue */}
            <div className="rounded-2xl border border-green-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    Completed Revenue
                  </p>

                  <p className="mt-2 text-3xl font-black text-slate-950">
                    {formatCurrency(
                      completedRevenue
                    )}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50">
                  <IndianRupee className="h-5 w-5 text-green-600" />
                </div>
              </div>

              <p className="mt-4 text-xs font-semibold text-green-600">
                From completed rentals
              </p>
            </div>
          </div>

          {/* ================================================= */}
          {/* REQUESTS + QUICK ACTIONS                         */}
          {/* ================================================= */}

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">

            {/* Recent Requests */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 className="font-black text-slate-950">
                    Recent Rental Requests
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Latest renter activity
                  </p>
                </div>

                <Link
                  href="/owner/requests"
                  className="text-sm font-bold text-slate-700 hover:text-slate-950"
                >
                  View all
                </Link>
              </div>

              {recentBookings.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <ClipboardList className="mx-auto h-10 w-10 text-slate-300" />

                  <p className="mt-3 font-bold text-slate-700">
                    No rental requests yet
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    New renter requests will appear here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <th className="px-5 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-400">
                          Container
                        </th>

                        <th className="px-5 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-400">
                          Rental Period
                        </th>

                        <th className="px-5 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-400">
                          Qty
                        </th>

                        <th className="px-5 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-400">
                          Amount
                        </th>

                        <th className="px-5 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-400">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {recentBookings.map(
                        (booking) => (
                          <tr
                            key={booking.id}
                            className="border-b border-slate-100 last:border-0"
                          >
                            <td className="px-5 py-4">
                              <p className="font-bold text-slate-900">
                                {booking.containers
                                  ?.title ||
                                  "Container"}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {booking.containers
                                  ?.location ||
                                  "—"}
                              </p>
                            </td>

                            <td className="px-5 py-4 text-sm text-slate-600">
                              <p>
                                {booking.start_date}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                to{" "}
                                {booking.end_date}
                              </p>
                            </td>

                            <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                              {booking.quantity}
                            </td>

                            <td className="px-5 py-4 text-sm font-bold text-slate-900">
                              {formatCurrency(
                                Number(
                                  booking.total_amount ||
                                    0
                                )
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${getStatusClasses(
                                  booking.status
                                )}`}
                              >
                                {booking.status}
                              </span>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Quick Actions */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-black text-slate-950">
                Quick Actions
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Common owner operations
              </p>

              <div className="mt-5 space-y-3">

                <Link
                  href="/owner/containers/new"
                  className="flex items-center justify-between rounded-xl border border-slate-200 p-4 hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                      <PackagePlus className="h-5 w-5 text-slate-700" />
                    </div>

                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Add Container
                      </p>

                      <p className="text-xs text-slate-500">
                        Add a new listing
                      </p>
                    </div>
                  </div>

                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </Link>

                <Link
                  href="/owner/containers"
                  className="flex items-center justify-between rounded-xl border border-slate-200 p-4 hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                      <Box className="h-5 w-5 text-slate-700" />
                    </div>

                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Manage Containers
                      </p>

                      <p className="text-xs text-slate-500">
                        Manage your inventory
                      </p>
                    </div>
                  </div>

                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </Link>

                <Link
                  href="/owner/requests"
                  className="flex items-center justify-between rounded-xl border border-slate-200 p-4 hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                      <ClipboardList className="h-5 w-5 text-amber-600" />
                    </div>

                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Rental Requests
                      </p>

                      <p className="text-xs text-slate-500">
                        Review renter requests
                      </p>
                    </div>
                  </div>

                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </Link>
              </div>
            </section>
          </div>

          {/* ================================================= */}
          {/* CONTAINER OVERVIEW                                */}
          {/* ================================================= */}

          <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="font-black text-slate-950">
                  Container Overview
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Current inventory
                </p>
              </div>

              <Link
                href="/owner/containers"
                className="text-sm font-bold text-slate-700"
              >
                Manage
              </Link>
            </div>

            {ownerContainers.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <Box className="mx-auto h-10 w-10 text-slate-300" />

                <p className="mt-3 font-bold text-slate-700">
                  No containers added
                </p>

                <Link
                  href="/owner/containers/new"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
                >
                  <PackagePlus className="h-4 w-4" />
                  Add Container
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
                {ownerContainers
                  .slice(0, 6)
                  .map((container) => {
                    const catName =
                      (container.container_categories as any)
                        ?.name || container.container_type;

                    return (
                      <div
                        key={container.id}
                        className="rounded-xl border border-slate-200 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-bold text-slate-900">
                              {container.title}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {container.location}
                            </p>
                          </div>

                          <span
                            className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black ${
                              container.is_available
                                ? "bg-green-50 text-green-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {container.is_available
                              ? "ACTIVE"
                              : "INACTIVE"}
                          </span>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                              Category
                            </p>

                            <p className="mt-1 text-sm font-bold text-slate-700">
                              {catName}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                              Inventory
                            </p>

                            <p className="mt-1 text-sm font-bold text-slate-700">
                              {container.total_quantity}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* CATEGORY BREAKDOWN */}
            {categoryBreakdown.length > 0 && (
              <div className="border-t border-slate-100 px-5 py-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Categories
                </h3>

                <div className="mt-3 flex flex-wrap gap-2">
                  {categoryBreakdown.map(
                    (cat) => (
                      <span
                        key={cat.name}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                      >
                        {cat.name}
                        <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                          {cat.count}
                        </span>
                      </span>
                    )
                  )}
                </div>
              </div>
            )}
          </section>

          {/* ================================================= */}
          {/* STATUS                                             */}
          {/* ================================================= */}

          <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />

              <div>
                <p className="text-sm font-bold text-green-800">
                  Owner dashboard is operational
                </p>

                <p className="mt-1 text-xs text-green-700">
                  Container inventory and rental activity are being tracked.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
