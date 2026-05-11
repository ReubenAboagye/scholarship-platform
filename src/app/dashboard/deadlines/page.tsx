import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDeadline, cn } from "@/lib/utils";
import { Clock, AlertTriangle, Calendar, ChevronRight } from "lucide-react";

function relationRow<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function daysLeft(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

interface DeadlineItem {
  id: string;
  status: string;
  scholarship: {
    id: string;
    name: string;
    slug: string | null;
    application_deadline: string | null;
    country: string | null;
    provider: string | null;
  } | null;
}

function urgencyGroup(days: number | null): {
  label: string;
  dot: string;
  pill: string;
  border: string;
} {
  if (days === null) return { label: "No deadline", dot: "bg-zinc-400", pill: "bg-zinc-50 text-zinc-500 border-zinc-200", border: "border-zinc-200" };
  if (days < 0) return { label: "Overdue", dot: "bg-red-500", pill: "bg-red-50 text-red-700 border-red-200", border: "border-red-200" };
  if (days <= 3) return { label: "Critical", dot: "bg-red-500", pill: "bg-red-50 text-red-700 border-red-200", border: "border-red-200" };
  if (days <= 7) return { label: "This week", dot: "bg-amber-500", pill: "bg-amber-50 text-amber-700 border-amber-200", border: "border-amber-200" };
  if (days <= 30) return { label: "This month", dot: "bg-blue-500", pill: "bg-blue-50 text-blue-700 border-blue-200", border: "border-blue-200" };
  return { label: "Later", dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700 border-emerald-200", border: "border-emerald-200" };
}

function groupItems(items: DeadlineItem[]) {
  const groups: Record<string, DeadlineItem[]> = {
    overdue: [],
    critical: [],
    week: [],
    month: [],
    later: [],
    nodate: [],
  };

  for (const item of items) {
    const d = item.scholarship?.application_deadline;
    if (!d) {
      groups.nodate.push(item);
      continue;
    }
    const days = daysLeft(d);
    if (days < 0) groups.overdue.push(item);
    else if (days <= 3) groups.critical.push(item);
    else if (days <= 7) groups.week.push(item);
    else if (days <= 30) groups.month.push(item);
    else groups.later.push(item);
  }

  // Sort each group by deadline ascending
  for (const key of Object.keys(groups)) {
    groups[key].sort((a, b) => {
      const da = a.scholarship?.application_deadline;
      const db = b.scholarship?.application_deadline;
      if (!da) return 1;
      if (!db) return -1;
      return new Date(da).getTime() - new Date(db).getTime();
    });
  }

  return groups;
}

const GROUP_ORDER = [
  { key: "overdue", title: "Overdue", icon: AlertTriangle, iconColor: "text-red-500" },
  { key: "critical", title: "Critical (3 days)", icon: Clock, iconColor: "text-red-500" },
  { key: "week", title: "Due this week", icon: Clock, iconColor: "text-amber-500" },
  { key: "month", title: "Due this month", icon: Calendar, iconColor: "text-blue-500" },
  { key: "later", title: "Later", icon: Calendar, iconColor: "text-emerald-500" },
  { key: "nodate", title: "No deadline set", icon: Calendar, iconColor: "text-zinc-400" },
] as const;

export default async function DeadlinesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: tracked } = await supabase
    .from("application_tracker")
    .select("id, status, scholarships(id, name, slug, application_deadline, country, provider)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const items: DeadlineItem[] = (tracked ?? []).map((t: any) => ({
    id: t.id,
    status: t.status,
    scholarship: relationRow(t.scholarships),
  }));

  const groups = groupItems(items);
  const totalWithDeadline = items.filter((i) => i.scholarship?.application_deadline).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl text-zinc-900" style={{ fontFamily: "Fraunces, Georgia, ui-serif, serif", fontWeight: 600 }}>
            Upcoming Deadlines
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {totalWithDeadline} scholarship{totalWithDeadline !== 1 ? "s" : ""} with deadlines tracked
          </p>
        </div>
        <a
          href="/dashboard/tracker"
          className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold text-zinc-800 bg-white border border-zinc-300 hover:bg-zinc-50 px-3.5 py-2 rounded-md transition-all"
        >
          Open Tracker <ChevronRight className="size-3" />
        </a>
      </div>

      {/* Groups */}
      {items.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-10 text-center">
          <Clock className="size-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-zinc-500">No deadlines tracked yet</p>
          <p className="text-xs text-zinc-400 mt-1 mb-4">Start tracking scholarships to see deadlines here</p>
          <a
            href="/dashboard/tracker"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 px-4 py-2 rounded-lg transition-all"
          >
            Go to Tracker
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          {GROUP_ORDER.map(({ key, title, icon: Icon, iconColor }) => {
            const groupItems = groups[key];
            if (groupItems.length === 0) return null;

            return (
              <div key={key}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={cn("size-4", iconColor)} />
                  <h2 className="text-sm font-semibold text-zinc-800">{title}</h2>
                  <span className="text-xs text-zinc-400 font-medium">{groupItems.length}</span>
                </div>
                <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden divide-y divide-zinc-50">
                  {groupItems.map((item) => {
                    const s = item.scholarship;
                    const deadline = s?.application_deadline;
                    const days = deadline ? daysLeft(deadline) : null;
                    const urgency = urgencyGroup(days);

                    return (
                      <a
                        key={item.id}
                        href={s?.slug ? `/dashboard/scholarships/${s.slug}` : "/dashboard/tracker"}
                        className="flex items-center gap-4 px-4 py-3.5 hover:bg-zinc-50 transition-colors group"
                      >
                        <div className={cn("size-2.5 rounded-full flex-shrink-0", urgency.dot)} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-zinc-800 group-hover:text-brand-700 truncate transition-colors">
                            {s?.name ?? "Scholarship"}
                          </p>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            {s?.provider ? `${s.provider} · ` : ""}
                            {deadline
                              ? new Date(deadline).toLocaleDateString("en-US", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "No deadline"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {days !== null && (
                            <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full border", urgency.pill)}>
                              {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
                            </span>
                          )}
                          <span
                            className={cn(
                              "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                              item.status === "In Progress"
                                ? "bg-blue-50 text-blue-600"
                                : item.status === "Submitted"
                                  ? "bg-violet-50 text-violet-600"
                                  : item.status === "Accepted"
                                    ? "bg-emerald-50 text-emerald-600"
                                    : item.status === "Rejected"
                                      ? "bg-rose-50 text-rose-600"
                                      : "bg-zinc-50 text-zinc-500"
                            )}
                          >
                            {item.status}
                          </span>
                          <ChevronRight className="size-3.5 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
