"use client";

import { useState } from "react";
import { Download, FileText } from "lucide-react";

import type { ReportFilters } from "@/app/owner/reports/actions";
import { exportReportToCsv } from "@/app/owner/reports/actions";

interface ExportCsvButtonProps {
  filters: ReportFilters;
}

export default function ExportCsvButton({
  filters,
}: ExportCsvButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const csv = await exportReportToCsv(filters);

      const blob = new Blob([csv], {
        type: "text/csv;charset=utf-8;",
      });

      const url = URL.createObjectURL(blob);

      const now = new Date();
      const timestamp = now
        .toISOString()
        .slice(0, 19)
        .replace(/[:T]/g, "-");

      const filename = `rental-report-${timestamp}.csv`;

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isExporting}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isExporting ? (
        <>
          <FileText className="h-4 w-4 animate-pulse" />
          Exporting…
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          Export CSV
        </>
      )}
    </button>
  );
}
