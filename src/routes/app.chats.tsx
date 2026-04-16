import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare } from "lucide-react";
import { relativeDate } from "@/lib/format";

export const Route = createFileRoute("/app/chats")({
  component: ChatsPage,
});

function ChatsPage() {
  const { profile } = useAuth();

  const { data: convs } = useQuery({
    queryKey: ["conversations", profile?.id],
    enabled: !!profile,
    queryFn: async () => {
      const { data: members } = await supabase
        .from("conversation_members")
        .select("conversation_id")
        .eq("user_id", profile!.id);
      const ids = (members ?? []).map((m) => m.conversation_id);
      if (ids.length === 0) return [];
      const { data } = await supabase
        .from("conversations")
        .select("*, messages(body_encrypted, created_at)")
        .in("id", ids)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Chats</h1>
        <p className="text-sm text-muted-foreground">Direct, group and course conversations</p>
      </div>

      {(convs ?? []).length === 0 ? (
        <Card className="p-10 text-center">
          <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/50" />
          <p className="mt-3 font-medium">No conversations yet</p>
          <p className="text-sm text-muted-foreground mt-1">Real end-to-end encrypted chat is coming in the next iteration.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {(convs ?? []).map((c) => {
            const last = c.messages?.[c.messages.length - 1];
            return (
              <Link key={c.id} to={"/app/chats/" + c.id as string}>
                <Card className="p-4 flex items-center gap-3 hover:bg-accent/30 transition">
                  <Avatar className="h-10 w-10"><AvatarFallback>{(c.title ?? "C")[0]}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{c.title ?? c.type}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {last ? "🔒 Encrypted message · " + relativeDate(last.created_at) : "No messages yet"}
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
