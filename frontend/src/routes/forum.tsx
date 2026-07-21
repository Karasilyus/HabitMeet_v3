import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Flag, Trash2, TrendingUp, Plus, Hash, Send } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  api,
  initialsOf,
  parseDbDate,
  type ActivityType,
  type ForumComment,
  type ForumPost,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/forum")({
  head: () => ({
    meta: [
      { title: "Forum · HabitMeet" },
      { name: "description", content: "Semt sakinleriyle alışkanlıklar üzerine konuş." },
    ],
  }),
  component: ForumPage,
});

function timeAgo(d: Date): string {
  const s = (Date.now() - d.getTime()) / 1000;
  if (s < 60) return "az önce";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa önce`;
  return `${Math.floor(h / 24)} gün önce`;
}

function ForumPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [typeSel, setTypeSel] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  const postsQ = useQuery({
    queryKey: ["forum"],
    queryFn: () => api<ForumPost[]>("/api/forum"),
  });
  const typesQ = useQuery({
    queryKey: ["types"],
    queryFn: () => api<ActivityType[]>("/api/activity-types"),
  });

  const createPost = useMutation({
    mutationFn: () =>
      api<ForumPost>("/api/forum", {
        method: "POST",
        body: { title, body, typeId: typeSel ? Number(typeSel) : undefined },
      }),
    onSuccess: () => {
      toast.success("Konu açıldı!");
      setTitle("");
      setBody("");
      setTypeSel("");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["forum"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deletePost = useMutation({
    mutationFn: (id: number) => api(`/api/forum/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("İlan silindi.");
      qc.invalidateQueries({ queryKey: ["forum"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reportPost = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      api("/api/reports", {
        method: "POST",
        body: { targetType: "forum_post", targetId: id, reason },
      }),
    onSuccess: () => toast.success("Şikayetin alındı. Moderasyon ekibi inceleyecek."),
    onError: (e: Error) => toast.error(e.message),
  });

  const posts = postsQ.data ?? [];
  const canModerate = user?.role === "admin" || user?.role === "moderator";

  // Tip adına göre gönderi sayıları (kenar çubuğu)
  const trending = Object.entries(
    posts.reduce<Record<string, number>>((acc, p) => {
      const key = p.type_name ?? "Genel";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Forum</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Toplulukla alışkanlıkların üzerine konuş, arkadaş bul.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full">
              <Plus className="mr-1 size-4" /> Konu aç
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display">Yeni konu</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="post-title">Başlık</Label>
                <Input
                  id="post-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Örn. Moda sahilinde 06:30 koşu grubu"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="post-body">İçerik</Label>
                <Textarea
                  id="post-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  placeholder="Detayları yaz…"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Etiket (aktivite tipi)</Label>
                <Select value={typeSel} onValueChange={setTypeSel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tip seç (isteğe bağlı)" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {(typesQ.data ?? []).map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                className="w-full rounded-full"
                disabled={!title.trim() || !body.trim() || createPost.isPending}
                onClick={() => createPost.mutate()}
              >
                {createPost.isPending ? "Paylaşılıyor…" : "Paylaş"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          {postsQ.isLoading ? (
            <p className="text-sm text-muted-foreground">Yükleniyor…</p>
          ) : posts.length === 0 ? (
            <Card className="rounded-3xl border-border/60 p-10 text-center">
              <p className="text-sm text-muted-foreground">
                Henüz konu yok. İlk konuyu sen aç — koşu grubu, kitap kulübü, ne istersen!
              </p>
            </Card>
          ) : (
            posts.map((p) => (
              <Card
                key={p.id}
                className="group rounded-3xl border-border/60 p-6 transition hover:border-primary/40"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarFallback className="bg-accent/60 text-sm font-semibold text-accent-foreground">
                      {initialsOf(p.author_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="leading-tight">
                    <div className="text-sm font-semibold">{p.author_name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {timeAgo(parseDbDate(p.created_at))}
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="ml-auto rounded-full bg-accent/40 text-[10px] text-accent-foreground"
                  >
                    <Hash className="mr-0.5 size-2.5" />
                    {p.type_name ?? "Genel"}
                  </Badge>
                </div>

                <h3 className="mt-4 font-display text-lg font-semibold leading-snug transition group-hover:text-primary">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>

                <div className="mt-5 flex items-center gap-1 border-t border-border/60 pt-4 text-sm text-muted-foreground">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full"
                    onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                  >
                    <MessageSquare className="mr-1.5 size-4" /> {p.comment_count} yorum
                  </Button>
                  <div className="ml-auto flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full"
                      title="Şikayet et"
                      onClick={() => {
                        const reason = window.prompt("Şikayet nedenin (en az 5 karakter):");
                        if (reason && reason.trim().length >= 5)
                          reportPost.mutate({ id: p.id, reason: reason.trim() });
                        else if (reason !== null)
                          toast.error("Şikayet nedeni en az 5 karakter olmalıdır.");
                      }}
                    >
                      <Flag className="size-4" />
                    </Button>
                    {(p.user_id === user?.id || canModerate) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full hover:text-destructive"
                        title="Sil"
                        onClick={() => {
                          if (window.confirm("Bu konu silinsin mi?")) deletePost.mutate(p.id);
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {expanded === p.id && <CommentSection postId={p.id} />}
              </Card>
            ))
          )}
        </div>

        <aside className="space-y-5">
          <Card className="rounded-3xl border-border/60 p-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              <h3 className="font-display text-base font-semibold">Popüler etiketler</h3>
            </div>
            {trending.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">Henüz gönderi yok.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {trending.map(([tag, count], i) => (
                  <li
                    key={tag}
                    className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-secondary/50"
                  >
                    <span className="w-4 text-center font-display text-sm font-semibold text-muted-foreground">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="text-sm font-medium">#{tag}</div>
                      <div className="text-[11px] text-muted-foreground">{count} gönderi</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="rounded-3xl border-border/60 bg-gradient-to-br from-accent/50 to-primary/20 p-5">
            <div className="text-[11px] font-medium uppercase tracking-wider text-accent-foreground/80">
              Topluluk kuralları
            </div>
            <h3 className="mt-2 font-display text-lg font-semibold leading-snug">
              Saygılı ve destekleyici bir alan
            </h3>
            <p className="mt-2 text-xs text-muted-foreground">
              Uygunsuz içerikleri bayrak simgesiyle bildirebilirsin; moderasyon ekibi inceler.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function CommentSection({ postId }: { postId: number }) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");

  const commentsQ = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => api<ForumComment[]>(`/api/forum/${postId}/comments`),
  });

  const addComment = useMutation({
    mutationFn: () =>
      api(`/api/forum/${postId}/comments`, { method: "POST", body: { body: draft } }),
    onSuccess: () => {
      setDraft("");
      qc.invalidateQueries({ queryKey: ["comments", postId] });
      qc.invalidateQueries({ queryKey: ["forum"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const comments = commentsQ.data ?? [];

  return (
    <div className="mt-4 space-y-3 rounded-2xl bg-secondary/30 p-4">
      {commentsQ.isLoading ? (
        <p className="text-xs text-muted-foreground">Yorumlar yükleniyor…</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted-foreground">İlk yorumu sen yaz.</p>
      ) : (
        comments.map((c) => (
          <div key={c.id} className="flex items-start gap-2.5">
            <Avatar className="size-7">
              <AvatarFallback className="bg-accent/60 text-[10px] font-semibold text-accent-foreground">
                {initialsOf(c.author_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 rounded-2xl bg-background px-3.5 py-2.5">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-semibold">{c.author_name}</span>
                <span className="text-[10px] text-muted-foreground">
                  {timeAgo(parseDbDate(c.created_at))}
                </span>
              </div>
              <p className="mt-0.5 text-sm leading-relaxed">{c.body}</p>
            </div>
          </div>
        ))
      )}

      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (draft.trim()) addComment.mutate();
        }}
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Yorum yaz…"
          className="h-9 rounded-full bg-background"
        />
        <Button
          type="submit"
          size="icon"
          className="size-9 rounded-full"
          disabled={!draft.trim() || addComment.isPending}
        >
          <Send className="size-3.5" />
        </Button>
      </form>
    </div>
  );
}
