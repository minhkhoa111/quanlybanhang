CREATE TABLE IF NOT EXISTS `branch_cameras` (
  `id` text PRIMARY KEY NOT NULL,
  `branch_id` text NOT NULL,
  `name` text NOT NULL,
  `location` text DEFAULT '' NOT NULL,
  `stream_url` text NOT NULL,
  `stream_type` text DEFAULT 'embed' NOT NULL,
  `active` integer DEFAULT 1 NOT NULL,
  `created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `branch_cameras_branch_idx` ON `branch_cameras` (`branch_id`,`active`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `camera_branch_permissions` (
  `id` text PRIMARY KEY NOT NULL,
  `admin_user_id` text NOT NULL,
  `branch_id` text NOT NULL,
  `created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `camera_permission_unique_idx` ON `camera_branch_permissions` (`admin_user_id`,`branch_id`);
