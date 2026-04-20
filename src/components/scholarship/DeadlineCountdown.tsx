"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

// ─────────────────────────────────────────────────────────────
// DeadlineCountdown — compact countdown used in the sticky top
// bar and optionally elsewhere. Updates every minute.
//
// Behaviour:
//   null deadline  → "Rolling"
//   past deadline  → "Closed"
//   ≤ 14 days      → red, "X days left"
//   ≤ 30 days      → amber, "X days left"
//   otherwise      → muted, "Month DD, YYYY"
// ─────────────────────────────────────────────────────────────

export default function DeadlineCountdown({
  deadline,
  size = "sm",
}: {
  deadline: string | null;
  size?: "sm" | "md";
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const textSize = size === "md" ? "text-sm" : "text-xs";

  if (!deadline) {
    return (
      <span className={`inline-flex items-center gap-1.5 ${textSize} font-medium text-slate-500`}>
        <Clock className="w-3.5 h-3.5" />
        Rolling — no fixed deadline
      </span>
    );
  }

  const target = new Date(deadline).getTime();
  const diffMs = target - now;
  const days = Math.ceil(diffMs / 86_400_000);

  if (diffMs <= 0) {
    return (
      <span className={`inline-flex items-center gap-1.5 ${textSize} font-medium text-slate-500`}>
        <Clock className="w-3.5 h-3.5" />
        Closed
      </span>
    );
  }

  const tone =
    days <= 14
      ? "text-red-700"
      : days <= 30
      ? "text-amber-700"
      : "text-slate-700";

  const formatted = new Date(deadline).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <span className={`inline-flex items-center gap-1.5 ${textSize} font-medium ${tone}`}>
      <Clock className="w-3.5 h-3.5" />
      {days <= 60 ? `${days} day${days === 1 ? "" : "s"} left · ${formatted}` : formatted}
    </span>
  );
}
