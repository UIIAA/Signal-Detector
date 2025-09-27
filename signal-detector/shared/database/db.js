const { Pool } = require('pg');
const sqlite3 = require('sqlite3');
const path = require('path');
const fs = require('fs');

let db;
let dbType;
let initialized = false;

async function initializeDatabase() {
  if (initialized) return;

  try {
    if (dbType === 'postgres') {
      // Read and execute the complete PostgreSQL schema
      const schemaPath = path.resolve(__dirname, 'schema.postgres.complete.sql');
      if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        await db.query(schema);
        console.log('PostgreSQL database initialized with complete schema');
      } else {
        console.warn('PostgreSQL schema file not found, tables might not exist');
      }
    } else {
      // For SQLite, run the original schema
      const schemaPath = path.resolve(__dirname, 'schema.sql');
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
    // Don't throw error, let the app continue
  }
}

async function getDb() {
  // Production environment (Vercel) requires PostgreSQL
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.POSTGRES_URL) {
      throw new Error("POSTGRES_URL environment variable is not set in production. PostgreSQL is required.");
    }
    if (!db) {
      db = new Pool({
        connectionString: process.env.POSTGRES_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });
      dbType = 'postgres';
      console.log('Connected to the PostgreSQL database.');

      // Initialize database schema
      await initializeDatabase();
    }
  } else {
    // Development environment fallback to SQLite
    if (!db) {
      const dbPath = path.resolve(__dirname, 'signal.db');
      const dbDir = path.dirname(dbPath);

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

      // Initialize database schema
      setTimeout(() => initializeDatabase(), 100);
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