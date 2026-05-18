import express from 'express';
import { createContact, listContacts, markContactRead } from '../models/Contact.js';
import authService from '../middleware/auth.js';

const router = express.Router();

router.get('/ping', (req, res) => {
  return res.json({ ok: true, route: '/api/contacts/ping' });
});

router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ error: 'name, email et message requis' });

    const result = await createContact({ name, email, subject, message });

    res.status(201).json({ message: 'Message reçu', id: result.id });
  } catch (err) {
    console.error('Erreur create contact:', err);
    res.status(500).json({ error: 'Erreur lors de la sauvegarde du message' });
  }
});

router.get('/',
  authService.authenticateToken.bind(authService),
  authService.requireRole(['admin']),
  async (req, res) => {
    try {
      const { limit = 100, offset = 0 } = req.query;
      const rows = await listContacts({ limit, offset });
      res.json({ message: 'Liste des messages', contacts: rows });
    } catch (err) {
      console.error('Erreur list contacts:', err);
      res.status(500).json({ error: 'Erreur lors de la récupération des messages' });
    }
  }
);

router.put('/:id/read',
  authService.authenticateToken.bind(authService),
  authService.requireRole(['admin']),
  async (req, res) => {
    try {
      const id = req.params.id;
      await markContactRead(id);
      res.json({ message: 'Marqué comme lu' });
    } catch (err) {
      console.error('Erreur mark contact read:', err);
      res.status(500).json({ error: 'Erreur lors de la mise à jour' });
    }
  }
);

export default router;
