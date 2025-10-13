// server/index.js
import express from "express";
import pkg from "pg";
const { Pool } = pkg;

const app = express();
const pool = new Pool({
  user: process.env.DATABASE_USER,
  host: "localhost",
  database: "call_log",
  password: process.env.DATABASE_PASSWORD,
  port: 5432,
});

app.use(express.json());

// Validation middleware for table names to prevent SQL injection
const validateTableName = (req, res, next) => {
  const tableName = req.params.table;
  // Only allow alphanumeric characters and underscores
  if (!tableName.match(/^[a-zA-Z0-9_]+$/)) {
    return res.status(400).json({ error: "Invalid table name" });
  }
  next();
};

// Legacy endpoints for call_log_names
// Get rows
app.get("/api/rows", async (req, res) => {
  const result = await pool.query("SELECT * FROM call_log_names");
  console.log("get from call_log_names");
  res.json(result.rows);
});

// Update row
app.put("/api/rows/:id", async (req, res) => {
  console.log("put to call_log_names");
  const { id } = req.params;
  const { column, value } = req.body;
  await pool.query(`UPDATE call_log_names SET ${column} = $1 WHERE id = $2`, [value, id]);
  res.sendStatus(200);
});

// New generic endpoints that work with any table
// Get rows from any table
app.get("/api/tables/:table/rows", validateTableName, async (req, res) => {
  try {
    const { table } = req.params;
    const result = await pool.query(`SELECT * FROM ${table}`);
    console.log(`get from ${table}`);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error", details: error.message });
  }
});

// Update row in any table
app.put("/api/tables/:table/rows/:id", validateTableName, async (req, res) => {
  try {
    const { table, id } = req.params;
    const { column, value } = req.body;
    
    // Validate column name to prevent SQL injection
    if (!column.match(/^[a-zA-Z0-9_]+$/)) {
      return res.status(400).json({ error: "Invalid column name" });
    }

    console.log(`put to ${table}`);
    await pool.query(`UPDATE ${table} SET ${column} = $1 WHERE id = $2`, [value, id]);
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error", details: error.message });
  }
});

// List available tables
app.get("/api/tables", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    res.json(result.rows.map(row => row.table_name));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error", details: error.message });
  }
});

// Get table structure
app.get("/api/tables/:table/structure", validateTableName, async (req, res) => {
  try {
    const { table } = req.params;
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [table]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error", details: error.message });
  }
});

app.listen(4000, () => console.log("Server running on http://localhost:4000"));

