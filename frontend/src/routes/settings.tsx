import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { KeyRound, Settings, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, getToken, setSession, type User } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Ayarlar · HabitMeet" },
      { name: "description", content: "Hesap ve uygulama ayarların." },
    ],
  }),
  component: SettingsPage,
});

// Şifre kuralları: backend ile birebir aynı doğrulama.
function passwordProblem(pw: string): string | null {
  if (pw.length < 8) return "Şifre en az 8 karakter olmalı.";
  if (!/[a-zçğıöşü]/.test(pw)) return "Şifre en az bir küçük harf içermeli.";
  if (!/[A-ZÇĞİÖŞÜ]/.test(pw)) return "Şifre en az bir büyük harf içermeli.";
  if (!/\d/.test(pw)) return "Şifre en az bir rakam içermeli.";
  return null;
}

function SettingsPage() {
  const [authVer, setAuthVer] = useState(0);
  const { user } = useAuth(authVer);

  const [name, setName] = useState("");
  const [hood, setHood] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");

  const hoodsQ = useQuery({
    queryKey: ["neighborhoods"],
    queryFn: () => api<string[]>("/api/meta/neighborhoods"),
  });

  const saveProfile = useMutation({
    mutationFn: () =>
      api<{ user: User }>("/api/auth/me", {
        method: "PUT",
        body: {
          ...(name.trim() ? { name: name.trim() } : {}),
          ...(hood ? { neighborhood: hood } : {}),
        },
      }),
    onSuccess: (r) => {
      const token = getToken();
      if (token) setSession(token, r.user);
      setAuthVer((v) => v + 1);
      setName("");
      setHood("");
      toast.success("Profil bilgilerin güncellendi.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const changePw = useMutation({
    mutationFn: () =>
      api<{ message: string }>("/api/auth/change-password", {
        method: "POST",
        body: { currentPassword: currentPw, newPassword: newPw },
      }),
    onSuccess: (r) => {
      toast.success(r.message);
      setCurrentPw("");
      setNewPw("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 lg:px-8">
      <div className="flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-2xl bg-accent/50 text-accent-foreground">
          <Settings className="size-5" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Ayarlar</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Hesap bilgilerini ve tercihlerini yönet.
          </p>
        </div>
      </div>

      <Card className="mt-6 rounded-3xl border-border/60 p-6">
        <h2 className="font-display text-lg font-semibold">Profil bilgileri</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="set-name">Ad Soyad</Label>
            <Input
              id="set-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={user?.name ?? "Adın Soyadın"}
            />
          </div>
          <div className="space-y-1.5">
            <Label>İlçe (İstanbul)</Label>
            <Select value={hood} onValueChange={setHood}>
              <SelectTrigger>
                <SelectValue placeholder={user?.neighborhood ?? "İlçeni seç"} />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {(hoodsQ.data ?? []).map((n) => (
                  <SelectItem key={n} value={n}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            className="rounded-full"
            disabled={(!name.trim() && !hood) || saveProfile.isPending}
            onClick={() => saveProfile.mutate()}
          >
            {saveProfile.isPending ? "Kaydediliyor…" : "Kaydet"}
          </Button>
        </div>
      </Card>

      <Card className="mt-4 rounded-3xl border-border/60 p-6">
        <div className="flex items-center gap-2">
          <KeyRound className="size-4 text-primary" />
          <h2 className="font-display text-lg font-semibold">Şifre değiştir</h2>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="set-current-pw">Mevcut şifre</Label>
            <Input
              id="set-current-pw"
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="set-new-pw">Yeni şifre</Label>
            <Input
              id="set-new-pw"
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">
              En az 8 karakter; büyük/küçük harf ve rakam içermeli.
            </p>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            className="rounded-full"
            disabled={!currentPw || !newPw || changePw.isPending}
            onClick={() => {
              const problem = passwordProblem(newPw);
              if (problem) {
                toast.error(problem);
                return;
              }
              changePw.mutate();
            }}
          >
            {changePw.isPending ? "Güncelleniyor…" : "Şifreyi güncelle"}
          </Button>
        </div>
      </Card>

      <Card className="mt-4 rounded-3xl border-border/60 p-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-primary" />
          <h2 className="font-display text-lg font-semibold">Gizlilik ve KVKK</h2>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Kişisel verilerinin nasıl işlendiğini öğrenmek için{" "}
          <Link to="/kvkk" className="font-medium text-primary underline">
            KVKK aydınlatma metnini
          </Link>{" "}
          inceleyebilirsin. Hesabını silmek istersen Profil sayfasındaki hesap silme
          bölümünü kullanabilirsin.
        </p>
      </Card>

      <Card className="mt-4 rounded-3xl border-border/60 bg-secondary/30 p-6">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <h2 className="font-display text-lg font-semibold">Yakında</h2>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Bildirim tercihleri, tema seçimi ve daha fazlası çok yakında burada olacak.
        </p>
      </Card>
    </div>
  );
}
