
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ContainerAvailabilityProps = {
  containerId: string;
  startDate: string;
  endDate: string;
  onAvailabilityChange?: (availableQuantity: number | null) => void;
};

type Availability = {
  total_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  is_available: boolean;
};

export default function ContainerAvailability({
  containerId,
  startDate,
  endDate,
  onAvailabilityChange,
}: ContainerAvailabilityProps) {
  const [availability, setAvailability] =
    useState<Availability | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAvailability() {
      if (!startDate || !endDate) {
        setAvailability(null);
        setError("");
        onAvailabilityChange?.(null);
        return;
      }

      setLoading(true);
      setError("");
      onAvailabilityChange?.(null);

      const supabase = createClient();

      const { data, error } = await supabase.rpc(
        "get_container_availability",
        {
          p_container_id: containerId,
          p_start_date: startDate,
          p_end_date: endDate,
        }
      );

      if (error) {
        setAvailability(null);
        setError(error.message);
        onAvailabilityChange?.(null);
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        setAvailability(null);
        setError("Unable to check availability");
        onAvailabilityChange?.(null);
        setLoading(false);
        return;
      }

      const result = data[0] as Availability;

      setAvailability(result);
      onAvailabilityChange?.(
        result.is_available
          ? result.available_quantity
          : 0
      );

      setLoading(false);
    }

    loadAvailability();
  }, [
    containerId,
    startDate,
    endDate,
    onAvailabilityChange,
  ]);

  if (!startDate || !endDate) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-sm font-medium text-slate-500">
          Select rental dates to check availability.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-sm font-medium text-slate-500">
          Checking availability...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-3">
        <p className="text-sm font-semibold text-red-700">
          {error}
        </p>
      </div>
    );
  }

  if (!availability) {
    return null;
  }

  if (!availability.is_available) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-3">
        <p className="text-sm font-semibold text-red-700">
          This container is currently unavailable.
        </p>
      </div>
    );
  }

  const hasAvailability =
    availability.available_quantity > 0;

  return (
    <div
      className={`rounded-xl border p-3 ${
        hasAvailability
          ? "border-green-200 bg-green-50"
          : "border-red-200 bg-red-50"
      }`}
    >
      <div className="flex items-center justify-between gap-3 p-2">
        <div>
            <p
              className={`text-sm font-bold ${
                hasAvailability
                  ? "text-green-700"
                  : "text-red-700"
              }`}
            >
              {hasAvailability
                ? `✓ ${availability.available_quantity} container${
                    availability.available_quantity === 1
                      ? ""
                      : "s"
                  } available for these dates`
                : "✕ No containers available for these dates"}
            </p>

            {hasAvailability && (
              <p className="mt-1 text-xs text-green-600">
                {availability.reserved_quantity} already booked
                {" · "}
                {availability.total_quantity} total
              </p>
            )}
        </div>
      </div>
    </div>
  );
}
