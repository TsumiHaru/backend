// security-config.js - Configuration de sécurité complète
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config();

class SecurityConfig {
  static setupSecurity(app) {
    // 1. Helmet pour les headers de sécurité
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          scriptSrc: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false
    }));

    // 2. CORS sécurisé
    const corsOptions = {
      origin: function (origin, callback) {
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'https://aufildessentiers.mehdikorichi.com'
];
        
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Non autorisé par la politique CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
    };
    
    app.use(cors(corsOptions));

    // 3. Rate limiting par endpoint
    const generalLimiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
      message: {
        error: 'Trop de requêtes, réessayez plus tard'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 50, // Augmenté pour les tests
      message: {
        error: 'Trop de tentatives de connexion, réessayez plus tard'
      }
    });

    // Rate limiting temporairement désactivé pour les tests
    // app.use('/api/', generalLimiter);
    // app.use('/api/login', authLimiter);
    // app.use('/api/register', authLimiter);

    // 4. Compression des réponses
    app.use(compression());

    // 5. Logging des requêtes
    if (process.env.NODE_ENV === 'production') {
      app.use(morgan('combined'));
    } else {
      app.use(morgan('dev'));
    }

    // 6. Parsing sécurisé
    app.use(express.json({ 
      limit: '10mb',
      verify: (req, res, buf) => {
        // Vérification de la taille et du contenu si nécessaire
      }
    }));
    app.use(express.urlencoded({ 
      extended: true, 
      limit: '10mb' 
    }));

    // 7. Protection contre les attaques par déni de service
    app.use((req, res, next) => {
      const timeout = setTimeout(() => {
        res.status(408).json({ error: 'Timeout de la requête' });
      }, 30000);

      res.on('finish', () => {
        clearTimeout(timeout);
      });

      next();
    });
  }

  // Middleware de validation des données
  static validateInput(schema) {
    return (req, res, next) => {
      const { error } = schema.validate(req.body);
      if (error) {
        // Log validation details in non-production to aid debugging
        if (process.env.NODE_ENV !== 'production') {
          console.error('Validation error:', error.details.map(d => d.message));
        }
        return res.status(400).json({
          error: 'Données invalides',
          details: error.details.map(d => d.message)
        });
      }
      next();
    };
  }

  // Middleware de logging des erreurs
  static errorHandler(err, req, res, next) {
    console.error(err.stack);

    if (process.env.NODE_ENV === 'production') {
      res.status(500).json({
        error: 'Erreur interne du serveur'
      });
    } else {
      res.status(500).json({
        error: err.message,
        stack: err.stack
      });
    }
  }

  // Middleware de sanitisation
  static sanitizeInput(req, res, next) {
    const sanitize = (obj) => {
      for (let key in obj) {
        if (typeof obj[key] === 'string') {
          obj[key] = obj[key]
            .replace(/<script[^>]*>.*?<\/script>/gi, '')
            .replace(/<[\/\!]*?[^<>]*?>/gi, '')
            .replace(/javascript:/gi, '')
            .trim();
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitize(obj[key]);
        }
      }
    };

    if (req.body) sanitize(req.body);
    if (req.query) sanitize(req.query);
    if (req.params) sanitize(req.params);

    next();
  }
}

// Configuration des variables d'environnement
class EnvironmentConfig {
  static validate() {
    const required = [
      'JWT_SECRET'
    ];

    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Variables d'environnement manquantes: ${missing.join(', ')}`);
    }
  }

  static getConfig() {
    this.validate();
    
    return {
      jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '15m'
      },
      server: {
        port: process.env.PORT || 3000,
        env: process.env.NODE_ENV || 'development'
      },
      security: {
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
        allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || []
      }
    };
  }
}

// Schémas de validation Joi
const userSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().min(2).max(50).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export { SecurityConfig, EnvironmentConfig, userSchema, loginSchema };
