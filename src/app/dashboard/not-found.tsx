import { SearchX } from "lucide-react";

export default function DashboardNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="size-16 bg-zinc-100 text-zinc-400 rounded-full flex items-center justify-center mb-6">
        <SearchX className="size-8" />
      </div>
      <h2 className="text-2xl font-semibold text-zinc-900 mb-2">Page Not Found</h2>
      <p className="text-zinc-500 max-w-md mx-auto mb-8">
        The dashboard page you're looking for doesn't exist or has been moved.
      </p>
      <a
        href="/dashboard"
        className="px-6 py-2.5 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors"
      >
        Return to Dashboard
      </a>
    </div>
  );
}
