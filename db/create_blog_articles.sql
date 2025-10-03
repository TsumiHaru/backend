-- Create blog_articles table and seed sample articles
-- Run in your database (e.g. via phpMyAdmin or mysql CLI):
--   mysql -u <user> -p <database> < create_blog_articles.sql

CREATE TABLE IF NOT EXISTS `blog_articles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `excerpt` TEXT NULL,
  `content` LONGTEXT NULL,
  `author` VARCHAR(150) DEFAULT 'Équipe',
  `published_at` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_published_at` (`published_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed sample articles
INSERT INTO `blog_articles` (title, slug, excerpt, content, author, published_at)
VALUES
('Bienvenue sur le blog', 'bienvenue-sur-le-blog', 'Premiers pas : notre blog va partager des récits de randonnées, conseils et actualités locales.', 'Bienvenue sur le blog d\'Au fil des sentiers. Ici nous partagerons des retours d\'expérience, des conseils pratiques pour vos balades, et des nouvelles des événements à venir. Restez à l\'écoute pour plus d\'articles !', 'Léa', '2024-09-01 10:00:00'),
('Comment préparer une randonnée d\'une journée', 'preparer-une-randonnee-1-journee', 'Checklist et conseils pour une randonnée d\'une journée réussie.', 'Une bonne préparation commence par le choix d\'un itinéraire adapté, des chaussures appropriées, et un sac bien organisé. N\'oubliez pas de vérifier la météo et d\'emporter de l\'eau en quantité suffisante.', 'Mathis', '2024-09-10 09:00:00'),
('Rencontrer des personnes lors des événements', 'rencontrer-personnes-evenements', 'Nos événements sont pensés pour favoriser les échanges et le contact humain.', 'Les événements sont l\'occasion parfaite pour rencontrer d\'autres passionnés. Pensez à venir avec une bonne humeur et à échanger : le partage est au coeur de notre communauté.', 'Camille', '2024-09-20 14:00:00')
ON DUPLICATE KEY UPDATE title = VALUES(title);
