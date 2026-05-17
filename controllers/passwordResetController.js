import { User } from '../models/User.js';
import emailService from '../services/emailService.js';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email requis' });
    }

    const user = await User.findByEmail(email);
    
    if (!user) {
      return res.status(200).json({ 
        message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' 
      });
    }

    const [existingToken] = await pool.query(
      `SELECT expires_at FROM email_verification_tokens 
       WHERE user_id = ? AND expires_at > NOW() LIMIT 1`,
      [user.id]
    );

    if (existingToken.length > 0) {
      return res.status(429).json({ 
        message: 'Un email de réinitialisation a déjà été envoyé récemment. Vérifiez votre boîte mail ou réessayez dans 1 heure.' 
      });
    }

    const resetToken = jwt.sign(
      { userId: user.id, email: user.email, type: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    await pool.query(
      'DELETE FROM email_verification_tokens WHERE user_id = ? AND expires_at <= NOW()',
      [user.id]
    );

    await pool.query(
      `INSERT INTO email_verification_tokens (user_id, token, expires_at, created_at) 
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR), NOW())`,
      [user.id, resetToken]
    );

    await emailService.sendPasswordResetEmail(user.email, user.name, resetToken);

    res.status(200).json({ 
      message: 'Email de réinitialisation envoyé avec succès.' 
    });
  } catch (error) {
    console.error('Erreur requestPasswordReset:', error);
    res.status(500).json({ message: 'Erreur lors de la demande de réinitialisation.' });
  }
};

export const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ message: 'Token manquant' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(400).json({ message: 'Token expiré' });
      }
      return res.status(400).json({ message: 'Token invalide' });
    }

    const [rows] = await pool.query(
      `SELECT user_id, expires_at FROM email_verification_tokens 
       WHERE token = ? AND expires_at > NOW()`,
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Token invalide ou expiré' });
    }

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

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(400).json({ message: 'Token expiré' });
      }
      return res.status(400).json({ message: 'Token invalide' });
    }

    const [rows] = await pool.query(
      `SELECT user_id FROM email_verification_tokens 
       WHERE token = ? AND expires_at > NOW()`,
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Token invalide ou expiré' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    await user.resetPassword(newPassword);

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

export const changePasswordAuthenticated = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.userId;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Les mots de passe ne correspondent pas' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Le mot de passe doit faire au moins 8 caractères' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const isPasswordValid = await user.verifyPassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Mot de passe actuel incorrect' });
    }

    await user.changePassword(newPassword);

    res.status(200).json({ 
      message: 'Mot de passe modifié avec succès' 
    });
  } catch (error) {
    console.error('Erreur changePasswordAuthenticated:', error);
    res.status(500).json({ message: 'Erreur lors de la modification du mot de passe' });
  }
};
