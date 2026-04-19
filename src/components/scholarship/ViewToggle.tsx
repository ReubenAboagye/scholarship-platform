"use client";

import { LayoutGrid, List } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function ViewToggle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentView = searchParams.get("view") || "grid";

  function setView(view: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", view);
    // Use scroll: false to prevent jumping to top
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex items-center gap-1 bg-slate-100/50 border border-slate-200 p-1 rounded-xl">
      <button
        onClick={() => setView("grid")}
        title="Grid View"
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-lg transition-all active:scale-95",
          currentView === "grid" 
            ? "bg-white text-slate-900 shadow-sm border border-slate-200" 
            : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
        )}
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
      <button
        onClick={() => setView("list")}
        title="List View"
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-lg transition-all active:scale-95",
          currentView === "list" 
            ? "bg-white text-slate-900 shadow-sm border border-slate-200" 
            : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
        )}
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  );
}
