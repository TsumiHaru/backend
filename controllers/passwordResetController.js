// controllers/passwordResetController.js
// Utilise la table email_verification_tokens existante pour les reset tokens
import { User } from '../models/User.js';
import emailService from '../services/emailService.js';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

// 1. Demander un email de réinitialisation de mot de passe
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email requis' });
    }

    // Chercher l'utilisateur
    const user = await User.findByEmail(email);
    
    if (!user) {
      // Pour la sécurité, on retourne quand même un succès
      return res.status(200).json({ 
        message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' 
      });
    }

    // Générer un token JWT valide 1 heure
    const resetToken = jwt.sign(
      { userId: user.id, email: user.email, type: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Sauvegarder le token dans email_verification_tokens (on réutilise la table)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 heure
    
    // Supprimer l'ancien token d'abord
await pool.query('DELETE FROM email_verification_tokens WHERE user_id = ?', [user.id]);

// Puis créer le nouveau
await pool.query(
  `INSERT INTO email_verification_tokens (user_id, token, expires_at, created_at) 
   VALUES (?, ?, ?, NOW())`,
  [user.id, resetToken, expiresAt]
);

    // Envoyer l'email
    await emailService.sendPasswordResetEmail(user.email, user.name, resetToken);

    res.status(200).json({ 
      message: 'Email de réinitialisation envoyé avec succès.' 
    });
  } catch (error) {
    console.error('Erreur requestPasswordReset:', error);
    res.status(500).json({ message: 'Erreur lors de la demande de réinitialisation.' });
  }
};

// 2. Vérifier que le token est valide
export const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ message: 'Token manquant' });
    }

    // Vérifier le JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(400).json({ message: 'Token expiré' });
      }
      return res.status(400).json({ message: 'Token invalide' });
    }

    // Chercher le token en BD et vérifier qu'il n'a pas expiré
    const [rows] = await pool.query(
      `SELECT user_id FROM email_verification_tokens 
       WHERE token = ? AND expires_at > NOW()`,
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Token invalide ou expiré' });
    }

    // Récupérer l'utilisateur pour retourner son email
    const user = await User.findById(decoded.userId);

    res.status(200).json({ 
      message: 'Token valide',
      email: user.email 
    });
  } catch (error) {
    console.error('Erreur verifyResetToken:', error);
    res.status(400).json({ message: 'Token invalide ou expiré' });
  }
};

// 3. Réinitialiser le mot de passe avec le token
export const resetPasswordWithToken = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Les mots de passe ne correspondent pas' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Le mot de passe doit faire au moins 8 caractères' });
    }

    // Vérifier le JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(400).json({ message: 'Token expiré' });
      }
      return res.status(400).json({ message: 'Token invalide' });
    }

    // Chercher le token en BD et vérifier qu'il n'a pas expiré
    const [rows] = await pool.query(
      `SELECT user_id FROM email_verification_tokens 
       WHERE token = ? AND expires_at > NOW()`,
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Token invalide ou expiré' });
    }

    // Chercher l'utilisateur
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Réinitialiser le mot de passe
    await user.changePassword(newPassword);

    // Supprimer le token (l'invalider)
    await pool.query(
      'DELETE FROM email_verification_tokens WHERE user_id = ?',
      [user.id]
    );

    res.status(200).json({ 
      message: 'Mot de passe réinitialisé avec succès' 
    });
  } catch (error) {
    console.error('Erreur resetPasswordWithToken:', error);
    res.status(500).json({ message: 'Erreur lors de la réinitialisation du mot de passe' });
  }
};

// 4. Modifier son mot de passe (utilisateur authentifié depuis profil)
export const changePasswordAuthenticated = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.id; // De la middleware authenticateToken

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Les mots de passe ne correspondent pas' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Le mot de passe doit faire au moins 8 caractères' });
    }

    // Chercher l'utilisateur
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier que le mot de passe actuel est correct
    const isPasswordValid = await user.verifyPassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Mot de passe actuel incorrect' });
    }

    // Changer le mot de passe
    await user.changePassword(newPassword);

    res.status(200).json({ 
      message: 'Mot de passe modifié avec succès' 
    });
  } catch (error) {
    console.error('Erreur changePasswordAuthenticated:', error);
    res.status(500).json({ message: 'Erreur lors de la modification du mot de passe' });
  }
};