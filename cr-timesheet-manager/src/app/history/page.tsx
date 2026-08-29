import Link from "next/link";
import { format } from "date-fns";

import { prisma } from "@/lib/prisma";

function parseSelectedCrNumbers(value: string | null | undefined): string[] {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    }
    if (typeof parsed === "string") {
      return parsed
        .split(/[\r\n,]+/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
  } catch {
    // Legacy data may be stored as a plain comma-separated list.
  }

  return raw
    .split(/[\r\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default async function HistoryPage() {
  const histories = await prisma.generationHistory.findMany({
    orderBy: { generatedAt: "desc" },
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500">History</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">History Generating</h1>
      </div>

      <div className="space-y-4">
        {histories.map((history) => {
          const historyId = String(history.id ?? "");
          const periodType = String(history.periodType ?? "");
          const periodStart = String(history.periodStart ?? "N/A");
          const periodEnd = String(history.periodEnd ?? "N/A");
          const generatedAt = history.generatedAt instanceof Date ? history.generatedAt : new Date(String(history.generatedAt ?? ""));
          const selectedCrNumbers = parseSelectedCrNumbers(history.selectedCrNumbers ?? undefined);

          return (
            <div key={historyId} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    Generated at {format(generatedAt, "MMM d, yyyy • HH:mm")}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900">
                    {periodType.toUpperCase()} • {periodStart} to {periodEnd}
                  </h2>
                </div>

                <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <div className="text-xs uppercase tracking-wide text-slate-500">Jumlah CR</div>
                    <div className="mt-1 font-semibold text-slate-900">{selectedCrNumbers.length}</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <div className="text-xs uppercase tracking-wide text-slate-500">Code Type</div>
                    <div className="mt-1 font-semibold text-slate-900">No CR</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <div className="text-xs uppercase tracking-wide text-slate-500">Period</div>
                    <div className="mt-1 font-semibold text-slate-900">{periodType}</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="text-sm text-slate-600">
                  Selected CRs: {selectedCrNumbers.join(", ") || "None"}
                </div>
                <Link
                  href={`/history/${historyId}`}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  View
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
