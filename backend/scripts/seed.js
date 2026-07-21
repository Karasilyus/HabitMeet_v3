// Demo veri (seed) script'i.
// Kullanım: backend klasöründe -> node scripts/seed.js
// Tekrar çalıştırmak güvenlidir (var olan kayıtları atlar).
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { runMigrations } = require('../src/config/migrate');
const userModel = require('../src/models/userModel');
const activityTypeModel = require('../src/models/activityTypeModel');
const habitModel = require('../src/models/habitModel');
const forumModel = require('../src/models/forumModel');
const authService = require('../src/services/authService');
const matchModel = require('../src/models/matchModel');
const messageModel = require('../src/models/messageModel');

const TYPES = [
  'Koşu', 'Yürüyüş', 'Fitness', 'Yoga', 'Pilates', 'Bisiklet', 'Yüzme',
  'Basketbol', 'Futbol', 'Kitap Okuma', 'Meditasyon', 'Dil Öğrenme', 'Satranç',
];

const DEMO_PASSWORD = 'Demo1234!';

// days: bugüne kadar kaç gün üst üste log'u olsun (streak = days)
const USERS = [
  {
    name: 'Ayşe Yılmaz', email: 'ayse@demo.habitmeet.local', neighborhood: 'Kadıköy',
    habits: [
      { name: 'Sabah koşusu', type: 'Koşu', days: 6 },
      { name: 'Akşam kitap okuma', type: 'Kitap Okuma', days: 12 },
    ],
  },
  {
    name: 'Mehmet Demir', email: 'mehmet@demo.habitmeet.local', neighborhood: 'Kadıköy',
    habits: [
      { name: 'Moda sahilinde koşu', type: 'Koşu', days: 4 },
      { name: 'Yoga seansı', type: 'Yoga', days: 2 },
    ],
  },
  {
    name: 'Zeynep Kaya', email: 'zeynep@demo.habitmeet.local', neighborhood: 'Kadıköy',
    habits: [
      { name: 'Kalamış yürüyüşü', type: 'Yürüyüş', days: 9 },
      { name: 'Sabah meditasyonu', type: 'Meditasyon', days: 5 },
      { name: 'Uyumadan önce kitap', type: 'Kitap Okuma', days: 4 },
    ],
  },
  {
    name: 'Can Öztürk', email: 'can@demo.habitmeet.local', neighborhood: 'Kadıköy',
    habits: [
      { name: 'Salon antrenmanı', type: 'Fitness', days: 3 },
      { name: 'Fenerbahçe parkuru koşusu', type: 'Koşu', days: 3 },
    ],
  },
  {
    name: 'Elif Şahin', email: 'elif@demo.habitmeet.local', neighborhood: 'Beşiktaş',
    habits: [{ name: 'Bebek sahili koşusu', type: 'Koşu', days: 7 }],
  },
  {
    name: 'Burak Aydın', email: 'burak@demo.habitmeet.local', neighborhood: 'Üsküdar',
    habits: [{ name: 'Kuzguncuk yürüyüşü', type: 'Yürüyüş', days: 5 }],
  },
];

const POSTS = [
  {
    by: 0, type: 'Koşu',
    title: 'Cumartesi sabahı Kalamış koşusu 🏃',
    body: "Bu cumartesi 08:00'de Kalamış Parkı girişinde buluşup 5 km koşuyoruz. Tempo rahat, her seviyeden koşucu katılabilir!",
  },
  {
    by: 2, type: 'Yürüyüş',
    title: 'Hafta içi akşam yürüyüş grubu',
    body: 'Salı ve perşembe 19:30 Moda sahilinde buluşuyoruz. Yürüyüş sonrası çay molası veriyoruz ☕',
  },
  {
    by: 3, type: 'Fitness',
    title: 'Spor salonu partneri arıyorum 💪',
    body: 'Kadıköy civarında sabah 07:00-08:00 arası antrenman yapan var mı? Birbirimizi motive edecek bir antrenman ortağı arıyorum.',
  },
];

function isoDaysAgo(i) {
  return new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
}

