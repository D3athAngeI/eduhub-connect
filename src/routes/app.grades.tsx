import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/app/grades")({
  component: GradesPage,
});

function GradesPage() {
  const { profile } = useAuth();

  const { data: grades } = useQuery({
    queryKey: ["grades", profile?.id],
    enabled: !!profile,
    queryFn: async () => {
      const q = supabase.from("grades").select("*, courses(name, color_hex)").order("created_at", { ascending: false });
      const { data } = profile?.role === "student" ? await q.eq("student_id", profile.id) : await q;
      return data ?? [];
    },
  });

  // Group by course
  const grouped = (grades ?? []).reduce<Record<string, { color: string; items: typeof grades }>>((acc, g) => {
    const k = g.courses?.name ?? "—";
    if (!acc[k]) acc[k] = { color: g.courses?.color_hex ?? "#6366f1", items: [] as never };
    acc[k].items!.push(g);
    return acc;
  }, {});

  const avg = (items: NonNullable<typeof grades>) => {
    const sumW = items.reduce((s, g) => s + Number(g.weight), 0) || 1;
    const sumV = items.reduce((s, g) => s + Number(g.value) * Number(g.weight), 0);
    return (sumV / sumW).toFixed(2);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Grades</h1>
        <p className="text-sm text-muted-foreground">Performance by course</p>
      </div>

      {Object.keys(grouped).length === 0 && <Card className="p-8 text-center text-muted-foreground">No grades recorded yet.</Card>}

      <div className="grid md:grid-cols-2 gap-3">
        {Object.entries(grouped).map(([course, { color, items }]) => (
          <Card key={course} className="p-5 border-l-4" style={{ borderLeftColor: color }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">{course}</h2>
              <div className="text-2xl font-bold tabular-nums" style={{ color }}>{avg(items!)}</div>
            </div>
            <div className="space-y-1.5">
              {items!.map((g) => (
                <div key={g.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                  <div>
                    <Badge variant="outline" className="text-xs mr-2">{g.category}</Badge>
                    {g.note && <span className="text-muted-foreground">{g.note}</span>}
                  </div>
                  <div className="font-mono font-semibold">{g.value}</div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
