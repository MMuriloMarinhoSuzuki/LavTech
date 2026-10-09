# AGENTS.md

The app lives in `lavanderia-system/` (this root contains only that folder). It is two
independent npm packages — `backend/` (Express, ESM) and `frontend/` (React 18 + TS + Vite) —
orchestrated by `lavanderia-system/package.json`. No workspaces/monorepo tooling; each package
has its own `node_modules`.

## Requirements
- **Node.js >= 22.** The database is the built-in `node:sqlite` (`backend/src/database/db.js`).
  Do **not** add `better-sqlite3`/`sqlite3` or any DB server; SQLite is embedded (file
  `backend/data/lavanderia.db`).

## Commands (run in `lavanderia-system/`)
- `npm start` — on-premise mode: builds `frontend/dist` if missing, frees ports, then runs one
  server on **3001** serving the built SPA + `/api` (when `SERVE_STATIC !== 'false'`).
  Wrappers: `./start.sh` (Linux/macOS), `start.bat` (Windows).
- `npm run dev` — backend `--watch` on 3001 + Vite on **5173**; Vite proxies `/api` -> 3001.
- `npm run setup` — `npm install` in both packages.
- `npm run build` — `cd frontend && tsc && vite build` (this is the only typecheck).
- `npm run db:reset` — deletes the SQLite files and reseeds.
- Backend alone: `cd backend && npm run dev | start | db:init | db:reset`.

## Verify changes
- There is **no test suite, linter, formatter, or CI**. Do not invent `npm test`/`lint` scripts.
- Frontend: `cd frontend && npx tsc --noEmit` (strict; `noUnusedLocals`/`noUnusedParameters` fail
  on unused imports/vars), or `npm run build`.
- Backend: no build/lint — start it and hit `/api/health` or log in via curl.

## Architecture notes
- Entry `backend/src/index.js` mounts all routes under `/api` (`backend/src/routes/index.js`).
  Data access lives only in `backend/src/models/index.js`; controllers are thin (Zod validates input).
- Config `backend/src/config/env.js` loads dotenv. `.env` is gitignored, `.env.example` committed.
  `DB_PATH` is resolved relative to `backend/`.
- DB bootstrap runs on import of `backend/src/database/init.js` (imported by models): creates schema;
  seeds the admin (`ADMIN_*`) only if `users` is empty; **always** ensures the owner admin (`OWNER_*`);
  seeds 10 services unless `SEED_SERVICES=false`. No mock client/order data exists.
- `runMigrations()` in `init.js` adds newer `orders` columns (`payment_method`, `payment_status`,
  `paid_at`) with `ALTER TABLE` for existing DBs — keep it in sync with `createSchema`.
- Receipts/notinha: `backend/src/dto/receiptDto.js` shapes an order into two presentations
  (`customer` comanda + `full` attendant copy), served by `GET /api/orders/:id/receipt`. Printing is a
  frontend-only 80mm thermal layout (`frontend/src/components/receipt/`) driven by print CSS
  (`#receipt-print-root` in `frontend/src/index.css`); the modal always renders BOTH copies and a single
  print button prints both vias — the CSS forces a page break (`break-before: page`) so each comes out
  on its own sheet. Store header comes from `STORE_*` env.
  Payment is set on order create or via `PATCH /api/orders/:id/payment`; `paid_at` is managed by the
  controller/model automatically.
- Deletion differs by entity: **users/clients/services are soft-deleted** (`active=0`; reads filter
  `WHERE active=1`), **orders are hard-deleted** (with their `order_items`). Don't assume a `DELETE`
  removed the row.
- Auth: JWT in `Authorization: Bearer` (token in `localStorage` key `lavanderia_token`). Roles
  `admin|manager|attendant`; per-route guards in `routes/index.js` (only admin deletes; clients/
  services create+edit = admin|manager; orders create = any authenticated, update = admin|manager,
  status change = any authenticated).
- API uses **snake_case** fields (`client_id`, `total_amount`, `zip_code`, `estimated_delivery`).
  Enums: service `category` = `washing|dyeing|ironing|special`; `unit` = `kg|piece|unit`; order
  `status` = `pending|in_progress|ready|delivered|cancelled`; `payment_status` = `pending|paid`;
  `payment_method` = `cash|pix|card|other`.
- Frontend alias `@/* -> src/*` is declared in **both** `frontend/tsconfig.json` and
  `frontend/vite.config.ts` — update both together. Axios baseURL =
  `import.meta.env.VITE_API_URL || '/api'` (dev via proxy, prod via same origin).
- All user-facing text is **pt-BR**. Keep `README.md` (also pt-BR) in sync when commands, ports, or
  credentials change.

## Cross-platform
- `scripts/*.mjs` is the portable launcher; `start.sh`/`start.bat`/`dev.bat` are thin wrappers. Put
  startup/port logic in `scripts/utils.mjs`, not bash/low-level scripts — it frees 3001/5173 by
  terminating only Node/npm processes and auto-installs deps and builds.
- `db:reset` deletes `-wal`/`-shm` too; stop the server first (WAL).

## Seeded logins
`jorge@lavanderia.com` / `0225` and `admin@lavanderia.com` / `admin123` — both `admin`. The
`ADMIN_*` / `OWNER_*` env vars only apply on first DB creation; change passwords via the
**Usuários** screen.
