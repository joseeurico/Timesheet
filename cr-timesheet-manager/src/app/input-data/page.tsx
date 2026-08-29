import { createCrAction, bulkCreateCrAction } from "@/app/actions";

export default function InputDataPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500">Data entry</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Input Data</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-semibold text-slate-900">Manual input</h2>
          <form action={createCrAction} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                No CR
                <input
                  name="noCr"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-sky-500"
                  placeholder="10001"
                  required
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Project ID
                <input
                  name="projectId"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-sky-500"
                  placeholder="P777"
                  required
                />
              </label>
            </div>

            <label className="block text-sm font-medium text-slate-700">
              Project Name
              <input
                name="projectName"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-sky-500"
                placeholder="Ticket tuc"
                required
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              AIP Fitur
              <input
                name="aipFitur"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-sky-500"
                placeholder="Change Request 2026"
                required
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Short Description
              <textarea
                name="shortDescription"
                className="mt-1 min-h-[120px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-sky-500"
                placeholder="Enhancement Feature Credit"
                required
              />
            </label>

            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 font-medium text-white transition hover:bg-slate-700"
            >
              Save
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-semibold text-slate-900">Bulk paste</h2>
          <form action={bulkCreateCrAction} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Paste tabular data (tab-separated rows)
              <textarea
                name="bulkPaste"
                className="mt-1 min-h-[320px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-sky-500"
                placeholder="10001\tP777\tTicket tuc\tChange Request 2026\tEnhancement Feature Credit"
              />
            </label>

            <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              Expected columns: No CR, Project ID, Project Name, AIP Fitur, Short Description.
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-cyan-600 px-4 py-2.5 font-medium text-white transition hover:bg-cyan-500"
            >
              Save valid rows
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
