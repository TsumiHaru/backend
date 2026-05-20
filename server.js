import express from "express";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
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

import authService from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

SecurityConfig.setupSecurity(app);

try {
  EnvironmentConfig.getConfig();
} catch (error) {
  console.error('Erreur de configuration:', error.message);
  process.exit(1);
}

app.use(SecurityConfig.sanitizeInput);
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  next();
}, express.static(path.join(__dirname, 'uploads'), {
  maxAge: '30d',
  immutable: true
}));

app.get("/", (req, res) => {
  res.json({ 
    message: "Backend en ligne",
    version: "1.0.0",
    environment: process.env.NODE_ENV || 'development'
  });
});

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

app.listen(PORT);
