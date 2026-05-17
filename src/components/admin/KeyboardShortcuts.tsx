"use client";

import { useState, useEffect } from "react";
import { Keyboard, X } from "lucide-react";

const SHORTCUTS = [
  { key: "?", description: "Show / hide this help" },
  { key: "g", description: "Go to search / focus search" },
  { key: "n", description: "New scholarship (Scholarships page)" },
  { key: "Esc", description: "Close modals / drawers" },
];

export default function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-900/50 p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-white rounded-lg shadow-xl border border-zinc-200 max-w-sm w-full p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Keyboard className="size-4 text-zinc-500" />
            <h2 className="text-sm font-medium text-zinc-900">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 rounded transition-colors"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="space-y-2">
          {SHORTCUTS.map((s) => (
            <div key={s.key} className="flex items-center justify-between">
              <span className="text-xs text-zinc-600">{s.description}</span>
              <kbd className="px-2 py-0.5 bg-zinc-100 border border-zinc-200 rounded text-[10px] font-mono text-zinc-700">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-zinc-400 mt-4 text-center">
          Press <kbd className="px-1 py-0.5 bg-zinc-100 border border-zinc-200 rounded font-mono">?</kbd> anytime to toggle this panel
        </p>
      </div>
    </div>
  );
}
