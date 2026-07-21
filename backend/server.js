require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const { runMigrations } = require('./src/config/migrate');
const db = require('./src/config/db');
const errorHandler = require('./src/middlewares/errorHandler');
const { generalLimiter } = require('./src/middlewares/rateLimiters');

const app = express();

// --- Güvenlik katmanı (lansman planı 15.1) ---
app.use(helmet());
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5500';
app.use(cors({ origin: corsOrigin.split(',').map((s) => s.trim()) }));
app.use(express.json({ limit: '100kb' }));
app.use('/api', generalLimiter);

// --- Route'lar ---
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/habits', require('./src/routes/habitRoutes'));
app.use('/api/matches', require('./src/routes/matchRoutes'));
app.use('/api/forum', require('./src/routes/forumRoutes'));
app.use('/api/messages', require('./src/routes/messageRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));
app.use('/api', require('./src/routes/miscRoutes'));

// --- Swagger ---
try {
  const swaggerUi = require('swagger-ui-express');
  const YAML = require('yamljs');
  const doc = YAML.load(path.join(__dirname, 'src/swagger/openapi.yaml'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(doc));
} catch (e) {
  console.warn('Swagger yüklenemedi:', e.message);
}

// --- Health check (DB bağlantı kontrolü dahil — UptimeRobot için) ---
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1 AS ok');
    res.json({ status: 'ok', db: db.usePg ? 'postgresql' : 'sqlite' });
  } catch (e) {
    res.status(500).json({ status: 'error', db: 'down' });
  }
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

async function start() {
  if (!process.env.JWT_SECRET) {
    console.error('HATA: JWT_SECRET tanımlanmamış. .env dosyanızı kontrol edin.');
    process.exit(1);
  }
  await runMigrations();
  // Admin seed: sabit kod yerine .env'den (güvenlik açığı #1 çözüldü)
  await require('./src/services/authService').seedAdmin();
  app.listen(PORT, () => {
    console.log(`HabitMeet API çalışıyor → http://localhost:${PORT}`);
    console.log(`Swagger → http://localhost:${PORT}/api-docs`);
  });
}

if (require.main === module) start();
module.exports = app;
