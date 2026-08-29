import Link from "next/link";

import { deleteCrAction } from "@/app/actions";
import { prisma } from "@/lib/prisma";

function formatStatus(status: string) {
  return status === "ACTIVE" ? "Active" : "Close";
}

export default async function ViewDataPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const params = await searchParams;
  const filter = params.status === "ACTIVE" || params.status === "CLOSE" ? params.status : "ALL";
  const query = String(params.q ?? "").trim();

  const records = await prisma.cRRecord.findMany({
    where: {
      ...(filter !== "ALL" ? { status: filter } : {}),
      ...(query
        ? {
            OR: [
              { noCr: { contains: query } },
              { projectId: { contains: query } },
              { projectName: { contains: query } },
              { aipFitur: { contains: query } },
              { shortDescription: { contains: query } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500">Management</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">View Data</h1>
        </div>
        <Link
          href="/input-data"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          Add new CR
        </Link>
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <form method="get" className="flex flex-col gap-3 md:flex-row">
          <input
            name="q"
            defaultValue={query}
            placeholder="Search: No CR, Project ID, Project Name..."
            className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-sky-500"
          />
          <select
            name="status"
            defaultValue={filter}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-sky-500"
          >
            <option value="ALL">All</option>
            <option value="ACTIVE">Active</option>
            <option value="CLOSE">Close</option>
          </select>
          <button
            type="submit"
            className="rounded-lg bg-sky-600 px-4 py-2.5 font-medium text-white transition hover:bg-sky-500"
          >
            Search
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">No CR</th>
                <th className="px-4 py-3 font-medium">Project ID</th>
                <th className="px-4 py-3 font-medium">Project Name</th>
                <th className="px-4 py-3 font-medium">AIP Fitur</th>
                <th className="px-4 py-3 font-medium">Short Description</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => {
                const recordId = String(record.id ?? "");
                const noCr = String(record.noCr ?? "");
                const projectId = String(record.projectId ?? "");
                const projectName = String(record.projectName ?? "");
                const aipFitur = String(record.aipFitur ?? "");
                const shortDescription = String(record.shortDescription ?? "");
                const status = String(record.status ?? "ACTIVE");

                return (
                  <tr key={recordId || noCr} className="border-t border-slate-200">
                    <td className="px-4 py-3 font-medium text-slate-900">{noCr}</td>
                    <td className="px-4 py-3 text-slate-700">{projectId}</td>
                    <td className="px-4 py-3 text-slate-700">{projectName}</td>
                    <td className="px-4 py-3 text-slate-700">{aipFitur}</td>
                    <td className="px-4 py-3 text-slate-700">{shortDescription}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                        {formatStatus(status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link
                          href={`/view-data/edit/${recordId}`}
                          className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Edit
                        </Link>
                        <form action={deleteCrAction}>
                          <input type="hidden" name="id" value={recordId} />
                          <button
                            type="submit"
                            className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100"
                            onClick={(event) => {
                              const confirmed = window.confirm("Delete this CR record permanently?");
                              if (!confirmed) {
                                event.preventDefault();
                              }
                            }}
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
