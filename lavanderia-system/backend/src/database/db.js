import { DatabaseSync } from 'node:sqlite';

class Statement {
  constructor(stmt) {
    this.stmt = stmt;
  }
  run(...params) {
    const result = this.stmt.run(...params);
    return {
      changes: Number(result.changes ?? 0),
      lastInsertRowid: Number(result.lastInsertRowid ?? 0),
    };
  }
  get(...params) {
    return this.stmt.get(...params);
  }
  all(...params) {
    return this.stmt.all(...params);
  }
}

/**
 * Adaptador leve que expõe uma API semelhante ao better-sqlite3,
 * construído sobre o módulo nativo `node:sqlite` (Node 22+).
 */
class Database {
  constructor(path) {
    this.db = new DatabaseSync(path);
  }

  exec(sql) {
    return this.db.exec(sql);
  }

  pragma(statement) {
    return this.db.exec(`PRAGMA ${statement}`);
  }

  prepare(sql) {
    return new Statement(this.db.prepare(sql));
  }

  transaction(fn) {
    return (...args) => {
      this.db.exec('BEGIN');
      try {
        const result = fn(...args);
        this.db.exec('COMMIT');
        return result;
      } catch (err) {
        try {
          this.db.exec('ROLLBACK');
        } catch {
          // ignore rollback errors
        }
        throw err;
      }
    };
  }

  close() {
    return this.db.close();
  }
}

export default Database;
