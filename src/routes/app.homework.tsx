import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { relativeDate, priorityClass } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/app/homework")({
  component: HomeworkPage,
});

function HomeworkPage() {
  const { profile } = useAuth();
  const qc = useQueryClient();

  const { data: homework } = useQuery({
    queryKey: ["homework", profile?.school_id],
    enabled: !!profile,
    queryFn: async () => {
      const { data } = await supabase
        .from("homework")
        .select("*, courses(name, color_hex), homework_status(status, student_id)")
        .eq("school_id", profile!.school_id)
        .order("due_date", { ascending: true, nullsFirst: false });
      return data ?? [];
    },
  });

  const updateStatus = async (homeworkId: string, status: "open" | "in_progress" | "done" | "submitted") => {
    if (!profile) return;
    const { error } = await supabase.from("homework_status").upsert(
      { homework_id: homeworkId, student_id: profile.id, status },
      { onConflict: "homework_id,student_id" }
    );
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["homework"] });
  };

  const grouped = (homework ?? []).reduce<Record<string, typeof homework>>((acc, h) => {
    const k = h.courses?.name ?? "—";
    (acc[k] ||= [] as never)!.push(h);
    return acc;
  }, {});

  const canCreate = profile?.role === "teacher" || profile?.role === "admin";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Homework</h1>
          <p className="text-sm text-muted-foreground">Track assignments per course</p>
        </div>
        {canCreate && <NewHomeworkDialog onDone={() => qc.invalidateQueries({ queryKey: ["homework"] })} />}
      </div>

      {Object.keys(grouped).length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">No homework yet.</Card>
      )}

      {Object.entries(grouped).map(([course, items]) => (
        <div key={course}>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2 mt-4">{course}</h2>
          <div className="space-y-2">
            {items!.map((h) => {
              const myStatus = h.homework_status?.find((s) => s.student_id === profile?.id)?.status ?? "open";
              return (
                <Card key={h.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full mt-2 shrink-0" style={{ backgroundColor: h.courses?.color_hex ?? "#6366f1" }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{h.title}</h3>
                        <Badge variant="outline" className={priorityClass(h.priority)}>{h.priority}</Badge>
                        {h.due_date && <Badge variant="outline">{relativeDate(h.due_date)}</Badge>}
                      </div>
                      {h.description && <p className="text-sm text-muted-foreground mt-1">{h.description}</p>}
                    </div>
                  </div>
                  {profile?.role === "student" && (
                    <div className="mt-3 flex gap-1 flex-wrap">
                      {(["open", "in_progress", "done", "submitted"] as const).map((s) => (
                        <Button
                          key={s}
                          size="sm"
                          variant={myStatus === s ? "default" : "outline"}
                          onClick={() => updateStatus(h.id, s)}
                        >
                          {s.replace("_", " ")}
                        </Button>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function NewHomeworkDialog({ onDone }: { onDone: () => void }) {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<"low" | "normal" | "medium" | "high">("normal");
  const [courseId, setCourseId] = useState("");

  const { data: courses } = useQuery({
    queryKey: ["courses-for-hw", profile?.school_id],
    enabled: !!profile && open,
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("id, name").eq("school_id", profile!.school_id).order("name");
      return data ?? [];
    },
  });

  const submit = async () => {
    if (!profile || !courseId || !title) return;
    const { error } = await supabase.from("homework").insert({
      school_id: profile.school_id,
      course_id: courseId,
      author_id: profile.id,
      title,
      description,
      due_date: dueDate || null,
      priority,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Homework created");
      setOpen(false);
      setTitle(""); setDescription(""); setDueDate(""); setCourseId("");
      onDone();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-1" /> New</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New homework</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>Course</Label>
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
              <SelectContent>
                {(courses ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Due date</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={submit} className="w-full">Create</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
