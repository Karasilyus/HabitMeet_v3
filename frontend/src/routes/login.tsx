import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Sprout, MapPin } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, setSession, type User } from "@/lib/api";

type Mode = "login" | "register" | "forgot" | "reset";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({
    token: typeof s.token === "string" ? s.token : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Giriş · HabitMeet" },
      { name: "description", content: "HabitMeet hesabına giriş yap veya kayıt ol." },
    ],
  }),
  component: LoginPage,
});

type AuthResponse = { token: string; user: User };

function LoginPage() {
  const navigate = useNavigate();
  const { token: resetToken } = Route.useSearch();
  const [mode, setMode] = useState<Mode>(resetToken ? "reset" : "login");
  const [directToken, setDirectToken] = useState<string | undefined>(undefined);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [kvkk, setKvkk] = useState(false);

  // İlçe listesi (public endpoint)
  const hoodsQ = useQuery({
    queryKey: ["neighborhoods"],
    queryFn: () => api<string[]>("/api/meta/neighborhoods"),
    enabled: mode === "register",
  });

  const finishAuth = (r: AuthResponse) => {
    setSession(r.token, r.user);
    toast.success(`Hoş geldin, ${r.user.name.split(" ")[0]}! 🌱`);
    navigate({ to: "/" });
  };

  const login = useMutation({
    mutationFn: () =>
      api<AuthResponse>("/api/auth/login", { method: "POST", body: { email, password } }),
    onSuccess: finishAuth,
    onError: (e: Error) => toast.error(e.message),
  });

  const register = useMutation({
    mutationFn: () =>
      api<AuthResponse>("/api/auth/register", {
        method: "POST",
        body: { name, email, password, neighborhood, kvkkConsent: true },
      }),
    onSuccess: finishAuth,
    onError: (e: Error) => toast.error(e.message),
  });

  const forgot = useMutation({
    mutationFn: () =>
      api<{ message: string; resetToken?: string }>("/api/auth/forgot-password", {
        method: "POST",
        body: { email },
      }),
    onSuccess: (r) => {
      if (r.resetToken) {
        setDirectToken(r.resetToken);
        setPassword("");
        setMode("reset");
        toast.success("Şimdi yeni şifreni belirleyebilirsin.");
        return;
      }
      toast.success(r.message);
      setMode("login");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reset = useMutation({
    mutationFn: () =>
      api<{ message: string }>("/api/auth/reset-password", {
        method: "POST",
        body: { token: resetToken ?? directToken, password },
      }),
    onSuccess: () => {
      toast.success("Şifren güncellendi. Şimdi giriş yapabilirsin.");
      setPassword("");
      setMode("login");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") login.mutate();
    else if (mode === "register") {
      if (!kvkk) {
        toast.error("Devam etmek için KVKK aydınlatma metnini onaylaman gerekir.");
        return;
      }
      if (!neighborhood) {
        toast.error("Lütfen ilçeni seç.");
        return;
      }
      register.mutate();
    } else if (mode === "forgot") forgot.mutate();
    else reset.mutate();
  };

  const busy =
    login.isPending || register.isPending || forgot.isPending || reset.isPending;

  return (
    <div className="grain-bg flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        {/* Marka */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-md">
            <Sprout className="size-7" strokeWidth={2.25} />
          </div>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">
            HabitMeet
          </h1>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-3.5" /> Semtinden alışkanlık arkadaşını bul
          </p>
        </div>

        <Card className="rounded-3xl border-border/60 p-7">
          <h2 className="font-display text-xl font-semibold">
            {mode === "login" && "Giriş yap"}
            {mode === "register" && "Kayıt ol"}
            {mode === "forgot" && "Şifremi unuttum"}
            {mode === "reset" && "Yeni şifre belirle"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login" && "Serine kaldığın yerden devam et."}
            {mode === "register" && "Bir dakikada hesabını oluştur."}
            {mode === "forgot" && "E-postana bir sıfırlama bağlantısı gönderelim."}
            {mode === "reset" && "Hesabın için yeni bir şifre seç."}
          </p>

          <form className="mt-6 space-y-4" onSubmit={submit}>
            {mode === "register" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Ad Soyad</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Adın Soyadın"
                  required
                />
              </div>
            )}

            {mode !== "reset" && (
              <div className="space-y-1.5">
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@eposta.com"
                  required
                />
              </div>
            )}

            {mode !== "forgot" && (
              <div className="space-y-1.5">
                <Label htmlFor="password">
                  {mode === "reset" ? "Yeni şifre" : "Şifre"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={8}
                  required
                />
                {mode === "register" && (
                  <p className="text-[11px] text-muted-foreground">
                    En az 8 karakter; büyük/küçük harf ve rakam içermeli.
                  </p>
                )}
              </div>
            )}

            {mode === "register" && (
              <>
                <div className="space-y-1.5">
                  <Label>İlçe (İstanbul)</Label>
                  <Select value={neighborhood} onValueChange={setNeighborhood}>
                    <SelectTrigger>
                      <SelectValue placeholder="İlçeni seç" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {(hoodsQ.data ?? []).map((n) => (
                        <SelectItem key={n} value={n}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    Eşleşmeler aynı ilçedeki kullanıcılarla yapılır.
                  </p>
                </div>

                <label className="flex items-start gap-2.5 rounded-2xl bg-secondary/40 p-3.5 text-xs leading-relaxed text-muted-foreground">
                  <Checkbox
                    checked={kvkk}
                    onCheckedChange={(v) => setKvkk(v === true)}
                    className="mt-0.5"
                  />
                  <span>
                    Kişisel verilerimin{" "}
              <a href="/kvkk" target="_blank" rel="noreferrer" className="font-medium text-primary underline">KVKK aydınlatma metni</a>{" "}
              kapsamında, eşleşme ve topluluk özellikleri için işlenmesini kabul ediyorum. Hesabımı istediğim an silebileceğimi biliyorum.
                  </span>
                </label>
              </>
            )}

            <Button type="submit" className="w-full rounded-full" disabled={busy}>
              {busy
                ? "Lütfen bekle…"
                : mode === "login"
                  ? "Giriş yap"
                  : mode === "register"
                    ? "Hesap oluştur"
                    : mode === "forgot"
                      ? "Bağlantı gönder"
                      : "Şifreyi güncelle"}
            </Button>
          </form>

          <div className="mt-5 space-y-1.5 text-center text-sm text-muted-foreground">
            {mode === "login" && (
              <>
                <p>
                  Hesabın yok mu?{" "}
                  <button
                    className="font-medium text-primary hover:underline"
                    onClick={() => setMode("register")}
                  >
                    Kayıt ol
                  </button>
                </p>
                <p>
                  <button
                    className="hover:underline"
                    onClick={() => setMode("forgot")}
                  >
                    Şifremi unuttum
                  </button>
                </p>
              </>
            )}
            {mode !== "login" && (
              <p>
                Zaten hesabın var mı?{" "}
                <button
                  className="font-medium text-primary hover:underline"
                  onClick={() => setMode("login")}
                >
                  Giriş yap
                </button>
              </p>
            )}
          </div>
        </Card>

       
      </div>
    </div>
  );
}
