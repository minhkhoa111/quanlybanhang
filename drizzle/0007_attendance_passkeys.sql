CREATE TABLE IF NOT EXISTS `employee_attendance_passkeys` (
  `id` text PRIMARY KEY NOT NULL,
  `admin_user_id` text NOT NULL,
  `public_key` text NOT NULL,
  `counter` integer DEFAULT 0 NOT NULL,
  `transports_json` text DEFAULT '[]' NOT NULL,
  `device_type` text DEFAULT 'singleDevice' NOT NULL,
  `backed_up` integer DEFAULT 0 NOT NULL,
  `created_at` integer NOT NULL,
  `last_used_at` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `employee_attendance_passkeys_user_idx` ON `employee_attendance_passkeys` (`admin_user_id`,`created_at`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `employee_attendance_challenges` (
  `id` text PRIMARY KEY NOT NULL,
  `admin_user_id` text NOT NULL,
  `kind` text NOT NULL,
  `challenge` text NOT NULL,
  `expires_at` integer NOT NULL,
  `created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `employee_attendance_challenges_user_idx` ON `employee_attendance_challenges` (`admin_user_id`,`expires_at`);
