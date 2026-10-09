"use client";

import { useState } from "react";

import { updateRequestStatus } from "@/app/owner/requests/actions";
import { Loader2 } from "lucide-react";
import ConfirmationModal from "@/components/ConfirmationModal";

type RequestActionsProps = {
  bookingId: string;
  status: string;
};

export default function RequestActions({
  bookingId,
  status,
}: RequestActionsProps) {
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<
    "accept" | "reject" | null
  >(null);
  const [confirmation, setConfirmation] = useState<
    "accept" | "reject" | null
  >(null);

  if (status.toLowerCase() !== "pending") {
    return null;
  }

  async function handleConfirm() {
    if (!confirmation) return;
    setLoading(true);
    setAction(confirmation);
    await updateRequestStatus(
      bookingId,
      confirmation === "accept" ? "accepted" : "rejected"
    );
  }

  return (
    <div className="mt-6 flex gap-4">
      <button
        type="button"
        onClick={() => setConfirmation("accept")}
        disabled={loading}
        className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading && action === "accept" && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}
        {loading && action === "accept"
          ? "Accepting..."
          : "Accept Request"}
      </button>

      <button
        type="button"
        onClick={() => setConfirmation("reject")}
        disabled={loading}
        className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading && action === "reject" && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}
        {loading && action === "reject"
          ? "Rejecting..."
          : "Reject Request"}
      </button>
      <ConfirmationModal
        isOpen={confirmation !== null}
        title={confirmation === "accept" ? "Accept this rental request?" : "Reject this rental request?"}
        message={
          confirmation === "accept"
            ? "This will mark the request as accepted and update its booking status."
            : "This will mark the request as rejected. The renter's request will not proceed."
        }
        confirmLabel={confirmation === "accept" ? "Accept request" : "Reject request"}
        tone={confirmation === "reject" ? "danger" : "positive"}
        isBusy={loading}
        busyLabel={action === "accept" ? "Accepting..." : "Rejecting..."}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmation(null)}
      />
    </div>
  );
}
