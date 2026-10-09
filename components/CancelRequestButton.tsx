"use client";

import { useState } from "react";
import { cancelRentalRequest } from "@/app/my-requests/actions";
import ConfirmationModal from "@/components/ConfirmationModal";

type CancelRequestButtonProps = {
  bookingId: string;
};

export default function CancelRequestButton({
  bookingId,
}: CancelRequestButtonProps) {
  const [loading, setLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  async function handleCancel() {
    setLoading(true);
    await cancelRentalRequest(bookingId);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsConfirmOpen(true)}
        disabled={loading}
        className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Cancelling..." : "Cancel request"}
      </button>
      <ConfirmationModal
        isOpen={isConfirmOpen}
        title="Cancel this rental request?"
        message="Are you sure you want to cancel this rental request? The request will be withdrawn from the owner's review."
        confirmLabel="Cancel request"
        tone="danger"
        isBusy={loading}
        busyLabel="Cancelling..."
        onConfirm={handleCancel}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </>
  );
}