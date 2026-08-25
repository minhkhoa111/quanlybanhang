CREATE TABLE IF NOT EXISTS `product_views` (
  `id` text PRIMARY KEY NOT NULL,
  `product_slug` text NOT NULL,
  `visitor_id` text NOT NULL,
  `viewed_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `product_views_slug_date_idx` ON `product_views` (`product_slug`, `viewed_at`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `product_views_visitor_idx` ON `product_views` (`visitor_id`, `product_slug`, `viewed_at`);
