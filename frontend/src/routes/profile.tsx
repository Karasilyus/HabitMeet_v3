import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MapPin,
  Flame,
  Sparkles,
  LogOut,
  Award,
  Calendar,
  Moon,
  Ban,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  api,
  clearSession,
  getToken,
  setSession,
  initialsOf,
  parseDbDate,
  type BlockedUser,
  type Habit,
  type HabitLog,
  type SleepLog,
  type Stats,
  type User,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { iconFor } from "@/lib/habit-icons";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profil · HabitMeet" },
      { name: "description", content: "Alışkanlıkların, rozetlerin ve hesap ayarların." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const [authVer, setAuthVer] = useState(0);
  const { user } = useAuth(authVer);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [sleepHours, setSleepHours] = useState("");

  const statsQ = useQuery({ queryKey: ["stats"], queryFn: () => api<Stats>("/api/stats") });
  const habitsQ = useQuery({ queryKey: ["habits"], queryFn: () => api<Habit[]>("/api/habits") });
  const sleepQ = useQuery({ queryKey: ["sleep"], queryFn: () => api<SleepLog[]>("/api/sleep") });
  const blocksQ = useQuery({
    queryKey: ["blocks"],
    queryFn: () => api<BlockedUser[]>("/api/blocks"),
  });

  // Semt değişikliği
  const [hood, setHood] = useState("");
  const hoodsQ = useQuery({
    queryKey: ["neighborhoods"],
    queryFn: () => api<string[]>("/api/meta/neighborhoods"),
  });
  const updateHood = useMutation({
    mutationFn: () =>
      api<{ user: User }>("/api/auth/me", {
        method: "PUT",
        body: { neighborhood: hood },
      }),
    onSuccess: (r) => {
      setSession(getToken()!, r.user);
      setAuthVer((v) => v + 1);
      setHood("");
      toast.success(
        `Semtin güncellendi: ${r.user.neighborhood}. Yeni eşleşmeler bu ilçeden önerilecek.`,
      );
      qc.invalidateQueries({ queryKey: ["matches"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const habits = habitsQ.data ?? [];
  const habitKey = habits.map((h) => h.id).join("-");

  // Son 12 hafta ısı haritası: gün -> tamamlanan alışkanlık sayısı
  const heatQ = useQuery({
    queryKey: ["heatmap", habitKey],
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
      const days: number[] = [];
      let activeDays = 0;
      for (let i = 12 * 7 - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const c = counts.get(d.toISOString().slice(0, 10)) ?? 0;
        if (c > 0) activeDays++;
        days.push(c);
      }
      return { days, activeDays };
    },
  });

  const addSleep = useMutation({
    mutationFn: () =>
      api("/api/sleep", {
        method: "POST",
        body: { date: new Date().toISOString().slice(0, 10), hours: Number(sleepHours) },
      }),
    onSuccess: () => {
      toast.success("Uyku kaydı eklendi.");
      setSleepHours("");
      qc.invalidateQueries({ queryKey: ["sleep"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const unblock = useMutation({
    mutationFn: (userId: number) => api(`/api/blocks/${userId}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Engel kaldırıldı.");
      qc.invalidateQueries({ queryKey: ["blocks"] });
      qc.invalidateQueries({ queryKey: ["matches"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteAccount = useMutation({
    mutationFn: () => api("/api/auth/me", { method: "DELETE" }),
    onSuccess: () => {
      clearSession();
      qc.clear();
      toast.success("Hesabın ve kişisel verilerin silindi.");
      navigate({ to: "/login" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const logout = () => {
    clearSession();
    qc.clear();
    navigate({ to: "/login" });
  };

  const stats = statsQ.data;
  const best = stats?.bestCurrentStreak ?? 0;

  const badges = [
    best >= 3 && { name: `${best} Gün Seri`, icon: Flame },
    (stats?.totalCompletedLogs ?? 0) >= 10 && { name: "İstikrarlı", icon: Sparkles },
    (stats?.acceptedMatches ?? 0) >= 1 && { name: "Sosyal Kelebek", icon: Award },
    habits.length >= 3 && { name: "Çok Yönlü", icon: MapPin },
  ].filter(Boolean) as { name: string; icon: typeof Flame }[];

  const memberSince = user?.created_at
    ? parseDbDate(String(user.created_at)).toLocaleDateString("tr-TR", {
        month: "long",
        year: "numeric",
      })
    : null;

  const heat = heatQ.data?.days ?? Array.from({ length: 12 * 7 }, () => 0);
  const maxHeat = Math.max(1, habits.length);

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
      {/* Header */}
      <Card className="overflow-hidden rounded-3xl border-border/60">
        <div className="h-32 bg-gradient-to-br from-primary/25 via-accent/60 to-primary/10" />
        <div className="relative px-6 pb-6">
          <div className="-mt-12 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <Avatar className="size-24 border-4 border-card shadow-md">
                <AvatarFallback className="bg-primary/15 font-display text-2xl font-semibold text-primary">
                  {initialsOf(user?.name ?? "?")}
                </AvatarFallback>
              </Avatar>
              <div className="pb-1 leading-tight">
                <h1 className="font-display text-2xl font-semibold tracking-tight">
                  {user?.name}
                </h1>
                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="size-3.5" /> {user?.neighborhood}
                  {memberSince && (
                    <>
                      <span className="text-border">·</span>
                      <Calendar className="size-3.5" /> {memberSince}'den beri
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2 pb-1">
              <Button variant="outline" className="rounded-full" onClick={logout}>
                <LogOut className="mr-1 size-4" /> Çıkış yap
              </Button>
            </div>
          </div>

          <p className="mt-4 max-w-xl text-sm text-muted-foreground">{user?.email}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Semtini değiştir:</span>
            <Select value={hood} onValueChange={setHood}>
              <SelectTrigger className="h-9 w-52 rounded-full">
                <SelectValue placeholder={user?.neighborhood ?? "İlçe seç"} />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {(hoodsQ.data ?? []).map((n) => (
                  <SelectItem key={n} value={n}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              className="rounded-full"
              disabled={!hood || hood === user?.neighborhood || updateHood.isPending}
              onClick={() => updateHood.mutate()}
            >
              Kaydet
            </Button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Aktif seri" value={String(best)} hint="gün" />
            <Stat label="Toplam alışkanlık" value={String(stats?.totalHabits ?? habits.length)} />
            <Stat label="Tamamlanan gün" value={String(stats?.totalCompletedLogs ?? 0)} />
            <Stat label="Eşleşme" value={String(stats?.acceptedMatches ?? 0)} />
          </div>
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Heatmap + habits */}
        <div className="space-y-6">
          <Card className="rounded-3xl border-border/60 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold">Son 12 hafta</h2>
                <p className="text-sm text-muted-foreground">
                  Her kare bir gün · koyuluk tamamlanan alışkanlık sayısı
                </p>
              </div>
              <Badge variant="secondary" className="rounded-full">
                {heatQ.data?.activeDays ?? 0} gün aktif
              </Badge>
            </div>
            <div className="mt-5 flex gap-1 overflow-x-auto">
              {Array.from({ length: 12 }).map((_, w) => (
                <div key={w} className="flex flex-col gap-1">
                  {Array.from({ length: 7 }).map((_, d) => {
                    const v = heat[w * 7 + d] ?? 0;
                    const ratio = v / maxHeat;
                    const bg =
                      v === 0
                        ? "bg-secondary"
                        : ratio <= 0.34
                          ? "bg-primary/30"
                          : ratio <= 0.67
                            ? "bg-primary/60"
                            : "bg-primary";
                    return <div key={d} className={`size-4 rounded-sm ${bg}`} />;
                  })}
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground">
              Az
              <div className="size-3 rounded-sm bg-secondary" />
              <div className="size-3 rounded-sm bg-primary/30" />
              <div className="size-3 rounded-sm bg-primary/60" />
              <div className="size-3 rounded-sm bg-primary" />
              Çok
            </div>
          </Card>

          <Card className="rounded-3xl border-border/60 p-6">
            <h2 className="font-display text-lg font-semibold">Aktif alışkanlıklar</h2>
            {habits.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">Henüz alışkanlık eklemedin.</p>
            ) : (
              <ul className="mt-4 divide-y divide-border/60">
                {habits.map((h) => {
                  const Icon = iconFor(h.type_name ?? h.name);
                  return (
                    <li key={h.id} className="flex items-center gap-4 py-3">
                      <div className="grid size-10 place-items-center rounded-xl bg-accent/50 text-accent-foreground">
                        <Icon className="size-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{h.name}</div>
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

          {/* Uyku takibi */}
          <Card className="rounded-3xl border-border/60 p-6">
            <div className="flex items-center gap-2">
              <Moon className="size-4 text-primary" />
              <h2 className="font-display text-lg font-semibold">Uyku takibi</h2>
            </div>
            <form
              className="mt-4 flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const h = Number(sleepHours);
                if (h > 0 && h <= 24) addSleep.mutate();
                else toast.error("0-24 arası bir saat gir.");
              }}
            >
              <Input
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={sleepHours}
                onChange={(e) => setSleepHours(e.target.value)}
                placeholder="Dün gece kaç saat uyudun?"
                className="h-10 rounded-full bg-secondary/40"
              />
              <Button
                type="submit"
                className="rounded-full"
                disabled={!sleepHours || addSleep.isPending}
              >
                Kaydet
              </Button>
            </form>
            {(sleepQ.data ?? []).length > 0 && (
              <ul className="mt-4 space-y-1.5">
                {(sleepQ.data ?? []).slice(0, 5).map((s) => (
                  <li
                    key={s.date}
                    className="flex items-center justify-between rounded-xl bg-secondary/30 px-3.5 py-2 text-sm"
                  >
                    <span className="text-muted-foreground">{s.date}</span>
                    <span className="font-medium">{s.hours} saat</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          <Card className="rounded-3xl border-border/60 p-5">
            <div className="flex items-center gap-2">
              <Award className="size-4 text-primary" />
              <h3 className="font-display text-base font-semibold">Rozetler</h3>
            </div>
            {badges.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Seri yaptıkça rozetler burada birikecek.
              </p>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3">
                {badges.map((b) => (
                  <div
                    key={b.name}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-secondary/30 p-4 text-center"
                  >
                    <div className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
                      <b.icon className="size-4.5" />
                    </div>
                    <div className="text-[11px] font-medium leading-tight">{b.name}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="rounded-3xl border-border/60 p-5">
            <div className="flex items-center gap-2">
              <Ban className="size-4 text-muted-foreground" />
              <h3 className="font-display text-base font-semibold">Engellenenler</h3>
            </div>
            {(blocksQ.data ?? []).length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Engellediğin kimse yok.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {(blocksQ.data ?? []).map((b) => (
                  <li key={b.blocked_id} className="flex items-center justify-between text-sm">
                    <span>{b.blocked_name}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 rounded-full text-xs"
                      onClick={() => unblock.mutate(b.blocked_id)}
                    >
                      Engeli kaldır
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="rounded-3xl border-destructive/30 p-5">
            <h3 className="font-display text-base font-semibold text-destructive">
              Tehlikeli bölge
            </h3>
            <p className="mt-2 text-xs text-muted-foreground">
              Hesabını silersen tüm alışkanlıkların, eşleşmelerin ve mesajların kalıcı olarak
              anonimleştirilir (KVKK).
            </p>
            <Button
              variant="outline"
              className="mt-4 w-full rounded-full border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => {
                if (
                  window.confirm(
                    "Hesabın kalıcı olarak silinecek. Bu işlem geri alınamaz. Emin misin?",
                  )
                ) {
                  deleteAccount.mutate();
                }
              }}
              disabled={deleteAccount.isPending}
            >
              <Trash2 className="mr-1 size-4" /> Hesabı sil
            </Button>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-secondary/40 p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-semibold leading-none">
        {value}
        {hint && <span className="ml-1 text-xs font-normal text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}
