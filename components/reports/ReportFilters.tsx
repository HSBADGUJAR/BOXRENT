"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import {
  CalendarDays,
  Filter,
  RotateCw,
  CheckCircle,
} from "lucide-react";

export type StatusFilter =
  | "pending"
  | "accepted"
  | "rejected"
  | "active"
  | "completed"
  | "cancelled";

const statusOptions: { value: string; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

export default function ReportFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [from, setFrom] = useState(
    searchParams.get("from") || ""
  );
  const [to, setTo] = useState(
    searchParams.get("to") || ""
  );
  const [status, setStatus] = useState(
    searchParams.get("status") || ""
  );

  const updateUrl = () => {
    const params = new URLSearchParams();

    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (status) params.set("status", status);

    const query = params.toString();
    router.push(
      query ? `${pathname}?${query}` : pathname
    );
  };

  const handleApply = () => {
    updateUrl();
  };

  const handleReset = () => {
    setFrom("");
    setTo("");
    setStatus("");
    router.push(pathname);
  };

  const hasFilters = from || to || status;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-5 w-5 text-slate-600" />
          <h2 className="text-lg font-black text-slate-950">
            Filters
          </h2>
        </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1">
          <label
            htmlFor="from-date"
            className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            From Date
          </label>

          <input
            id="from-date"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="to-date"
            className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            To Date
          </label>

          <input
            id="to-date"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="status-filter"
            className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Status
          </label>

          <select
            id="status-filter"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="">All Statuses</option>

            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-teal-700"
          >
            Apply
          </button>

          {hasFilters && (
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <RotateCw className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export { statusOptions };
