// public.routes.js - Routes publiques
import express from 'express';
import authService from '../middleware/auth.js';

const router = express.Router();

// Route de santé du serveur
router.get('/health', (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Route avec API Key
router.get('/public-data',
  authService.validateApiKey.bind(authService),
  (req, res) => {
    res.json({ 
      data: 'Données publiques pour services externes',
      timestamp: new Date().toISOString()
    });
  }
);

// Route d'information sur l'API
router.get('/info', (req, res) => {
  res.json({
    name: 'Au Fil des Sentiers API',
    version: '1.0.0',
    description: 'API sécurisée pour la gestion des événements',
    endpoints: {
      auth: '/api/auth',
      events: '/api/events',
      users: '/api/users',
      public: '/api/public'
    }
  });
});

// Public: get minimal public user info by id
router.get('/user/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const pool = (await import('../config/db.js')).default;
    const [rows] = await pool.query('SELECT id, name, created_at FROM users WHERE id = ? LIMIT 1', [id]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    const user = rows[0];
    res.json({ user });
  } catch (err) {
    console.error('Erreur public user:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
