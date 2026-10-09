import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import Database from './db.js';
import {
  DB_PATH,
  ADMIN_NAME,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  SEED_SERVICES,
  OWNER_NAME,
  OWNER_EMAIL,
  OWNER_PASSWORD,
} from '../config/env.js';

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const createSchema = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'attendant')),
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      neighborhood TEXT,
      city TEXT,
      state TEXT,
      zip_code TEXT,
      notes TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL CHECK (category IN ('washing', 'dyeing', 'ironing', 'special')),
      unit TEXT NOT NULL CHECK (unit IN ('kg', 'piece', 'unit')),
      price DECIMAL(10,2) NOT NULL,
      estimated_days INTEGER DEFAULT 1,
      icon TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'ready', 'delivered', 'cancelled')) DEFAULT 'pending',
      total_amount DECIMAL(10,2) DEFAULT 0,
      discount DECIMAL(10,2) DEFAULT 0,
      notes TEXT,
      estimated_delivery DATETIME,
      delivered_at DATETIME,
      payment_method TEXT,
      payment_status TEXT NOT NULL DEFAULT 'pending',
      paid_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      service_id INTEGER NOT NULL,
      quantity DECIMAL(10,2) NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      total_price DECIMAL(10,2) NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (service_id) REFERENCES services(id)
    );

    CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
    CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
    CREATE INDEX IF NOT EXISTS idx_orders_client ON orders(client_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(created_at);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
  `);
};

const runMigrations = () => {
  const columns = db
    .prepare("SELECT name FROM pragma_table_info('orders')")
    .all()
    .map((c) => c.name);
  const addColumn = (name, ddl) => {
    if (!columns.includes(name)) {
      db.exec(`ALTER TABLE orders ADD COLUMN ${ddl}`);
      console.log(`  • Migração aplicada: orders.${name}`);
    }
  };
  addColumn('payment_method', 'payment_method TEXT');
  addColumn('payment_status', "payment_status TEXT NOT NULL DEFAULT 'pending'");
  addColumn('paid_at', 'paid_at DATETIME');

  // Migração dos ícones de serviço (feature "ícone por serviço").
  const svcColumns = db
    .prepare("SELECT name FROM pragma_table_info('services')")
    .all()
    .map((c) => c.name);
  if (!svcColumns.includes('icon')) {
    db.exec('ALTER TABLE services ADD COLUMN icon TEXT');
    console.log('  • Migração aplicada: services.icon');
  }
  // Retrofill: serviços já existentes ganham ícone pelo nome.
  const backfillIcons = [
    ['bermuda', 'bermuda'],
    ['calça', 'calca'],
    ['calca', 'calca'],
    ['camiseta', 'camiseta'],
    ['camisa', 'camiseta'],
    ['moletom', 'moletom'],
    ['vestido', 'vestido'],
    ['edredom', 'edredom'],
    ['cobertor', 'edredom'],
    ['tapete', 'tapete'],
    ['couro', 'couro'],
    ['tênis', 'tenis'],
    ['tenis', 'tenis'],
    ['mochila', 'mochila'],
    ['pelúcia', 'pelucia'],
    ['ursinho', 'pelucia'],
    ['lavagem', 'lavagem'],
    ['roupa', 'lavagem'],
    ['higienização', 'higieniza'],
  ];
  for (const [keyword, icon] of backfillIcons) {
    db.prepare('UPDATE services SET icon = ? WHERE icon IS NULL AND name LIKE ?').run(
      icon,
      `%${keyword}%`
    );
  }
  db.prepare("UPDATE services SET icon = 'default' WHERE icon IS NULL").run();
};

const seedAdmin = () => {
  const { count } = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (count > 0) return;

  const hash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
    ADMIN_NAME,
    ADMIN_EMAIL,
    hash,
    'admin'
  );
  console.log(`  • Usuário administrador criado: ${ADMIN_EMAIL}`);
  if (ADMIN_PASSWORD === 'admin123') {
    console.warn(
      '  ⚠️  A senha do administrador ainda é a padrão. Altere-a em "Usuários" ou no arquivo .env.'
    );
  }
};

const ensureOwner = () => {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(OWNER_EMAIL);
  if (existing) return;

  const hash = bcrypt.hashSync(OWNER_PASSWORD, 10);
  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
    OWNER_NAME,
    OWNER_EMAIL,
    hash,
    'admin'
  );
  console.log(`  • Conta de administrador garantida: ${OWNER_EMAIL}`);
};

const seedServices = () => {
  if (!SEED_SERVICES) return;
  const { count } = db.prepare('SELECT COUNT(*) as count FROM services').get();
  if (count > 0) return;

  const insert = db.prepare(
    'INSERT INTO services (name, description, category, unit, price, estimated_days, icon) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const services = [
    [
      'Lavagem e Higienização de Roupas em Geral',
      'Limpeza do vestuário do dia a dia e peças delicadas. O processo se destaca pela utilização de produtos exclusivos e importados com ação antiácaro, bactericida, germicida e fungicida, garantindo uma higienização profunda.',
      'washing',
      'kg',
      28.0,
      2,
      'lavagem',
    ],
    [
      'Tingimento de Camiseta',
      'Tingimento profissional de camisetas — mudança completa da cor ou revitalização do tecido, corrigindo manchas e desbotamentos causados pelo tempo e uso.',
      'dyeing',
      'piece',
      35.0,
      3,
      'camiseta',
    ],
    [
      'Tingimento de Calça',
      'Tingimento profissional de calças — mudança completa da cor (muito utilizada em peças de inverno) ou revitalização do tecido, corrigindo manchas e desbotamentos.',
      'dyeing',
      'piece',
      45.0,
      3,
      'calca',
    ],
    [
      'Tingimento de Bermuda',
      'Tingimento profissional de bermudas — mudança completa da cor ou revitalização do tecido, corrigindo manchas e desbotamentos.',
      'dyeing',
      'piece',
      40.0,
      3,
      'bermuda',
    ],
    [
      'Tingimento de Moletom',
      'Tingimento profissional de moletons — mudança completa da cor ou revitalização do tecido, corrigindo manchas e desbotamentos.',
      'dyeing',
      'piece',
      55.0,
      3,
      'moletom',
    ],
    [
      'Tingimento de Vestido',
      'Tingimento profissional de vestidos — mudança completa da cor ou revitalização do tecido, corrigindo manchas e desbotamentos.',
      'dyeing',
      'piece',
      50.0,
      3,
      'vestido',
    ],
    [
      'Lavagem e Higienização de Tapetes',
      'Limpeza especializada para remover poeira, ácaros e sujeiras profundas de tapetes de diversos tamanhos e materiais.',
      'washing',
      'piece',
      80.0,
      3,
      'tapete',
    ],
    [
      'Lavagem de Edredons e Cobertores',
      'Higienização de peças volumosas de cama que geralmente não cabem em máquinas domésticas, focada na eliminação de fungos e ácaros.',
      'washing',
      'piece',
      60.0,
      3,
      'edredom',
    ],
    [
      'Renovação de Couro',
      'Tratamento específico para limpar, hidratar e recuperar o aspecto de roupas e jaquetas de couro, evitando ressecamento e rachaduras.',
      'special',
      'piece',
      150.0,
      3,
      'couro',
    ],
    [
      'Lavagem de Tênis e Mochilas',
      'Higienização detalhada de calçados e mochilas, removendo sujeiras pesadas e odores impregnados de forma segura para os materiais.',
      'special',
      'piece',
      45.0,
      2,
      'tenis',
    ],
  ];
  const tx = db.transaction(() => {
    for (const s of services) insert.run(...s);
  });
  tx();
  console.log(`  • ${services.length} serviços de exemplo cadastrados (editáveis na tela "Serviços").`);
};

export const initDatabase = () => {
  createSchema();
  runMigrations();
  seedAdmin();
  ensureOwner();
  seedServices();
  return db;
};

initDatabase();

export default db;