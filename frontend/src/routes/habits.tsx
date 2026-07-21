import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Flame, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { api, type ActivityType, type Habit, type HabitLog } from "@/lib/api";
import { iconFor } from "@/lib/habit-icons";

export const Route = createFileRoute("/habits")({
  head: () => ({
    meta: [
      { title: "Alışkanlıklar · HabitMeet" },
      { name: "description", content: "Tüm alışkanlıkların, serileri ve haftalık grafikler." },
    ],
  }),
  component: HabitsPage,
});

function HabitsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [typeSel, setTypeSel] = useState("");
  const [newType, setNewType] = useState("");

  const habitsQ = useQuery({
    queryKey: ["habits"],
    queryFn: () => api<Habit[]>("/api/habits"),
  });
  const typesQ = useQuery({
    queryKey: ["types"],
    queryFn: () => api<ActivityType[]>("/api/activity-types"),
  });

  const habits = habitsQ.data ?? [];
  const habitKey = habits.map((h) => h.id).join("-");

  // Son 7 gün: her alışkanlık için gün gün tamamlanma durumu (bugün dahil)
  const last7Days = Array.from({ length: 7 }, (_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - idx));
    return d.toISOString().slice(0, 10);
  });
  const dayLabels = last7Days.map((day) =>
    new Date(`${day}T12:00:00`).toLocaleDateString("tr-TR", { weekday: "short" }),
  );
  const weekQ = useQuery({
    queryKey: ["habitWeek", habitKey],
    enabled: habits.length > 0,
    queryFn: async () => {
      const all = await Promise.all(
        habits.map((h) => api<{ logs: HabitLog[] }>(`/api/habits/${h.id}/logs`)),
      );
      const map: Record<number, boolean[]> = {};
      habits.forEach((h, i) => {
        const doneSet = new Set(
          all[i].logs.filter((l) => l.completed).map((l) => l.date),
        );
        map[h.id] = last7Days.map((day) => doneSet.has(day));
      });
      return map;
    },
  });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["habits"] });
    qc.invalidateQueries({ queryKey: ["stats"] });
    qc.invalidateQueries({ queryKey: ["matches"] });
    qc.invalidateQueries({ queryKey: ["weekLogs"] });
    qc.invalidateQueries({ queryKey: ["habitWeek"] });
  };

  const createHabit = useMutation({
    mutationFn: () =>
      api<Habit>("/api/habits", {
        method: "POST",
        body: { name, typeId: typeSel ? Number(typeSel) : undefined },
      }),
    onSuccess: () => {
      toast.success("Alışkanlık eklendi. Bugünü işaretlemeyi unutma!");
      setName("");
      setTypeSel("");
      setOpen(false);
      invalidateAll();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const suggestType = useMutation({
    mutationFn: () =>
      api<ActivityType>("/api/activity-types", { method: "POST", body: { name: newType } }),
    onSuccess: (t) => {
      if (t.is_approved) {
        toast.success("Aktivite tipi eklendi ve kullanıma hazır.");
      } else {
        toast.success(
          "Tip önerin alındı, admin onayı bekliyor. Sen hemen kullanabilirsin; onaylanınca herkese açılır.",
        );
      }
      setNewType("");
      qc.invalidateQueries({ queryKey: ["types"] });
    },
    onError: (e: Error) => toast.error(e.message),
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
      invalidateAll();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delHabit = useMutation({
    mutationFn: (id: number) => api(`/api/habits/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Alışkanlık silindi.");
      invalidateAll();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const doneToday = habits.filter((h) => h.loggedToday).length;
  const types = typesQ.data ?? [];

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Alışkanlıklar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {habits.length} aktif alışkanlık · Bugün {doneToday}/{habits.length || 0} tamamlandı
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full">
              <Plus className="mr-1 size-4" /> Yeni alışkanlık
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">Yeni alışkanlık</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="habit-name">Alışkanlık adı</Label>
                <Input
                  id="habit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Örn. Sabah koşusu"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Aktivite tipi</Label>
                <Select value={typeSel} onValueChange={setTypeSel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tip seç (eşleşme için önemli)" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {types.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.name}
                        {t.is_approved ? "" : " (onay bekliyor)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Aynı ilçede aynı tipte seri yapan kullanıcılarla otomatik eşleşirsin.
                </p>
              </div>
              <div className="rounded-2xl bg-secondary/40 p-3.5">
                <Label className="text-xs">Listede yok mu? Yeni tip öner</Label>
                <div className="mt-2 flex gap-2">
                  <Input
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    placeholder="Örn. Satranç"
                    className="h-9"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-full"
                    disabled={!newType.trim() || suggestType.isPending}
                    onClick={() => suggestType.mutate()}
                  >
                    Öner
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                className="w-full rounded-full"
                disabled={name.trim().length < 2 || createHabit.isPending}
                onClick={() => createHabit.mutate()}
              >
                {createHabit.isPending ? "Ekleniyor…" : "Ekle"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {habitsQ.isLoading ? (
        <p className="mt-8 text-sm text-muted-foreground">Yükleniyor…</p>
      ) : habits.length === 0 ? (
        <Card className="mt-8 rounded-3xl border-border/60 p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Henüz alışkanlığın yok. “Yeni alışkanlık” ile ilkini ekle — her gün işaretledikçe
            serin büyür, aynı ilçedeki komşularla eşleşirsin.
          </p>
        </Card>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {habits.map((h) => {
            const Icon = iconFor(h.type_name ?? h.name);
            const weekDays = weekQ.data?.[h.id] ?? Array.from({ length: 7 }, () => false);
            const week = weekDays.filter(Boolean).length;
            return (
              <Card
                key={h.id}
                className="group rounded-3xl border-border/60 p-5 transition hover:border-primary/40 hover:shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="grid size-12 place-items-center rounded-2xl bg-accent/50 text-accent-foreground transition group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="size-5" />
                  </div>
                  <Badge variant="secondary" className="rounded-full text-[10px] uppercase tracking-wider">
                    {h.type_name ?? "Genel"}
                  </Badge>
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{h.name}</h3>

                <div className="mt-4 flex items-baseline gap-2">
                  <Flame className="size-4 text-primary" />
                  <span className="font-display text-3xl font-semibold leading-none">{h.streak}</span>
                  <span className="text-sm text-muted-foreground">gün seri</span>
                </div>

                <div className="mt-4 flex gap-1">
                  {last7Days.map((day, i) => (
                    <div key={day} className="flex flex-1 flex-col items-center gap-1">
                      <div
                        className={`h-8 w-full rounded-md ${weekDays[i] ? "bg-primary" : "bg-secondary"} ${i === 6 ? "ring-1 ring-primary/40" : ""}`}
                        title={day}
                      />
                      <span className="text-[10px] text-muted-foreground">{dayLabels[i]}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                  <span>Bu hafta {week}/7</span>
                  <span>{h.loggedToday ? "Bugün tamamlandı ✓" : "Bugün henüz işaretlenmedi"}</span>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  {h.loggedToday ? (
                    <Button variant="secondary" className="flex-1 rounded-full" disabled>
                      <Check className="mr-1 size-4" /> Bugün tamamlandı
                    </Button>
                  ) : (
                    <Button
                      className="flex-1 rounded-full"
                      disabled={logHabit.isPending}
                      onClick={() => logHabit.mutate(h.id)}
                    >
                      <Check className="mr-1 size-4" /> Bugünü işaretle
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-muted-foreground hover:text-destructive"
                    title="Alışkanlığı sil"
                    onClick={() => {
                      if (window.confirm(`"${h.name}" silinsin mi? Logları da silinir.`)) {
                        delHabit.mutate(h.id);
                      }
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
