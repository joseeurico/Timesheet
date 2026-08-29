"use client";

import { useState } from "react";

export default function GenerateTimesheetPage() {
  const [periodType, setPeriodType] = useState("day");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [crInput, setCrInput] = useState("10001\n20031");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | {
    selectedNumbers: string[];
    missing: string[];
    outputVersion1: { headers: string[]; rows: Record<string, string>[]; tsv: string };
    outputVersion2: { headers: string[]; rows: Record<string, string>[]; tsv: string };
  }>(null);
  const [notice, setNotice] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setNotice("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          periodType,
          periodStart,
          periodEnd,
          crNumbers: crInput,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to generate the timesheet.");
      }

      setResult(payload);
      setNotice(`Generated ${payload.selectedNumbers.length} CR record(s).`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setNotice("Copied to clipboard.");
    } catch {
      setNotice("Clipboard copy is not available on this browser.");
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500">Utility</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Generate Timesheet</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[400px_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-semibold text-slate-900">Generation settings</h2>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Period type
              <select
                value={periodType}
                onChange={(event) => setPeriodType(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-sky-500"
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
            </label>

            <label className="block text-sm font-medium text-slate-700">
              {periodType === "month" ? "Month" : periodType === "week" ? "Start date" : "Date"}
              <input
                type="date"
                value={periodStart}
                onChange={(event) => setPeriodStart(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-sky-500"
              />
            </label>

            {periodType !== "day" && (
              <label className="block text-sm font-medium text-slate-700">
                End date
                <input
                  type="date"
                  value={periodEnd}
                  onChange={(event) => setPeriodEnd(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-sky-500"
                />
              </label>
            )}

            <label className="block text-sm font-medium text-slate-700">
              CR numbers
              <textarea
                value={crInput}
                onChange={(event) => setCrInput(event.target.value)}
                className="mt-1 min-h-[180px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-sky-500"
                placeholder="10001\n20031\n30012"
              />
            </label>

            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate"}
            </button>
          </div>
        </section>

        <section className="space-y-6">
          {notice && (
            <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
              {notice}
            </div>
          )}

          {result && (
            <>
              {result.missing.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  Missing CRs: {result.missing.join(", ")}
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h2 className="text-xl font-semibold text-slate-900">Output Version 1</h2>
                  <button
                    type="button"
                    onClick={() => copyText(result.outputVersion1.tsv)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Copy Version 1
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-slate-200 text-left text-sm">
                    <thead className="bg-slate-50 text-slate-700">
                      <tr>
                        {result.outputVersion1.headers.map((header) => (
                          <th key={header} className="px-3 py-2 font-medium">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.outputVersion1.rows.map((row, index) => (
                        <tr key={`${index}-${row["Project Code"]}`} className="border-t border-slate-200">
                          {result.outputVersion1.headers.map((header) => (
                            <td key={`${header}-${index}`} className="px-3 py-2 text-slate-700">
                              {row[header]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h2 className="text-xl font-semibold text-slate-900">Output Version 2</h2>
                  <button
                    type="button"
                    onClick={() => copyText(result.outputVersion2.tsv)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Copy Version 2
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-slate-200 text-left text-sm">
                    <thead className="bg-slate-50 text-slate-700">
                      <tr>
                        {result.outputVersion2.headers.map((header) => (
                          <th key={header} className="px-3 py-2 font-medium">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.outputVersion2.rows.map((row, index) => (
                        <tr key={`${index}-${row["Project Code"]}`} className="border-t border-slate-200">
                          {result.outputVersion2.headers.map((header) => (
                            <td key={`${header}-${index}`} className="px-3 py-2 text-slate-700">
                              {row[header]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </section>
      </form>
    </div>
  );
}
