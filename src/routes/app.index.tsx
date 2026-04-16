import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, BookOpen, Calendar, GraduationCap, Sparkles } from "lucide-react";
import { todayDow, formatTime, hexToRgba, relativeDate } from "@/lib/format";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

function Dashboard() {
  const { profile } = useAuth();
  const dow = todayDow();

  const { data: timetable } = useQuery({
    queryKey: ["dashboard-timetable", profile?.school_id, dow],
    enabled: !!profile,
    queryFn: async () => {
      const { data } = await supabase
        .from("timetable_entries")
        .select("*, courses(name, color_hex, subject)")
        .eq("school_id", profile!.school_id)
        .eq("day_of_week", dow)
        .order("start_time");
      return data ?? [];
    },
  });

  const { data: homework } = useQuery({
    queryKey: ["dashboard-homework", profile?.school_id],
    enabled: !!profile,
    queryFn: async () => {
      const { data } = await supabase
        .from("homework")
        .select("id, title, due_date, courses(name, color_hex)")
        .eq("school_id", profile!.school_id)
        .gte("due_date", new Date().toISOString().slice(0, 10))
        .order("due_date")
        .limit(5);
      return data ?? [];
    },
  });

  const { data: announcements } = useQuery({
    queryKey: ["dashboard-announcements", profile?.school_id],
    enabled: !!profile,
    queryFn: async () => {
      const { data } = await supabase
        .from("announcements")
        .select("id, title, priority, pinned, created_at, courses(name, color_hex)")
        .eq("school_id", profile!.school_id)
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(4);
      return data ?? [];
    },
  });

  const { data: events } = useQuery({
    queryKey: ["dashboard-events", profile?.school_id],
    enabled: !!profile,
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("id, title, start_at")
        .eq("school_id", profile!.school_id)
        .gte("start_at", new Date().toISOString())
        .order("start_at")
        .limit(3);
      return data ?? [];
    },
  });

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mt-1">
          {greeting}, <span style={{ color: profile?.color_hex }}>{profile?.full_name?.split(" ")[0] || "there"}</span>
        </h1>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<Calendar className="h-5 w-5" />} label="Today's classes" value={String(timetable?.length ?? 0)} tint="info" />
        <StatCard icon={<BookOpen className="h-5 w-5" />} label="Open homework" value={String(homework?.length ?? 0)} tint="warning" />
        <StatCard icon={<Bell className="h-5 w-5" />} label="Announcements" value={String(announcements?.length ?? 0)} tint="primary" />
        <StatCard icon={<GraduationCap className="h-5 w-5" />} label="Upcoming events" value={String(events?.length ?? 0)} tint="success" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2"><Calendar className="h-4 w-4" /> Today's schedule</h2>
            <Link to="/app/timetable" className="text-xs text-primary hover:underline">View week →</Link>
          </div>
          {timetable && timetable.length > 0 ? (
            <div className="space-y-2">
              {timetable.slice(0, 3).map((e) => (
                <div
                  key={e.id}
                  className="flex items-center gap-3 p-3 rounded-lg border-l-4"
                  style={{
                    borderLeftColor: e.courses?.color_hex ?? "#6366f1",
                    backgroundColor: hexToRgba(e.courses?.color_hex ?? "#6366f1", 0.06),
                  }}
                >
                  <div className="text-sm font-mono tabular-nums w-20">{formatTime(e.start_time)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{e.courses?.name}</div>
                    <div className="text-xs text-muted-foreground">{e.room ?? "—"}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyHint text="No classes today. Enjoy! 🎉" />
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2"><BookOpen className="h-4 w-4" /> Upcoming homework</h2>
            <Link to="/app/homework" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          {homework && homework.length > 0 ? (
            <div className="space-y-2">
              {homework.map((h) => (
                <div key={h.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                  <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: h.courses?.color_hex ?? "#6366f1" }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{h.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{h.courses?.name}</div>
                  </div>
                  {h.due_date && <Badge variant="outline" className="text-xs">{relativeDate(h.due_date)}</Badge>}
                </div>
              ))}
            </div>
          ) : (
            <EmptyHint text="Nothing due soon ✨" />
          )}
        </Card>

        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4" /> Latest announcements</h2>
            <Link to="/app/announcements" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          {announcements && announcements.length > 0 ? (
            <div className="space-y-2">
              {announcements.map((a) => (
                <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
                  {a.courses && <div className="h-2.5 w-2.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: a.courses.color_hex }} />}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{a.title}</div>
                    <div className="text-xs text-muted-foreground">{a.courses?.name ?? "School-wide"} · {relativeDate(a.created_at)}</div>
                  </div>
                  {a.priority === "high" && <Badge variant="destructive" className="text-xs">High</Badge>}
                </div>
              ))}
            </div>
          ) : (
            <EmptyHint text="No announcements yet." />
          )}
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, tint }: { icon: React.ReactNode; label: string; value: string; tint: "info" | "warning" | "primary" | "success" }) {
  const tints = {
    info: "bg-info/10 text-info",
    warning: "bg-warning/15 text-warning-foreground",
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
  };
  return (
    <Card className="p-4 flex items-center gap-3">
      <div className={`h-10 w-10 rounded-xl grid place-items-center ${tints[tint]}`}>{icon}</div>
      <div>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </Card>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <div className="text-sm text-muted-foreground py-6 text-center">{text}</div>;
}
