// Event.js - Modèle événement avec base de données MySQL
import pool from '../config/db.js';

export class Event {
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.date = data.date;
    this.location = data.location;
    this.lat = data.lat;
    this.lng = data.lng;
    this.image = data.image;
    this.status = data.status;
    this.participants = data.participants;
  }

  // Obtenir tous les événements
  static async findAll(limit = 50, offset = 0) {
    const [rows] = await pool.query(
      `SELECT * FROM events ORDER BY date ASC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    return rows.map(row => new Event(row));
  }

  // Trouver un événement par ID
  static async findById(id) {
    const [rows] = await pool.query(
      'SELECT * FROM events WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) return null;
    return new Event(rows[0]);
  }

  // Créer un nouvel événement
  static async create(eventData) {
    const { title, description, date, location, lat, lng, image = 'default.jpg' } = eventData;
    
    const [result] = await pool.query(
      `INSERT INTO events (title, description, date, location, lat, lng, image, status, participants) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Ouvert', 0)`,
      [title, description, date, location, lat, lng, image]
    );

    return await this.findById(result.insertId);
  }

  // Mettre à jour un événement
  async update(updateData) {
    const allowedFields = ['title', 'description', 'date', 'location', 'lat', 'lng', 'image', 'status'];
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
      `UPDATE events SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    Object.assign(this, updateData);
  }

  // Supprimer un événement
  async delete() {
    await pool.query('DELETE FROM events WHERE id = ?', [this.id]);
  }

  // Obtenir les données publiques
  toPublicJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      date: this.date,
      location: this.location,
      lat: this.lat,
      lng: this.lng,
      image: this.image,
      status: this.status,
      participants: this.participants
    };
  }
}