import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';

let db;
let dbType = 'sqlite';

// Configuração do banco de dados
const initDb = () => {
  if (db) return db;

  const dbPath = path.join(process.cwd(), 'shared', 'database', 'signal.db');

  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err);
    } else {
      console.log('Connected to SQLite database');
    }
  });

  return db;
};

// Promisify database methods
const query = async (sql, params = []) => {
  const database = initDb();

  return new Promise((resolve, reject) => {
    database.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve({ rows });
      }
    });
  });
};

const getDb = async () => {
  return {
    db: initDb(),
    dbType
  };
};

export { query, getDb };