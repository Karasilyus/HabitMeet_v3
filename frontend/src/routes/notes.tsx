import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { NotebookPen, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { api, parseDbDate } from "@/lib/api";

type Note = {
  id: number;
  user_id: number;
  body: string;
  created_at: string;
};

export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: "Not Defteri · HabitMeet" },
      { name: "description", content: "Kişisel not defterin." },
    ],
  }),
  component: NotesPage,
});

function NotesPage() {
  const qc = useQueryClient();
  const [body, setBody] = useState("");

  const notesQ = useQuery({
    queryKey: ["notes"],
    queryFn: () => api<Note[]>("/api/notes"),
  });

  const addNote = useMutation({
    mutationFn: () => api<Note>("/api/notes", { method: "POST", body: { body } }),
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Not eklendi.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delNote = useMutation({
    mutationFn: (id: number) => api(`/api/notes/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Not silindi.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const notes = notesQ.data ?? [];

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 lg:px-8">
      <div className="flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-2xl bg-accent/50 text-accent-foreground">
          <NotebookPen className="size-5" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Not Defteri</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Sadece senin görebildiğin kişisel notların.
          </p>
        </div>
      </div>

      <Card className="mt-6 rounded-3xl border-border/60 p-5">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={5000}
          rows={4}
          placeholder="Aklındakini yaz… (hedefler, fikirler, hatırlatmalar)"
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">{body.length}/5000</span>
          <Button
            className="rounded-full"
            disabled={!body.trim() || addNote.isPending}
            onClick={() => addNote.mutate()}
          >
            {addNote.isPending ? "Ekleniyor…" : "Not ekle"}
          </Button>
        </div>
      </Card>

      <div className="mt-6 space-y-3">
        {notesQ.isLoading && (
          <p className="text-sm text-muted-foreground">Notlar yükleniyor…</p>
        )}
        {!notesQ.isLoading && notes.length === 0 && (
          <Card className="rounded-3xl border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
            Henüz notun yok. İlk notunu yukarıdan ekleyebilirsin.
          </Card>
        )}
        {notes.map((n) => (
          <Card key={n.id} className="group rounded-3xl border-border/60 p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="whitespace-pre-line text-sm leading-relaxed">{n.body}</p>
              <button
                type="button"
                title="Notu sil"
                className="shrink-0 text-muted-foreground opacity-0 transition hover:text-destructive group-hover:opacity-100"
                onClick={() => {
                  if (window.confirm("Bu not silinsin mi?")) delNote.mutate(n.id);
                }}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              {parseDbDate(n.created_at).toLocaleString("tr-TR", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
