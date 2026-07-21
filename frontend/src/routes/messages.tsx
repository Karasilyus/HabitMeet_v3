import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, Flag, Ban, Sparkles , Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  api,
  initialsOf,
  parseDbDate,
  type Conversation,
  type Match,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/messages")({
  validateSearch: (s: Record<string, unknown>) => ({
    match:
      typeof s.match === "number"
        ? s.match
        : typeof s.match === "string"
          ? Number(s.match)
          : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Mesajlar · HabitMeet" },
      { name: "description", content: "Eşleştiğin kişilerle sohbet et." },
    ],
  }),
  component: MessagesPage,
});

function MessagesPage() {
  const { user } = useAuth();
  const { match } = Route.useSearch();
  const qc = useQueryClient();
  const [active, setActive] = useState<number | undefined>(match);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const matchesQ = useQuery({
    queryKey: ["matches"],
    queryFn: () => api<Match[]>("/api/matches"),
  });
  const threads = (matchesQ.data ?? []).filter((m) => m.status === "accepted");
  const activeId = active ?? threads[0]?.id;
  const current = threads.find((t) => t.id === activeId);

  const convQ = useQuery({
    queryKey: ["conversation", activeId],
    enabled: !!activeId,
    refetchInterval: 10000,
    queryFn: async () => {
      const r = await api<Conversation>(`/api/messages/${activeId}`);
      // Okundu bilgisi değişti — rozetleri tazele
      qc.invalidateQueries({ queryKey: ["matches"] });
      return r;
    },
  });

  const messages = convQ.data?.messages ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, activeId]);

  const send = useMutation({
    mutationFn: () =>
      api(`/api/messages/${activeId}`, { method: "POST", body: { body: draft } }),
    onSuccess: () => {
      setDraft("");
      qc.invalidateQueries({ queryKey: ["conversation", activeId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const report = useMutation({
    mutationFn: (reason: string) =>
      api("/api/reports", {
        method: "POST",
        body: { targetType: "user", targetId: current?.other_user_id, reason },
      }),
    onSuccess: () => toast.success("Şikayetin alındı. Moderasyon ekibi inceleyecek."),
    onError: (e: Error) => toast.error(e.message),
  });

  const block = useMutation({
    mutationFn: () =>
      api("/api/blocks", { method: "POST", body: { userId: current?.other_user_id } }),
    onSuccess: () => {
      toast.success("Kullanıcı engellendi.");
      setActive(undefined);
      qc.invalidateQueries({ queryKey: ["matches"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Mesaj silme: yalnızca kendi mesajını silebilir.
  const delMsg = useMutation({
    mutationFn: (id: number) => api(`/api/messages/item/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversation"] });
      toast.success("Mesaj silindi.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto h-[calc(100svh-4rem)] max-w-7xl px-5 py-6 lg:px-8">
      <div className="grid h-full grid-cols-1 gap-5 md:grid-cols-[320px_1fr]">
        {/* Threads */}
        <Card className="flex flex-col overflow-hidden rounded-3xl border-border/60">
          <div className="border-b border-border/60 p-4">
            <h2 className="font-display text-lg font-semibold">Sohbetler</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Kabul edilen eşleşmelerinle mesajlaşabilirsin.
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {threads.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                Henüz aktif sohbetin yok. Bir eşleşmeyi kabul ettiğinde burada görünür.
              </p>
            ) : (
              threads.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActive(t.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition ${
                    activeId === t.id ? "bg-accent/50" : "hover:bg-secondary/50"
                  }`}
                >
                  <Avatar className="size-10">
                    <AvatarFallback className="bg-accent/60 text-sm font-semibold text-accent-foreground">
                      {initialsOf(t.other_user_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="truncate text-sm font-semibold">{t.other_user_name}</div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">
                      {t.type_name} · {t.other_neighborhood}
                    </div>
                  </div>
                  {Number(t.unread_count) > 0 && (
                    <Badge className="h-5 min-w-5 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
                      {t.unread_count}
                    </Badge>
                  )}
                </button>
              ))
            )}
          </div>
        </Card>

        {/* Conversation */}
        <Card className="flex flex-col overflow-hidden rounded-3xl border-border/60">
          {!current ? (
            <div className="grid flex-1 place-items-center p-8 text-center text-sm text-muted-foreground">
              Soldan bir sohbet seç veya önce bir eşleşmeyi kabul et.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-border/60 p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarFallback className="bg-accent/60 text-sm font-semibold text-accent-foreground">
                      {initialsOf(current.other_user_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="leading-tight">
                    <div className="font-display text-base font-semibold">
                      {current.other_user_name}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Sparkles className="size-3 text-primary" /> {current.type_name} ·{" "}
                      {current.other_neighborhood}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    title="Şikayet et"
                    onClick={() => {
                      const reason = window.prompt("Şikayet nedenin (en az 5 karakter):");
                      if (reason && reason.trim().length >= 5) report.mutate(reason.trim());
                      else if (reason !== null) toast.error("Şikayet nedeni en az 5 karakter olmalıdır.");
                    }}
                  >
                    <Flag className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:text-destructive"
                    title="Engelle"
                    onClick={() => {
                      if (window.confirm(`${current.other_user_name} engellensin mi?`)) {
                        block.mutate();
                      }
                    }}
                  >
                    <Ban className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto bg-secondary/20 p-6">
                <div className="mx-auto w-fit rounded-full bg-background/80 px-3 py-1 text-[11px] text-muted-foreground backdrop-blur">
                  “{current.type_name}” alışkanlığı üzerinden eşleştiniz
                </div>
                {messages.map((m) => {
                  const mine = m.sender_id === user?.id;
                  return (
                    <div
                      key={m.id}
                      className={`group flex items-center gap-1.5 ${mine ? "justify-end" : "justify-start"}`}
                    >
                      {mine && (
                        <button
                          type="button"
                          title="Mesajı sil"
                          className="text-muted-foreground opacity-0 transition hover:text-destructive group-hover:opacity-100"
                          onClick={() => {
                            if (window.confirm("Bu mesaj silinsin mi?")) delMsg.mutate(m.id);
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                          mine
                            ? "rounded-br-md bg-primary text-primary-foreground"
                            : "rounded-bl-md bg-background text-foreground"
                        }`}
                      >
                        {m.body}
                        <div
                          className={`mt-1 text-[10px] ${
                            mine ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}
                        >
                          {parseDbDate(m.created_at).toLocaleTimeString("tr-TR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <div className="border-t border-border/60 p-3">
                <form
                  className="flex items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (draft.trim()) send.mutate();
                  }}
                >
                  <Input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Bir mesaj yaz…"
                    className="h-11 rounded-full bg-secondary/40"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="size-11 rounded-full"
                    disabled={!draft.trim() || send.isPending}
                  >
                    <Send className="size-4" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
