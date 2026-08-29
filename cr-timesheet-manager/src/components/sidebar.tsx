import Link from "next/link";
import {
  BarChart3,
  ClipboardList,
  FileText,
  History,
  PencilLine,
  Settings,
  TableProperties,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/input-data", label: "Input Data", icon: ClipboardList },
  { href: "/generate-timesheet", label: "Generate Timesheet", icon: FileText },
  { href: "/view-data", label: "View Data", icon: TableProperties },
  { href: "/history", label: "History Generating", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="w-full max-w-[260px] flex-shrink-0 border-r border-slate-200 bg-slate-900 text-slate-100">
      <div className="flex h-20 items-center border-b border-slate-800 px-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-cyan-500/20 p-2 text-cyan-300">
            <PencilLine className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">CR</div>
            <div className="text-lg font-semibold">Timesheet</div>
          </div>
        </div>
      </div>

      <nav className="space-y-2 p-4">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800 hover:text-white"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
