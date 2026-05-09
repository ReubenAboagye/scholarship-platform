"use client";

import { useState, useRef, useEffect } from "react";
import { MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface Props {
  actions: ActionItem[];
  align?: "left" | "right";
}

export default function ActionDropdown({ actions, align = "right" }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 text-zinc-300 hover:text-zinc-600 transition-colors rounded hover:bg-zinc-50"
        aria-label="Actions"
        aria-expanded={open}
      >
        <MoreVertical className="size-3.5" />
      </button>

      {open && (
        <div
          className={cn(
            "absolute z-50 mt-1 w-44 bg-white border border-zinc-200 rounded-lg shadow-lg py-1 animate-in fade-in zoom-in-95 duration-100",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {actions.map((action, i) => (
            <button
              key={i}
              disabled={action.disabled}
              onClick={() => {
                setOpen(false);
                action.onClick();
              }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors text-left",
                action.danger
                  ? "text-red-600 hover:bg-red-50"
                  : "text-zinc-700 hover:bg-zinc-50",
                action.disabled && "opacity-40 cursor-not-allowed"
              )}
            >
              {action.icon && <span className="size-4 flex items-center justify-center">{action.icon}</span>}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
