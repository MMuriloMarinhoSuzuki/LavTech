import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './routes/index.js';
import { PORT, HOST, FRONTEND_URL, SERVE_STATIC } from './config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, '../../frontend/dist');

const app = express();

app.use(
  cors({
    origin: [FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', routes);

// Em produção (on-premise) o próprio servidor entrega o frontend compilado.
const hasBuild = fs.existsSync(path.join(distPath, 'index.html'));
if (SERVE_STATIC && hasBuild) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

const server = app.listen(PORT, HOST, () => {
  const shown = HOST === '0.0.0.0' ? 'localhost' : HOST;
  console.log('');
  console.log('  🧺  Lavanderia System');
  console.log('  --------------------');
  console.log(`  Servidor:  http://${shown}:${PORT}`);
  if (SERVE_STATIC && hasBuild) {
    console.log('  Modo:      produção (frontend + API na mesma porta)');
  } else if (SERVE_STATIC && !hasBuild) {
    console.log('  Modo:      API (frontend ainda não compilado — rode `npm run build`)');
  } else {
    console.log('  Modo:      desenvolvimento (API apenas)');
  }
  console.log('');
});

const shutdown = (signal) => {
  console.log(`\n🛑  Recebido ${signal}. Encerrando...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 3000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

export default app;
