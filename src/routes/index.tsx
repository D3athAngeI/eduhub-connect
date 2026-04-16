import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && user) router.navigate({ to: "/app" });
  }, [loading, user, router]);

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/app`,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success("Account created — you can now sign in.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.navigate({ to: "/app" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background">
      {/* Hero */}
      <div className="hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-primary to-accent text-primary-foreground">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur grid place-items-center font-bold text-xl">E</div>
          <span className="font-semibold text-xl">EduSpace</span>
        </div>
        <div>
          <h1 className="text-5xl font-bold tracking-tight leading-tight">Your school,<br />all in one place.</h1>
          <p className="mt-4 text-primary-foreground/85 text-lg max-w-md">
            Timetable, homework, grades, chats and announcements — closed and safe inside your school.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3 max-w-md">
            {[
              ["📚", "Homework & Grades"],
              ["📅", "Smart Timetable"],
              ["💬", "Encrypted Chats"],
              ["🔔", "Announcements"],
            ].map(([e, t]) => (
              <div key={t} className="rounded-xl bg-white/10 backdrop-blur px-4 py-3 text-sm font-medium">
                <div className="text-xl">{e}</div>{t}
              </div>
            ))}
          </div>
        </div>
        <div className="text-xs text-primary-foreground/70">Multi-tenant · School-scoped · Built with privacy in mind</div>
      </div>

      {/* Auth */}
      <div className="flex items-center justify-center p-6 md:p-10">
        <Card className="w-full max-w-md p-8">
          <div className="md:hidden flex items-center gap-2 mb-6">
            <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground grid place-items-center font-bold">E</div>
            <span className="font-semibold text-lg">EduSpace</span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">{mode === "login" ? "Welcome back" : "Create your account"}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "login" ? "Sign in with your school email." : "Use your school email to be auto-assigned."}
          </p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Alex Müller" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">School email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@school.edu" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </Button>
          </form>
          <div className="mt-6 text-sm text-center text-muted-foreground">
            {mode === "login" ? (
              <>New to EduSpace? <button onClick={() => setMode("signup")} className="text-primary font-medium hover:underline">Sign up</button></>
            ) : (
              <>Already have an account? <button onClick={() => setMode("login")} className="text-primary font-medium hover:underline">Sign in</button></>
            )}
          </div>
          <div className="mt-4 text-xs text-center text-muted-foreground">
            <Link to="/login" className="hover:underline">Having trouble? Open dedicated login</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
