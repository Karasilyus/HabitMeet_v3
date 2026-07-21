import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Flame,
  Check,
  MapPin,
  ArrowRight,
  Sparkles,
  CalendarCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  api,
  initialsOf,
  type Habit,
  type HabitLog,
  type Match,
  type Stats,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { iconFor } from "@/lib/habit-icons";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bugün · HabitMeet" },
      {
        name: "description",
        content: "Bugünkü alışkanlıkların, serilerin ve semtinden yeni eşleşmeler.",
      },
    ],
  }),
  component: TodayPage,
});

const DAY_NAMES = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

function TodayPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const habitsQ = useQuery({
    queryKey: ["habits"],
    queryFn: () => api<Habit[]>("/api/habits"),
  });
  const statsQ = useQuery({
    queryKey: ["stats"],
    queryFn: () => api<Stats>("/api/stats"),
  });
  const matchesQ = useQuery({
    queryKey: ["matches"],
    queryFn: () => api<Match[]>("/api/matches"),
  });

  const habits = habitsQ.data ?? [];
  const habitKey = habits.map((h) => h.id).join("-");

  const weekQ = useQuery({
    queryKey: ["weekLogs", habitKey],
    enabled: habits.length > 0,
    queryFn: async () => {
      const all = await Promise.all(
        habits.map((h) => api<{ logs: HabitLog[] }>(`/api/habits/${h.id}/logs`)),
      );
      const counts = new Map<string, number>();
      for (const { logs } of all) {
        for (const l of logs) {
          if (l.completed === 1 || (l.completed as unknown) === true) {
            counts.set(l.date, (counts.get(l.date) ?? 0) + 1);
          }
        }
      }
      const days: { label: string; count: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        days.push({ label: DAY_NAMES[d.getDay()], count: counts.get(key) ?? 0 });
      }
      return days;
    },
  });

  const logHabit = useMutation({
    mutationFn: (id: number) =>
      api<{ streak: number; newMatchCount: number }>(`/api/habits/${id}/log`, {
        method: "POST",
        body: {},
      }),
    onSuccess: (r) => {
      toast.success(
        `İşaretlendi! Seri: ${r.streak} gün` +
          (r.newMatchCount > 0 ? ` · ${r.newMatchCount} yeni eşleşme önerisi 🎉` : ""),
      );
      qc.invalidateQueries({ queryKey: ["habits"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["matches"] });
      qc.invalidateQueries({ queryKey: ["weekLogs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const done = habits.filter((h) => h.loggedToday).length;
  const total = habits.length;
  const progress = total ? Math.round((done / total) * 100) : 0;
  const stats = statsQ.data;

  const me = user?.id;
  const incoming = (matchesQ.data ?? [])
    .filter((m) => m.status === "pending" && m.requested_by !== me)
    .slice(0, 3);

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Günaydın" : hour < 18 ? "İyi günler" : "İyi akşamlar";
  const firstName = user?.name?.split(" ")[0] ?? "";

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
      {/* Hero */}
      <section className="grain-bg relative overflow-hidden rounded-3xl border border-border/60 bg-card p-8 md:p-10">
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <MapPin className="size-3" /> {user?.neighborhood ?? "İstanbul"} · semt topluluğu
            </div>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              {greet} {firstName}.
              <br />
              <span className="text-primary">
                {total > 0 ? `Bugün ${total} küçük söz` : "Bugün yeni bir başlangıç"}
              </span>{" "}
              {total > 0 ? "verdin." : "seni bekliyor."}
            </h1>
            <p className="mt-3 text-base text-muted-foreground">
              {total > 0
                ? `Küçük ritüeller büyük bir seri oluyor. Bugün ${done} / ${total} tamamlandı.`
                : "İlk alışkanlığını ekle, seri oluşturmaya başla."}
            </p>
          </div>

          <div className="w-full max-w-sm rounded-2xl bg-background/70 p-5 backdrop-blur">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Bugünkü ilerleme</span>
              <span className="font-display text-2xl font-semibold">{progress}%</span>
            </div>
            <Progress value={progress} className="mt-3 h-2 bg-secondary" />
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <StatChip icon={Flame} label="En iyi seri" value={String(stats?.bestCurrentStreak ?? 0)} />
              <StatChip icon={CalendarCheck} label="Tamamlanan" value={String(stats?.totalCompletedLogs ?? 0)} />
              <StatChip icon={Users} label="Eşleşme" value={String(stats?.acceptedMatches ?? 0)} />
            </div>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Habits */}
        <Card className="col-span-2 rounded-3xl border-border/60 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold">Bugünkü alışkanlıkların</h2>
              <p className="text-sm text-muted-foreground">Küçük adımlar, tutarlı ritüel.</p>
            </div>
            <Button variant="ghost" size="sm" className="text-primary" asChild>
              <Link to="/habits">
                Tümü <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </div>

          {habitsQ.isLoading ? (
            <p className="mt-6 text-sm text-muted-foreground">Yükleniyor…</p>
          ) : habits.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-secondary/30 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Henüz alışkanlığın yok. İlkini ekleyerek seriye başla — aynı ilçede aynı
                alışkanlığı yapan komşularla otomatik eşleşirsin.
              </p>
              <Button className="mt-4 rounded-full" asChild>
                <Link to="/habits">İlk alışkanlığını ekle</Link>
              </Button>
            </div>
          ) : (
            <ul className="mt-5 divide-y divide-border/60">
              {habits.map((h) => {
                const Icon = iconFor(h.type_name ?? h.name);
                return (
                  <li key={h.id} className="flex items-center gap-4 py-3.5">
                    <button
                      onClick={() => {
                        if (!h.loggedToday) logHabit.mutate(h.id);
                      }}
                      disabled={logHabit.isPending}
                      title={h.loggedToday ? "Bugün tamamlandı" : "Bugünü işaretle"}
                      className={`grid size-10 shrink-0 place-items-center rounded-xl border transition ${
                        h.loggedToday
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background hover:border-primary/60"
                      }`}
                    >
                      {h.loggedToday ? (
                        <Check className="size-4" />
                      ) : (
                        <Icon className="size-4.5 text-muted-foreground" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="font-medium">{h.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {h.type_name ?? "Genel"}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">
                      <Flame className="size-3 text-primary" />
                      {h.streak}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Suggestions */}
        <Card className="rounded-3xl border-border/60 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold">Gelen istekler</h2>
              <p className="text-sm text-muted-foreground">Aynı ritmi tutturan komşular.</p>
            </div>
          </div>
          {incoming.length === 0 ? (
            <p className="mt-5 text-sm text-muted-foreground">
              Şimdilik yeni istek yok. Alışkanlıklarını işaretlemeye devam et — seri
              tuttukça eşleşme önerileri oluşur.
            </p>
          ) : (
            <ul className="mt-5 space-y-4">
              {incoming.map((m) => (
                <li key={m.id} className="flex items-center gap-3">
                  <Avatar className="size-11">
                    <AvatarFallback className="bg-accent/60 text-sm font-semibold text-accent-foreground">
                      {initialsOf(m.other_user_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 leading-tight">
                    <div className="text-sm font-semibold">{m.other_user_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {m.type_name} · {m.other_neighborhood}
                    </div>
                  </div>
                  <Badge variant="secondary" className="rounded-full text-[10px]">
                    Yeni
                  </Badge>
                </li>
              ))}
            </ul>
          )}
          <Button variant="secondary" className="mt-5 w-full rounded-full" asChild>
            <Link to="/matches">Tüm eşleşmeleri gör</Link>
          </Button>
        </Card>
      </section>

      {/* Week strip */}
      <section className="mt-6 rounded-3xl border border-border/60 bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold">Bu hafta</h2>
            <p className="text-sm text-muted-foreground">
              Her sütun bir gün · yükseklik tamamlanan alışkanlıklar.
            </p>
          </div>
          <Badge variant="secondary" className="rounded-full">
            Son 7 gün
          </Badge>
        </div>
        <div className="mt-6 flex h-40 items-end gap-3">
          {(weekQ.data ?? DAY_NAMES.map((label) => ({ label, count: 0 }))).map((d, i) => {
            const max = Math.max(1, total);
            const pct = Math.max(4, Math.round((d.count / max) * 100));
            return (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className={`w-full rounded-t-lg ${
                    d.count > 0 ? "bg-gradient-to-t from-primary to-accent" : "bg-secondary"
                  }`}
                  style={{ height: `${pct}%` }}
                />
                <span className="text-xs text-muted-foreground">{d.label}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function StatChip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Flame;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-secondary/60 p-2.5">
      <Icon className="mx-auto size-3.5 text-primary" />
      <div className="mt-1 font-display text-base font-semibold leading-none">{value}</div>
      <div className="mt-1 text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}
