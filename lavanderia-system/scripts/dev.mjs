import {
  BACKEND,
  FRONTEND,
  NPM,
  checkNodeVersion,
  ensureDependencies,
  freePort,
  spawnService,
  killTree,
  banner,
} from './utils.mjs';

checkNodeVersion();
ensureDependencies();

banner('🚀  Iniciando em modo desenvolvimento...');
console.log('    Backend:  http://localhost:3001    (recarrega ao salvar)');
console.log('    Frontend: http://localhost:5173    (Vite + HMR)');
console.log('');

freePort(3001);
freePort(5173);

const backend = spawnService(process.execPath, ['--watch', 'src/index.js'], BACKEND, {
  SERVE_STATIC: 'false',
});
const frontend = spawnService(NPM, ['run', 'dev'], FRONTEND, {
  SERVE_STATIC: 'false',
});

let shuttingDown = false;
const shutdown = () => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log('\n🛑  Encerrando servidores...');
  killTree(backend);
  killTree(frontend);
  setTimeout(() => process.exit(0), 600);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
