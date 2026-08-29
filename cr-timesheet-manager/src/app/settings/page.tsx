"use client";

import { useState } from "react";

const STORAGE_KEY = "cr-timesheet-settings";

function getStoredSettings() {
  if (typeof window === "undefined") {
    return {
      projectCode: "noCr",
      periodType: "day",
      separator: " & ",
      dateFormat: "yyyy-MM-dd",
    };
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return {
      projectCode: "noCr",
      periodType: "day",
      separator: " & ",
      dateFormat: "yyyy-MM-dd",
    };
  }

  try {
    const parsed = JSON.parse(stored) as {
      projectCode?: string;
      periodType?: string;
      separator?: string;
      dateFormat?: string;
    };

    return {
      projectCode: parsed.projectCode ?? "noCr",
      periodType: parsed.periodType ?? "day",
      separator: parsed.separator ?? " & ",
      dateFormat: parsed.dateFormat ?? "yyyy-MM-dd",
    };
  } catch {
    return {
      projectCode: "noCr",
      periodType: "day",
      separator: " & ",
      dateFormat: "yyyy-MM-dd",
    };
  }
}

export default function SettingsPage() {
  const initialSettings = getStoredSettings();
  const [projectCode, setProjectCode] = useState(initialSettings.projectCode);
  const [periodType, setPeriodType] = useState(initialSettings.periodType);
  const [separator, setSeparator] = useState(initialSettings.separator);
  const [dateFormat, setDateFormat] = useState(initialSettings.dateFormat);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const payload = {
      projectCode,
      periodType,
      separator,
      dateFormat,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500">Configuration</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Settings</h1>
      </div>

      <div className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-5">
          <label className="block text-sm font-medium text-slate-700">
            Default Project Code
            <select
              value={projectCode}
              onChange={(event) => setProjectCode(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-sky-500"
            >
              <option value="noCr">No CR</option>
              <option value="projectId">Project ID</option>
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Default Period
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
            Default Separator
            <input
              value={separator}
              onChange={(event) => setSeparator(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-sky-500"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Date Format
            <input
              value={dateFormat}
              onChange={(event) => setDateFormat(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-sky-500"
            />
          </label>

          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-slate-900 px-4 py-2.5 font-medium text-white transition hover:bg-slate-700"
          >
            Save settings
          </button>

          {saved && <div className="text-sm text-emerald-700">Settings saved.</div>}
        </div>
      </div>
    </div>
  );
}
