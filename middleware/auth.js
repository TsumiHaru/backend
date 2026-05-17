import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
    this.refreshTokens = new Set();
  }

  async hashPassword(password) {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    return await bcrypt.hash(password, saltRounds);
  }

  async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  generateTokens(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = jwt.sign(payload, this.jwtSecret, { 
      expiresIn: process.env.JWT_EXPIRES_IN || '15m' 
    });

    const refreshToken = jwt.sign(payload, this.jwtSecret, { 
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' 
    });

    this.refreshTokens.add(refreshToken);
    
    return { accessToken, refreshToken };
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Token invalide');
    }
  }

  authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token d\'accès requis' });
    }

    try {
      const user = this.verifyToken(token);
      req.user = user;
      next();
    } catch (error) {
      console.error('authenticateToken error:', error.message);
      res.status(403).json({ error: 'Token invalide ou expiré', detail: error.message });
    }
  }

  requireRole(roles) {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: "Vous n'avez pas les autorisations" });
      }
      next();
    };
  }

  refreshAccessToken(refreshToken) {
    if (!this.refreshTokens.has(refreshToken)) {
      throw new Error('Refresh token invalide');
    }

    try {
      const user = this.verifyToken(refreshToken);
      const newAccessToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        this.jwtSecret,
        { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
      );
      
      return newAccessToken;
    } catch (error) {
      this.refreshTokens.delete(refreshToken);
      throw new Error('Refresh token expiré');
    }
  }

  logout(refreshToken) {
    this.refreshTokens.delete(refreshToken);
  }

  generateApiKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  validateApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API Key requise' });
    }

    if (!this.isValidApiKey(apiKey)) {
      return res.status(401).json({ error: 'API Key invalide' });
    }

    next();
  }

  isValidApiKey(apiKey) {
    const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
    return validApiKeys.includes(apiKey);
  }
}

const authService = new AuthService();

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token manquant' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token invalide' });
    req.user = user;
    next();
  });
};


export default authService;
