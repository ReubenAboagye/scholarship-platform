"use client";

import { Eye, X, ExternalLink } from "lucide-react";
import { useImpersonation } from "./ImpersonationProvider";

export default function ImpersonationBanner() {
  const { isImpersonating, targetName, targetEmail, stopImpersonation } = useImpersonation();

  if (!isImpersonating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[70] bg-amber-500 text-white px-4 py-2 shadow-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Eye className="size-4" />
          <span className="text-sm font-semibold">
            Impersonating: {targetName || targetEmail || "Unknown user"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/dashboard"
            target="_blank"
            className="flex items-center gap-1 text-xs font-medium bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded transition-colors"
          >
            <ExternalLink className="size-3" />
            View Dashboard
          </a>
          <button
            onClick={stopImpersonation}
            className="flex items-center gap-1 text-xs font-medium bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded transition-colors"
          >
            <X className="size-3" />
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}
