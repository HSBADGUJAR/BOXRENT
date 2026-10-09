"use client";

import { useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteContainer } from "@/app/owner/containers/actions";
import ConfirmationModal from "@/components/ConfirmationModal";

interface DeleteContainerButtonProps {
  containerId: string;
}

export default function DeleteContainerButton({ containerId }: DeleteContainerButtonProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <>
      <form
        ref={formRef}
        action={deleteContainer}
        onSubmit={() => setIsDeleting(true)}
      >
        <input type="hidden" name="containerId" value={containerId} />
        <button
          type="button"
          onClick={() => setIsConfirmOpen(true)}
          disabled={isDeleting}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          title="Delete"
          aria-label="Delete container"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </form>
      <ConfirmationModal
        isOpen={isConfirmOpen}
        title="Delete this container?"
        message="Are you sure you want to delete this container? This action cannot be undone."
        confirmLabel="Delete container"
        tone="danger"
        isBusy={isDeleting}
        busyLabel="Deleting..."
        onConfirm={() => formRef.current?.requestSubmit()}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </>
  );
}