import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Users,
  Flag,
  ShieldCheck,
  ScrollText,
  LayoutDashboard,
  Ban,
  CheckCircle2,
  XCircle,
  Search,
  Sparkles,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api, parseDbDate } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

// ---- Backend yanıt tipleri ----
type Overview = {
  totals: {
    users: number;
    habits: number;
    logs: number;
    matches: number;
    forumPosts: number;
    messages: number;
  };
  signupsLast7Days: number;
  usersByNeighborhood: Array<{ neighborhood: string; user_count: number }>;
  popularTypes: Array<{ name: string; habit_count: number }>;
  pendingReports: number;
};

type AdminUser = {
  id: number;
  name: string;
  email: string;
  neighborhood: string;
  role: "user" | "moderator" | "admin";
  is_banned: number;
  ban_reason: string | null;
  deleted_at: string | null;
  created_at: string;
};

type AdminReport = {
  id: number;
  reporter_id: number;
  reporter_name: string;
  target_type: string;
  target_id: number;
  reason: string;
  status: "pending" | "resolved" | "dismissed";
  created_at: string;
};

type PendingType = {
  id: number;
  name: string;
  creator_name: string | null;
};

type AdminLog = {
  id: number;
  admin_name: string;
  action: string;
  target_type: string | null;
  target_id: number | null;
  detail: string | null;
  created_at: string;
};

const TARGET_LABELS: Record<string, string> = {
  user: "Kullanıcı",
  forum_post: "Forum ilanı",
  forum_comment: "Forum yorumu",
  message: "Mesaj",
};

const ACTION_LABELS: Record<string, string> = {
  ban_user: "Kullanıcı askıya alındı",
  unban_user: "Askı kaldırıldı",
  resolve_report: "Şikayet çözüldü",
  dismiss_report: "Şikayet reddedildi",
  approve_type: "Aktivite tipi onaylandı",
};

function fmtDate(s: string | null) {
  if (!s) return "-";
  return parseDbDate(s).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function AdminPage() {
  const navigate = useNavigate();
  const { ready, user } = useAuth();
  const isStaff = user?.role === "admin" || user?.role === "moderator";
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (ready && user && !isStaff) {
      navigate({ to: "/" });
    }
  }, [ready, user, isStaff, navigate]);

  if (!ready || !user || !isStaff) return null;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Yönetim Paneli
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isAdmin
            ? "İstatistikler, kullanıcılar, şikayetler, tip onayları ve denetim kayıtları."
            : "Kullanıcı yönetimi ve şikayet kuyruğu (moderatör yetkisi)."}
        </p>
      </div>

      <Tabs defaultValue={isAdmin ? "overview" : "users"}>
        <TabsList className="mb-4 flex-wrap">
          {isAdmin && (
            <TabsTrigger value="overview">
              <LayoutDashboard className="mr-1.5 size-4" /> Genel Bakış
            </TabsTrigger>
          )}
          <TabsTrigger value="users">
            <Users className="mr-1.5 size-4" /> Kullanıcılar
          </TabsTrigger>
          <TabsTrigger value="reports">
            <Flag className="mr-1.5 size-4" /> Şikayetler
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="types">
              <ShieldCheck className="mr-1.5 size-4" /> Tip Onayı
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="logs">
              <ScrollText className="mr-1.5 size-4" /> Denetim Kayıtları
            </TabsTrigger>
          )}
        </TabsList>

        {isAdmin && (
          <TabsContent value="overview">
            <OverviewTab />
          </TabsContent>
        )}
        <TabsContent value="users">
          <UsersTab />
        </TabsContent>
        <TabsContent value="reports">
          <ReportsTab />
        </TabsContent>
        {isAdmin && (
          <TabsContent value="types">
            <TypesTab />
          </TabsContent>
        )}
        {isAdmin && (
          <TabsContent value="logs">
            <LogsTab />
          </TabsContent>
        )}
      </Tabs>
    </main>
  );
}

