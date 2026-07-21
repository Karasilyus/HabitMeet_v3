import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Sparkles, MessageCircle, Check, X, Ban, Clock } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { api, initialsOf, type Match } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/matches")({
  head: () => ({
    meta: [
      { title: "Eşleşmeler · HabitMeet" },
      { name: "description", content: "Aynı semtte, aynı ritmi tutturan komşuların." },
    ],
  }),
  component: MatchesPage,
});

function MatchesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const matchesQ = useQuery({
    queryKey: ["matches"],
    queryFn: () => api<Match[]>("/api/matches"),
  });

  const respond = useMutation({
    mutationFn: ({ id, accept }: { id: number; accept: boolean }) =>
      api(`/api/matches/${id}/respond`, { method: "POST", body: { accept } }),
    onSuccess: (_r, v) => {
      toast.success(v.accept ? "Eşleşme kabul edildi. Mesajlaşmaya başlayabilirsin!" : "İstek reddedildi.");
      qc.invalidateQueries({ queryKey: ["matches"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const block = useMutation({
    mutationFn: (userId: number) =>
      api("/api/blocks", { method: "POST", body: { userId } }),
    onSuccess: () => {
      toast.success("Kullanıcı engellendi.");
      qc.invalidateQueries({ queryKey: ["matches"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const me = user?.id;
  const all = matchesQ.data ?? [];
  const incoming = all.filter((m) => m.status === "pending" && m.requested_by !== me);
  const outgoing = all.filter((m) => m.status === "pending" && m.requested_by === me);
  const accepted = all.filter((m) => m.status === "accepted");

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Eşleşmeler</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <MapPin className="mr-1 inline size-3.5" />
            {user?.neighborhood} · aynı ilçede aynı alışkanlıkta seri yapanlarla otomatik eşleşme
          </p>
        </div>
      </div>

      {matchesQ.isLoading ? (
        <p className="mt-8 text-sm text-muted-foreground">Yükleniyor…</p>
      ) : all.length === 0 ? (
        <Card className="mt-8 rounded-3xl border-border/60 p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Henüz eşleşme yok. Bir alışkanlığını bugün işaretle — aynı ilçede aynı tipte
            seri yapan komşularınla otomatik eşleşme isteği oluşur.
          </p>
        </Card>
      ) : (
        <div className="mt-8 space-y-10">
          {incoming.length > 0 && (
            <Section title="Gelen istekler" subtitle="Seninle eşleşmek isteyenler">
              {incoming.map((m) => (
                <MatchCard key={m.id} match={m}>
                  <Button
                    className="flex-1 rounded-full"
                    disabled={respond.isPending}
                    onClick={() => respond.mutate({ id: m.id, accept: true })}
                  >
                    <Check className="mr-1 size-4" /> Kabul et
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full"
                    disabled={respond.isPending}
                    onClick={() => respond.mutate({ id: m.id, accept: false })}
                  >
                    <X className="mr-1 size-4" /> Reddet
                  </Button>
                </MatchCard>
              ))}
            </Section>
          )}

          {accepted.length > 0 && (
            <Section title="Aktif eşleşmeler" subtitle="Mesajlaşmaya açık">
              {accepted.map((m) => (
                <MatchCard key={m.id} match={m}>
                  <Button className="flex-1 rounded-full" asChild>
                    <Link to="/messages" search={{ match: m.id }}>
                      <MessageCircle className="mr-1 size-4" /> Mesaj
                      {Number(m.unread_count) > 0 ? ` (${m.unread_count})` : ""}
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full text-muted-foreground hover:text-destructive"
                    title="Engelle"
                    onClick={() => {
                      if (window.confirm(`${m.other_user_name} engellensin mi?`)) {
                        block.mutate(m.other_user_id);
                      }
                    }}
                  >
                    <Ban className="size-4" />
                  </Button>
                </MatchCard>
              ))}
            </Section>
          )}

          {outgoing.length > 0 && (
            <Section title="Gönderilen istekler" subtitle="Yanıt bekleniyor">
              {outgoing.map((m) => (
                <MatchCard key={m.id} match={m}>
                  <Badge variant="secondary" className="rounded-full">
                    <Clock className="mr-1 size-3" /> Yanıt bekleniyor
                  </Badge>
                </MatchCard>
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
      <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">{children}</div>
    </section>
  );
}

function MatchCard({ match: m, children }: { match: Match; children: React.ReactNode }) {
  return (
    <Card className="group relative overflow-hidden rounded-3xl border-border/60 p-6 transition hover:border-primary/40 hover:shadow-sm">
      <div className="absolute right-5 top-5 flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
        <Sparkles className="size-3" /> {m.type_name}
      </div>

      <div className="flex items-center gap-4">
        <Avatar className="size-14 border-2 border-background shadow-sm">
          <AvatarFallback className="bg-accent/60 font-display text-lg font-semibold text-accent-foreground">
            {initialsOf(m.other_user_name)}
          </AvatarFallback>
        </Avatar>
        <div className="leading-tight">
          <div className="font-display text-lg font-semibold">{m.other_user_name}</div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="size-3" /> {m.other_neighborhood}
          </div>
        </div>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        “{m.type_name}” alışkanlığında seninle aynı ritmi tutturuyor.
      </p>

      <div className="mt-5 flex items-center gap-2">{children}</div>
    </Card>
  );
}
