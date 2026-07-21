import { useEffect, useRef, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Sprout,
  Users,
  MessageCircle,
  MessagesSquare,
  UserRound,
  Sparkles,
  Flame,
  LogOut,
  NotebookPen,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  api,
  clearSession,
  getToken,
  initialsOf,
  type Match,
  type Stats,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";

const nav = [
  { title: "Bugün", url: "/", icon: Sprout },
  { title: "Alışkanlıklar", url: "/habits", icon: Sparkles },
  { title: "Eşleşmeler", url: "/matches", icon: Users },
  { title: "Mesajlar", url: "/messages", icon: MessageCircle },
  { title: "Forum", url: "/forum", icon: MessagesSquare },
  { title: "Not Defteri", url: "/notes", icon: NotebookPen },
  { title: "Profil", url: "/profile", icon: UserRound },
  { title: "Ayarlar", url: "/settings", icon: Settings },
];

function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth(pathname);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const authed = Boolean(getToken());

  // Rozetler ve seri kartı gerçek verilerden hesaplanır
  const matchesQ = useQuery({
    queryKey: ["matches"],
    queryFn: () => api<Match[]>("/api/matches"),
    enabled: authed,
    refetchInterval: 30000,
  });
  const statsQ = useQuery({
    queryKey: ["stats"],
    queryFn: () => api<Stats>("/api/stats"),
    enabled: authed,
  });

  const me = user?.id;
  const matches = matchesQ.data ?? [];
  const pendingIncoming = matches.filter(
    (m) => m.status === "pending" && m.requested_by !== me,
  ).length;
  const unread = matches
    .filter((m) => m.status === "accepted")
    .reduce((sum, m) => sum + Number(m.unread_count ?? 0), 0);

  const badgeFor = (url: string) =>
    url === "/matches" ? pendingIncoming : url === "/messages" ? unread : 0;

  // Yeni eşleşme isteği / okunmamış mesaj sayısı arttığında ekrana bildirim düşür.
  // İlk yüklemede gösterilmez; yalnızca artış anında gösterilir.
  const prevCounts = useRef<{ pending: number; unread: number } | null>(null);
  useEffect(() => {
    if (!matchesQ.data) return;
    const prev = prevCounts.current;
    if (prev) {
      if (pendingIncoming > prev.pending) {
        toast.info("🤝 Yeni bir eşleşme isteğin var!");
      }
      if (unread > prev.unread && !pathname.startsWith("/messages")) {
        toast.info("💬 Yeni mesajın var.");
      }
    }
    prevCounts.current = { pending: pendingIncoming, unread };
  }, [matchesQ.data, pendingIncoming, unread, pathname]);

  const isStaff = user?.role === "admin" || user?.role === "moderator";
  const items = isStaff
    ? [...nav, { title: "Yönetim", url: "/admin", icon: ShieldCheck }]
    : nav;

  const streak = statsQ.data?.bestCurrentStreak ?? 0;

  const logout = () => {
    clearSession();
    qc.clear();
    navigate({ to: "/login" });
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Sprout className="size-4.5" strokeWidth={2.25} />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="font-display text-base font-semibold tracking-tight">
              HabitMeet
            </span>
            <span className="text-[11px] text-muted-foreground">
              {user?.neighborhood ?? "Semt topluluğu"}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menü</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive =
                  item.url === "/" ? pathname === "/" : pathname.startsWith(item.url);
                const badge = badgeFor(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link to={item.url}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                        {badge > 0 && (
                          <Badge className="ml-auto h-5 min-w-5 justify-center rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground group-data-[collapsible=icon]:hidden">
                            {badge}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto group-data-[collapsible=icon]:hidden">
          <SidebarGroupContent>
            <div className="mx-2 rounded-2xl bg-gradient-to-br from-primary/15 via-accent/40 to-primary/5 p-4">
              <div className="flex items-center gap-2">
                <Flame className="size-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Aktif seri
                </span>
              </div>
              {streak > 0 ? (
                <>
                  <div className="mt-2 font-display text-2xl font-semibold">
                    {streak} gün
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    Harika gidiyorsun, seriyi bozma! 🌱
                  </p>
                </>
              ) : (
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                  Henüz seri yok. Bugün bir alışkanlık işaretleyerek başla!
                </p>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2.5">
          <Avatar className="size-8">
            <AvatarFallback className="bg-accent/60 text-xs font-semibold text-accent-foreground">
              {initialsOf(user?.name ?? "?")}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-medium">{user?.name}</span>
            <span className="truncate text-[11px] text-muted-foreground">
              {user?.email}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-muted-foreground hover:text-destructive group-data-[collapsible=icon]:hidden"
            title="Çıkış yap"
            onClick={logout}
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { ready, user } = useAuth(pathname);
  const navigate = useNavigate();
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/kvkk");

  useEffect(() => {
    if (ready && !user && !isAuthPage) {
      navigate({ to: "/login" });
    }
  }, [ready, user, isAuthPage, navigate]);

  // Giriş ve KVKK sayfaları: kenar çubuğu olmadan sade görünüm
  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur">
          <SidebarTrigger />
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
