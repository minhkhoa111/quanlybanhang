CREATE TABLE IF NOT EXISTS `branches` (`id` text PRIMARY KEY NOT NULL,`code` text NOT NULL UNIQUE,`name` text NOT NULL,`address` text NOT NULL,`phone` text NOT NULL DEFAULT '',`hours` text NOT NULL DEFAULT '08:00–22:00',`active` integer NOT NULL DEFAULT 1,`created_at` integer NOT NULL);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `branches_code_idx` ON `branches` (`code`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` text PRIMARY KEY NOT NULL,
  `username` text NOT NULL UNIQUE,
  `name` text NOT NULL,
  `password_hash` text NOT NULL,
  `password_salt` text NOT NULL,
  `role` text NOT NULL DEFAULT 'sales',
  `branch` text NOT NULL DEFAULT '',
  `active` integer NOT NULL DEFAULT 1,
  `created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `admin_users_username_idx` ON `admin_users` (LOWER(`username`));
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `admin_user_sessions` (
  `id` text PRIMARY KEY NOT NULL,
  `admin_user_id` text NOT NULL,
  `token_hash` text NOT NULL UNIQUE,
  `expires_at` integer NOT NULL,
  `created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `admin_user_sessions_token_idx` ON `admin_user_sessions` (`token_hash`);
--> statement-breakpoint
ALTER TABLE `admin_users` ADD COLUMN `branch_id` text NOT NULL DEFAULT '';
