import { CheckCircle2, AlertCircle, Info } from "lucide-react";

// ─────────────────────────────────────────────────────────────
// EligibilityStatus — plain, government-portal-style status
// banner replacing the gamified "100% SCORE" circle.
//
// Three states:
//   eligible     → green "You meet all listed criteria"
//   not_eligible → amber "Some requirements aren't met" + list
//   unknown      → slate "Sign in / complete profile to check"
// ─────────────────────────────────────────────────────────────

export default function EligibilityStatus({
  state,
  unmetCriteria = [],
  missingFields = [],
}: {
  state: "eligible" | "not_eligible" | "unknown";
  unmetCriteria?: string[];
  missingFields?: string[];
}) {
  if (state === "eligible") {
    return (
      <div className="flex items-start gap-3 p-4 rounded-lg border border-emerald-200 bg-emerald-50">
        <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-emerald-900">
            You meet the listed eligibility criteria
          </p>
          <p className="text-xs text-emerald-800/80 mt-0.5">
            Based on your current profile. Individual programmes may have
            additional requirements — always review the official portal before
            applying.
          </p>
        </div>
      </div>
    );
  }

  if (state === "not_eligible") {
    return (
      <div className="flex items-start gap-3 p-4 rounded-lg border border-amber-200 bg-amber-50">
        <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-900">
            Some requirements are not met
          </p>
          {unmetCriteria.length > 0 && (
            <ul className="mt-1.5 text-xs text-amber-800/90 space-y-0.5 list-disc list-inside">
              {unmetCriteria.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          )}
          <p className="text-xs text-amber-800/80 mt-2">
            You can still review the scholarship — some criteria may be flexible
            or incorrectly inferred from your profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border border-slate-200 bg-slate-50">
      <Info className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-slate-900">
          Eligibility cannot be checked yet
        </p>
        <p className="text-xs text-slate-600 mt-0.5">
          {missingFields.length > 0
            ? `Add the following to your profile to check: ${missingFields.join(", ")}.`
            : "Complete your profile to see whether you match this scholarship."}
        </p>
      </div>
    </div>
  );
}
