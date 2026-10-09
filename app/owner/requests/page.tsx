import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Package,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

export default async function OwnerRequestsPage() {
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

  const { data: ownerContainers } = await supabase
    .from("containers")
    .select("id")
    .eq("owner_id", user.id);

  const containerIds = (ownerContainers ?? []).map(
    (c) => c.id
  );

  let bookings: any[] = [];
  let error: string | null = null;

  if (containerIds.length > 0) {
    const { data, error: queryError } = await supabase
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
          container_categories (
            id,
            name
          )
        )
      `)
      .in("container_id", containerIds)
      .order("created_at", { ascending: false });

    if (queryError) {
      error = queryError.message;
    }

    bookings = data ?? [];
  }

  if (error) {
    console.error("Failed to load rental requests:", error);
  }

  const requests = bookings;

  const pendingRequests = requests.filter(
    (request) => request.status === "pending"
  );

  const acceptedRequests = requests.filter(
    (request) => request.status === "accepted"
  );

  const rejectedRequests = requests.filter(
    (request) => request.status === "rejected"
  );

  return (
    <main className="min-h-screen bg-slate-50">
      {/* HEADER */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* <Link
            href="/owner"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link> */}

          <div className="mt-6">
            <p className="text-sm font-semibold text-teal-700">
              Owner Dashboard
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
              Rental Requests
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Review and manage requests from renters.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* STATS */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm font-medium text-slate-500">
              Pending
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-950">
              {pendingRequests.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm font-medium text-slate-500">
              Accepted
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {acceptedRequests.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm font-medium text-slate-500">
              Rejected
            </p>

            <p className="mt-2 text-3xl font-bold text-red-600">
              {rejectedRequests.length}
            </p>
          </div>
        </div>

        {/* REQUESTS */}
        <section className="mt-8">
          {requests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <Package className="mx-auto h-10 w-10 text-slate-300" />

              <h2 className="mt-4 text-lg font-bold text-slate-950">
                No rental requests yet
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Requests from renters will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => {
                const container = Array.isArray(request.containers)
                  ? request.containers[0]
                  : request.containers;

                const categoryName =
                  (container as any)?.container_categories
                    ?.name || container?.container_type;

                return (
                  <div
                    key={request.id}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-col justify-between gap-5 lg:flex-row">
                      {/* CONTAINER */}
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                            <Package className="h-5 w-5 text-slate-700" />
                          </div>

                          <div>
                            <h2 className="font-bold text-slate-950">
                              {container?.title ||
                                "Container"}
                            </h2>

                            <p className="text-sm text-slate-500">
                              {categoryName} ·{" "}
                              {container?.location}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-4 sm:grid-cols-3">
                          <div>
                            <p className="text-xs font-medium text-slate-400">
                              Rental Period
                            </p>

                            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                              <CalendarDays className="h-4 w-4" />
                              {request.start_date} →{" "}
                              {request.end_date}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-medium text-slate-400">
                              Quantity
                            </p>

                            <p className="mt-1 text-sm font-semibold text-slate-700">
                              {request.quantity}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-medium text-slate-400">
                              Total
                            </p>

                            <p className="mt-1 text-sm font-bold text-slate-950">
                              ₹
                              {Number(
                                request.total_amount
                              ).toLocaleString("en-IN")}
                            </p>
                          </div>
                        </div>

                        {request.notes && (
                          <div className="mt-5 rounded-xl bg-slate-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                              Renter Notes
                            </p>

                            <p className="mt-1 text-sm leading-6 text-slate-600">
                              {request.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* STATUS + ACTION */}
                      <div className="flex flex-col items-start justify-between gap-4 lg:items-end">
                        <StatusBadge
                          status={request.status}
                        />

                        <Link
                          href={`/owner/requests/${request.id}`}
                          className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-teal-700"
                        >
                          View Request
                        </Link>
                      </div>
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
