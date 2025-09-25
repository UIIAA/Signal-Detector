
const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

let db;
let dbType;

// Construct the absolute path to the database file
const dbPath = path.join("/Users/marcoscruz/Documents/Projetos/Sinal Ruido", 'shared', 'database', 'signal.db');

async function getDb() {
  if (process.env.POSTGRES_URL) {
    if (!db) {
      db = new Pool({
        connectionString: process.env.POSTGRES_URL,
      });
      dbType = 'postgres';
      console.log('Connected to the PostgreSQL database.');
    }
  } else {
    if (!db) {
      db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error(err.message);
        }
        console.log('Connected to the SQLite database.');
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
  } else {
    // For sqlite, we need to convert the query to use ?
    const sqliteSql = sql.replace(/\$\d+/g, '?');
    return new Promise((resolve, reject) => {
      // For SELECT queries, use `all`. For INSERT, UPDATE, DELETE, use `run`.
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