async function main() {
  await runMigrations();
  await authService.seedAdmin();

  // 1) Aktivite tipleri (onaylı)
  const typeIds = {};
  for (const name of TYPES) {
    let t = await activityTypeModel.findByName(name);
    if (!t) {
      t = await activityTypeModel.create({ name, createdBy: null, isApproved: 1 });
      console.log('Aktivite tipi eklendi:', name);
    } else if (!t.is_approved) {
      await activityTypeModel.approve(t.id);
    }
    typeIds[name] = t.id;
  }

  // 2) Demo kullanıcılar + alışkanlıklar + streak logları
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const created = [];
  for (const u of USERS) {
    let user = await userModel.findByEmail(u.email);
    if (!user) {
      user = await userModel.create({
        name: u.name, email: u.email, password: hash, neighborhood: u.neighborhood,
      });
      console.log(`Kullanıcı eklendi: ${u.name} (${u.email} / ${DEMO_PASSWORD}) — ${u.neighborhood}`);
    }
    created.push(user);
    const existing = await habitModel.findByUser(user.id);
    for (const h of u.habits) {
      let habit = existing.find((x) => x.name === h.name);
      if (!habit) {
        habit = await habitModel.create({ userId: user.id, name: h.name, typeId: typeIds[h.type] });
      }
      // Bugün dahil son `days` gün için tamamlanmış log (streak = days)
      for (let i = h.days - 1; i >= 0; i--) {
        await habitModel.upsertLog(habit.id, isoDaysAgo(i), 1);
      }
    }
  }


  // 3) Eslesmeler + demo mesajlar
  const [ayse, mehmet, zeynep, can] = created;
  async function ensureMatch(a, b, typeName, requestedBy, status) {
    const typeId = typeIds[typeName];
    const [u1, u2] = a.id < b.id ? [a, b] : [b, a];
    let m = await matchModel.findExisting(u1.id, u2.id, typeId);
    if (!m) {
      m = await matchModel.create(u1.id, u2.id, typeId, requestedBy.id);
      console.log(`Eslesme eklendi: ${a.name} <-> ${b.name} (${typeName}, ${status})`);
    }
    if (status !== 'pending' && m.status !== status) {
      await matchModel.updateStatus(m.id, status);
    }
    return m;
  }

  const runMatch = await ensureMatch(ayse, mehmet, 'Koşu', mehmet, 'accepted');
  await ensureMatch(ayse, can, 'Koşu', can, 'pending');
  await ensureMatch(ayse, zeynep, 'Kitap Okuma', zeynep, 'pending');

  const existingMsgs = await messageModel.listByMatch(runMatch.id);
  if (existingMsgs.length === 0) {
    await messageModel.create(runMatch.id, mehmet.id, 'Selam! Yarın sabah Moda sahilinde koşuya var mısın? 🌊');
    await messageModel.create(runMatch.id, ayse.id, "Olur! 07:00'de iskele önünde buluşalım mı?");
    await messageModel.create(runMatch.id, mehmet.id, 'Süper, 07:00 iskele önü. Görüşürüz 👍');
    console.log('Demo mesajlar eklendi.');
  }

  // 4) Forum ilanları + örnek yorumlar
  const existingPosts = await forumModel.listPosts();
  for (const p of POSTS) {
    if (existingPosts.some((x) => x.title === p.title)) continue;
    const post = await forumModel.createPost({
      userId: created[p.by].id, typeId: typeIds[p.type], title: p.title, body: p.body,
    });
    await forumModel.createComment({
      postId: post.id,
      userId: created[(p.by + 1) % created.length].id,
      body: 'Ben varım! 🙌',
    });
    console.log('Forum ilanı eklendi:', p.title);
  }

  console.log('\n✅ Seed tamamlandı!');
  console.log('----------------------------------------');
  console.log(`Demo kullanıcı şifresi (hepsi için): ${DEMO_PASSWORD}`);
  USERS.forEach((u) => console.log(`  ${u.email}  (${u.neighborhood})`));
  console.log('----------------------------------------');
  console.log('İpucu: Kendi hesabını Kadıköy ilçesinde açıp "Koşu" tipinde bir alışkanlık');
  console.log('ekler ve bugünü işaretlersen, streak eşiğini geçtiğinde Ayşe/Mehmet ile');
  console.log('otomatik eşleşme isteği oluşur. Hızlı test için .env dosyasına MIN_STREAK_DAYS=1 yaz.');
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Seed hatası:', e);
    process.exit(1);
  });
