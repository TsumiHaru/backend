import express from 'express';
import { appendLog } from '../services/logService.js';

const router = express.Router();

// Accepts JSON: { level: 'error'|'warn'|'info', message: string, meta: object }
router.post('/', express.json(), (req, res) => {
  const { level = 'error', message = '', meta = {} } = req.body || {};
  appendLog({ level, message, meta, ip: req.ip });
  // Respond 204 No Content to reduce client noise
  res.status(204).end();
});

export default router;
