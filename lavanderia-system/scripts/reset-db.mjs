import { BACKEND, checkNodeVersion, runSync } from './utils.mjs';

checkNodeVersion();

console.log('⚠️   Isto apaga TODOS os dados (clientes, pedidos, serviços e usuários).');
runSync(process.execPath, ['src/database/reset.js'], BACKEND);
