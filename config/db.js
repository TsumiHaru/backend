// db.js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test de connexion
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connexion MySQL réussie');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Erreur MySQL:', error.message);
    return false;
  }
}

export default pool;