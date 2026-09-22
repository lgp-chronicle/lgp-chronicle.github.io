CREATE TABLE `campaigns` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`active` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `characters` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign_id` text NOT NULL,
	`name` text NOT NULL,
	`realm` text NOT NULL,
	`region` text NOT NULL,
	`added_at` text NOT NULL,
	`checked_at` text,
	`profile` text DEFAULT '{}' NOT NULL,
	`logs` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`errors` text DEFAULT '[]' NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `daily_editions` (
	`day` text PRIMARY KEY NOT NULL,
	`updated_at` text NOT NULL,
	`data` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `activity_events` (
	`id` text PRIMARY KEY NOT NULL,
	`character_id` text NOT NULL,
	`at` text NOT NULL,
	`kind` text NOT NULL,
	`data` text NOT NULL,
	FOREIGN KEY (`character_id`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_events_at` ON `activity_events` (`at`);--> statement-breakpoint
CREATE TABLE `warcraft_logs_snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`character_id` text NOT NULL,
	`at` text NOT NULL,
	`hash` text NOT NULL,
	`data` text NOT NULL,
	FOREIGN KEY (`character_id`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_logs_character_at` ON `warcraft_logs_snapshots` (`character_id`,`at`);--> statement-breakpoint
CREATE TABLE `character_snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`character_id` text NOT NULL,
	`at` text NOT NULL,
	`hash` text NOT NULL,
	`data` text NOT NULL,
	FOREIGN KEY (`character_id`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_snapshots_character_at` ON `character_snapshots` (`character_id`,`at`);--> statement-breakpoint
CREATE TABLE `sync_state` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text,
	`lease_until` integer DEFAULT 0 NOT NULL,
	`last_run` integer DEFAULT 0 NOT NULL
);
