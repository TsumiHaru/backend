// auth.routes.js - Routes d'authentification avec base de données
import express from 'express';
import { User } from '../models/User.js';
import authService from '../middleware/auth.js';
import emailService from '../services/emailService.js';
import { SecurityConfig } from '../middleware/security-config.js';
import rateLimit from 'express-rate-limit';
import pool from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';
import * as passwordResetController from '../controllers/passwordResetController.js';
import { authenticateToken } from '../middleware/auth.js'; // pour la modification de mot de passe connecté


const router = express.Router();

// Limiter pour le renvoi d'email de vérification: 3 par heure par IP
const resendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: { error: 'Trop de demandes de renvoi, réessayez dans une heure' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Schémas de validation
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().min(2).max(50).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Route d'inscription avec vérification email
router.post('/register', 
  SecurityConfig.validateInput(registerSchema),
  async (req, res) => {
    try {
      const { email, password, name } = req.body;
      
      // Créer l'utilisateur (doit être en 'pending')
        const user = await User.create({ email, password, name, role: 'user' });
        console.log('Utilisateur créé (post-register):', { id: user.id, email: user.email, status: user.status });

        // Safety: if for any reason the created user is not 'pending', force it to pending
        if (!user.status || user.status === 'active') {
          // Only enforce when in development to avoid unexpected production changes
          if (process.env.NODE_ENV !== 'production') {
            await pool.query('UPDATE users SET status = ? WHERE id = ?', ['pending', user.id]);
            user.status = 'pending';
            console.log('Correction: statut utilisateur forcé à pending pour vérification');
          }
        }

        // Générer un token de vérification et le stocker en base
        const verificationToken = uuidv4();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Supprimer d'éventuels anciens tokens pour cet utilisateur
        await pool.query('DELETE FROM email_verification_tokens WHERE user_id = ?', [user.id]);

        await pool.query(
          'INSERT INTO email_verification_tokens (user_id, token, expires_at, created_at) VALUES (?, ?, ?, NOW())',
          [user.id, verificationToken, expiresAt.toISOString().slice(0, 19).replace('T', ' ')]
        );
        console.log('Token créé pour user:', user.id, 'token:', verificationToken, 'expiresAt:', expiresAt.toISOString());

        // Envoyer l'email de vérification
        try {
          await emailService.sendVerificationEmail(email, name, verificationToken);
        } catch (emailErr) {
          console.error('Erreur envoi email vérification:', emailErr);
          // Ne pas bloquer la création de l'utilisateur si l'email échoue, mais informer
          return res.status(201).json({ message: 'Utilisateur créé, mais l\'envoi de l\'email a échoué. Réessayez plus tard.' });
        }

        res.status(201).json({ 
          message: 'Utilisateur créé. Un email de vérification a été envoyé.'
        });
    } catch (error) {
      console.error('Erreur registration:', error);
      res.status(400).json({ error: error.message });
    }
  }
);

// Route de connexion
router.post('/login', 
  SecurityConfig.validateInput(loginSchema),
  async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await User.findByEmail(email);
      
      if (!user) {
        return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
      }

      if (!await user.verifyPassword(password)) {
        return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
      }

      if (user.status !== 'active') {
        return res.status(401).json({ 
          error: 'Compte non vérifié. Vérifiez votre email pour activer votre compte.',
          needsVerification: true
        });
      }

      const tokens = authService.generateTokens(user);
      
      res.json({
        message: 'Connexion réussie',
        user: user.toPublicJSON(),
        ...tokens
      });
    } catch (error) {
      console.error('Erreur login:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// Route de vérification d'email
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token de vérification requis' });
    }
    console.log('Tentative vérification avec token:', token);

    // Rechercher le token en base
    const [rows] = await pool.query(
      'SELECT evt.*, u.* FROM email_verification_tokens evt JOIN users u ON evt.user_id = u.id WHERE evt.token = ? AND evt.expires_at > NOW() LIMIT 1',
      [token]
    );

    if (rows.length === 0) {
      console.log('Aucun token trouvé pour:', token, 'rows:', rows);
      return res.status(400).json({ error: 'Token de vérification invalide ou expiré' });
    }

    const userRow = rows[0];
    const user = new User(userRow);

    // Activer le compte
    await user.markAsVerified();

    // Supprimer le token utilisé
    await pool.query('DELETE FROM email_verification_tokens WHERE user_id = ?', [user.id]);

    res.json({ message: 'Email vérifié avec succès', user: user.toPublicJSON() });
  } catch (error) {
    console.error('Erreur vérification:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification' });
  }
});

// Route de renvoi d'email de vérification
router.post('/resend-verification', resendLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email requis' });
    }

    const user = await User.findByEmail(email);
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    if (user.status === 'active') {
      return res.status(400).json({ error: 'Compte déjà vérifié' });
    }

    // Générer un nouveau token
    const verificationToken = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await pool.query('DELETE FROM email_verification_tokens WHERE user_id = ?', [user.id]);
    await pool.query(
      'INSERT INTO email_verification_tokens (user_id, token, expires_at, created_at) VALUES (?, ?, ?, NOW())',
      [user.id, verificationToken, expiresAt.toISOString().slice(0, 19).replace('T', ' ')]
    );

    try {
      await emailService.sendVerificationEmail(email, user.name || '', verificationToken);
      res.json({ message: 'Email de vérification renvoyé' });
    } catch (err) {
      console.error('Erreur renvoi email:', err);
      res.status(500).json({ error: 'Impossible d\'envoyer l\'email' });
    }
  } catch (error) {
    console.error('Erreur renvoi email:', error);
    res.status(500).json({ error: 'Erreur lors du renvoi de l\'email' });
  }
});

// Route de refresh token
router.post('/refresh', (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token requis' });
    }

    const newAccessToken = authService.refreshAccessToken(refreshToken);
    
    res.json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// Route de logout
router.post('/logout', (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      authService.logout(refreshToken);
    }
    
    res.json({ message: 'Déconnexion réussie' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la déconnexion' });
  }
});

// Route protégée (exemple)
router.get('/protected', 
  authService.authenticateToken.bind(authService),
  authService.requireRole(['admin', 'user']),
  (req, res) => {
    res.json({ 
      message: 'Accès autorisé', 
      user: req.user 
    });
  }
);

// Route pour récupérer le profil de l'utilisateur connecté
router.get('/me',
  authService.authenticateToken.bind(authService),
  async (req, res) => {
    try {
      const [rows] = await pool.query(
        'SELECT id, name, email, role, status, created_at FROM users WHERE id = ? LIMIT 1',
        [req.user.userId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Utilisateur introuvable' });
      }

      res.json(rows[0]);
    } catch (error) {
      console.error('Erreur /me:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
    }
  }
);

// Demander un email de réinitialisation (utilisateur non connecté)
router.post('/forgot-password', passwordResetController.requestPasswordReset);

// Vérifier que le token est valide (GET depuis le lien du mail)
router.get('/verify-reset-token/:token', passwordResetController.verifyResetToken);

// Réinitialiser le mot de passe avec le token
router.post('/reset-password', passwordResetController.resetPasswordWithToken);

// Modifier son mot de passe (utilisateur connecté - depuis profil)
router.post('/change-password', authenticateToken, passwordResetController.changePasswordAuthenticated);



export default router;