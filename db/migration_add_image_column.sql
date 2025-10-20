-- Migration: add image column to blog_articles
ALTER TABLE blog_articles
  ADD COLUMN image VARCHAR(512) NULL AFTER excerpt;

-- update some existing sample rows (adjust slugs or ids if different)
UPDATE blog_articles SET image = 'https://via.placeholder.com/800x400.png?text=Article+1' WHERE slug = 'bienvenue-sur-le-blog';
UPDATE blog_articles SET image = 'https://via.placeholder.com/800x400.png?text=Article+2' WHERE slug = 'preparer-une-randonnee-1-journee';
UPDATE blog_articles SET image = 'https://via.placeholder.com/800x400.png?text=Article+3' WHERE slug = 'rencontrer-personnes-evenements';
