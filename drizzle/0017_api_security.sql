CREATE TABLE IF NOT EXISTS `api_rate_limits` (
  `rate_key` text PRIMARY KEY NOT NULL,
  `count` integer DEFAULT 1 NOT NULL,
  `expires_at` integer NOT NULL
);

CREATE INDEX IF NOT EXISTS `api_rate_limits_expires_at_idx`
  ON `api_rate_limits` (`expires_at`);
