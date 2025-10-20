// controllers/passwordResetController.js - CORRIGÉ (Fuseau horaire MySQL)
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

    console.log('📧 [Password Reset] Demande pour:', email);

    // Chercher l'utilisateur
    const user = await User.findByEmail(email);
    
    if (!user) {
      console.log('❌ Utilisateur non trouvé:', email);
      return res.status(200).json({ 
        message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' 
      });
    }

    console.log('✅ Utilisateur trouvé:', user.id, user.email);

    // Vérifier s'il y a déjà un token valide (non expiré) pour cet utilisateur
    const [existingToken] = await pool.query(
      `SELECT expires_at FROM email_verification_tokens 
       WHERE user_id = ? AND expires_at > NOW() LIMIT 1`,
      [user.id]
    );

    if (existingToken.length > 0) {
      console.log('⏱️ Token valide existe déjà, rate limit activé');
      return res.status(429).json({ 
        message: 'Un email de réinitialisation a déjà été envoyé récemment. Vérifiez votre boîte mail ou réessayez dans 1 heure.' 
      });
    }

    // Générer un token JWT valide 1 heure
    const resetToken = jwt.sign(
      { userId: user.id, email: user.email, type: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('🔑 Token généré:', resetToken.substring(0, 30) + '...');

    // Supprimer les anciens tokens expirés
    const [deleteResult] = await pool.query(
      'DELETE FROM email_verification_tokens WHERE user_id = ? AND expires_at <= NOW()',
      [user.id]
    );
    console.log('🗑️ Anciens tokens expirés supprimés:', deleteResult.affectedRows);

    // Créer le nouveau token avec DATE_ADD pour éviter les problèmes de fuseau horaire
    const [insertResult] = await pool.query(
      `INSERT INTO email_verification_tokens (user_id, token, expires_at, created_at) 
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR), NOW())`,
      [user.id, resetToken]
    );
    
    console.log('💾 Token inséré:', insertResult.insertId, 'affectedRows:', insertResult.affectedRows);

    // Vérifier que le token a bien été inséré
    const [checkRows] = await pool.query(
      'SELECT token, expires_at FROM email_verification_tokens WHERE user_id = ? AND token = ?',
      [user.id, resetToken]
    );
    
    console.log('✔️ Vérification BD - Token trouvé:', checkRows.length > 0);
    if (checkRows.length > 0) {
      console.log('   expires_at en BD:', checkRows[0].expires_at);
    }

    // Envoyer l'email
    await emailService.sendPasswordResetEmail(user.email, user.name, resetToken);

    res.status(200).json({ 
      message: 'Email de réinitialisation envoyé avec succès.' 
    });
  } catch (error) {
    console.error('❌ Erreur requestPasswordReset:', error);
    res.status(500).json({ message: 'Erreur lors de la demande de réinitialisation.' });
  }
};

// 2. Vérifier que le token est valide
export const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    console.log('🔍 [Verify Token] Vérification:', token.substring(0, 30) + '...');

    if (!token) {
      return res.status(400).json({ message: 'Token manquant' });
    }

    // Vérifier le JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ JWT valide pour userId:', decoded.userId);
    } catch (jwtError) {
      console.error('❌ JWT invalide:', jwtError.message);
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(400).json({ message: 'Token expiré' });
      }
      return res.status(400).json({ message: 'Token invalide' });
    }

    // Chercher le token en BD
    const [rows] = await pool.query(
      `SELECT user_id, expires_at FROM email_verification_tokens 
       WHERE token = ? AND expires_at > NOW()`,
      [token]
    );

    console.log('🔍 Résultat BD:', rows.length, 'rows');
    if (rows.length > 0) {
      console.log('✅ Token trouvé en BD, expires_at:', rows[0].expires_at);
    } else {
      console.log('❌ Token PAS trouvé en BD ou expiré');
    }

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
    console.error('❌ Erreur verifyResetToken:', error);
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
    await user.resetPassword(newPassword);

    // Supprimer le token (l'invalider)
    await pool.query(
      'DELETE FROM email_verification_tokens WHERE user_id = ?',
      [user.id]
    );

    console.log('✅ Mot de passe réinitialisé pour userId:', user.id);

    res.status(200).json({ 
      message: 'Mot de passe réinitialisé avec succès' 
    });
  } catch (error) {
    console.error('❌ Erreur resetPasswordWithToken:', error);
    res.status(500).json({ message: 'Erreur lors de la réinitialisation du mot de passe' });
  }
};

// 4. Modifier son mot de passe (utilisateur authentifié depuis profil)
export const changePasswordAuthenticated = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.userId;

    console.log('🔐 [Change Password] Pour userId:', userId);

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
      console.error('❌ Utilisateur non trouvé:', userId);
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier que le mot de passe actuel est correct
    const isPasswordValid = await user.verifyPassword(currentPassword);
    if (!isPasswordValid) {
      console.log('❌ Mot de passe actuel incorrect');
      return res.status(400).json({ message: 'Mot de passe actuel incorrect' });
    }

    // Changer le mot de passe
    await user.changePassword(newPassword);

    console.log('✅ Mot de passe changé avec succès pour userId:', userId);
    res.status(200).json({ 
      message: 'Mot de passe modifié avec succès' 
    });
  } catch (error) {
    console.error('❌ Erreur changePasswordAuthenticated:', error);
    res.status(500).json({ message: 'Erreur lors de la modification du mot de passe' });
  }
};