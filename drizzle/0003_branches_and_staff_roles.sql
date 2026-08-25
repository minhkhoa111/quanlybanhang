CREATE TABLE IF NOT EXISTS `branches` (`id` text PRIMARY KEY NOT NULL,`code` text NOT NULL UNIQUE,`name` text NOT NULL,`address` text NOT NULL,`phone` text NOT NULL DEFAULT '',`hours` text NOT NULL DEFAULT '08:00–22:00',`active` integer NOT NULL DEFAULT 1,`created_at` integer NOT NULL);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `branches_code_idx` ON `branches` (`code`);
--> statement-breakpoint
ALTER TABLE `admin_users` ADD COLUMN `branch_id` text NOT NULL DEFAULT '';
