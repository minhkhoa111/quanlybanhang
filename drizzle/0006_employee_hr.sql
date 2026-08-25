CREATE TABLE IF NOT EXISTS `employee_profiles` (
  `admin_user_id` text PRIMARY KEY NOT NULL,
  `date_of_birth` text DEFAULT '' NOT NULL,
  `joined_date` text DEFAULT '' NOT NULL,
  `citizen_id_encrypted` text DEFAULT '' NOT NULL,
  `permanent_address_encrypted` text DEFAULT '' NOT NULL,
  `temporary_address_encrypted` text DEFAULT '' NOT NULL,
  `photo_key` text DEFAULT '' NOT NULL,
  `bank_name` text DEFAULT '' NOT NULL,
  `bank_account_name_encrypted` text DEFAULT '' NOT NULL,
  `bank_account_number_encrypted` text DEFAULT '' NOT NULL,
  `monthly_salary` integer DEFAULT 0 NOT NULL,
  `updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `employee_attendance` (
  `id` text PRIMARY KEY NOT NULL,
  `admin_user_id` text NOT NULL,
  `work_date` text NOT NULL,
  `check_in` text DEFAULT '' NOT NULL,
  `check_out` text DEFAULT '' NOT NULL,
  `status` text DEFAULT 'present' NOT NULL,
  `note` text DEFAULT '' NOT NULL,
  `recorded_by` text DEFAULT '' NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `employee_attendance_user_date_idx` ON `employee_attendance` (`admin_user_id`,`work_date`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `employee_attendance_date_idx` ON `employee_attendance` (`work_date`,`admin_user_id`);
