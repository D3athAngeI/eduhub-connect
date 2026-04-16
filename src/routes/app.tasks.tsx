import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Check } from "lucide-react";
import { priorityClass, relativeDate } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/app/tasks")({
  component: TasksPage,
});

function TasksPage() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");

  const { data: todos } = useQuery({
    queryKey: ["todos", profile?.id],
    enabled: !!profile,
    queryFn: async () => {
      const { data } = await supabase.from("todos").select("*").eq("user_id", profile!.id).order("status").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: hw } = useQuery({
    queryKey: ["tasks-hw", profile?.school_id],
    enabled: !!profile,
    queryFn: async () => {
      const { data } = await supabase.from("homework").select("id, title, due_date, courses(name, color_hex), homework_status(status, student_id)").eq("school_id", profile!.school_id).gte("due_date", new Date().toISOString().slice(0, 10)).order("due_date");
      return data ?? [];
    },
  });

  const add = async () => {
    if (!profile || !title.trim()) return;
    const { error } = await supabase.from("todos").insert({ user_id: profile.id, title: title.trim() });
    if (error) toast.error(error.message);
    else { setTitle(""); qc.invalidateQueries({ queryKey: ["todos"] }); }
  };

  const toggle = async (id: string, current: string) => {
    const next = current === "done" ? "open" : "done";
    await supabase.from("todos").update({ status: next }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["todos"] });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Tasks</h1>
        <p className="text-sm text-muted-foreground">Personal todos + homework auto-feed</p>
      </div>

      <Card className="p-3 flex gap-2">
        <Input placeholder="Add a private task…" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <Button onClick={add}><Plus className="h-4 w-4" /></Button>
      </Card>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">My todos</h2>
        <div className="space-y-2">
          {(todos ?? []).length === 0 && <Card className="p-4 text-sm text-muted-foreground text-center">No personal todos.</Card>}
          {(todos ?? []).map((t) => (
            <Card key={t.id} className="p-3 flex items-center gap-3">
              <button onClick={() => toggle(t.id, t.status)} className={`h-6 w-6 rounded-full border-2 grid place-items-center ${t.status === "done" ? "bg-success border-success text-success-foreground" : "border-muted-foreground/30"}`}>
                {t.status === "done" && <Check className="h-3.5 w-3.5" />}
              </button>
              <div className={`flex-1 min-w-0 ${t.status === "done" ? "line-through text-muted-foreground" : ""}`}>{t.title}</div>
              <Badge variant="outline" className={priorityClass(t.priority)}>{t.priority}</Badge>
              {t.due_date && <span className="text-xs text-muted-foreground">{relativeDate(t.due_date)}</span>}
            </Card>
          ))}
        </div>
      </div>

      {(hw ?? []).length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2 mt-6">From homework</h2>
          <div className="space-y-2">
            {(hw ?? []).map((h) => {
              const status = h.homework_status?.find((s) => s.student_id === profile?.id)?.status ?? "open";
              return (
                <Card key={h.id} className="p-3 flex items-center gap-3">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: h.courses?.color_hex ?? "#6366f1" }} />
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium ${status === "done" ? "line-through text-muted-foreground" : ""}`}>{h.title}</div>
                    <div className="text-xs text-muted-foreground">{h.courses?.name} · {h.due_date && relativeDate(h.due_date)}</div>
                  </div>
                  <Badge variant="outline" className="capitalize">{status.replace("_", " ")}</Badge>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
