-- Add `image` column to blog_articles if it doesn't exist, then seed placeholder images for existing rows.
-- Safe to run multiple times.

/*
Paste this into phpMyAdmin SQL tab or run with mysql CLI:
mysql -u <user> -p <database> < add_image_column_and_seed.sql
*/

-- 1) Add the column if it does not exist
-- Use the compatible conditional check below to add the column when needed.
-- (Some MySQL/MariaDB versions do not support `ADD COLUMN IF NOT EXISTS`.)

-- Note: Some MySQL versions don't support ADD COLUMN IF NOT EXISTS; below is a compatible fallback.
-- The following block checks for the column and adds it if missing (works in phpMyAdmin):

SET @table_name = 'blog_articles';
SET @column_name = 'image';

SELECT COUNT(*) INTO @col_exists
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = @table_name
  AND COLUMN_NAME = @column_name;

-- If column doesn't exist, create it
SET @s = IF(@col_exists = 0,
  CONCAT('ALTER TABLE `', @table_name, '` ADD COLUMN `', @column_name, '` VARCHAR(512) NULL AFTER `excerpt`;'),
  'SELECT "column_exists";');

PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2) Update existing rows with placeholder images where image is NULL or empty
UPDATE `blog_articles`
SET `image` = CONCAT('https://via.placeholder.com/1200x630.png?text=', REPLACE(LEFT(title, 40), ' ', '+'))
WHERE `image` IS NULL OR `image` = '';

-- 3) Optionally, set a default value for new rows (you can uncomment if desired)
-- ALTER TABLE `blog_articles` ALTER COLUMN `image` SET DEFAULT '';

-- 4) Quick verification select
SELECT id, title, slug, image FROM `blog_articles` ORDER BY id LIMIT 20;
