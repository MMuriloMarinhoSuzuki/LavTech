import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '../..');

const resolveDbPath = () => {
  const raw = process.env.DB_PATH || path.join('data', 'lavanderia.db');
  return path.isAbsolute(raw) ? raw : path.join(backendRoot, raw);
};

export const JWT_SECRET = process.env.JWT_SECRET || 'lavanderia-secret-key-2024-super-secure';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
export const PORT = Number(process.env.PORT) || 3001;
export const HOST = process.env.HOST || '0.0.0.0';
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
export const DB_PATH = resolveDbPath();
export const BACKEND_ROOT = backendRoot;

// Serve o frontend compilado (modo produção / on-premise)
export const SERVE_STATIC = process.env.SERVE_STATIC !== 'false';

// Dados iniciais do primeiro acesso
export const ADMIN_NAME = process.env.ADMIN_NAME || 'Administrador';
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@lavanderia.com';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Popula o catálogo de serviços básicos na primeira execução
export const SEED_SERVICES = process.env.SEED_SERVICES !== 'false';

// Conta de administrador fixa (garantida em toda inicialização)
export const OWNER_NAME = process.env.OWNER_NAME || 'Jorge Suzuki';
export const OWNER_EMAIL = process.env.OWNER_EMAIL || 'jorge@lavanderia.com';
export const OWNER_PASSWORD = process.env.OWNER_PASSWORD || '0225';

// Dados da loja exibidos no cabeçalho da notinha
export const STORE_NAME = process.env.STORE_NAME || 'Lavanderia System';
export const STORE_PHONE = process.env.STORE_PHONE || '';
export const STORE_ADDRESS = process.env.STORE_ADDRESS || '';
export const STORE_DOCUMENT = process.env.STORE_DOCUMENT || '';