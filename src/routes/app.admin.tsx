import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/admin")({
  component: AdminPage,
});

function AdminPage() {
  const { profile, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && profile && profile.role !== "admin") router.navigate({ to: "/app" });
  }, [loading, profile, router]);
  if (!profile || profile.role !== "admin") return null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Admin panel</h1>
        <p className="text-sm text-muted-foreground">Manage users, courses and school</p>
      </div>
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="school">School</TabsTrigger>
        </TabsList>
        <TabsContent value="users"><UsersTab /></TabsContent>
        <TabsContent value="courses"><CoursesTab /></TabsContent>
        <TabsContent value="school"><SchoolTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function UsersTab() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const { data: users } = useQuery({
    queryKey: ["admin-users", profile?.school_id],
    enabled: !!profile,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("school_id", profile!.school_id).order("full_name");
      return data ?? [];
    },
  });
  const setRole = async (id: string, role: "student" | "teacher" | "parent" | "admin") => {
    const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Role updated"); qc.invalidateQueries({ queryKey: ["admin-users"] }); }
  };
  return (
    <div className="space-y-2 mt-3">
      {(users ?? []).map((u) => (
        <Card key={u.id} className="p-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full grid place-items-center text-white font-semibold text-sm" style={{ backgroundColor: u.color_hex }}>
            {u.full_name?.[0] ?? u.email[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{u.full_name || "(no name)"}</div>
            <div className="text-xs text-muted-foreground truncate">{u.email}</div>
          </div>
          <Select value={u.role} onValueChange={(v) => setRole(u.id, v as "student" | "teacher" | "parent" | "admin")}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="teacher">Teacher</SelectItem>
              <SelectItem value="parent">Parent</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </Card>
      ))}
    </div>
  );
}

function CoursesTab() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [grade, setGrade] = useState("");

  const { data: courses } = useQuery({
    queryKey: ["admin-courses", profile?.school_id],
    enabled: !!profile,
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("*").eq("school_id", profile!.school_id).order("name");
      return data ?? [];
    },
  });

  const create = async () => {
    if (!profile || !name) return;
    const { error } = await supabase.from("courses").insert({ school_id: profile.school_id, name, color_hex: color, grade_level: grade || null });
    if (error) toast.error(error.message);
    else { toast.success("Course created"); setOpen(false); setName(""); setGrade(""); qc.invalidateQueries({ queryKey: ["admin-courses"] }); }
  };

  return (
    <div className="space-y-2 mt-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> New course</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New course</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Grade level</Label><Input value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="e.g. 10a" /></div>
              <div className="space-y-1.5"><Label>Color</Label><Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-20" /></div>
              <Button onClick={create} className="w-full">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {(courses ?? []).map((c) => (
        <Card key={c.id} className="p-3 flex items-center gap-3 border-l-4" style={{ borderLeftColor: c.color_hex }}>
          <div className="flex-1">
            <div className="font-medium">{c.name}</div>
            <div className="text-xs text-muted-foreground">{c.grade_level ?? "—"}</div>
          </div>
          <Badge variant="outline">{c.subject ?? "course"}</Badge>
        </Card>
      ))}
    </div>
  );
}

function SchoolTab() {
  const { profile } = useAuth();
  const { data: school } = useQuery({
    queryKey: ["admin-school", profile?.school_id],
    enabled: !!profile,
    queryFn: async () => {
      const { data } = await supabase.from("schools").select("*").eq("id", profile!.school_id).single();
      return data;
    },
  });
  if (!school) return null;
  return (
    <Card className="p-5 mt-3 space-y-2">
      <div><div className="text-xs text-muted-foreground">School name</div><div className="font-semibold">{school.name}</div></div>
      <div><div className="text-xs text-muted-foreground">Email domain</div><div className="font-mono text-sm">{school.domain ?? "—"}</div></div>
      <div className="text-xs text-muted-foreground pt-2">New users matching this domain will be auto-assigned to this school.</div>
    </Card>
  );
}
