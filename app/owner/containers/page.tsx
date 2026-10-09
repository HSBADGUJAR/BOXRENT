import { redirect } from "next/navigation";
import Link from "next/link";
import { ImageOff, Plus, Edit, Eye, CheckCircle2, AlertCircle } from "lucide-react";
import { deleteContainer } from "./actions";
import DeleteContainerButton from "@/components/owner/DeleteContainerButton";

import { createClient } from "@/lib/supabase/server";
import {
  CONTAINER_IMAGE_BUCKET,
  SIGNED_URL_TTL_SECONDS,
} from "@/lib/container-images";

export default async function OwnerContainersPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const supabase = await createClient();

  const { success, error } = await searchParams;

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

  const { data: containers } = await supabase
    .from("containers")
    .select(`
      *,
      container_categories (
        id,
        name
      )
    `)
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const ownerContainers = containers ?? [];

  /* Load the primary image of each container (signed URLs) */
  const containerIds = ownerContainers.map(
    (container) => container.id
  );

  const primaryImageUrls = new Map<string, string>();

  const reservedMap = new Map<string, number>();

  if (containerIds.length > 0) {
    const { data: images } = await supabase
      .from("container_images")
      .select("container_id, storage_path")
      .eq("is_primary", true)
      .in("container_id", containerIds);

    const storagePaths = (images ?? []).map(
      (image) => image.storage_path
    );

    if (storagePaths.length > 0) {
      const { data: signed } = await supabase.storage
        .from(CONTAINER_IMAGE_BUCKET)
        .createSignedUrls(
          storagePaths,
          SIGNED_URL_TTL_SECONDS
        );

      (images ?? []).forEach((image, index) => {
        const url =
          signed?.[index]?.signedUrl ??
          signed?.find(
            (entry) => entry.path === image.storage_path
          )?.signedUrl;

        if (url) {
          primaryImageUrls.set(image.container_id, url);
        }
      });
    }

    const { data: activeBookings } = await supabase
      .from("bookings")
      .select("container_id, quantity")
      .in("container_id", containerIds)
      .in("status", ["accepted", "active"]);

    (activeBookings ?? []).forEach((booking) => {
      const current = reservedMap.get(
        booking.container_id
      ) || 0;
      reservedMap.set(
        booking.container_id,
        current + Number(booking.quantity || 0)
      );
    });
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* <Link
              href="/owner"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"
            >
              Back to Dashboard
            </Link> */}

            <Link
              href="/owner/containers/new"
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
            >
              <Plus className="h-4 w-4" />
              Add Container
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-semibold text-teal-700">
            Owner Dashboard
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            My Containers
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage your container inventory and rental listings.
          </p>
        </div>

        {success && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-3 w-3 text-emerald-700" />
              </div>
              <p className="font-medium text-emerald-900">{success}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-3 w-3 text-red-700" />
              </div>
              <p className="font-medium text-red-900">{error}</p>
            </div>
          </div>
        )}

        {ownerContainers.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <Eye className="h-8 w-8 text-slate-400" />
            </div>

            <p className="mt-6 text-lg font-bold text-slate-900">
              No containers yet
            </p>

            <p className="mt-2 text-slate-500 max-w-md mx-auto">
              Get started by adding your first container. Renters will be able to
              discover and request it.
            </p>

            <Link
              href="/owner/containers/new"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white hover:bg-teal-700"
            >
              <Plus className="h-4 w-4" />
              Add Container
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-5 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-400">
                      Image
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-400">
                      Container
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-400">
                      Category
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-400">
                      Location
                    </th>

                     <th className="px-5 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-400">
                      Inventory
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-400">
                      Available
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-400">
                      Status
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-400">
                      Price/Day
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-black uppercase tracking-wider text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {ownerContainers.map((container) => {
                    const categoryName =
                      (container.container_categories as any)
                        ?.name || container.container_type;

                    return (
                    <tr
                      key={container.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                    <td className="px-5 py-4">
                        <div className="h-12 w-12 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                          {primaryImageUrls.get(
                            container.id
                          ) ? (
                            <img
                              src={primaryImageUrls.get(
                                container.id
                              )}
                              alt={container.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <ImageOff className="h-4 w-4 text-slate-300" />
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-900 truncate max-w-xs">
                          {container.title}
                        </p>

                        <p className="mt-1 text-xs text-slate-500 truncate max-w-xs">
                          {container.description?.slice(0, 60) ?? "No description"}
                          {container.description && container.description.length > 60
                            ? "..."
                            : ""}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-sm font-medium text-slate-700">
                          {categoryName}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {container.location}
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                        {container.total_quantity}
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                        {Math.max(
                          0,
                          Number(container.total_quantity || 0) -
                            (reservedMap.get(container.id) || 0)
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                            container.is_available
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {container.is_available ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm font-bold text-slate-900">
                        ₹{Number(container.price_per_day).toLocaleString("en-IN")}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/owner/containers/${container.id}/edit`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>

                          <DeleteContainerButton containerId={container.id} />
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
