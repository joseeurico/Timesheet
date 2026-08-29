import { format } from "date-fns";

import { prisma } from "@/lib/prisma";

function parseStoredJson<T>(value: string | undefined | null, fallback: T): T {
  const safeValue = value ?? "";

  try {
    return JSON.parse(safeValue) as T;
  } catch {
    return fallback;
  }
}

export default async function HistoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const history = await prisma.generationHistory.findUnique({ where: { id } });

  if (!history) {
    return (
      <div className="p-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-700 shadow-sm">
          History record not found.
        </div>
      </div>
    );
  }

  const periodType = String(history.periodType ?? "");
  const periodStart = String(history.periodStart ?? "N/A");
  const periodEnd = String(history.periodEnd ?? "N/A");
  const generatedAt = history.generatedAt instanceof Date ? history.generatedAt : new Date(String(history.generatedAt ?? ""));
  const selectedCrNumbers = parseStoredJson<string[]>(String(history.selectedCrNumbers ?? "[]"), []);
  const outputVersion1 = parseStoredJson<{ headers: string[]; rows: Record<string, string>[]; tsv: string }>(
    String(history.outputVersion1 ?? ""),
    { headers: [], rows: [], tsv: "" }
  );
  const outputVersion2 = parseStoredJson<{ headers: string[]; rows: Record<string, string>[]; tsv: string }>(
    String(history.outputVersion2 ?? ""),
    { headers: [], rows: [], tsv: "" }
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500">Review</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Generation History</h1>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="text-sm text-slate-500">Generated At</div>
              <div className="mt-1 font-medium text-slate-900">
                {format(generatedAt, "MMM d, yyyy • HH:mm")}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-500">Period</div>
              <div className="mt-1 font-medium text-slate-900">
                {periodType} ({periodStart} to {periodEnd})
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-500">Selected CRs</div>
              <div className="mt-1 font-medium text-slate-900">{selectedCrNumbers.length}</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Selected CR numbers</h2>
          <div className="flex flex-wrap gap-2">
            {selectedCrNumbers.map((value) => (
              <span key={value} className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                {value}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Version 1 output</h2>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(outputVersion1.tsv || "")}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Copy Version 1
            </button>
          </div>
          <pre className="overflow-x-auto rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
            {outputVersion1.tsv || "No output available"}
          </pre>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Version 2 output</h2>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(outputVersion2.tsv || "")}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Copy Version 2
            </button>
          </div>
          <pre className="overflow-x-auto rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
            {outputVersion2.tsv || "No output available"}
          </pre>
        </div>
      </div>
    </div>
  );
}
