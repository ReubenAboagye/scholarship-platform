"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Bell, X, CheckCheck, Shield, UserPlus, BookOpen,
  ArrowRightLeft, Crown, Users, Calendar,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// Admin Notification Center
//
// Lightweight activity feed for the admin header bell. Shows:
//   - Recent role changes (super_admin only, via RLS)
//   - New user signups (all admins)
//   - New scholarships published (all admins)
//
// No persistent notification table — this pulls live from the
// audit log and recent rows so it is always accurate and never
// leaves stale unread badges.
// ─────────────────────────────────────────────────────────────

type ActivityItem = {
  id: string;
  type: "role_change" | "new_user" | "new_scholarship";
  title: string;
  body: string | null;
  href: string | null;
  created_at: string;
};

const HOURS_WINDOW = 24;

function activityIcon(type: ActivityItem["type"]) {
  const base = "size-4 flex-shrink-0 mt-0.5";
  switch (type) {
    case "role_change":     return <ArrowRightLeft className={`${base} text-red-500`} />;
    case "new_user":        return <UserPlus        className={`${base} text-emerald-500`} />;
    case "new_scholarship": return <BookOpen        className={`${base} text-blue-500`} />;
    default:                return <Bell            className={`${base} text-zinc-400`} />;
  }
}

export default function AdminNotificationCenter() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Load last-seen timestamp from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("admin-notif-last-seen");
      if (raw) setLastSeen(raw);
    } catch { /* ignore */ }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const since = new Date(Date.now() - HOURS_WINDOW * 60 * 60 * 1000).toISOString();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // Pull in parallel: audit events, new users, new scholarships
    const [
      { data: auditRows },
      { data: userRows },
      { data: scholarshipRows },
    ] = await Promise.all([
      supabase
        .from("admin_role_audit_log")
        .select("id, actor_email, target_email, old_role, new_role, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("profiles")
        .select("id, full_name, email, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("scholarships")
        .select("id, name, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const merged: ActivityItem[] = [
      ...(auditRows ?? []).map((r: any) => ({
        id: `audit-${r.id}`,
        type: "role_change" as const,
        title: `${r.actor_email ?? "System"} changed a role`,
        body: `${r.target_email ?? "User"}: ${r.old_role} → ${r.new_role}`,
        href: "/admin/audit",
        created_at: r.created_at,
      })),
      ...(userRows ?? []).map((r: any) => ({
        id: `user-${r.id}`,
        type: "new_user" as const,
        title: "New user signup",
        body: r.full_name ? `${r.full_name} (${r.email})` : r.email,
        href: "/admin/users",
        created_at: r.created_at,
      })),
      ...(scholarshipRows ?? []).map((r: any) => ({
        id: `scholarship-${r.id}`,
        type: "new_scholarship" as const,
        title: "New scholarship published",
        body: r.name,
        href: "/admin/scholarships",
        created_at: r.created_at,
      })),
    ];

    merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setItems(merged.slice(0, 20));
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Mark all as "seen" when opening
  function handleOpen() {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen && items.length > 0) {
      const newest = items[0].created_at;
      try {
        localStorage.setItem("admin-notif-last-seen", newest);
      } catch { /* ignore */ }
      setLastSeen(newest);
    }
  }

  const hasNew = items.some(i => !lastSeen || i.created_at > lastSeen);
  const newCount = items.filter(i => !lastSeen || i.created_at > lastSeen).length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative size-9 flex items-center justify-center rounded-lg hover:bg-zinc-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="size-5 text-zinc-600" />
        {hasNew && (
          <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-zinc-200 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-zinc-900">Activity</h3>
              {newCount > 0 && (
                <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                  {newCount} new
                </span>
              )}
            </div>
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider">
              Last {HOURS_WINDOW}h
            </span>
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-zinc-50">
            {loading ? (
              <div className="py-8 text-center text-xs text-zinc-400">Loading…</div>
            ) : items.length === 0 ? (
              <div className="py-10 text-center">
                <div className="size-10 bg-zinc-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Calendar className="size-5 text-zinc-300" />
                </div>
                <p className="text-xs text-zinc-400 font-medium">No recent activity</p>
                <p className="text-[10px] text-zinc-300 mt-1">Check back later for updates</p>
              </div>
            ) : (
              items.map((item) => {
                const isNew = !lastSeen || item.created_at > lastSeen;
                return (
                  <div
                    key={item.id}
                    className={`flex gap-3 px-4 py-3 transition-colors hover:bg-zinc-50 ${isNew ? "bg-blue-50/30" : ""}`}
                  >
                    {activityIcon(item.type)}
                    <div className="flex-1 min-w-0">
                      {item.href ? (
                        <a
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className="text-xs font-semibold text-zinc-800 hover:text-brand-600 transition-colors line-clamp-1"
                        >
                          {item.title}
                        </a>
                      ) : (
                        <p className="text-xs font-semibold text-zinc-800 line-clamp-1">{item.title}</p>
                      )}
                      {item.body && (
                        <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2">{item.body}</p>
                      )}
                      <p className="text-[10px] text-zinc-300 mt-1">{timeAgo(item.created_at)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="px-4 py-2.5 border-t border-zinc-100 text-center">
              <a
                href="/admin/audit"
                onClick={() => setOpen(false)}
                className="text-[11px] font-semibold text-zinc-400 hover:text-brand-600 transition-colors"
              >
                View full audit log
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
