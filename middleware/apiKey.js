// backend/middleware/apiKey.js
export default function requireApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  if (!apiKey || apiKey !== process.env.PUBLIC_API_KEY) {
    return res.status(401).json({ error: 'API key manquante ou invalide' });
  }
  next();
}