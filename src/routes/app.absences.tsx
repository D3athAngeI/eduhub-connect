import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/app/absences")({
  component: AbsencesPage,
});

function AbsencesPage() {
  const { profile } = useAuth();
  const { data } = useQuery({
    queryKey: ["absences", profile?.id],
    enabled: !!profile,
    queryFn: async () => {
      const q = supabase.from("absences").select("*").order("date", { ascending: false });
      const { data } = profile?.role === "student" ? await q.eq("student_id", profile.id) : await q;
      return data ?? [];
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Absences</h1>
        <p className="text-sm text-muted-foreground">Attendance records</p>
      </div>
      {(data ?? []).length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">No absences recorded.</Card>
      ) : (
        <div className="space-y-2">
          {(data ?? []).map((a) => (
            <Card key={a.id} className="p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{new Date(a.date).toLocaleDateString()}</div>
                <div className="text-xs text-muted-foreground">{a.reason ?? "—"} · {a.periods?.length ?? 0} periods</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">{a.type}</Badge>
                <Badge variant={a.excused ? "default" : "destructive"}>{a.excused ? "excused" : "unexcused"}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
