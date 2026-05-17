import express from "express";
import dotenv from "dotenv";
import { SecurityConfig, EnvironmentConfig } from "./middleware/security-config.js";

import authRoutes from "./routes/auth.routes.js";

import eventsRoutes from "./routes/events.routes.js";
import usersRoutes from "./routes/users.routes.js";
import publicRoutes from "./routes/public.routes.js";
import eventRegistrationRoutes from "./routes/event-registration.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import blogRoutes from "./routes/blog.routes.js";
import logsRoutes from "./routes/logs.routes.js";
import contactsRoutes from "./routes/contacts.routes.js";


import pool from './config/db.js';
import requireApiKey from './middleware/apiKey.js';
import authService from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

SecurityConfig.setupSecurity(app);

try {
  EnvironmentConfig.getConfig();
  console.log('Configuration chargée avec succès');
} catch (error) {
  console.error('Erreur de configuration:', error.message);
  process.exit(1);
}

app.use(SecurityConfig.sanitizeInput);

app.get("/", (req, res) => {
  res.json({ 
    message: "Backend en ligne",
    version: "1.0.0",
    environment: process.env.NODE_ENV || 'development'
  });
});

if (process.env.NODE_ENV !== 'production') {
  app.get('/test-email', async (req, res) => {
    try {
      const ok = await (await import('./services/emailService.js')).default.verifyConnection();
      if (ok) return res.json({ success: true, message: 'Configuration email OK' });
      return res.status(500).json({ success: false, message: 'Problème configuration email' });
    } catch (err) {
      console.error('Erreur test-email:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/test-send-email', async (req, res) => {
    try {
      const to = req.query.to || 'test@example.com';
      const name = req.query.name || 'Test User';
      const token = req.query.token || 'test-token-123';

      await (await import('./services/emailService.js')).default.sendVerificationEmail(to, name, token);
      res.json({ success: true, message: `Email envoyé à ${to} (vérifier logs)` });
    } catch (err) {
      console.error('Erreur test-send-email:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/debug/user-tokens', async (req, res) => {
    try {
      const { email } = req.query;
      if (!email) return res.status(400).json({ error: 'email query param requis' });

      const [users] = await pool.query('SELECT id, email, status FROM users WHERE email = ? LIMIT 1', [email]);
      if (users.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });

      const user = users[0];
      const [tokens] = await pool.query('SELECT id, token, expires_at, created_at FROM email_verification_tokens WHERE user_id = ? ORDER BY created_at DESC', [user.id]);

      res.json({ user, tokens });
    } catch (err) {
      console.error('Erreur debug/user-tokens:', err);
      res.status(500).json({ error: err.message });
    }
  });
}

app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/event-registrations', eventRegistrationRoutes);
app.use('/api/admin', adminRoutes);

const blogProtection = process.env.BLOG_PROTECTION || 'auth';
if (blogProtection === 'public') {
  app.use('/api/blog', blogRoutes);
} else if (blogProtection === 'auth') {
  app.use('/api/blog', authService.authenticateToken.bind(authService), blogRoutes);
} else if (blogProtection === 'admin') {
  app.use('/api/blog', authService.authenticateToken.bind(authService), authService.requireRole(['admin']), blogRoutes);
} else {
  app.use('/api/blog', authService.authenticateToken.bind(authService), blogRoutes);
}
app.use('/api/logs', logsRoutes);
app.use('/api/contacts', contactsRoutes);

app.use(SecurityConfig.errorHandler);

app.listen(PORT, () => {
  console.log(`Serveur démarré sur port ${PORT}`);
  console.log(`Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(`CORS autorisé pour: ${process.env.ALLOWED_ORIGINS || 'localhost'}`);
  console.log(`Endpoints disponibles:`);
  console.log(`   - GET  /api/events`);
});
