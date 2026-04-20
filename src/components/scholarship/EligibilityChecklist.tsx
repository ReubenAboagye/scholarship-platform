import { Check, X, Minus } from "lucide-react";

// ─────────────────────────────────────────────────────────────
// EligibilityChecklist — replaces the old 3-column card with a
// government-portal-style row table. Each row shows criterion,
// what the scholarship requires, what the user has, and a clear
// status (met / not met / unknown).
// ─────────────────────────────────────────────────────────────

export type EligibilityRow = {
  label: string;
  requirement: string;
  userValue: string | number | null | undefined;
  status: "met" | "unmet" | "unknown";
};

function StatusPill({ status }: { status: EligibilityRow["status"] }) {
  if (status === "met") {
    return (
      <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-medium">
        <Check className="w-3.5 h-3.5" /> Met
      </span>
    );
  }
  if (status === "unmet") {
    return (
      <span className="inline-flex items-center gap-1 text-red-700 text-xs font-medium">
        <X className="w-3.5 h-3.5" /> Not met
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-slate-400 text-xs font-medium">
      <Minus className="w-3.5 h-3.5" /> Unknown
    </span>
  );
}

export default function EligibilityChecklist({ rows }: { rows: EligibilityRow[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr className="text-left">
            <th className="px-4 py-3 font-medium text-slate-600">Criterion</th>
            <th className="px-4 py-3 font-medium text-slate-600">Required</th>
            <th className="px-4 py-3 font-medium text-slate-600">Your profile</th>
            <th className="px-4 py-3 font-medium text-slate-600 text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.label} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-4 py-3 text-slate-900 font-medium">{r.label}</td>
              <td className="px-4 py-3 text-slate-600">{r.requirement}</td>
              <td className="px-4 py-3 text-slate-600">
                {r.userValue !== null && r.userValue !== undefined && r.userValue !== ""
                  ? String(r.userValue)
                  : <span className="text-slate-400 italic">Not set</span>}
              </td>
              <td className="px-4 py-3 text-right">
                <StatusPill status={r.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
