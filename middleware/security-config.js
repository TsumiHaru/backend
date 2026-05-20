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
    app.set('trust proxy', 1);

    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https://nominatim.openstreetmap.org"],
          scriptSrc: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false
    }));

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
      max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 10,
      message: {
        error: 'Trop de tentatives de connexion, réessayez plus tard'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

    const passwordLimiter = rateLimit({
      windowMs: 60 * 60 * 1000,
      max: parseInt(process.env.PASSWORD_RESET_RATE_LIMIT_MAX) || 5,
      message: {
        error: 'Trop de demandes, réessayez plus tard'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

    app.use('/api/', generalLimiter);
    app.use('/api/auth/login', authLimiter);
    app.use('/api/auth/register', authLimiter);
    app.use('/api/auth/forgot-password', passwordLimiter);
    app.use('/api/auth/resend-verification', passwordLimiter);

    app.use(compression());

    if (process.env.NODE_ENV === 'production') {
      app.use(morgan('combined'));
    } else {
      app.use(morgan('dev'));
    }

    app.use(express.json({ 
      limit: '10mb',
    }));
    app.use(express.urlencoded({ 
      extended: true, 
      limit: '10mb' 
    }));

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

  static validateInput(schema) {
    return (req, res, next) => {
      const { error } = schema.validate(req.body);
      if (error) {
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

  static rejectBotFields(req, res, next) {
    const values = [req.body?.website, req.body?.company, req.body?.url];
    if (values.some(value => typeof value === 'string' && value.trim().length > 0)) {
      return res.status(400).json({ error: 'Requête invalide' });
    }
    next();
  }
}

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

const userSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().min(2).max(50).required(),
  website: Joi.string().allow('').optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  website: Joi.string().allow('').optional()
});

export { SecurityConfig, EnvironmentConfig, userSchema, loginSchema };
