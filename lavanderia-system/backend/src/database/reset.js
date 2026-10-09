import fs from 'fs';
import { DB_PATH } from '../config/env.js';

console.log(`Banco de dados: ${DB_PATH}`);

for (const suffix of ['', '-wal', '-shm']) {
  const file = DB_PATH + suffix;
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    console.log(`  • removido ${file}`);
  }
}

console.log('Recriando estrutura e dados iniciais...');
await import('./init.js');
console.log('Banco de dados recriado com sucesso.');