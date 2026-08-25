CREATE TABLE IF NOT EXISTS `orders` (
  `id` text PRIMARY KEY NOT NULL,
  `order_code` text NOT NULL DEFAULT '',
  `customer_name` text NOT NULL,
  `phone` text NOT NULL,
  `email` text NOT NULL DEFAULT '',
  `product_slug` text NOT NULL DEFAULT '',
  `product_name` text NOT NULL,
  `color` text NOT NULL DEFAULT '',
  `storage` text NOT NULL DEFAULT '',
  `quantity` integer NOT NULL DEFAULT 1,
  `delivery_method` text NOT NULL DEFAULT '',
  `address` text NOT NULL DEFAULT '',
  `payment_method` text NOT NULL DEFAULT '',
  `contact_time` text NOT NULL DEFAULT '',
  `note` text NOT NULL DEFAULT '',
  `status` text NOT NULL DEFAULT 'new',
  `payment_status` text NOT NULL DEFAULT 'unpaid',
  `total` text NOT NULL DEFAULT '',
  `shipping_fee` text NOT NULL DEFAULT '',
  `discount` text NOT NULL DEFAULT '',
  `finance_company` text NOT NULL DEFAULT '',
  `installment_name` text NOT NULL DEFAULT '',
  `installment_phone` text NOT NULL DEFAULT '',
  `date_of_birth` text NOT NULL DEFAULT '',
  `citizen_id` text NOT NULL DEFAULT '',
  `citizen_id_issue_date` text NOT NULL DEFAULT '',
  `citizen_id_issue_place` text NOT NULL DEFAULT '',
  `down_payment_percent` integer NOT NULL DEFAULT 0,
  `down_payment_amount` text NOT NULL DEFAULT '',
  `financed_amount` text NOT NULL DEFAULT '',
  `installment_term` integer NOT NULL DEFAULT 0,
  `monthly_payment` text NOT NULL DEFAULT '',
  `estimated_interest` text NOT NULL DEFAULT '',
  `customer_id` text NOT NULL DEFAULT '',
  `voucher_code` text NOT NULL DEFAULT '',
  `items_json` text NOT NULL DEFAULT '[]',
  `invoice_status` text NOT NULL DEFAULT 'not_created',
  `invoice_number` text NOT NULL DEFAULT '',
  `invoice_template_code` text NOT NULL DEFAULT '',
  `invoice_series` text NOT NULL DEFAULT '',
  `invoice_date` text NOT NULL DEFAULT '',
  `invoice_buyer_type` text NOT NULL DEFAULT 'individual',
  `invoice_buyer_name` text NOT NULL DEFAULT '',
  `invoice_company_name` text NOT NULL DEFAULT '',
  `invoice_tax_code` text NOT NULL DEFAULT '',
  `invoice_address` text NOT NULL DEFAULT '',
  `invoice_email` text NOT NULL DEFAULT '',
  `invoice_seller_name` text NOT NULL DEFAULT '',
  `invoice_seller_tax_code` text NOT NULL DEFAULT '',
  `invoice_seller_address` text NOT NULL DEFAULT '',
  `invoice_seller_phone` text NOT NULL DEFAULT '',
  `invoice_tax_rate` integer NOT NULL DEFAULT 0,
  `invoice_tax_included` integer NOT NULL DEFAULT 1,
  `invoice_note` text NOT NULL DEFAULT '',
  `warranty_months` integer NOT NULL DEFAULT 12,
  `warranty_start_date` text NOT NULL DEFAULT '',
  `warranty_serials` text NOT NULL DEFAULT '',
  `warranty_policy` text NOT NULL DEFAULT '',
  `created_at` integer NOT NULL
);
--> statement-breakpoint
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
