// events.routes.js - Routes pour les événements avec base de données
import express from 'express';
import { Event } from '../models/Event.js';
import authService from '../middleware/auth.js';
import { SecurityConfig } from '../middleware/security-config.js';
import pool from '../config/db.js';
import Joi from 'joi';

const router = express.Router();

// Schémas de validation
const eventSchema = Joi.object({
  title: Joi.string().min(3).max(100).required(),
  description: Joi.string().min(10).max(1000).required(),
  date: Joi.date().iso().required(),
  location: Joi.string().min(3).max(200).required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  maxParticipants: Joi.number().integer().min(1).max(1000).optional()
});

// Route publique - Obtenir tous les événements
router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0, lat, lng, radius = 50 } = req.query;
    
    let events;
    if (lat && lng) {
      // Recherche par localisation
      events = await Event.findByLocation(parseFloat(lat), parseFloat(lng), parseInt(radius));
    } else {
      // Tous les événements
      events = await Event.findAll(parseInt(limit), parseInt(offset));
    }
    
    res.json({
      events: events.map(event => event.toPublicJSON()),
      total: events.length
    });
  } catch (error) {
    console.error('Erreur récupération événements:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des événements' });
  }
});

// Route publique - Obtenir un événement par ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    
    if (!event) {
      return res.status(404).json({ error: 'Événement non trouvé' });
    }
    
    if (!event.isActive) {
      return res.status(404).json({ error: 'Événement supprimé' });
    }
    
    // Obtenir les participants
    const participants = await event.getParticipants();
    
    res.json({
      event: event.toPublicJSON(),
      participants: participants.map(p => ({
        id: p.id,
        name: p.name,
        joinedAt: p.joined_at
      }))
    });
  } catch (error) {
    console.error('Erreur récupération événement:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'événement' });
  }
});

// Route protégée - Créer un événement
router.post('/',
  authService.authenticateToken.bind(authService),
  SecurityConfig.validateInput(eventSchema),
  async (req, res) => {
    try {
      const eventData = {
        ...req.body,
        createdBy: req.user.userId
      };
      
      const event = await Event.create(eventData);
      
      res.status(201).json({
        message: 'Événement créé avec succès',
        event: event.toPublicJSON()
      });
    } catch (error) {
      console.error('Erreur création événement:', error);
      res.status(500).json({ error: 'Erreur lors de la création de l\'événement' });
    }
  }
);

// Route protégée - Mettre à jour un événement
router.put('/:id',
  authService.authenticateToken.bind(authService),
  SecurityConfig.validateInput(eventSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      const event = await Event.findById(id);
      
      if (!event) {
        return res.status(404).json({ error: 'Événement non trouvé' });
      }
      
      // Vérifier que l'utilisateur est le créateur ou un admin
      if (event.createdBy !== req.user.userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Vous n\'êtes pas autorisé à modifier cet événement' });
      }
      
      await event.update(req.body);
      
      res.json({
        message: 'Événement mis à jour avec succès',
        event: event.toPublicJSON()
      });
    } catch (error) {
      console.error('Erreur mise à jour événement:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'événement' });
    }
  }
);

// Route protégée - Supprimer un événement
router.delete('/:id',
  authService.authenticateToken.bind(authService),
  async (req, res) => {
    try {
      const { id } = req.params;
      const event = await Event.findById(id);
      
      if (!event) {
        return res.status(404).json({ error: 'Événement non trouvé' });
      }
      
      // Vérifier que l'utilisateur est le créateur ou un admin
      if (event.createdBy !== req.user.userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Vous n\'êtes pas autorisé à supprimer cet événement' });
      }
      
      await event.delete();
      
      res.json({ message: 'Événement supprimé avec succès' });
    } catch (error) {
      console.error('Erreur suppression événement:', error);
      res.status(500).json({ error: 'Erreur lors de la suppression de l\'événement' });
    }
  }
);

// Route protégée - Rejoindre un événement
router.post('/:id/join',
  authService.authenticateToken.bind(authService),
  async (req, res) => {
    try {
      const { id } = req.params;
      const event = await Event.findById(id);
      
      if (!event) {
        return res.status(404).json({ error: 'Événement non trouvé' });
      }
      
      if (!event.isActive) {
        return res.status(400).json({ error: 'Événement supprimé' });
      }
      
      await event.joinEvent(req.user.userId);
      
      res.json({ 
        message: 'Vous avez rejoint l\'événement avec succès',
        currentParticipants: event.currentParticipants
      });
    } catch (error) {
      console.error('Erreur rejoindre événement:', error);
      res.status(400).json({ error: error.message });
    }
  }
);

// Route protégée - Quitter un événement
router.post('/:id/leave',
  authService.authenticateToken.bind(authService),
  async (req, res) => {
    try {
      const { id } = req.params;
      const event = await Event.findById(id);
      
      if (!event) {
        return res.status(404).json({ error: 'Événement non trouvé' });
      }
      
      await event.leaveEvent(req.user.userId);
      
      res.json({ 
        message: 'Vous avez quitté l\'événement avec succès',
        currentParticipants: event.currentParticipants
      });
    } catch (error) {
      console.error('Erreur quitter événement:', error);
      res.status(400).json({ error: error.message });
    }
  }
);

// Route protégée - Obtenir les événements de l'utilisateur
router.get('/user/my-events',
  authService.authenticateToken.bind(authService),
  async (req, res) => {
    try {
      const { limit = 50, offset = 0 } = req.query;
      
      const [rows] = await pool.query(
        `SELECT e.*, u.name as creator_name 
         FROM events e 
         LEFT JOIN users u ON e.created_by = u.id 
         WHERE e.created_by = ? AND e.is_active = 1 
         ORDER BY e.date ASC 
         LIMIT ? OFFSET ?`,
        [req.user.userId, parseInt(limit), parseInt(offset)]
      );
      
      const events = rows.map(row => new Event(row));
      
      res.json({
        events: events.map(event => event.toPublicJSON()),
        total: events.length
      });
    } catch (error) {
      console.error('Erreur récupération événements utilisateur:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération de vos événements' });
    }
  }
);

export default router;