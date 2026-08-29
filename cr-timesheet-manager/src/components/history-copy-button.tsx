"use client";

export function HistoryCopyButton({ value, label }: { value: string; label: string }) {
  const handleCopy = async () => {
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // No-op fallback for browsers that block clipboard access.
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
    >
      {label}
    </button>
  );
}
