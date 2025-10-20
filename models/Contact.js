import pool from '../config/db.js';

export async function createContact({ name, email, subject, message }) {
  const sql = `INSERT INTO contacts (name, email, subject, message) VALUES (?, ?, ?, ?)`;
  const [result] = await pool.query(sql, [name, email, subject || null, message]);
  return { id: result.insertId };
}

export async function listContacts({ limit = 100, offset = 0 } = {}) {
  const sql = `SELECT id, name, email, subject, message, created_at, is_read FROM contacts ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  const [rows] = await pool.query(sql, [Number(limit), Number(offset)]);
  return rows;
}

export async function markContactRead(id) {
  const sql = `UPDATE contacts SET is_read = 1 WHERE id = ?`;
  await pool.query(sql, [id]);
}
