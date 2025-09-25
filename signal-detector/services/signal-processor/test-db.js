const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Test the database connection and query
const dbPath = path.join(__dirname, '..', '..', 'shared', 'database', 'signal.db');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Database connection error:', err);
    return;
  }
  
  console.log('Connected to database');
  
  // Test a simple query
  db.get("SELECT COUNT(*) as count FROM goals", [], (err, row) => {
    if (err) {
      console.error('Error querying goals:', err);
    } else {
      console.log('Goals count:', row.count);
    }
    
    // Test the complex query
    const userId = 'default-user';
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - 1); // Last 1 day
    
    const query = `
      SELECT 
        g.id,
        g.title,
        g.goal_type,
        COUNT(a.id) as activity_count,
        AVG(CAST(a.signal_score AS FLOAT)) as avg_signal_score,
        SUM(CASE WHEN a.classification = 'SINAL' THEN 1 ELSE 0 END) as signal_count,
        SUM(CASE WHEN a.classification = 'RUÍDO' THEN 1 ELSE 0 END) as noise_count
      FROM goals g
      LEFT JOIN activity_goals ag ON g.id = ag.goal_id
      LEFT JOIN activities a ON ag.activity_id = a.id
      WHERE g.user_id = ? 
        AND (a.created_at IS NULL OR a.created_at >= ?)
      GROUP BY g.id, g.title, g.goal_type
      HAVING activity_count > 0
      ORDER BY signal_count DESC, avg_signal_score DESC
      LIMIT 10
    `;
    
    console.log('Executing query with userId:', userId, 'and dateLimit:', dateLimit.toISOString());
    
    db.all(query, [userId, dateLimit.toISOString()], (err, rows) => {
      if (err) {
        console.error('Error executing query:', err);
      } else {
        console.log('Query results:', rows);
      }
      
      db.close();
    });
  });
});