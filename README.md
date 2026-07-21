# HabitMeet

Alışkanlık takibi + semt bazlı eşleşme uygulaması. Tek repo, iki klasör:

```
habitmeet/
├─ backend/    → Node.js + Express + SQLite API (port 3000)
├─ frontend/   → React (TanStack Start + Vite) arayüz (port 8080 veya 5173)
└─ package.json → ikisini tek komutla çalıştıran kök script'ler
```

## Kurulum (ilk sefer)

> Gereksinim: Node.js 22 LTS

```bash
npm install        # kök araçlar (concurrently)
npm run setup      # backend + frontend bağımlılıkları
npm run seed       # (isteğe bağlı) demo veriler
```

## Çalıştırma

```bash
npm run dev
```

Tek komutla ikisi birden açılır:
- **api** → http://localhost:3000 (Swagger: /api-docs)
- **web** → terminalde yazan adres (genelde http://localhost:8080 veya 5173)

İstersen ayrı ayrı: `npm run dev:backend` / `npm run dev:frontend`

## Hazır ayarlar

- `backend/.env` — hazır geliyor (SQLite, CORS izinleri 5173/8080, admin hesabı: `admin@habitmeet.local / Admin1234!`)
- `frontend/.env` — `VITE_API_URL=http://localhost:3000`

## Demo kullanıcılar (seed sonrası)

Şifre hepsi için: `Demo1234!`

| E-posta | İlçe |
|---|---|
| ayse@demo.habitmeet.local | Kadıköy |
| mehmet@demo.habitmeet.local | Kadıköy |
| zeynep@demo.habitmeet.local | Kadıköy |
| can@demo.habitmeet.local | Kadıköy |
| elif@demo.habitmeet.local | Beşiktaş |
| burak@demo.habitmeet.local | Üsküdar |

## Production dağıtımı

- **Backend (Railway):** `DATABASE_URL` (PostgreSQL) ve `CORS_ORIGIN=https://<vercel-adresin>` ayarla.
- **Frontend (Vercel):** proje kökü olarak `frontend/` klasörünü seç, env değişkeni `VITE_API_URL=https://<railway-adresin>`.
