ALTER TABLE `media_assets` ADD `upload_state` text DEFAULT 'ready' NOT NULL;--> statement-breakpoint
ALTER TABLE `media_assets` ADD `duration_seconds` real;