"use client";

import { useState } from "react";
import { Trash2, X } from "lucide-react";

import { deleteContainerByIdDirect as deleteContainer } from "@/app/owner/containers/actions";

type DeleteContainerButtonProps = {
  containerId: string;
};

export default function DeleteContainerButton({
  containerId,
}: DeleteContainerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleDelete() {
    setIsDeleting(true);
    setErrorMessage(null);

    const result = await deleteContainer(containerId);

    if (!result.success) {
      setErrorMessage(result.error);
      setIsDeleting(false);
      return;
    }

    setIsOpen(false);
    window.location.reload();
  }

  function handleClose() {
    if (!isDeleting) {
      setIsOpen(false);
      setErrorMessage(null);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-red-600 transition hover:text-red-700"
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  Delete Container?
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  This action permanently removes this container
                  from your listings if it has no rental history.
                </p>
              </div>

              <button
                type="button"
                onClick={handleClose}
                disabled={isDeleting}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 rounded-xl bg-red-50 p-4">
              <p className="text-sm font-medium text-red-700">
                Containers with existing rental history cannot
                be deleted.
              </p>
            </div>

            {errorMessage && (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {errorMessage}
              </p>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isDeleting}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}