// EventRegistration.js - Modèle pour les inscriptions aux événements
import pool from '../config/db.js';

export class EventRegistration {
  constructor(data) {
    this.id = data.id;
    this.userId = data.user_id;
    this.eventId = data.event_id;
    this.status = data.status || 'Inscrit'; // Inscrit, Annulé, Présent
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  // Créer une nouvelle inscription
  static async create(userId, eventId) {
    // Vérifier si l'utilisateur est déjà inscrit
    const existingRegistration = await this.findByUserAndEvent(userId, eventId);
    if (existingRegistration) {
      throw new Error('Vous êtes déjà inscrit à cet événement');
    }

    const [result] = await pool.query(
      'INSERT INTO event_registrations (user_id, event_id, status, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
      [userId, eventId, 'Inscrit']
    );

    return new EventRegistration({
      id: result.insertId,
      user_id: userId,
      event_id: eventId,
      status: 'Inscrit'
    });
  }

  // Trouver une inscription par utilisateur et événement
  static async findByUserAndEvent(userId, eventId) {
    const [rows] = await pool.query(
      'SELECT * FROM event_registrations WHERE user_id = ? AND event_id = ?',
      [userId, eventId]
    );
    
    if (rows.length === 0) return null;
    return new EventRegistration(rows[0]);
  }

  // Trouver toutes les inscriptions d'un utilisateur
  static async findByUser(userId) {
    const [rows] = await pool.query(`
      SELECT er.*, e.title, e.date, e.location, e.lat, e.lng
      FROM event_registrations er
      JOIN events e ON er.event_id = e.id
      WHERE er.user_id = ?
      ORDER BY er.created_at DESC
    `, [userId]);
    
    return rows.map(row => ({
      ...new EventRegistration(row),
      eventTitle: row.title,
      eventDate: row.date,
      eventLocation: row.location,
      eventLat: row.lat,
      eventLng: row.lng
    }));
  }

  // Trouver toutes les inscriptions d'un événement
  static async findByEvent(eventId) {
    const [rows] = await pool.query(`
      SELECT er.*, u.name, u.email
      FROM event_registrations er
      JOIN users u ON er.user_id = u.id
      WHERE er.event_id = ?
      ORDER BY er.created_at DESC
    `, [eventId]);
    
    return rows.map(row => ({
      ...new EventRegistration(row),
      userName: row.name,
      userEmail: row.email
    }));
  }

  // Mettre à jour le statut d'une inscription
  async updateStatus(status) {
    await pool.query(
      'UPDATE event_registrations SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, this.id]
    );
    this.status = status;
  }

  // Supprimer une inscription
  async delete() {
    await pool.query('DELETE FROM event_registrations WHERE id = ?', [this.id]);
  }

  // Obtenir les statistiques d'un événement
  static async getEventStats(eventId) {
    // Count both French and English status variants to be resilient
    // approved: 'Présent' or 'approved'
    // pending: 'Inscrit' or 'pending'
    // rejected: 'Annulé' or 'rejected'
    const [rows] = await pool.query(`
      SELECT 
        COUNT(*) as total_registrations,
        SUM(CASE WHEN status IN ('Présent', 'present', 'approved') THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN status IN ('Inscrit', 'inscrit', 'pending') THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status IN ('Annulé', 'Annule', 'annulé', 'annule', 'rejected') THEN 1 ELSE 0 END) as rejected_count
      FROM event_registrations 
      WHERE event_id = ?
    `, [eventId]);

    return rows[0];
  }

  // Obtenir les données publiques
  toPublicJSON() {
    return {
      id: this.id,
      userId: this.userId,
      eventId: this.eventId,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
