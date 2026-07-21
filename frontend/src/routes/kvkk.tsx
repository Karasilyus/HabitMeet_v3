import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/kvkk")({
  head: () => ({
    meta: [
      { title: "KVKK Aydınlatma Metni · HabitMeet" },
      {
        name: "description",
        content: "HabitMeet kişisel verilerin korunması aydınlatma metni.",
      },
    ],
  }),
  component: KvkkPage,
});

function KvkkPage() {
  return (
    <div className="min-h-svh bg-background px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Geri dön
        </Link>

        <Card className="mt-4 rounded-3xl border-border/60 p-8">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-primary/15 text-primary">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight">
                KVKK Aydınlatma Metni
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında bilgilendirme
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-6 text-sm leading-relaxed text-muted-foreground">
            <section>
              <h2 className="mb-1.5 font-semibold text-foreground">1. Veri Sorumlusu</h2>
              <p>
                Bu aydınlatma metni, HabitMeet uygulaması ("Uygulama") tarafından, 6698
                sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca kişisel
                verilerinizin işlenmesine ilişkin sizi bilgilendirmek amacıyla
                hazırlanmıştır.
              </p>
            </section>

            <section>
              <h2 className="mb-1.5 font-semibold text-foreground">2. İşlenen Kişisel Veriler</h2>
              <ul className="list-disc space-y-1 pl-5">
                <li>Kimlik ve iletişim bilgileri: ad soyad, e-posta adresi</li>
                <li>Konum bilgisi: yaşadığınız ilçe (semt)</li>
                <li>Uygulama içi veriler: alışkanlıklar, seri kayıtları, uyku kayıtları, kişisel notlar</li>
                <li>Sosyal veriler: eşleşmeler, mesajlar, forum gönderileri ve yorumları</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-1.5 font-semibold text-foreground">3. İşleme Amaçları</h2>
              <ul className="list-disc space-y-1 pl-5">
                <li>Hesabınızın oluşturulması ve uygulamanın çalıştırılması</li>
                <li>Aynı ilçedeki kullanıcılarla alışkanlık bazlı eşleştirme yapılması</li>
                <li>Mesajlaşma, forum ve topluluk özelliklerinin sunulması</li>
                <li>Güvenliğin sağlanması ve kötüye kullanımın önlenmesi</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-1.5 font-semibold text-foreground">4. Hukuki Sebep ve Saklama</h2>
              <p>
                Verileriniz, kayıt sırasında verdiğiniz açık rıza (KVKK md. 5/1) ve
                sözleşmenin ifası hukuki sebeplerine dayanılarak işlenir. Verileriniz
                hesabınız aktif olduğu sürece saklanır; hesabınızı sildiğinizde kişisel
                verileriniz anonimleştirilir.
              </p>
            </section>

            <section>
              <h2 className="mb-1.5 font-semibold text-foreground">5. Verilerin Aktarılması</h2>
              <p>
                Kişisel verileriniz üçüncü kişilerle paylaşılmaz; yalnızca uygulamanın
                barındırıldığı sunucu altyapısında (yurt dışında bulunan barındırma
                sağlayıcıları dahil) saklanır.
              </p>
            </section>

            <section>
              <h2 className="mb-1.5 font-semibold text-foreground">6. KVKK md. 11 Kapsamındaki Haklarınız</h2>
              <ul className="list-disc space-y-1 pl-5">
                <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                <li>İşlenmişse buna ilişkin bilgi talep etme</li>
                <li>Düzeltilmesini veya silinmesini isteme</li>
                <li>İşlenmesine itiraz etme ve zararın giderilmesini talep etme</li>
              </ul>
              <p className="mt-2">
                Profil sayfanızdan bilgilerinizi güncelleyebilir, hesap silme bölümünden
                tüm verilerinizin silinmesini sağlayabilirsiniz.
              </p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}
