import pg from 'pg';
const { Pool } = pg;

let pool;

// Configuração do banco de dados PostgreSQL
const initDb = () => {
  if (pool) return pool;

  const connectionString = process.env.POSTGRES_URL;

  if (!connectionString) {
    const errorMsg =
      'CRITICAL ERROR: POSTGRES_URL environment variable is required. ' +
      'Please set POSTGRES_URL in your .env.local file for production database access.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  pool = new Pool({
    connectionString,
    ssl: {
      // Only disable certificate validation in development
      // In production, always validate SSL certificates to prevent MITM attacks
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });

  console.log('PostgreSQL connection pool initialized');
  return pool;
};

// Query method with PostgreSQL support
const query = async (sql, params = []) => {
  const client = initDb();

  try {
    const result = await client.query(sql, params);
    return {
      rows: result.rows,
      rowCount: result.rowCount
    };
  } catch (error) {
    console.error('Database query error:', error.message);
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw error;
  }
};

const getDb = async () => {
  return {
    db: initDb(),
    dbType: 'postgres'
  };
};

// Graceful shutdown
process.on('SIGINT', async () => {
  if (pool) {
    await pool.end();
    console.log('Database pool closed');
  }
  process.exit(0);
});

export { query, getDb };