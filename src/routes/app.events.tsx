import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays } from "lucide-react";
import { relativeDate } from "@/lib/format";

export const Route = createFileRoute("/app/events")({
  component: EventsPage,
});

function EventsPage() {
  const { profile } = useAuth();
  const { data } = useQuery({
    queryKey: ["events", profile?.school_id],
    enabled: !!profile,
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("school_id", profile!.school_id)
        .order("start_at");
      return data ?? [];
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Events</h1>
        <p className="text-sm text-muted-foreground">School calendar</p>
      </div>
      {(data ?? []).length === 0 ? (
        <Card className="p-10 text-center">
          <CalendarDays className="h-10 w-10 mx-auto text-muted-foreground/50" />
          <p className="mt-3 text-muted-foreground">No upcoming events.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {(data ?? []).map((e) => (
            <Card key={e.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">{e.title}</h3>
                  {e.description && <p className="text-sm text-muted-foreground mt-1">{e.description}</p>}
                  <div className="text-xs text-muted-foreground mt-1">{new Date(e.start_at).toLocaleString()} · {relativeDate(e.start_at)}</div>
                </div>
                <Badge variant="outline" className="capitalize">{e.target_scope}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
