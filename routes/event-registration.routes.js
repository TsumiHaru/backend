// event-registration.routes.js - Routes pour les inscriptions aux événements
import express from 'express';
import { EventRegistration } from '../models/EventRegistration.js';
import authService from '../middleware/auth.js';
import pool from '../config/db.js';
import Joi from 'joi';

const router = express.Router();

// Schémas de validation
const joinEventSchema = Joi.object({
  eventId: Joi.number().integer().positive().required()
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('approved', 'rejected', 'Présent', 'Annulé', 'Inscrit').required()
});

// Route pour rejoindre un événement
router.post('/join/:eventId', 
  authService.authenticateToken.bind(authService),
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const userId = req.user.userId;

      const registration = await EventRegistration.create(userId, eventId);
      
      res.status(201).json({
        message: 'Inscription à l\'événement réussie. En attente d\'approbation.',
        registration: registration.toPublicJSON()
      });
    } catch (error) {
      console.error('Erreur inscription événement:', error);
      res.status(400).json({ error: error.message });
    }
  }
);

// Route pour quitter un événement
router.delete('/leave/:eventId',
  authService.authenticateToken.bind(authService),
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const userId = req.user.userId;

      const registration = await EventRegistration.findByUserAndEvent(userId, eventId);
      
      if (!registration) {
        return res.status(404).json({ error: 'Inscription non trouvée' });
      }

      await registration.delete();
      
      res.json({ message: 'Vous avez quitté l\'événement' });
    } catch (error) {
      console.error('Erreur sortie événement:', error);
      res.status(500).json({ error: 'Erreur lors de la sortie de l\'événement' });
    }
  }
);

// Route pour obtenir les inscriptions d'un utilisateur
router.get('/my-registrations',
  authService.authenticateToken.bind(authService),
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const registrations = await EventRegistration.findByUser(userId);
      
      res.json({ registrations });
    } catch (error) {
      console.error('Erreur récupération inscriptions:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des inscriptions' });
    }
  }
);

// Route pour obtenir les inscriptions d'un événement (admin)
router.get('/event/:eventId',
  authService.authenticateToken.bind(authService),
  authService.requireRole(['admin']),
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const registrations = await EventRegistration.findByEvent(eventId);
      const stats = await EventRegistration.getEventStats(eventId);
      
      res.json({ registrations, stats });
    } catch (error) {
      console.error('Erreur récupération inscriptions événement:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des inscriptions' });
    }
  }
);

// Route pour approuver/rejeter une inscription (admin)
router.put('/:registrationId/status',
  authService.authenticateToken.bind(authService),
  authService.requireRole(['admin']),
  async (req, res) => {
    try {
      const { registrationId } = req.params;
      const { status } = req.body;

      // Trouver l'inscription
      const [rows] = await pool.query(
        'SELECT * FROM event_registrations WHERE id = ?',
        [registrationId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Inscription non trouvée' });
      }

      const registration = new EventRegistration(rows[0]);
      await registration.updateStatus(status);
      
      res.json({
        message: `Inscription ${status === 'approved' ? 'approuvée' : 'rejetée'}`,
        registration: registration.toPublicJSON()
      });
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour du statut' });
    }
  }
);

// Route pour obtenir les statistiques globales (admin)
router.get('/stats',
  authService.authenticateToken.bind(authService),
  authService.requireRole(['admin']),
  async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT 
          COUNT(*) as total_registrations,
          SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count
        FROM event_registrations
      `);
      
      res.json({ stats: rows[0] });
    } catch (error) {
      console.error('Erreur récupération statistiques:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
    }
  }
);

export default router;
