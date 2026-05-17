"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard boundary caught:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="size-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-6">
        <AlertCircle className="size-8" />
      </div>
      <h2 className="text-2xl font-semibold text-zinc-900 mb-2">Something went wrong</h2>
      <p className="text-zinc-500 max-w-md mx-auto mb-8">
        We encountered an unexpected error while loading this dashboard view. 
        Please try again or contact support if the issue persists.
      </p>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors"
        >
          Try again
        </button>
        <a
          href="/dashboard"
          className="px-6 py-2.5 bg-white border border-zinc-200 text-zinc-700 font-medium rounded-lg hover:bg-zinc-50 transition-colors"
        >
          Return to Dashboard
        </a>
      </div>
    </div>
  );
}
