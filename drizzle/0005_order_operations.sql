ALTER TABLE `orders` ADD COLUMN `branch_id` text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE `orders` ADD COLUMN `branch_name` text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE `orders` ADD COLUMN `assigned_admin_id` text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE `orders` ADD COLUMN `assigned_admin_name` text NOT NULL DEFAULT '';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `orders_branch_created_idx` ON `orders` (`branch_id`,`created_at`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `orders_assigned_admin_idx` ON `orders` (`assigned_admin_id`,`created_at`);
