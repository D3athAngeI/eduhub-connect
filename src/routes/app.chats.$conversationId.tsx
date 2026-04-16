import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Lock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/chats/$conversationId")({
  component: ConversationPage,
});

// NOTE: real E2E encryption will be added in next iteration.
// For now we store plaintext in body_encrypted to keep schema future-proof.
function ConversationPage() {
  const { conversationId } = Route.useParams();
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const { data: conv } = useQuery({
    queryKey: ["conv", conversationId],
    queryFn: async () => {
      const { data } = await supabase.from("conversations").select("*").eq("id", conversationId).maybeSingle();
      return data;
    },
  });

  const { data: messages } = useQuery({
    queryKey: ["msgs", conversationId],
    queryFn: async () => {
      const { data } = await supabase.from("messages").select("*, profiles:sender_id(full_name, color_hex)").eq("conversation_id", conversationId).order("created_at");
      return data ?? [];
    },
  });

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    const ch = supabase
      .channel("msgs:" + conversationId)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` }, () => {
        qc.invalidateQueries({ queryKey: ["msgs", conversationId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [conversationId, qc]);

  const send = async () => {
    if (!profile || !text.trim()) return;
    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: profile.id,
      body_encrypted: text.trim(),
    });
    if (error) toast.error(error.message);
    else setText("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] md:h-[calc(100vh-5rem)] -m-4 md:-m-8">
      <header className="flex items-center gap-3 px-4 py-3 border-b bg-card">
        <Link to="/app/chats"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{conv?.title ?? conv?.type ?? "Conversation"}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1"><Lock className="h-3 w-3" /> Secure (E2E coming soon)</div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {(messages ?? []).map((m) => {
          const mine = m.sender_id === profile?.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {!mine && <div className="text-xs font-semibold mb-0.5" style={{ color: m.profiles?.color_hex }}>{m.profiles?.full_name}</div>}
                <div className="text-sm whitespace-pre-wrap">{m.body_encrypted}</div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="p-3 border-t bg-card flex gap-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" onKeyDown={(e) => e.key === "Enter" && send()} />
        <Button onClick={send}><Send className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}
