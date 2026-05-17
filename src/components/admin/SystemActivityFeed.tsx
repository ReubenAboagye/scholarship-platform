"use client";

import { Users, BookOpen, ShieldCheck, ArrowRightLeft, Clock } from "lucide-react";
import { m } from "framer-motion";
import { cn } from "@/lib/utils";

type ActivityKind = "signup" | "scholarship" | "role_change";

export type ActivityEvent = {
  id: string;
  kind: ActivityKind;
  title: string;
  subtitle?: string | null;
  created_at: string;
  href?: string;
};

interface Props {
  events: ActivityEvent[];
}

const KIND_META: Record<ActivityKind, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  signup: {
    label: "New user",
    icon: <Users className="size-3.5" />,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  scholarship: {
    label: "New scholarship",
    icon: <BookOpen className="size-3.5" />,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  role_change: {
    label: "Role changed",
    icon: <ArrowRightLeft className="size-3.5" />,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(ms / 60_000);
  const hours = Math.floor(ms / 3_600_000);
  const days = Math.floor(ms / 86_400_000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function SystemActivityFeed({ events }: Props) {
  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, delay: 0.3 }}
      className="space-y-3"
    >
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-3.5 text-zinc-400" />
          <h2 className="text-[11px] font-medium text-zinc-900 uppercase tracking-widest">
            System Activity
          </h2>
        </div>
        <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest">
          Live Feed
        </span>
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-sm">
        {events.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Clock className="size-5 mx-auto mb-2 text-zinc-300" />
            <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
              No recent activity
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {events.map((event) => {
              const meta = KIND_META[event.kind];
              return (
                <div
                  key={event.id}
                  className="group flex items-start gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors"
                >
                  <div
                    className={cn(
                      "mt-0.5 size-7 rounded-md flex items-center justify-center flex-shrink-0",
                      meta.bg,
                      meta.color
                    )}
                  >
                    {meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[10px] font-semibold uppercase tracking-wider", meta.color)}>
                        {meta.label}
                      </span>
                      <span className="text-[10px] text-zinc-300">·</span>
                      <span className="text-[10px] text-zinc-400">{timeAgo(event.created_at)}</span>
                    </div>
                    <p className="text-sm font-medium text-zinc-900 truncate mt-0.5">
                      {event.title}
                    </p>
                    {event.subtitle && (
                      <p className="text-[11px] text-zinc-500 truncate mt-0.5">{event.subtitle}</p>
                    )}
                  </div>
                  {event.href && (
                    <a
                      href={event.href}
                      className="self-center p-1.5 text-zinc-300 hover:text-zinc-600 transition-colors"
                      title="View details"
                    >
                      <ShieldCheck className="size-3.5" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </m.div>
  );
}
