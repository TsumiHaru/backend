// User.js - Modèle utilisateur avec base de données MySQL
import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export class User {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.password = data.password;
    this.name = data.name;
    this.role = data.role || 'user';
    this.status = data.status || 'pending';
    this.emailVerifiedAt = data.email_verified_at;
    this.rememberToken = data.remember_token;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  // Créer un nouvel utilisateur
  static async create(userData) {
    const { email, password, name, role = 'user' } = userData;
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new Error('Un utilisateur avec cet email existe déjà');
    }

    // Hasher le mot de passe
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const [result] = await pool.query(
      `INSERT INTO users (email, password, name, role, status, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [email, hashedPassword, name, role, 'pending']
    );

    return new User({
      id: result.insertId,
      email,
      name,
      role,
      status: 'pending'
    });
  }

  // Trouver un utilisateur par email
  static async findByEmail(email) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (rows.length === 0) return null;
    return new User(rows[0]);
  }

  // Trouver un utilisateur par ID
  static async findById(id) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) return null;
    return new User(rows[0]);
  }

  // Vérifier le mot de passe
  async verifyPassword(password) {
    return await bcrypt.compare(password, this.password);
  }

  // Marquer l'utilisateur comme vérifié
  async markAsVerified() {
    await pool.query(
      'UPDATE users SET status = ?, email_verified_at = NOW(), updated_at = NOW() WHERE id = ?',
      ['active', this.id]
    );
    this.status = 'active';
    this.emailVerifiedAt = new Date();
  }

  // Mettre à jour le profil
  async update(updateData) {
    const allowedFields = ['name', 'email'];
    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updates.length === 0) return;

    values.push(this.id);
    await pool.query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    );

    // Mettre à jour l'objet
    Object.assign(this, updateData);
  }

  // Supprimer l'utilisateur
  async delete() {
    await pool.query('DELETE FROM users WHERE id = ?', [this.id]);
  }

  // Obtenir tous les utilisateurs (admin)
  static async findAll(limit = 50, offset = 0) {
    const [rows] = await pool.query(
      'SELECT id, email, name, role, status, email_verified_at, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    
    return rows.map(row => new User(row));
  }

  // Changer le mot de passe
  async changePassword(newPassword) {
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

  await pool.query(
    'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
    [hashedPassword, this.id]
  );

  this.password = hashedPassword;
  }

  // Réinitialiser le mot de passe
async resetPassword(newPassword) {
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

  await pool.query(
    'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
    [hashedPassword, this.id]
  );

  this.password = hashedPassword;
}

  // Obtenir les données publiques (sans mot de passe)
  toPublicJSON() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      role: this.role,
      status: this.status,
      emailVerifiedAt: this.emailVerifiedAt,
      createdAt: this.createdAt
    };
  }
}
