import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { GraduationCap, FileText, FolderOpen, CalendarDays, User, ShieldCheck, Bell, BookOpen } from "lucide-react";

export const Route = createFileRoute("/app/more")({
  component: MorePage,
});

const items = [
  { to: "/app/announcements", label: "Announcements", icon: Bell },
  { to: "/app/homework", label: "Homework", icon: BookOpen },
  { to: "/app/grades", label: "Grades", icon: GraduationCap },
  { to: "/app/absences", label: "Absences", icon: FileText },
  { to: "/app/events", label: "Events", icon: CalendarDays },
  { to: "/app/files", label: "Files", icon: FolderOpen },
  { to: "/app/profile", label: "Profile & settings", icon: User },
];

function MorePage() {
  const { profile } = useAuth();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">More</h1>
        <p className="text-sm text-muted-foreground">Everything else in EduSpace</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {items.map((i) => (
          <Link key={i.to} to={i.to as string}>
            <Card className="p-5 hover:bg-accent/30 transition flex flex-col items-start gap-2">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center"><i.icon className="h-5 w-5" /></div>
              <div className="font-medium">{i.label}</div>
            </Card>
          </Link>
        ))}
        {profile?.role === "admin" && (
          <Link to="/app/admin">
            <Card className="p-5 hover:bg-accent/30 transition flex flex-col items-start gap-2">
              <div className="h-10 w-10 rounded-xl bg-destructive/10 text-destructive grid place-items-center"><ShieldCheck className="h-5 w-5" /></div>
              <div className="font-medium">Admin panel</div>
            </Card>
          </Link>
        )}
      </div>
    </div>
  );
}
