import { SearchX } from "lucide-react";

export default function AdminNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="size-16 bg-zinc-100 text-zinc-400 rounded-full flex items-center justify-center mb-6">
        <SearchX className="size-8" />
      </div>
      <h2 className="text-2xl font-semibold text-zinc-900 mb-2">Page Not Found</h2>
      <p className="text-zinc-500 max-w-md mx-auto mb-8">
        The admin page you're looking for doesn't exist or has been moved.
      </p>
      <a
        href="/admin"
        className="px-6 py-2.5 bg-zinc-900 text-white font-medium rounded-lg hover:bg-zinc-800 transition-colors"
      >
        Return to Overview
      </a>
    </div>
  );
}
