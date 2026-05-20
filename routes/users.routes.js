import express from 'express';
import authService from '../middleware/auth.js';
import { User } from '../models/User.js';

const router = express.Router();

router.get('/',
  authService.authenticateToken.bind(authService),
  authService.requireRole(['admin']),
  async (req, res) => {
    try {
      const users = await User.findAll(100, 0);
      res.json({
        message: 'Liste des utilisateurs',
        users: users.map(user => user.toPublicJSON())
      });
    } catch {
      res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
    }
  }
);

router.get('/:id',
  authService.authenticateToken.bind(authService),
  authService.requireRole(['admin', 'moderator']),
  async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({
      message: 'Utilisateur trouvé',
      user: user.toPublicJSON()
    });
  }
);

router.put('/:id',
  authService.authenticateToken.bind(authService),
  authService.requireRole(['admin']),
  (req, res) => {
    res.json({
      message: `Utilisateur ${req.params.id} modifié avec succès`,
      user: req.body
    });
  }
);

router.delete('/:id',
  authService.authenticateToken.bind(authService),
  authService.requireRole(['admin']),
  (req, res) => {
    res.json({
      message: `Utilisateur ${req.params.id} supprimé avec succès`
    });
  }
);

export default router;
