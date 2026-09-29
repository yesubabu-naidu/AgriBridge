import mysql from 'mysql2/promise';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

const isPostgres = String(process.env.DB_TYPE || '').toLowerCase() === 'postgres';
let mysqlPool = null;
let pgPool = null;

if (isPostgres) {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  pgPool = new pg.Pool(connectionString ? {
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  } : {
    host: process.env.DB_HOST || 'localhost', user: process.env.DB_USER || 'postgres', password: process.env.DB_PASSWORD || '', database: process.env.DB_NAME || 'agribridge', port: Number(process.env.DB_PORT) || 5432
  });
} else {
  mysqlPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost', user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '', database: process.env.DB_NAME || 'agribridge', port: Number(process.env.DB_PORT) || 3306,
    waitForConnections: true, connectionLimit: 10, queueLimit: 0
  });
}

export async function query(sql, params = []) {
  try {
    if (!isPostgres) {
      const [rows] = await mysqlPool.execute(sql, params);
      return rows;
    }
    let index = 1;
    let pgSql = sql.replace(/\?/g, () => `$${index++}`);
    const command = sql.trim().toUpperCase();
    if (command.startsWith('INSERT') && !/\bRETURNING\b/i.test(pgSql)) pgSql = `${pgSql.replace(/;\s*$/, '')} RETURNING id`;
    const result = await pgPool.query(pgSql, params);
    if (command.startsWith('INSERT')) return { insertId: result.rows[0]?.id, affectedRows: result.rowCount };
    if (command.startsWith('UPDATE') || command.startsWith('DELETE')) return { affectedRows: result.rowCount };
    return result.rows;
  } catch (error) {
    console.error(`Database query failed (${isPostgres ? 'PostgreSQL' : 'MySQL'}):`, error.message);
    throw error;
  }
}

(async () => {
  try {
    if (isPostgres) {
      await pgPool.query('CREATE TABLE IF NOT EXISTS weather_cache (id SERIAL PRIMARY KEY, location VARCHAR(150) NOT NULL, latitude NUMERIC(10,7) NOT NULL, longitude NUMERIC(10,7) NOT NULL, forecast_json TEXT NOT NULL, ai_analysis_json TEXT NULL, fetched_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, expires_at TIMESTAMPTZ NOT NULL)');
    } else {
      await mysqlPool.query('CREATE TABLE IF NOT EXISTS weather_cache (id INT AUTO_INCREMENT PRIMARY KEY, location VARCHAR(150) NOT NULL, latitude DECIMAL(10,7) NOT NULL, longitude DECIMAL(10,7) NOT NULL, forecast_json LONGTEXT NOT NULL, ai_analysis_json LONGTEXT NULL, fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, expires_at TIMESTAMP NOT NULL, INDEX idx_location (location, expires_at), INDEX idx_coords (latitude, longitude)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
    }
  } catch (error) {
    console.error('Weather cache initialization failed:', error.message);
  }
})();

export async function withTransaction(work) {
  const connection = isPostgres ? await pgPool.connect() : await mysqlPool.getConnection();
  const transactionQuery = async (sql, params = []) => {
    if (!isPostgres) {
      const [rows] = await connection.execute(sql, params);
      return rows;
    }
    let index = 1;
    let pgSql = sql.replace(/\?/g, () => String.fromCharCode(36) + index++);
    const command = sql.trim().toUpperCase();
    if (command.startsWith("INSERT") && !/\bRETURNING\b/i.test(pgSql)) pgSql = pgSql.replace(/;\s*$/, "") + " RETURNING id";
    const result = await connection.query(pgSql, params);
    if (command.startsWith("INSERT")) return { insertId: result.rows[0]?.id, affectedRows: result.rowCount };
    if (command.startsWith("UPDATE") || command.startsWith("DELETE")) return { affectedRows: result.rowCount };
    return result.rows;
  };
  try {
    await connection.query("BEGIN");
    const result = await work(transactionQuery);
    await connection.query("COMMIT");
    return result;
  } catch (error) {
    try { await connection.query("ROLLBACK"); } catch {}
    throw error;
  } finally {
    connection.release();
  }
}

export default isPostgres ? pgPool : mysqlPool;
