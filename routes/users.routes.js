// users.routes.js - Routes pour les utilisateurs
import express from 'express';
import authService from '../middleware/auth.js';
import { getUserById, testUsers } from '../models/test-users.js';

const router = express.Router();

// Route protégée pour obtenir la liste des utilisateurs (admin seulement)
router.get('/',
  authService.authenticateToken.bind(authService),
  authService.requireRole(['admin']),
  (req, res) => {
    const users = testUsers.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }));
    
    res.json({
      message: 'Liste des utilisateurs',
      users
    });
  }
);

// Route protégée pour obtenir un utilisateur spécifique
router.get('/:id',
  authService.authenticateToken.bind(authService),
  authService.requireRole(['admin', 'moderator']),
  (req, res) => {
    const user = getUserById(parseInt(req.params.id));
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    res.json({
      message: 'Utilisateur trouvé',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  }
);

// Route protégée pour modifier un utilisateur
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

// Route protégée pour supprimer un utilisateur
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
