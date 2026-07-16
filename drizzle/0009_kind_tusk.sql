CREATE TABLE `comment_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`commentId` int NOT NULL,
	`fingerprint` varchar(128) NOT NULL,
	`reason` varchar(200),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `comment_reports_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_comment_report` UNIQUE(`commentId`,`fingerprint`)
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`marketId` int NOT NULL,
	`fingerprint` varchar(128) NOT NULL,
	`content` varchar(500) NOT NULL,
	`status` enum('visible','hidden','deleted') NOT NULL DEFAULT 'visible',
	`reportCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_comments_market` ON `comments` (`marketId`,`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_comments_fp` ON `comments` (`fingerprint`);