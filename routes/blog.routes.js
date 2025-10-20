import express from 'express';
import { Blog } from '../models/Blog.js';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const router = express.Router();

// Setup server-side DOMPurify with jsdom
const window = (new JSDOM('')).window;
const DOMPurify = createDOMPurify(window);

// GET /api/blog - list articles
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const articles = await Blog.findAll({ limit, offset });
    res.json({ articles, pagination: { page, limit } });
  } catch (error) {
    console.error('Erreur récupération articles blog:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/blog/:id - article detail
router.get('/:id', async (req, res) => {
  try {
    const article = await Blog.findById(req.params.id);
    if (!article) return res.status(404).json({ error: 'Article non trouvé' });
    // sanitize content before sending using DOMPurify
    const cleanContent = article.content ? DOMPurify.sanitize(article.content) : '';
    const cleanExcerpt = article.excerpt ? DOMPurify.sanitize(article.excerpt) : '';
    const sanitized = { ...article, content: cleanContent, excerpt: cleanExcerpt };
    res.json({ article: sanitized });
  } catch (error) {
    console.error('Erreur récupération article:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
