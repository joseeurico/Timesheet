import { format } from "date-fns";

import { HistoryCopyButton } from "@/components/history-copy-button";
import { prisma } from "@/lib/prisma";
import { joinWithAmpersand } from "@/lib/timesheet";

function parseStoredJson<T>(value: string | undefined | null, fallback: T): T {
  const safeValue = String(value ?? "").trim();

  if (!safeValue) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(safeValue) as T;
    if (Array.isArray(parsed)) {
      return parsed as T;
    }
  } catch {
    // Legacy records may store arrays as comma-separated values.
  }

  if (Array.isArray(fallback)) {
    const splitValues = safeValue
      .split(/[\r\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (splitValues.length > 0) {
      return splitValues as T;
    }
  }

  return fallback;
}

function parseLegacyOutputObject(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.tsv === "string") {
    return { headers: Array.isArray(record.headers) ? record.headers.map(String) : [], rows: Array.isArray(record.rows) ? record.rows as Record<string, string>[] : [], tsv: record.tsv };
  }

  const activity = Array.isArray(record.activity) ? joinWithAmpersand(record.activity.map(String)) : String(record.activity ?? "");
  const projectName = Array.isArray(record.projectName) ? joinWithAmpersand(record.projectName.map(String)) : String(record.projectName ?? "");
  const projectCode = Array.isArray(record.projectCode) ? joinWithAmpersand(record.projectCode.map(String)) : String(record.projectCode ?? "");

  if (!activity && !projectName && !projectCode) {
    return null;
  }
  const rows = [{ "Activity / Remarks": activity, "Project Name": projectName, "Project Code": projectCode }];

  return {
    headers: ["Activity / Remarks", "Project Name", "Project Code"],
    rows,
    tsv: [["Activity / Remarks", "Project Name", "Project Code"], ...rows.map((row) => Object.values(row))]
      .map((row) => row.join("\t"))
      .join("\n"),
  };
}

function parseStoredOutput(value: string | undefined | null) {
  const safeValue = String(value ?? "").trim();

  if (!safeValue) {
    return { headers: [], rows: [], tsv: "" };
  }

  try {
    const parsed = JSON.parse(safeValue);
    if (parsed && typeof parsed === "object") {
      const normalized = parseLegacyOutputObject(parsed);
      if (normalized) {
        return normalized;
      }
    }
    if (typeof parsed === "string") {
      return { headers: [], rows: [], tsv: parsed };
    }
  } catch {
    // Legacy rows may contain plain TSV text rather than JSON.
  }

  if (safeValue.includes("\t") || safeValue.includes("\n")) {
    return { headers: [], rows: [], tsv: safeValue };
  }

  return { headers: [], rows: [], tsv: "" };
}

function parseTsvOutput(output: ReturnType<typeof parseStoredOutput>) {
  if (output.headers.length > 0 || !output.tsv) {
    return output;
  }

  const lines = output.tsv.split(/\r?\n/).filter((line) => line.length > 0);
  if (lines.length === 0) {
    return output;
  }

  const headers = lines[0].split("\t");
  const rows = lines.slice(1).map((line) => {
    const values = line.split("\t");
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });

  return { ...output, headers, rows };
}

function OutputTable({ output }: { output: ReturnType<typeof parseStoredOutput> }) {
  const parsedOutput = parseTsvOutput(output);

  if (parsedOutput.headers.length === 0 || parsedOutput.rows.length === 0) {
    return <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No output available</div>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-slate-50">
          <tr>
            {parsedOutput.headers.map((header) => (
              <th key={header} className="whitespace-nowrap px-4 py-3 font-semibold text-slate-700">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {parsedOutput.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {parsedOutput.headers.map((header) => (
                <td key={header} className="whitespace-pre-wrap px-4 py-3 align-top text-slate-700">
                  {(row as Record<string, string>)[header] ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
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
  const outputVersion1 = parseStoredOutput(history.outputVersion1 ?? undefined);
  const outputVersion2 = parseStoredOutput(history.outputVersion2 ?? undefined);

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
            <HistoryCopyButton value={outputVersion1.tsv || ""} label="Copy Version 1" />
          </div>
          <OutputTable output={outputVersion1} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Version 2 output</h2>
            <HistoryCopyButton value={outputVersion2.tsv || ""} label="Copy Version 2" />
          </div>
          <OutputTable output={outputVersion2} />
        </div>
      </div>
    </div>
  );
}