// ---------------- Genel Bakış ----------------
function OverviewTab() {
  const q = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: () => api<Overview>("/api/admin/stats"),
  });

  if (q.isLoading)
    return <p className="text-sm text-muted-foreground">Yükleniyor…</p>;
  if (!q.data) return null;
  const d = q.data;

  const cards = [
    { label: "Kullanıcı", value: d.totals.users },
    { label: "Alışkanlık", value: d.totals.habits },
    { label: "Tamamlanan log", value: d.totals.logs },
    { label: "Eşleşme", value: d.totals.matches },
    { label: "Forum ilanı", value: d.totals.forumPosts },
    { label: "Mesaj", value: d.totals.messages },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <Card key={c.label} className="rounded-2xl">
            <CardContent className="p-4">
              <div className="font-display text-2xl font-semibold">{c.value}</div>
              <div className="text-xs text-muted-foreground">{c.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Son 7 günde kayıt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-display text-3xl font-semibold text-primary">
              {d.signupsLast7Days}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Bekleyen şikayet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-display text-3xl font-semibold text-destructive">
              {d.pendingReports}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Popüler aktiviteler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {d.popularTypes.slice(0, 5).map((t) => (
              <div key={t.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-primary" /> {t.name}
                </span>
                <Badge variant="secondary">{t.habit_count}</Badge>
              </div>
            ))}
            {d.popularTypes.length === 0 && (
              <p className="text-xs text-muted-foreground">Henüz veri yok.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">İlçelere göre kullanıcılar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {d.usersByNeighborhood.map((n) => (
              <Badge key={n.neighborhood} variant="outline" className="rounded-full">
                {n.neighborhood} · {n.user_count}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------- Kullanıcılar ----------------
function UsersTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [banTarget, setBanTarget] = useState<AdminUser | null>(null);
  const [banReason, setBanReason] = useState("");

  const q = useQuery({
    queryKey: ["admin", "users", query, page],
    queryFn: () =>
      api<AdminUser[]>(
        `/api/admin/users?search=${encodeURIComponent(query)}&page=${page}`,
      ),
  });

  const ban = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      api<{ message: string }>(`/api/admin/users/${id}/ban`, {
        method: "POST",
        body: { reason },
      }),
    onSuccess: (r) => {
      toast.success(r.message);
      setBanTarget(null);
      setBanReason("");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const unban = useMutation({
    mutationFn: (id: number) =>
      api<{ message: string }>(`/api/admin/users/${id}/unban`, { method: "POST" }),
    onSuccess: (r) => {
      toast.success(r.message);
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const users = q.data ?? [];

  return (
    <div className="space-y-4">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setQuery(search);
        }}
      >
        <Input
          placeholder="İsim veya e-posta ara…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Button type="submit" variant="secondary">
          <Search className="mr-1.5 size-4" /> Ara
        </Button>
      </form>

      <Card className="rounded-2xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kullanıcı</TableHead>
                <TableHead>İlçe</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Kayıt</TableHead>
                <TableHead className="text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="font-medium">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </TableCell>
                  <TableCell>{u.neighborhood}</TableCell>
                  <TableCell>
                    <Badge
                      variant={u.role === "user" ? "secondary" : "default"}
                      className="capitalize"
                    >
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {u.deleted_at ? (
                      <Badge variant="outline">Silinmiş</Badge>
                    ) : u.is_banned ? (
                      <Badge variant="destructive" title={u.ban_reason ?? ""}>
                        Askıda
                      </Badge>
                    ) : (
                      <Badge className="bg-primary/15 text-primary hover:bg-primary/15">
                        Aktif
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {fmtDate(u.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    {u.role !== "admin" && !u.deleted_at && (
                      u.is_banned ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => unban.mutate(u.id)}
                          disabled={unban.isPending}
                        >
                          <CheckCircle2 className="mr-1 size-3.5" /> Askıyı kaldır
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setBanTarget(u)}
                        >
                          <Ban className="mr-1 size-3.5" /> Askıya al
                        </Button>
                      )
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && !q.isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    Kullanıcı bulunamadı.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Önceki
        </Button>
        <span className="text-sm text-muted-foreground">Sayfa {page}</span>
        <Button
          size="sm"
          variant="outline"
          disabled={users.length < 20}
          onClick={() => setPage((p) => p + 1)}
        >
          Sonraki
        </Button>
      </div>

      <Dialog open={Boolean(banTarget)} onOpenChange={(o) => !o && setBanTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kullanıcıyı askıya al</DialogTitle>
            <DialogDescription>
              <strong>{banTarget?.name}</strong> askıya alınacak. Kullanıcı giriş
              yapamayacak.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Gerekçe (örn. kural ihlali)…"
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanTarget(null)}>
              Vazgeç
            </Button>
            <Button
              variant="destructive"
              disabled={ban.isPending}
              onClick={() =>
                banTarget &&
                ban.mutate({ id: banTarget.id, reason: banReason.trim() || "Kural ihlali" })
              }
            >
              Askıya al
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------- Şikayetler ----------------
function ReportsTab() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<"pending" | "resolved" | "dismissed">("pending");

  const q = useQuery({
    queryKey: ["admin", "reports", status],
    queryFn: () => api<AdminReport[]>(`/api/admin/reports?status=${status}`),
  });

  const resolve = useMutation({
    mutationFn: ({ id, s }: { id: number; s: "resolved" | "dismissed" }) =>
      api<{ message: string }>(`/api/admin/reports/${id}/resolve`, {
        method: "POST",
        body: { status: s },
      }),
    onSuccess: (r) => {
      toast.success(r.message);
      qc.invalidateQueries({ queryKey: ["admin", "reports"] });
      qc.invalidateQueries({ queryKey: ["admin", "overview"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reports = q.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(
          [
            ["pending", "Bekleyen"],
            ["resolved", "Çözülen"],
            ["dismissed", "Reddedilen"],
          ] as const
        ).map(([val, label]) => (
          <Button
            key={val}
            size="sm"
            variant={status === val ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setStatus(val)}
          >
            {label}
          </Button>
        ))}
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Hedef</TableHead>
                <TableHead>Gerekçe</TableHead>
                <TableHead>Şikayet eden</TableHead>
                <TableHead>Tarih</TableHead>
                {status === "pending" && (
                  <TableHead className="text-right">İşlem</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-muted-foreground">{r.id}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {TARGET_LABELS[r.target_type] ?? r.target_type} #{r.target_id}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <span className="line-clamp-2 text-sm">{r.reason}</span>
                  </TableCell>
                  <TableCell className="text-sm">{r.reporter_name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {fmtDate(r.created_at)}
                  </TableCell>
                  {status === "pending" && (
                    <TableCell className="space-x-1.5 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={resolve.isPending}
                        onClick={() => resolve.mutate({ id: r.id, s: "resolved" })}
                      >
                        <CheckCircle2 className="mr-1 size-3.5" /> Çözüldü
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={resolve.isPending}
                        onClick={() => resolve.mutate({ id: r.id, s: "dismissed" })}
                      >
                        <XCircle className="mr-1 size-3.5" /> Reddet
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {reports.length === 0 && !q.isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={status === "pending" ? 6 : 5}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    Bu durumda şikayet yok. 🎉
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------- Tip Onayı ----------------
function TypesTab() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin", "pendingTypes"],
    queryFn: () => api<PendingType[]>("/api/admin/activity-types/pending"),
  });

  const approve = useMutation({
    mutationFn: (id: number) =>
      api<{ message: string }>(`/api/admin/activity-types/${id}/approve`, {
        method: "POST",
      }),
    onSuccess: (r) => {
      toast.success(r.message);
      qc.invalidateQueries({ queryKey: ["admin", "pendingTypes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const types = q.data ?? [];

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tip adı</TableHead>
              <TableHead>Öneren</TableHead>
              <TableHead className="text-right">İşlem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {types.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {t.creator_name ?? "-"}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    disabled={approve.isPending}
                    onClick={() => approve.mutate(t.id)}
                  >
                    <CheckCircle2 className="mr-1 size-3.5" /> Onayla
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {types.length === 0 && !q.isLoading && (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                  Onay bekleyen aktivite tipi yok.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ---------------- Denetim Kayıtları ----------------
function LogsTab() {
  const q = useQuery({
    queryKey: ["admin", "logs"],
    queryFn: () => api<AdminLog[]>("/api/admin/logs"),
  });

  const logs = q.data ?? [];

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tarih</TableHead>
              <TableHead>Yönetici</TableHead>
              <TableHead>İşlem</TableHead>
              <TableHead>Hedef</TableHead>
              <TableHead>Detay</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="text-xs text-muted-foreground">
                  {fmtDate(l.created_at)}
                </TableCell>
                <TableCell className="text-sm font-medium">{l.admin_name}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {ACTION_LABELS[l.action] ?? l.action}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {l.target_type ? `${l.target_type} #${l.target_id}` : "-"}
                </TableCell>
                <TableCell className="max-w-xs">
                  <span className="line-clamp-1 text-sm text-muted-foreground">
                    {l.detail ?? "-"}
                  </span>
                </TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && !q.isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                  Henüz denetim kaydı yok.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
