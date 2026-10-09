
"use client";

import {
  useCallback,
  useMemo,
  useState,
} from "react";

import ContainerAvailability from "@/components/ContainerAvailability";
import { createRentalRequest } from "@/app/(public)/containers/[id]/actions";

import {
  CalendarDays,
  FileText,
  Loader2,
  Minus,
  Plus,
  Send,
} from "lucide-react";

type RentalRequestFormProps = {
  containerId: string;
  pricePerDay: number;
};

export default function RentalRequestForm({
  containerId,
  pricePerDay,
}: RentalRequestFormProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /*
    null means availability has not been checked yet.
  */
  const [availableQuantity, setAvailableQuantity] =
    useState<number | null>(null);

  const [idempotencyKey] = useState(() => crypto.randomUUID());

  /*
    Calculate rental days.
  */
  const rentalDays = useMemo(() => {
    if (!startDate || !endDate) {
      return 0;
    }

    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return 0;
    }

    if (end < start) {
      return 0;
    }

    const millisecondsPerDay =
      1000 * 60 * 60 * 24;

    return (
      Math.floor(
        (end.getTime() - start.getTime()) /
          millisecondsPerDay
      ) + 1
    );
  }, [startDate, endDate]);

  /*
    Calculate estimated total.

    Server-side RPC remains the final
    source of truth for the actual amount.
  */
  const totalAmount =
    rentalDays * quantity * pricePerDay;

  /*
    Today's date.
  */
  const today = new Date()
    .toISOString()
    .split("T")[0];

  /*
    Receive availability from ContainerAvailability.
  */
  const handleAvailabilityChange = useCallback(
    (available: number | null) => {
      setAvailableQuantity(available);

      /*
        If current quantity is greater than
        the newly available quantity,
        automatically reduce it.
      */
      if (available !== null) {
        setQuantity((current) => {
          if (available <= 0) {
            return 1;
          }

          return Math.min(current, available);
        });
      }
    },
    []
  );

  /*
    Increase quantity.

    Never allow quantity to exceed
    the currently available quantity.
  */
  function increaseQuantity() {
    setQuantity((current) => {
      /*
        Availability not checked yet.
        Allow increment temporarily.
      */
      if (availableQuantity === null) {
        return current + 1;
      }

      /*
        No inventory available.
      */
      if (availableQuantity <= 0) {
        return current;
      }

      /*
        Maximum = currently available quantity.
      */
      return Math.min(
        current + 1,
        availableQuantity
      );
    });
  }

  /*
    Decrease quantity.
  */
  function decreaseQuantity() {
    setQuantity((current) =>
      Math.max(1, current - 1)
    );
  }

  /*
    Quantity is invalid when:
    - no availability
    - requested quantity > availability
  */
  const quantityUnavailable =
    availableQuantity !== null &&
    (availableQuantity <= 0 ||
      quantity > availableQuantity);

  /*
    Submit button validation.
  */
  const cannotSubmit =
    !startDate ||
    !endDate ||
    rentalDays <= 0 ||
    quantityUnavailable ||
    isSubmitting;

  return (
    <div className="text-stone-900">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
          Reserve your container
        </p>
        <h2 className="mt-2 text-xl font-bold text-stone-950">
          Choose your rental dates
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          Send a request and the owner will confirm availability.
        </p>
      </div>

      <form
        action={async (formData) => {
          setIsSubmitting(true);

          formData.set("idempotency_key", idempotencyKey);

          try {
            await createRentalRequest(
              containerId,
              formData
            );
          } finally {
            setIsSubmitting(false);
          }
        }}
        className="space-y-5"
      >
        {/* START DATE */}
        <div>
          <label
            htmlFor="start_date"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Start Date
          </label>

          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

            <input
              id="start_date"
              name="start_date"
              type="date"
              min={today}
              value={startDate}
              onChange={(e) => {
                const value = e.target.value;

                setStartDate(value);

                /*
                  If selected end date is before
                  the new start date, clear it.
                */
                if (endDate && value > endDate) {
                  setEndDate("");
                }

                /*
                  Reset quantity when dates change.
                */
                setQuantity(1);
              }}
              required
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
            />
          </div>
        </div>

        {/* END DATE */}
        <div>
          <label
            htmlFor="end_date"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            End Date
          </label>

          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

            <input
              id="end_date"
              name="end_date"
              type="date"
              min={startDate || today}
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);

                /*
                  Reset quantity because the
                  availability may change.
                */
                setQuantity(1);
              }}
              required
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
            />
          </div>
        </div>

        {/* AVAILABILITY */}
        <ContainerAvailability
          containerId={containerId}
          startDate={startDate}
          endDate={endDate}
          onAvailabilityChange={
            handleAvailabilityChange
          }
        />

        {/* QUANTITY */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-semibold text-slate-700">
              Quantity
            </label>

            {availableQuantity !== null &&
              availableQuantity > 0 && (
                <span className="text-xs font-semibold text-slate-500">
                  Max: {availableQuantity}
                </span>
              )}
          </div>

          <div
            className={`flex h-12 items-center justify-between rounded-xl border px-3 ${
              quantityUnavailable
                ? "border-red-300 bg-red-50"
                : "border-slate-200"
            }`}
          >
            {/* MINUS */}
            <button
              type="button"
              onClick={decreaseQuantity}
              disabled={quantity <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </button>

            {/* QUANTITY */}
            <span
              className={`font-semibold ${
                quantityUnavailable
                  ? "text-red-700"
                  : "text-slate-900"
              }`}
            >
              {quantity}
            </span>

            {/* PLUS */}
            <button
              type="button"
              onClick={increaseQuantity}
              disabled={
                availableQuantity !== null &&
                (availableQuantity <= 0 ||
                  quantity >= availableQuantity)
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </button>

            <input
              type="hidden"
              name="quantity"
              value={quantity}
            />
          </div>

          {/* QUANTITY ERROR */}
          {availableQuantity !== null &&
            availableQuantity <= 0 && (
              <p className="mt-2 text-xs font-semibold text-red-600">
                No containers are available for the selected dates.
              </p>
            )}

          {availableQuantity !== null &&
            availableQuantity > 0 &&
            quantity > availableQuantity && (
              <p className="mt-2 text-xs font-semibold text-red-600">
                Only {availableQuantity} container
                {availableQuantity === 1 ? "" : "s"}{" "}
                {availableQuantity === 1 ? "is" : "are"} available.
              </p>
            )}
        </div>

        {/* NOTES */}
        <div>
          <label
            htmlFor="notes"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Notes
            <span className="ml-1 font-normal text-slate-400">
              (Optional)
            </span>
          </label>

          <div className="relative">
            <FileText className="absolute left-3 top-3 h-5 w-5 text-slate-400" />

            <textarea
              id="notes"
              name="notes"
              rows={4}
              placeholder="Tell the owner anything important about your rental..."
              className="w-full resize-none rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
            />
          </div>
        </div>

        {/* PRICE SUMMARY */}
        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
          <div className="flex justify-between text-sm text-stone-600">
            <span>Price per day</span>
            <span className="font-semibold text-stone-900">₹{pricePerDay.toLocaleString("en-IN")}</span>
          </div>

          <div className="mt-2 flex justify-between text-sm text-stone-600">
            <span>Rental days</span>
            <span className="font-semibold text-stone-900">{rentalDays || 0}</span>
          </div>

          <div className="mt-2 flex justify-between text-sm text-stone-600">
            <span>Quantity</span>
            <span className="font-semibold text-stone-900">{quantity}</span>
          </div>

          <div className="my-3 h-px bg-stone-200" />

          <div className="flex justify-between">
            <span className="font-bold text-stone-900">Estimated total</span>
            <span className="text-xl font-black text-emerald-700">
              ₹{totalAmount.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* SUBMIT */}
        <button
          type="submit"
          disabled={cannotSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3.5 text-sm font-bold text-white shadow-sm shadow-emerald-900/10 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending request...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Request to rent
            </>
          )}
        </button>

        <p className="text-center text-xs leading-5 text-stone-500">
          Your request will be reviewed by the container owner.
        </p>
      </form>
    </div>
  );
}
