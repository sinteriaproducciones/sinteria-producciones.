CREATE TABLE `reservations` (
	`id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`created_at` integer NOT NULL,
	`status` text DEFAULT 'nueva' NOT NULL,
	`notes` text DEFAULT '' NOT NULL
);
