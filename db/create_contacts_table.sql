-- create_contacts_table.sql
-- phpMyAdmin-friendly SQL to create a contacts table for storing messages from the frontend contact form.
-- Run this in phpMyAdmin or via your migration tooling.

CREATE TABLE IF NOT EXISTS `contacts` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `subject` VARCHAR(255) DEFAULT NULL,
  `message` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  INDEX (`email`),
  INDEX (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional: grant minimal privileges if needed (example for dev)
-- GRANT SELECT, INSERT, UPDATE ON `your_database`.`contacts` TO 'your_user'@'localhost';
