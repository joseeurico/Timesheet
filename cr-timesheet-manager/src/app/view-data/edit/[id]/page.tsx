import { notFound } from "next/navigation";

import { updateCrAction } from "@/app/actions";
import { prisma } from "@/lib/prisma";

export default async function EditDataPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const record = await prisma.cRRecord.findUnique({ where: { id } });

  if (!record) {
    notFound();
  }

  const recordId = String(record.id ?? "");
  const noCr = String(record.noCr ?? "");
  const projectId = String(record.projectId ?? "");
  const projectName = String(record.projectName ?? "");
  const aipFitur = String(record.aipFitur ?? "");
  const shortDescription = String(record.shortDescription ?? "");
  const status = String(record.status ?? "ACTIVE");

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500">Management</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Edit Data</h1>
      </div>

      <div className="max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <form action={updateCrAction} className="space-y-4">
          <input type="hidden" name="id" value={recordId} />

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700 md:col-span-2">
              No CR
              <input
                value={noCr}
                disabled
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2.5 text-slate-500"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Project ID
              <input
                defaultValue={projectId}
                name="projectId"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-sky-500"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Project Name
              <input
                defaultValue={projectName}
                name="projectName"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-sky-500"
              />
            </label>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            AIP Fitur
            <input
              defaultValue={aipFitur}
              name="aipFitur"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-sky-500"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Short Description
            <textarea
              defaultValue={shortDescription}
              name="shortDescription"
              className="mt-1 min-h-[110px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-sky-500"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Status
            <select
              name="status"
              defaultValue={status}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-sky-500"
            >
              <option value="ACTIVE">Active</option>
              <option value="CLOSE">Close</option>
            </select>
          </label>

          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2.5 font-medium text-white transition hover:bg-slate-700"
          >
            Save changes
          </button>
        </form>
      </div>
    </div>
  );
}
