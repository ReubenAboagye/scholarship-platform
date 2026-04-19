"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, X, CheckCheck, Sparkles, Calendar, AlertTriangle, CheckCircle2, UserCircle, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  is_read: boolean;
  created_at: string;
}

function NotifIcon({ type }: { type: string }) {
  const base = "w-4 h-4 flex-shrink-0 mt-0.5";
  switch (type) {
    case "new_match":       return <Sparkles    className={`${base} text-brand-500`} />;
    case "deadline_soon":   return <Calendar    className={`${base} text-amber-500`} />;
    case "deadline_urgent": return <AlertTriangle className={`${base} text-red-500`} />;
    case "status_update":   return <CheckCircle2 className={`${base} text-emerald-500`} />;
    case "profile_nudge":   return <UserCircle  className={`${base} text-slate-400`} />;
    case "digest":          return <Mail        className={`${base} text-blue-500`} />;
    default:                return <Bell        className={`${base} text-slate-400`} />;
  }
}

export default function NotificationCenter() {
  const [open,          setOpen]          = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading,       setLoading]       = useState(true);
  const ref        = useRef<HTMLDivElement>(null);
  const supabaseRef = useRef(createClient());
  const channelRef  = useRef<ReturnType<typeof supabaseRef.current.channel> | null>(null);

  const supabase    = supabaseRef.current;
  const unreadCount = notifications.filter(n => !n.is_read).length;

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setNotifications(data ?? []);
    setLoading(false);
  }

  // Realtime subscription — strict single-subscribe via channelRef guard
  useEffect(() => {
    if (channelRef.current) return; // already subscribed — skip (StrictMode double-invoke)

    load();

    channelRef.current = supabase
      .channel("notif-center")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
      }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev]);
      })
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function markAllRead() {
    const ids = notifications.filter(n => !n.is_read).map(n => n.id);
    if (!ids.length) return;
    await supabase.from("notifications").update({ is_read: true }).in("id", ids);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  }

  async function markRead(id: string) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  }

  async function dismiss(id: string) {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  }

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => { setOpen(v => !v); if (!open) load(); }}
        className="relative p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead}
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-brand-600 transition-colors">
                <CheckCheck className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-50">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading…</div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Bell className="w-5 h-5 text-slate-300" />
                </div>
                <p className="text-xs text-slate-400 font-medium">No notifications yet</p>
              </div>
            ) : notifications.map(n => (
              <div key={n.id}
                className={`flex gap-3 px-4 py-3 transition-colors hover:bg-slate-50 ${!n.is_read ? "bg-blue-50/40" : ""}`}>
                <NotifIcon type={n.type} />
                <div className="flex-1 min-w-0">
                  {n.href ? (
                    <a href={n.href} onClick={() => { markRead(n.id); setOpen(false); }}
                      className="text-xs font-semibold text-slate-800 hover:text-brand-600 transition-colors line-clamp-1">
                      {n.title}
                    </a>
                  ) : (
                    <p className="text-xs font-semibold text-slate-800 line-clamp-1">{n.title}</p>
                  )}
                  {n.body && <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{n.body}</p>}
                  <p className="text-[10px] text-slate-300 mt-1">{timeAgo(n.created_at)}</p>
                </div>
                <button onClick={() => dismiss(n.id)}
                  className="p-1 text-slate-200 hover:text-slate-400 rounded transition-colors flex-shrink-0 self-start mt-0.5">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-slate-100 text-center">
              <a href="/dashboard" onClick={() => setOpen(false)}
                className="text-[11px] font-semibold text-slate-400 hover:text-brand-600 transition-colors">
                Go to dashboard
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
