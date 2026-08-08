CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fingerprint` varchar(128) NOT NULL,
	`type` varchar(32) NOT NULL,
	`title` varchar(200) NOT NULL,
	`body` varchar(300),
	`linkUrl` varchar(200),
	`refType` varchar(16),
	`refId` int,
	`idempotencyKey` varchar(160) NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`),
	CONSTRAINT `notifications_idempotencyKey_unique` UNIQUE(`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `watchlist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fingerprint` varchar(128) NOT NULL,
	`marketId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `watchlist_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_watch` UNIQUE(`fingerprint`,`marketId`)
);
--> statement-breakpoint
CREATE INDEX `idx_notifications_fp` ON `notifications` (`fingerprint`,`isRead`,`id`);--> statement-breakpoint
CREATE INDEX `idx_watchlist_market` ON `watchlist` (`marketId`);