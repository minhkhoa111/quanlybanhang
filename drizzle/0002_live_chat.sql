CREATE TABLE IF NOT EXISTS `live_chat_conversations` (`id` text PRIMARY KEY NOT NULL,`customer_name` text NOT NULL,`phone` text NOT NULL,`token` text NOT NULL UNIQUE,`status` text NOT NULL DEFAULT 'waiting',`assigned_admin` text NOT NULL DEFAULT '',`created_at` integer NOT NULL,`updated_at` integer NOT NULL);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `live_chat_messages` (`id` text PRIMARY KEY NOT NULL,`conversation_id` text NOT NULL,`sender` text NOT NULL,`sender_name` text NOT NULL DEFAULT '',`text` text NOT NULL,`created_at` integer NOT NULL);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `live_chat_messages_conversation_idx` ON `live_chat_messages` (`conversation_id`,`created_at`);
