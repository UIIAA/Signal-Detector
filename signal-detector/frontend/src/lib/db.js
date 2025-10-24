
const { Pool } = require('pg');
const sqlite3 = require('sqlite3');
const path = require('path');
const fs = require('fs');

let db;
let dbType;
let initialized = false;

// O caminho agora deve ser relativo à raiz do projeto frontend
const SCHEMA_DIR = path.resolve(process.cwd(), '../shared/database');

async function initializeDatabase() {
  if (initialized) return;

  try {
    if (dbType === 'postgres') {
      const schemaPath = path.join(SCHEMA_DIR, 'schema.postgres.complete.sql');
      if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        await db.query(schema);
        console.log('PostgreSQL database initialized with complete schema');
      } else {
        console.warn('PostgreSQL schema file not found, tables might not exist');
      }
    } else {
      const schemaPath = path.join(SCHEMA_DIR, 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        const statements = schema.split(';').filter(stmt => stmt.trim());

        for (const statement of statements) {
          if (statement.trim()) {
            await new Promise((resolve, reject) => {
              db.run(statement.trim(), (err) => {
                if (err && !err.message.includes('already exists')) {
                  reject(err);
                } else {
                  resolve();
                }
              });
            });
          }
        }
        console.log('SQLite database initialized with schema');
      }
    }

    initialized = true;
  } catch (error) {
    console.error('Database initialization error:', error.message);
  }
}

async function getDb() {
  if (process.env.POSTGRES_URL) {
    if (!db) {
      db = new Pool({
        connectionString: process.env.POSTGRES_URL,
        ssl: {
          // Only disable certificate validation in development
          // In production, always validate SSL certificates to prevent MITM attacks
          rejectUnauthorized: process.env.NODE_ENV === 'production'
        }
      });
      dbType = 'postgres';
      console.log('Connected to the PostgreSQL database (Neon).');
      await initializeDatabase();
    }
  } else {
    if (!db) {
      // O banco de dados SQLite agora será criado na raiz do projeto, não em `shared`
      const dbPath = path.resolve(process.cwd(), '../signal.db');
      db = new sqlite3.Database(dbPath, (err) => {
        if (err) console.error(err.message);
        console.log(`Connected to the SQLite database at ${dbPath}`);
      });
      dbType = 'sqlite';
      setTimeout(() => initializeDatabase(), 100);
    }
  }
  return { db, dbType };
}

async function query(sql, params = []) {
  const { db, dbType } = await getDb();

  if (dbType === 'postgres') {
    return db.query(sql, params);
  } else {
    const sqliteSql = sql.replace(/\$\d+/g, '?');
    return new Promise((resolve, reject) => {
      if (sqliteSql.trim().toUpperCase().startsWith('SELECT')) {
        db.all(sqliteSql, params, (err, rows) => {
          if (err) reject(err); else resolve({ rows });
        });
      } else {
        db.run(sqliteSql, params, function (err) {
          if (err) reject(err); else resolve({ rowCount: this.changes, rows: [] });
        });
      }
    });
  }
}

module.exports = { query, getDb };
