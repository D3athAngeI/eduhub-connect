import { Link, useLocation, useRouter } from "@tanstack/react-router";
import { LayoutDashboard, MessageSquare, Calendar, CheckSquare, MoreHorizontal, GraduationCap, LogOut, Moon, Sun, Bell, BookOpen, FileText, FolderOpen, CalendarDays, ShieldCheck } from "lucide-react";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const tabs: NavItem[] = [
  { to: "/app", label: "Today", icon: LayoutDashboard, exact: true },
  { to: "/app/chats", label: "Chats", icon: MessageSquare },
  { to: "/app/timetable", label: "Schedule", icon: Calendar },
  { to: "/app/tasks", label: "Tasks", icon: CheckSquare },
  { to: "/app/more", label: "More", icon: MoreHorizontal },
];

const sideLinks: NavItem[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/timetable", label: "Timetable", icon: Calendar },
  { to: "/app/chats", label: "Chats", icon: MessageSquare },
  { to: "/app/announcements", label: "Announcements", icon: Bell },
  { to: "/app/homework", label: "Homework", icon: BookOpen },
  { to: "/app/tasks", label: "Tasks", icon: CheckSquare },
  { to: "/app/grades", label: "Grades", icon: GraduationCap },
  { to: "/app/absences", label: "Absences", icon: FileText },
  { to: "/app/events", label: "Events", icon: CalendarDays },
  { to: "/app/files", label: "Files", icon: FolderOpen },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const loc = useLocation();
  const router = useRouter();

  const initials = (profile?.full_name || profile?.email || "U")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const isActive = (to: string, exact = false) =>
    exact ? loc.pathname === to : loc.pathname === to || loc.pathname.startsWith(to + "/");

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
        <div className="px-5 py-5 flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground grid place-items-center font-bold">E</div>
          <div>
            <div className="font-semibold leading-tight">EduSpace</div>
            <div className="text-xs text-muted-foreground leading-tight">School community</div>
          </div>
        </div>
        <nav className="px-3 py-2 flex-1 overflow-y-auto">
          {sideLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition",
                isActive(l.to, l.exact)
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
              )}
            >
              <l.icon className="h-4 w-4" />
              {l.label}
            </Link>
          ))}
          {profile?.role === "admin" && (
            <Link
              to="/app/admin"
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition mt-2",
                isActive("/app/admin")
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
              )}
            >
              <ShieldCheck className="h-4 w-4" />
              Admin
            </Link>
          )}
        </nav>
        <div className="p-3 border-t flex items-center gap-2">
          <Link to="/app/profile" className="flex items-center gap-2 flex-1 min-w-0 hover:bg-sidebar-accent/50 rounded-lg px-2 py-1.5">
            <Avatar className="h-8 w-8 border-2" style={{ borderColor: profile?.color_hex }}>
              <AvatarFallback style={{ backgroundColor: profile?.color_hex, color: "white" }}>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{profile?.full_name || "User"}</div>
              <div className="text-xs text-muted-foreground capitalize truncate">{profile?.role}</div>
            </div>
          </Link>
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={async () => { await signOut(); router.navigate({ to: "/login" }); }} aria-label="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden flex items-center justify-between px-4 h-14 border-b bg-card">
        <Link to="/app" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground grid place-items-center font-bold">E</div>
          <span className="font-semibold">EduSpace</span>
        </Link>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Link to="/app/profile">
            <Avatar className="h-8 w-8 border-2" style={{ borderColor: profile?.color_hex }}>
              <AvatarFallback style={{ backgroundColor: profile?.color_hex, color: "white" }}>{initials}</AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 min-w-0 pb-20 md:pb-0 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-4 md:p-8">{children}</div>
      </main>

      {/* Bottom tabs (mobile) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-card border-t z-40">
        <div className="grid grid-cols-5">
          {tabs.map((t) => {
            const active = isActive(t.to, t.exact);
            return (
              <Link
                key={t.to}
                to={t.to}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <t.icon className={cn("h-5 w-5", active && "scale-110 transition-transform")} />
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
