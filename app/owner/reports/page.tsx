import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  CheckCircle,
  Clock3,
  DollarSign,
  IndianRupee,
  Package,
  TrendingUp,
  Activity,
  Percent,
} from "lucide-react";

import { fetchReportData } from "./actions";

import BarChart from "@/components/reports/BarChart";
import ReportFilters from "@/components/reports/ReportFilters";
import ExportCsvButton from "@/components/reports/ExportCsvButton";

type ReportsPageProps = {
  searchParams: Promise<{
    from?: string;
    to?: string;
    status?: string;
  }>;
};

export default async function ReportsPage({
  searchParams,
}: ReportsPageProps) {
  const sp = await searchParams;

  const filters = {
    from: sp.from,
    to: sp.to,
    status: sp.status,
  };

  const { containers, bookings } = await fetchReportData(
    filters
  );

  /* ======================================================= */
  /* HELPERS                                                  */
  /* ======================================================= */

  function formatCurrency(amount: number) {
    if (!amount || isNaN(amount)) return "₹0";
    return `₹${Math.round(amount).toLocaleString("en-IN")}`;
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

  function formatMonthKey(key: string) {
    const date = new Date(key + "-01");
    return date.toLocaleDateString("en-IN", {
      month: "short",
      year: "numeric",
    });
  }

  /* ======================================================= */
  /* REPORT STATS                                              */
  /* ======================================================= */

  const totalBookings = bookings.length;

  const totalRevenue = bookings.reduce(
    (sum, b) => sum + Number(b.total_amount || 0),
    0
  );

  const completedBookings = bookings.filter(
    (b) => b.status === "completed"
  );

  const completedRevenue = completedBookings.reduce(
    (sum, b) => sum + Number(b.total_amount || 0),
    0
  );

  const activeBookings = bookings.filter(
    (b) => b.status === "active"
  );

  const acceptedBookings = bookings.filter(
    (b) => b.status === "accepted"
  );

  const pendingBookings = bookings.filter(
    (b) => b.status === "pending"
  );

  const avgBookingValue =
    totalBookings > 0 ? totalRevenue / totalBookings : 0;

  const totalListings = containers.length;

  const totalPhysicalContainers = containers.reduce(
    (sum, c) => sum + Number(c.total_quantity || 0),
    0
  );

  const reservedContainers = bookings
    .filter((b) => b.status === "accepted" || b.status === "active")
    .reduce((sum, b) => sum + Number(b.quantity || 0), 0);

  const availableContainers = Math.max(
    0,
    totalPhysicalContainers - reservedContainers
  );

  const utilizationRate =
    totalPhysicalContainers > 0
      ? (reservedContainers / totalPhysicalContainers) * 100
      : 0;

  const activeRentals = activeBookings.length;
  const pendingRequests = pendingBookings.length;

  /* ======================================================= */
  /* REVENUE BY MONTH                                          */
  /* ======================================================= */

  const revenueByMonthMap = bookings.reduce(
    (acc: Record<string, number>, b) => {
      const month = (b.created_at || "").slice(0, 7);

      if (!month) return acc;

      acc[month] =
        (acc[month] || 0) + Number(b.total_amount || 0);
      return acc;
    },
    {}
  );

  const revenueByMonthData = Object.entries(revenueByMonthMap)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([month, value]) => ({
      label: formatMonthKey(month),
      value,
      color: "#0d9488",
      rawMonth: month,
    }));

  /* ======================================================= */
  /* BOOKINGS BY STATUS                                       */
  /* ======================================================= */

  const statusLabels: Record<string, string> = {
    pending: "Pending",
    accepted: "Accepted",
    active: "Active",
    completed: "Completed",
    rejected: "Rejected",
    cancelled: "Cancelled",
  };

  const statusColors: Record<string, string> = {
    pending: "#f59e0b",
    accepted: "#22c55e",
    active: "#14b8a3",
    completed: "#64748b",
    rejected: "#ef4444",
    cancelled: "#9ca3af",
  };

  const statusMap = bookings.reduce(
    (acc: Record<string, number>, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    },
    {}
  );

  const statusData = Object.entries(statusMap)
    .sort(([, a], [, b]) => b - a)
    .map(([status, count]) => ({
      label: statusLabels[status] || status,
      value: count,
      color: statusColors[status] || "#64748b",
      rawStatus: status,
    }));

  /* ======================================================= */
  /* REVENUE BY CONTAINER                                     */
  /* ======================================================= */

  const revenueByContainerMap = bookings.reduce(
    (acc: Record<string, { name: string; revenue: number; count: number }>, b) => {
      const container = Array.isArray(b.containers)
        ? b.containers[0]
        : b.containers;

      const name = container?.title || "Unknown";
      const id = b.container_id;

      if (!acc[id]) {
        acc[id] = { name, revenue: 0, count: 0 };
      }

      acc[id].revenue += Number(b.total_amount || 0);
      acc[id].count += 1;
      return acc;
    },
    {}
  );

  const topContainersByRevenue = Object.entries(
    revenueByContainerMap
  )
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .slice(0, 5)
    .map(([id, data]) => ({
      id,
      label: data.name,
      value: data.revenue,
      count: data.count,
      color: "#0d9488",
    }));

  /* ======================================================= */
  /* RECENT BOOKINGS                                          */
  /* ======================================================= */

  const recentBookings = bookings.slice(0, 10);

  /* ======================================================= */
  /* REVENUE TREND (for trend indicator)                     */
  /* ======================================================= */

  const firstHalfRevenue = revenueByMonthData
    .slice(0, Math.ceil(revenueByMonthData.length / 2))
    .reduce((sum, item) => sum + item.value, 0);

  const secondHalfRevenue = revenueByMonthData
    .slice(Math.ceil(revenueByMonthData.length / 2))
    .reduce((sum, item) => sum + item.value, 0);

  const revenueTrend =
    firstHalfRevenue > 0
      ? ((secondHalfRevenue - firstHalfRevenue) /
          firstHalfRevenue) *
        100
      : 0;

  /* ======================================================= */
  /* EMPTY STATE                                              */
  /* ======================================================= */

  const hasFilters = filters.from || filters.to || filters.status;
  const isEmpty = bookings.length === 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ================================================== */}
      {/* HEADER                                            */}
      {/* ================================================== */}

      <header className="border-b border-slate-200 bg-white">
        <div className="px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* <Link
                href="/owner"
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link> */}

              {/* <div className="h-4 w-px bg-slate-200" /> */}

              <div>
                <p className="text-sm font-semibold text-teal-700">
                  Owner Dashboard
                </p>

                <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                  Reports &amp; Analytics
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Analyze your container rental performance,
                  revenue trends, and booking activity.
                </p>
              </div>
            </div>

            <ExportCsvButton filters={filters} />
          </div>
        </div>
      </header>

      {/* ================================================== */}
      {/* FILTERS                                           */}
      {/* ================================================== */}

      <div className="px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1600px]">
          <ReportFilters />
        </div>
      </div>

      {/* ================================================== */}
      {/* CONTENT                                           */}
      {/* ================================================== */}

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1600px]">

          {/* ============================================= */}
          {/* KPI CARDS                                     */}
          {/* ============================================= */}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            {/* Total Revenue */}
            {/* <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    Total Revenue
                  </p>

                  <p className="mt-2 text-3xl font-black text-slate-950">
                    {formatCurrency(totalRevenue)}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50">
                  <IndianRupee className="h-5 w-5 text-green-600" />
                </div>
              </div>

              <div className="mt-3 flex items-center gap-1.5">
                <span
                  className={`text-xs font-semibold ${
                    revenueTrend >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {revenueTrend >= 0 ? "+" : ""}
                  {Math.round(revenueTrend)}%
                </span>

                <span className="text-xs text-slate-400">
                  vs. previous period
                </span>
              </div>
            </div> */}

            {/* Completed Revenue */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    Completed Revenue
                  </p>

                  <p className="mt-2 text-3xl font-black text-slate-950">
                    {formatCurrency(completedRevenue)}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50">
                  <DollarSign className="h-5 w-5 text-teal-600" />
                </div>
              </div>

              <p className="mt-3 text-xs font-semibold text-slate-500">
                {completedBookings.length}{" "}
                completed bookings
              </p>
            </div>

            {/* Total Bookings */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    Total Bookings
                  </p>

                  <p className="mt-2 text-3xl font-black text-slate-950">
                    {totalBookings}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
              </div>

              <div className="mt-3 flex items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1 font-semibold text-green-700">
                  {completedBookings.length} completed
                </span>

                <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                  {pendingBookings.length} pending
                </span>

                <span className="inline-flex items-center gap-1 font-semibold text-teal-700">
                  {activeBookings.length} active
                </span>
              </div>
            </div>

            {/* Avg Booking Value */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    Avg Booking Value
                  </p>

                  <p className="mt-2 text-3xl font-black text-slate-950">
                    {formatCurrency(avgBookingValue)}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
              </div>

              <p className="mt-3 text-xs font-semibold text-slate-500">
                Across {totalBookings} bookings
              </p>
            </div>

            {/* Occupancy Rate */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    Utilization Rate
                  </p>

                  <p className="mt-2 text-3xl font-black text-slate-950">
                    {Math.round(utilizationRate)}%
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
                  <Percent className="h-5 w-5 text-amber-600" />
                </div>
              </div>

              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-teal-600 transition-all"
                  style={{ width: `${utilizationRate}%` }}
                />
              </div>

              <p className="mt-2 text-xs text-slate-500">
                {reservedContainers} of{" "}
                {totalPhysicalContainers} physical containers reserved
              </p>
            </div>

            {/* Total Physical Containers */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    Total Physical Containers
                  </p>

                  <p className="mt-2 text-3xl font-black text-slate-950">
                    {totalPhysicalContainers}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                  <Package className="h-5 w-5 text-slate-700" />
                </div>
              </div>

              <p className="mt-3 text-xs font-semibold text-slate-500">
                {totalListings} listings · {availableContainers} available
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
                    {pendingRequests}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
                  <Clock3 className="h-5 w-5 text-amber-600" />
                </div>
              </div>

              <Link
                href="/owner/requests"
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-amber-700"
              >
                Review requests
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
                    {activeRentals}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50">
                  <Activity className="h-5 w-5 text-teal-700" />
                </div>
              </div>

              <p className="mt-3 text-xs font-semibold text-teal-700">
                Currently in progress
              </p>
            </div>

            {/* Accepted */}
            <div className="rounded-2xl border border-green-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    Accepted
                  </p>

                  <p className="mt-2 text-3xl font-black text-slate-950">
                    {acceptedBookings.length}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>

              <p className="mt-3 text-xs font-semibold text-green-700">
                Confirmed bookings
              </p>
            </div>
          </div>

          {/* ============================================= */}
          {/* ADDITIONAL KPI CARDS                          */}
          {/* ============================================= */}

         

          {/* ============================================= */}
          {/* CHARTS                                      */}
          {/* ============================================= */}

          <div className="mt-6 grid gap-6 lg:grid-cols-2">

            {/* Revenue by Month */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-950">
                    Revenue by Month
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Total revenue from completed and active bookings
                  </p>
                </div>

                <BarChart3 className="h-5 w-5 text-slate-400" />
              </div>

              <BarChart
                data={revenueByMonthData}
                unit="currency"
                height={180}
                emptyMessage="No revenue data for this period"
              />
            </div>

            {/* Bookings by Status */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-950">
                    Bookings by Status
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Distribution across all booking states
                  </p>
                </div>

                <BarChart3 className="h-5 w-5 text-slate-400" />
              </div>

              <BarChart
                data={statusData}
                unit="number"
                height={180}
                emptyMessage="No bookings found"
                showIcons={true}
              />

              {statusData.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {statusData.map((item) => (
                    <div
                      key={item.rawStatus}
                      className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                    >
                      <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        {item.label}
                      </span>

                      <span className="text-xs font-bold text-slate-900">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ============================================= */}
          {/* REVENUE BY CONTAINER                        */}
          {/* ============================================= */}

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-950">
                  Top Containers by Revenue
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Your highest-earning container listings
                </p>
              </div>

              <Link
                href="/owner/containers"
                className="text-sm font-bold text-slate-700 hover:text-slate-950"
              >
                Manage All
              </Link>
            </div>

            {topContainersByRevenue.length === 0 ? (
              <div className="py-8 text-center">
                <Package className="mx-auto h-10 w-10 text-slate-300" />

                <p className="mt-3 text-sm font-bold text-slate-700">
                  No revenue data yet
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Completed or active bookings will appear here.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-2">
                <BarChart
                  data={topContainersByRevenue}
                  unit="currency"
                  height={150}
                  emptyMessage="No revenue data"
                />

                <div className="min-w-0">
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50">
                          <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-400">
                            Container
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-wider text-slate-400">
                            Revenue
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-wider text-slate-400">
                            Bookings
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {topContainersByRevenue.map(
                          (container) => (
                            <tr
                              key={container.id}
                              className="border-b border-slate-100 last:border-0"
                            >
                              <td className="px-4 py-3">
                                <p className="max-w-[180px] truncate font-bold text-slate-900">
                                  {container.label}
                                </p>
                              </td>

                              <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">
                                {formatCurrency(
                                  container.value
                                )}
                              </td>

                              <td className="px-4 py-3 text-right text-sm font-semibold text-slate-500">
                                {container.count}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ============================================= */}
          {/* RECENT BOOKINGS TABLE                       */}
          {/* ============================================= */}

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-black text-slate-950">
                  Recent Bookings
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Latest rental activity
                  {hasFilters && " (filtered)"}
                </p>
              </div>

              <Link
                href="/owner/requests"
                className="text-sm font-bold text-slate-700 hover:text-slate-950"
              >
                View all requests
              </Link>
            </div>

            {isEmpty ? (
              <div className="px-5 py-12 text-center">
                <Package className="mx-auto h-10 w-10 text-slate-300" />

                <p className="mt-3 font-bold text-slate-700">
                  No bookings found
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {hasFilters
                    ? "Try adjusting your filters."
                    : "New rental requests will appear here."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
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

                      <th className="px-5 py-3 text-right text-xs font-black uppercase tracking-wider text-slate-400">
                        Amount
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-400">
                        Status
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-400">
                        Created
                      </th>

                      <th className="px-5 py-3 text-center text-xs font-black uppercase tracking-wider text-slate-400">
                        Actions
                      </th>
                    </tr>
                  </thead>

                    <tbody>
                    {recentBookings.map((booking) => {
                      const container = Array.isArray(
                        booking.containers
                      )
                        ? booking.containers[0]
                        : booking.containers;

                      const categoryName =
                        (container as any)?.container_categories
                          ?.name || "";

                      return (
                        <tr
                          key={booking.id}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                                <Package className="h-5 w-5 text-slate-700" />
                              </div>

                              <div>
                                <p className="font-bold text-slate-900">
                                  {container?.title || "Container"}
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  {categoryName
                                    ? `${categoryName} · ${container?.location || "—"}`
                                    : container?.location || "—"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            <p className="flex items-center gap-1">
                              <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                              {booking.start_date}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              to {booking.end_date}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                            {booking.quantity}
                          </td>

                          <td className="px-5 py-4 text-right text-sm font-bold text-slate-900">
                            {formatCurrency(
                              Number(booking.total_amount || 0)
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

                          <td className="px-5 py-4 text-sm text-slate-500">
                            {(booking.created_at || "").slice(0, 10)}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-center">
                              <Link
                                href={`/owner/requests/${booking.id}`}
                                className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                                title="View details"
                              >
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 6h.01M10 12h.01M10 18h.01m.015 5h-.015a2.5 2.5 0 01-2.5-2.5V5a2.5 2.5 0 012.5-2.5h4a2.5 2.5 0 012.5 2.5v14a2.5 2.5 0 01-2.5 2.5h-4z"
                                  />
                                </svg>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ============================================= */}
          {/* SUMMARY FOOTER                              */}
          {/* ============================================= */}

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-slate-500">
              <div>
                Showing {recentBookings.length} of{" "}
                {totalBookings} bookings
                {hasFilters && (
                  <span className="font-medium text-slate-700">
                    {" "}
                    (filtered)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4">
                <span>
                  Generated on{" "}
                  {new Date().toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
