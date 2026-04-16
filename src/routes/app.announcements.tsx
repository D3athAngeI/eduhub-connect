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
import { Pin, Plus } from "lucide-react";
import { priorityClass, relativeDate } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/app/announcements")({
  component: AnnouncementsPage,
});

function AnnouncementsPage() {
  const { profile } = useAuth();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["announcements", profile?.school_id],
    enabled: !!profile,
    queryFn: async () => {
      const { data } = await supabase
        .from("announcements")
        .select("*, courses(name, color_hex), profiles:author_id(full_name, color_hex)")
        .eq("school_id", profile!.school_id)
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const canCreate = profile?.role === "teacher" || profile?.role === "admin";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Announcements</h1>
          <p className="text-sm text-muted-foreground">News and updates from your school</p>
        </div>
        {canCreate && <NewAnnouncementDialog onDone={() => qc.invalidateQueries({ queryKey: ["announcements"] })} />}
      </div>

      {(data ?? []).length === 0 && <Card className="p-8 text-center text-muted-foreground">No announcements yet.</Card>}

      <div className="space-y-3">
        {(data ?? []).map((a) => (
          <Card key={a.id} className="p-5">
            <div className="flex items-start gap-3">
              {a.courses && <div className="h-3 w-3 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: a.courses.color_hex }} />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {a.pinned && <Pin className="h-3.5 w-3.5 text-primary" />}
                  <h3 className="font-semibold">{a.title}</h3>
                  <Badge variant="outline" className={priorityClass(a.priority)}>{a.priority}</Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {a.profiles?.full_name ?? "—"} · {a.courses?.name ?? "School-wide"} · {relativeDate(a.created_at)}
                </div>
                {a.body && <p className="text-sm mt-2 whitespace-pre-wrap">{a.body}</p>}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function NewAnnouncementDialog({ onDone }: { onDone: () => void }) {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<"low" | "normal" | "medium" | "high">("normal");
  const [courseId, setCourseId] = useState<string>("");
  const [pinned, setPinned] = useState(false);

  const { data: courses } = useQuery({
    queryKey: ["courses-for-ann", profile?.school_id],
    enabled: !!profile && open,
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("id, name").eq("school_id", profile!.school_id).order("name");
      return data ?? [];
    },
  });

  const submit = async () => {
    if (!profile || !title) return;
    const { error } = await supabase.from("announcements").insert({
      school_id: profile.school_id,
      course_id: courseId || null,
      author_id: profile.id,
      title,
      body,
      priority,
      pinned,
    });
    if (error) toast.error(error.message);
    else { toast.success("Announcement posted"); setOpen(false); setTitle(""); setBody(""); setCourseId(""); setPinned(false); onDone(); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> New</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New announcement</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>Course (optional, school-wide if empty)</Label>
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger><SelectValue placeholder="School-wide" /></SelectTrigger>
              <SelectContent>
                {(courses ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Body</Label><Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem><SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-end gap-2 pb-1.5 cursor-pointer">
              <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="h-4 w-4" />
              <span className="text-sm">Pin to top</span>
            </label>
          </div>
          <Button onClick={submit} className="w-full">Post</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
