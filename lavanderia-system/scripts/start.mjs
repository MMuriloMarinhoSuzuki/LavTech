import {
  BACKEND,
  checkNodeVersion,
  ensureDependencies,
  ensureBuild,
  freePort,
  spawnService,
  killTree,
  openBrowser,
  banner,
} from './utils.mjs';

checkNodeVersion();
ensureDependencies();
ensureBuild();

const PORT = process.env.PORT || '3001';

banner('🚀  Iniciando o Lavanderia System (modo on-premise, porta única)...');

freePort(Number(PORT));

const server = spawnService(process.execPath, ['src/index.js'], BACKEND, {
  SERVE_STATIC: 'true',
  NODE_ENV: process.env.NODE_ENV || 'production',
});

if (process.env.OPEN_BROWSER !== 'false') {
  setTimeout(() => openBrowser(`http://localhost:${PORT}`), 1500);
}

let shuttingDown = false;
const shutdown = () => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log('\n🛑  Encerrando o servidor...');
  killTree(server);
  setTimeout(() => process.exit(0), 500);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
server.on('exit', (code) => process.exit(code ?? 0));
