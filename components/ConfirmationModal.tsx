"use client";

import { useEffect } from "react";
import { AlertTriangle, Check, Loader2 } from "lucide-react";

type ConfirmationModalProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  tone?: "danger" | "positive";
  isBusy?: boolean;
  busyLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmLabel,
  tone = "positive",
  isBusy = false,
  busyLabel = "Processing...",
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  useEffect(() => {
    if (!isOpen || isBusy) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isBusy, onCancel]);

  if (!isOpen) return null;

  const isDanger = tone === "danger";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-stone-950/55 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isBusy) onCancel();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-title"
        aria-describedby="confirmation-message"
        className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl sm:p-7"
      >
        <div className="flex items-start gap-4">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              isDanger ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"
            }`}
          >
            {isDanger ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <Check className="h-5 w-5" />
            )}
          </span>
          <div className="min-w-0 pt-0.5">
            <h2 id="confirmation-title" className="text-lg font-bold text-stone-950">
              {title}
            </h2>
            <p id="confirmation-message" className="mt-2 text-sm leading-6 text-stone-600">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isBusy}
            className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-bold text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Keep it
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isBusy}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isDanger ? "bg-red-700 hover:bg-red-800" : "bg-emerald-700 hover:bg-emerald-800"
            }`}
          >
            {isBusy && <Loader2 className="h-4 w-4 animate-spin" />}
            {isBusy ? busyLabel : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}