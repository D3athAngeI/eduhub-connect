import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { FolderOpen, FileText } from "lucide-react";
import { relativeDate } from "@/lib/format";

export const Route = createFileRoute("/app/files")({
  component: FilesPage,
});

function FilesPage() {
  const { profile } = useAuth();
  const { data } = useQuery({
    queryKey: ["files", profile?.school_id],
    enabled: !!profile,
    queryFn: async () => {
      const { data } = await supabase.from("files").select("*, courses(name, color_hex)").eq("school_id", profile!.school_id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Files</h1>
        <p className="text-sm text-muted-foreground">Course and conversation attachments</p>
      </div>
      {(data ?? []).length === 0 ? (
        <Card className="p-10 text-center">
          <FolderOpen className="h-10 w-10 mx-auto text-muted-foreground/50" />
          <p className="mt-3 text-muted-foreground">No files yet.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {(data ?? []).map((f) => (
            <Card key={f.id} className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted grid place-items-center"><FileText className="h-5 w-5 text-muted-foreground" /></div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{f.name}</div>
                <div className="text-xs text-muted-foreground">{f.courses?.name ?? "General"} · {(f.size / 1024).toFixed(1)} KB · {relativeDate(f.created_at)}</div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
