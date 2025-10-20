// models/user.model.js
import pool from '../config/db.js';

export async function createUserInDB(userData) {
  const { email, name, password, role = 'user' } = userData;
  
  const [result] = await pool.query(
    'INSERT INTO users (email, name, password, role, status) VALUES (?, ?, ?, ?, ?)',
    [email, name, password, role, 'pending']
  );
  
  return {
    id: result.insertId,
    email,
    name,
    role
  };
}

export async function getUserByEmailFromDB(email) {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );
  
  return rows[0] || null;
}

export async function getUserByIdFromDB(id) {
  const [rows] = await pool.query(
    'SELECT id, email, name, role FROM users WHERE id = ?',
    [id]
  );
  
  return rows[0] || null;
}