import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LogOut, Moon, Sun } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/profile")({
  component: ProfilePage,
});

const PRESET_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f59e0b", "#10b981", "#06b6d4", "#3b82f6"];

function ProfilePage() {
  const { profile, refreshProfile, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) { setFullName(profile.full_name); setColor(profile.color_hex); }
  }, [profile]);

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName, color_hex: color }).eq("id", profile.id);
    if (error) toast.error(error.message);
    else { toast.success("Profile saved"); await refreshProfile(); }
    setSaving(false);
  };

  const initials = (fullName || profile?.email || "U").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Profile & Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your personal info</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-4" style={{ borderColor: color }}>
            <AvatarFallback style={{ backgroundColor: color, color: "white" }} className="text-xl">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold">{profile?.email}</div>
            <Badge variant="outline" className="capitalize mt-1">{profile?.role}</Badge>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label>Full name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Personal color</Label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button key={c} onClick={() => setColor(c)} className={`h-10 w-10 rounded-full transition ${color === c ? "ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110" : ""}`} style={{ backgroundColor: c }} />
              ))}
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-10 rounded-full cursor-pointer" />
            </div>
          </div>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-3">Appearance</h2>
        <div className="flex items-center justify-between">
          <div className="text-sm">Theme</div>
          <Button variant="outline" onClick={toggle}>
            {theme === "dark" ? <><Sun className="h-4 w-4 mr-2" /> Light mode</> : <><Moon className="h-4 w-4 mr-2" /> Dark mode</>}
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <Button variant="destructive" onClick={async () => { await signOut(); router.navigate({ to: "/" }); }}>
          <LogOut className="h-4 w-4 mr-2" /> Sign out
        </Button>
      </Card>
    </div>
  );
}
