import { format } from "date-fns";
import Link from "next/link";

import { prisma } from "@/lib/prisma";

function formatStatus(status: string) {
  return status === "ACTIVE" ? "Active" : "Close";
}

export default async function DashboardPage() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [total, active, close, currentMonth, recent] = await Promise.all([
    prisma.cRRecord.count(),
    prisma.cRRecord.count({ where: { status: "ACTIVE" } }),
    prisma.cRRecord.count({ where: { status: "CLOSE" } }),
    prisma.cRRecord.count({
      where: {
        createdAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
    }),
    prisma.cRRecord.findMany({
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: {
        noCr: true,
        projectName: true,
        status: true,
        updatedAt: true,
      },
    }),
  ]);

  const cards = [
    { label: "Total CR", value: total },
    { label: "Active CR", value: active },
    { label: "Close CR", value: close },
    { label: "Current month", value: currentMonth },
  ];

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500">
            Overview
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Dashboard</h1>
        </div>
        <Link
          href="/input-data"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          Add CR
        </Link>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-4 text-3xl font-semibold text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Status summary</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2">
              <span className="font-medium text-emerald-800">Active</span>
              <span className="text-lg font-semibold text-emerald-700">{active}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-100 px-3 py-2">
              <span className="font-medium text-slate-700">Close</span>
              <span className="text-lg font-semibold text-slate-700">{close}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Date / activity summary</h2>
          <div className="rounded-lg bg-sky-50 px-3 py-4 text-sm text-sky-900">
            {monthStart.toLocaleDateString()} to {monthEnd.toLocaleDateString()} • {currentMonth} new CR(s) in period
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Recent activity</h2>
          <Link href="/view-data" className="text-sm font-medium text-sky-700 hover:text-sky-800">
            View all
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">No CR</th>
                <th className="px-3 py-2 font-medium">Project Name</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((record) => {
                const noCr = String(record.noCr ?? "");
                const projectName = String(record.projectName ?? "");
                const status = String(record.status ?? "ACTIVE");
                const updatedAt = record.updatedAt instanceof Date ? record.updatedAt : new Date(String(record.updatedAt ?? ""));

                return (
                  <tr key={noCr || projectName} className="border-t border-slate-200">
                    <td className="px-3 py-3 text-slate-600">
                      {format(updatedAt, "MMM d, yyyy")}
                    </td>
                    <td className="px-3 py-3 font-medium text-slate-900">{noCr}</td>
                    <td className="px-3 py-3 text-slate-700">{projectName}</td>
                    <td className="px-3 py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                        {formatStatus(status)}
                      </span>
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
