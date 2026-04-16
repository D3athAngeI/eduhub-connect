import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DAYS, formatTime, hexToRgba } from "@/lib/format";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/app/timetable")({
  component: Timetable,
});

const HOURS = Array.from({ length: 11 }, (_, i) => i + 7); // 7..17

function Timetable() {
  const { profile } = useAuth();
  const [view, setView] = useState<"week" | "day">("week");
  const [dayIdx, setDayIdx] = useState(() => {
    const d = new Date().getDay();
    return d === 0 ? 0 : Math.min(d - 1, 4);
  });

  const { data: entries } = useQuery({
    queryKey: ["timetable", profile?.school_id],
    enabled: !!profile,
    queryFn: async () => {
      const { data } = await supabase
        .from("timetable_entries")
        .select("*, courses(name, color_hex, subject), profiles:teacher_id(full_name)")
        .eq("school_id", profile!.school_id)
        .order("start_time");
      return data ?? [];
    },
  });

  const { data: subs } = useQuery({
    queryKey: ["substitutions", profile?.school_id],
    enabled: !!profile,
    queryFn: async () => {
      const { data } = await supabase
        .from("timetable_substitutions")
        .select("*")
        .gte("date", new Date().toISOString().slice(0, 10));
      return data ?? [];
    },
  });

  const subMap = new Map((subs ?? []).map((s) => [s.timetable_entry_id, s]));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Timetable</h1>
          <p className="text-sm text-muted-foreground">Week overview · subjects color-coded</p>
        </div>
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          <button onClick={() => setView("week")} className={`px-3 py-1.5 text-sm rounded-md ${view === "week" ? "bg-card shadow-sm font-medium" : "text-muted-foreground"}`}>Week</button>
          <button onClick={() => setView("day")} className={`px-3 py-1.5 text-sm rounded-md ${view === "day" ? "bg-card shadow-sm font-medium" : "text-muted-foreground"}`}>Day</button>
        </div>
      </div>

      {view === "day" && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {DAYS.slice(0, 5).map((d, i) => (
            <Button key={d} variant={dayIdx === i ? "default" : "outline"} size="sm" onClick={() => setDayIdx(i)}>{d}</Button>
          ))}
        </div>
      )}

      <Card className="overflow-x-auto">
        {view === "week" ? (
          <div className="min-w-[720px] grid grid-cols-[64px_repeat(5,1fr)]">
            <div className="border-b border-r p-2 text-xs font-medium text-muted-foreground">Time</div>
            {DAYS.slice(0, 5).map((d) => (
              <div key={d} className="border-b p-2 text-xs font-semibold text-center">{d}</div>
            ))}
            {HOURS.map((h) => (
              <Row key={h} hour={h} dayIdxs={[1, 2, 3, 4, 5]} entries={entries ?? []} subs={subMap} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-[64px_1fr]">
            <div className="border-b border-r p-2 text-xs font-medium text-muted-foreground">Time</div>
            <div className="border-b p-2 text-xs font-semibold text-center">{DAYS[dayIdx]}</div>
            {HOURS.map((h) => (
              <Row key={h} hour={h} dayIdxs={[dayIdx + 1]} entries={entries ?? []} subs={subMap} />
            ))}
          </div>
        )}
      </Card>

      {(entries ?? []).length === 0 && (
        <div className="text-sm text-muted-foreground text-center py-8">
          No timetable entries yet. Teachers and admins can create them.
        </div>
      )}
    </div>
  );
}

type Entry = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string | null;
  courses: { name: string; color_hex: string; subject: string | null } | null;
};

function Row({ hour, dayIdxs, entries, subs }: { hour: number; dayIdxs: number[]; entries: Entry[]; subs: Map<string, { type: string; new_room: string | null; note: string | null }> }) {
  return (
    <>
      <div className="border-b border-r p-2 text-xs font-mono tabular-nums text-muted-foreground">{String(hour).padStart(2, "0")}:00</div>
      {dayIdxs.map((d) => {
        const cell = entries.find((e) => e.day_of_week === d && parseInt(e.start_time.slice(0, 2)) === hour);
        return (
          <div key={d} className="border-b border-l first:border-l-0 p-1 min-h-[60px]">
            {cell && (
              <div
                className="rounded-lg p-2 h-full border-l-4 text-xs"
                style={{
                  borderLeftColor: cell.courses?.color_hex ?? "#6366f1",
                  backgroundColor: hexToRgba(cell.courses?.color_hex ?? "#6366f1", 0.1),
                }}
              >
                <div className="font-semibold truncate">{cell.courses?.name}</div>
                <div className="text-muted-foreground truncate">{cell.room ?? "—"}</div>
                <div className="text-[10px] text-muted-foreground">{formatTime(cell.start_time)}–{formatTime(cell.end_time)}</div>
                {subs.get(cell.id) && (
                  <Badge variant="outline" className="mt-1 text-[10px] bg-warning/15 border-warning/30 text-warning-foreground gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {subs.get(cell.id)!.type}
                  </Badge>
                )}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
