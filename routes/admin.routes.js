import express from 'express';
import { User } from '../models/User.js';
import { EventRegistration } from '../models/EventRegistration.js';
import authService from '../middleware/auth.js';
import pool from '../config/db.js';
import Joi from 'joi';

const router = express.Router();

const requireAdmin = authService.requireRole(['admin']);

const createEventSchema = Joi.object({
  title: Joi.string().min(3).max(255).required(),
  date: Joi.date().required(),
  location: Joi.string().min(3).max(255).required(),
  lat: Joi.number().required(),
  lng: Joi.number().required(),
  image: Joi.string().max(255).default('default.jpg'),
  status: Joi.string().valid('Ouvert', 'Fermé', 'Complet', 'Annulé').default('Ouvert'),
  participants: Joi.number().integer().min(0).default(0),
  description: Joi.string().allow('')
});

const updateUserSchema = Joi.object({
  status: Joi.string().valid('pending', 'active', 'banned').required()
});

router.get('/stats', 
  authService.authenticateToken.bind(authService),
  requireAdmin,
  async (req, res) => {
    try {
      const [userStats] = await pool.query(`
        SELECT 
          COUNT(*) as total_users,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_users,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_users,
          SUM(CASE WHEN status = 'banned' THEN 1 ELSE 0 END) as banned_users
        FROM users
      `);

      const [eventStats] = await pool.query(`
        SELECT 
          COUNT(*) as total_events,
          SUM(CASE WHEN status = 'Ouvert' THEN 1 ELSE 0 END) as open_events,
          SUM(CASE WHEN status = 'Fermé' THEN 1 ELSE 0 END) as closed_events,
          SUM(CASE WHEN status = 'Complet' THEN 1 ELSE 0 END) as full_events
        FROM events
      `);

      const [registrationStats] = await pool.query(`
        SELECT 
          COUNT(*) as total_registrations,
          SUM(CASE WHEN status = 'approved' OR status = 'Présent' THEN 1 ELSE 0 END) as approved_registrations,
          SUM(CASE WHEN status = 'pending' OR status = 'Inscrit' THEN 1 ELSE 0 END) as pending_registrations,
          SUM(CASE WHEN status = 'rejected' OR status = 'Annulé' THEN 1 ELSE 0 END) as rejected_registrations
        FROM event_registrations
      `);

      res.json({
        users: userStats[0],
        events: eventStats[0],
        registrations: registrationStats[0]
      });
    } catch (error) {
      console.error('Erreur récupération statistiques:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
    }
  }
);

router.get('/users',
  authService.authenticateToken.bind(authService),
  requireAdmin,
  async (req, res) => {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const offset = (page - 1) * limit;
      
      let query = 'SELECT id, name, email, role, status, email_verified_at, created_at FROM users';
      let params = [];
      
      if (status) {
        query += ' WHERE status = ?';
        params.push(status);
      }
      
      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);

      const [rows] = await pool.query(query, params);
      
      let countQuery = 'SELECT COUNT(*) as total FROM users';
      let countParams = [];
      if (status) {
        countQuery += ' WHERE status = ?';
        countParams.push(status);
      }
      
      const [countResult] = await pool.query(countQuery, countParams);
      
      res.json({
        users: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / limit)
        }
      });
    } catch (error) {
      console.error('Erreur récupération utilisateurs:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
    }
  }
);

router.put('/users/:userId/status',
  authService.authenticateToken.bind(authService),
  requireAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { status } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      await pool.query(
        'UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?',
        [status, userId]
      );

      res.json({ message: `Statut de l'utilisateur mis à jour: ${status}` });
    } catch (error) {
      console.error('Erreur mise à jour utilisateur:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'utilisateur' });
    }
  }
);

router.delete('/users/:userId',
  authService.authenticateToken.bind(authService),
  requireAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      await pool.query('DELETE FROM event_registrations WHERE user_id = ?', [userId]);
      
      await pool.query('DELETE FROM users WHERE id = ?', [userId]);

      res.json({ message: 'Utilisateur supprimé avec succès' });
    } catch (error) {
      console.error('Erreur suppression utilisateur:', error);
      res.status(500).json({ error: 'Erreur lors de la suppression de l\'utilisateur' });
    }
  }
);

router.post('/events',
  authService.authenticateToken.bind(authService),
  requireAdmin,
  async (req, res) => {
    try {
      const eventData = req.body;
      const { error, value } = createEventSchema.validate(eventData);

      if (error) {
        return res.status(400).json({
          error: error.details.map(detail => detail.message).join(', ')
        });
      }

      const eventDate = typeof value.date === 'string'
        ? value.date.split('T')[0]
        : value.date.toISOString().slice(0, 10);
      
      const [result] = await pool.query(
        `INSERT INTO events (title, date, location, lat, lng, image, status, participants, description) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          value.title,
          eventDate,
          value.location,
          value.lat,
          value.lng,
          value.image || 'default.jpg',
          value.status || 'Ouvert',
          value.participants || 0,
          value.description || ''
        ]
      );

      res.status(201).json({
        message: 'Événement créé avec succès',
        eventId: result.insertId
      });
    } catch (error) {
      console.error('Erreur création événement:', error);
      res.status(500).json({ error: 'Erreur lors de la création de l\'événement' });
    }
  }
);

router.get('/registrations/pending',
  authService.authenticateToken.bind(authService),
  requireAdmin,
  async (req, res) => {
    try {
      const [allRows] = await pool.query(`
        SELECT 
          er.id,
          er.user_id,
          er.event_id,
          er.status,
          er.created_at,
          u.name as user_name,
          u.email as user_email,
          e.title as event_title,
          e.date as event_date,
          e.location as event_location
        FROM event_registrations er
        JOIN users u ON er.user_id = u.id
        JOIN events e ON er.event_id = e.id
        ORDER BY er.created_at DESC
      `);
      
      const pendingRows = allRows.filter(row => 
        row.status === 'pending' || row.status === 'Inscrit' || row.status === 'inscrit'
      );
      
      res.json({ registrations: pendingRows });
    } catch (error) {
      console.error('Erreur récupération inscriptions:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des inscriptions' });
    }
  }
);

router.put('/registrations/:registrationId/status',
  authService.authenticateToken.bind(authService),
  requireAdmin,
  async (req, res) => {
    try {
      const { registrationId } = req.params;
      const { status } = req.body;

      if (!['approved', 'rejected', 'Présent', 'Annulé'].includes(status)) {
        return res.status(400).json({ error: 'Statut invalide' });
      }

      const statusMap = {
        'approved': 'Présent',
        'rejected': 'Annulé'
      };
      
      const finalStatus = statusMap[status] || status;

      await pool.query(
        'UPDATE event_registrations SET status = ?, updated_at = NOW() WHERE id = ?',
        [finalStatus, registrationId]
      );

      res.json({ 
        message: `Inscription ${finalStatus === 'Présent' ? 'approuvée' : 'rejetée'}` 
      });
    } catch (error) {
      console.error('Erreur mise à jour inscription:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'inscription' });
    }
  }
);

export default router;
