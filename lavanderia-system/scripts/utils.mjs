/**
 * Utilitários compartilhados pelos scripts de inicialização.
 * Funciona no Linux, macOS e Windows.
 */
import { spawn, spawnSync, execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const ROOT = path.resolve(__dirname, '..');
export const BACKEND = path.join(ROOT, 'backend');
export const FRONTEND = path.join(ROOT, 'frontend');
export const IS_WINDOWS = process.platform === 'win32';
export const NPM = IS_WINDOWS ? 'npm.cmd' : 'npm';

export function banner(text) {
  console.log('\n' + text);
}

export function checkNodeVersion() {
  const major = Number(process.versions.node.split('.')[0]);
  if (Number.isNaN(major) || major < 22) {
    console.error(
      `\n  ✖ Node.js ${process.versions.node} detectado.\n` +
        '    É necessário Node.js 22 ou superior (o banco SQLite é embutido no Node).\n'
    );
    process.exit(1);
  }
}

export function runSync(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', shell: IS_WINDOWS });
  if (result.status !== 0) {
    console.error(`\n  ✖ Falha ao executar: ${command} ${args.join(' ')}\n`);
    process.exit(result.status ?? 1);
  }
}

export function ensureDependencies() {
  if (!existsSync(path.join(BACKEND, 'node_modules'))) {
    banner('📦  Instalando dependências do backend...');
    runSync(NPM, ['install', '--no-audit', '--no-fund'], BACKEND);
  }
  if (!existsSync(path.join(FRONTEND, 'node_modules'))) {
    banner('📦  Instalando dependências do frontend...');
    runSync(NPM, ['install', '--no-audit', '--no-fund'], FRONTEND);
  }
}

export function ensureBuild() {
  if (!existsSync(path.join(FRONTEND, 'dist', 'index.html'))) {
    banner('🏗️   Compilando o frontend (apenas na primeira vez)...');
    runSync(NPM, ['run', 'build'], FRONTEND);
  }
}

/* ------------------------------------------------------------------ portas */

function safeExec(cmd) {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf8' }) || '';
  } catch {
    return '';
  }
}

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function listeningPids(port) {
  const pids = new Set();
  if (IS_WINDOWS) {
    const out = safeExec('netstat -ano');
    const re = new RegExp(`[:.]${port}\\s`);
    for (const line of out.split(/\r?\n/)) {
      if (!/LISTENING/i.test(line) || !re.test(line)) continue;
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (/^\d+$/.test(pid) && pid !== '0') pids.add(Number(pid));
    }
    return [...pids];
  }

  const lsof = safeExec(`lsof -ti tcp:${port}`);
  lsof.split(/\s+/).forEach((p) => /^\d+$/.test(p) && pids.add(Number(p)));
  if (pids.size) return [...pids];

  const ss = safeExec(`ss -ltnp "sport = :${port}"`);
  for (const m of ss.matchAll(/pid=(\d+)/g)) pids.add(Number(m[1]));
  if (pids.size) return [...pids];

  const fuser = safeExec(`fuser ${port}/tcp`);
  fuser.split(/\s+/).forEach((p) => /^\d+$/.test(p) && pids.add(Number(p)));
  return [...pids];
}

function isNodeLikeProcess(pid) {
  if (IS_WINDOWS) {
    const out = safeExec(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`);
    return /node\.exe|npm|vite/i.test(out);
  }
  const out = safeExec(`ps -o args= -p ${pid}`);
  return out.length > 0 && /node|npm|vite|lavanderia/i.test(out);
}

function killPid(pid, hard = false) {
  if (IS_WINDOWS) {
    spawnSync('taskkill', ['/PID', String(pid), '/T', hard ? '/F' : ''].filter(Boolean), {
      stdio: 'ignore',
    });
    return;
  }
  try {
    process.kill(pid, hard ? 'SIGKILL' : 'SIGTERM');
  } catch {
    /* ignore */
  }
}

/** Libera uma porta encerrando apenas processos Node/npm deste app. */
export function freePort(port) {
  const pids = listeningPids(port);
  if (pids.length === 0) return;

  const killable = pids.filter(isNodeLikeProcess);
  if (killable.length === 0) {
    console.error(`\n  ⚠️  A porta ${port} está em uso por outro programa.`);
    console.error(`      Encerre-o ou altere PORT no arquivo backend/.env.\n`);
    process.exit(1);
  }

  console.log(`⚠️   Porta ${port} em uso (PID: ${killable.join(', ')}). Liberando...`);
  killable.forEach((pid) => killPid(pid));

  const deadline = Date.now() + 3000;
  while (Date.now() < deadline) {
    sleepSync(150);
    const remaining = listeningPids(port).filter(isNodeLikeProcess);
    if (remaining.length === 0) return;
    remaining.forEach((pid) => killPid(pid, true));
  }
}

/* --------------------------------------------------------------- processos */

/** Encerra um processo e todos os seus filhos. */
export function killTree(child) {
  if (!child || child.killed || child.exitCode !== null) return;
  if (IS_WINDOWS) {
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch {
      try {
        child.kill('SIGTERM');
      } catch {
        /* ignore */
      }
    }
  }
}

/** Inicia um processo em seu próprio grupo (para permitir matar a árvore). */
export function spawnService(command, args, cwd, env = {}) {
  return spawn(command, args, {
    cwd,
    stdio: 'inherit',
    detached: !IS_WINDOWS,
    shell: IS_WINDOWS,
    env: { ...process.env, ...env },
  });
}

export function openBrowser(url) {
  try {
    if (IS_WINDOWS) {
      spawn('cmd', ['/c', 'start', '""', url], { stdio: 'ignore', detached: true }).unref();
    } else if (process.platform === 'darwin') {
      spawn('open', [url], { stdio: 'ignore', detached: true }).unref();
    } else {
      spawn('xdg-open', [url], { stdio: 'ignore', detached: true }).unref();
    }
  } catch {
    /* abertura do navegador é opcional */
  }
}
