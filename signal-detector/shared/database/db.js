const { Pool } = require('pg');
const sqlite3 = require('sqlite3');
const path = require('path');

let db;
let dbType;

async function getDb() {
  // Production environment (Vercel) requires PostgreSQL
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.POSTGRES_URL) {
      throw new Error("POSTGRES_URL environment variable is not set in production. PostgreSQL is required.");
    }
    if (!db) {
      db = new Pool({
        connectionString: process.env.POSTGRES_URL,
      });
      dbType = 'postgres';
      console.log('Connected to the PostgreSQL database.');
    }
  } else {
    // Development environment fallback to SQLite
    if (!db) {
      const dbPath = path.resolve(__dirname, '..', '..', '..', 'shared', 'database', 'signal.db');
      const dbDir = path.dirname(dbPath);
      const fs = require('fs');
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error(err.message);
        }
        console.log(`Connected to the SQLite database at ${dbPath}`);
      });
      dbType = 'sqlite';
    }
  }
  return { db, dbType };
}

async function query(sql, params = []) {
  const { db, dbType } = await getDb();

  if (dbType === 'postgres') {
    return db.query(sql, params);
  } else { // This block will now only be executed in development
    const sqliteSql = sql.replace(/\$\d+/g, '?');
    return new Promise((resolve, reject) => {
      if (sqliteSql.trim().toUpperCase().startsWith('SELECT')) {
        db.all(sqliteSql, params, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve({ rows });
          }
        });
      } else {
        db.run(sqliteSql, params, function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({ rowCount: this.changes });
          }
        });
      }
    });
  }
}

module.exports = { query, getDb };