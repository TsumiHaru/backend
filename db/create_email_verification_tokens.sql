-- NOTE: Some MySQL/MariaDB installations create `users.id` as INT UNSIGNED
-- while others use signed INT. A foreign key requires exact type/attribute
-- parity between the referencing and referenced columns. To avoid
-- compatibility errors when running this migration in different environments
-- we create the tokens table without a strict foreign-key constraint.
-- If you control the database and want the FK, run an ALTER TABLE to add it
-- after ensuring `email_verification_tokens.user_id` and `users.id` have
-- identical definitions (signed/unsigned, length).

CREATE TABLE IF NOT EXISTS `email_verification_tokens` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_token` (`token`),
  KEY `idx_email_verification_tokens_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional: if you confirm `users.id` is INT UNSIGNED, you can add the FK:
-- ALTER TABLE `email_verification_tokens`
--   ADD CONSTRAINT `fk_evt_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

-- Convenience: delete expired tokens (run periodically or via a scheduled job)
-- DELETE FROM email_verification_tokens WHERE expires_at < NOW();
