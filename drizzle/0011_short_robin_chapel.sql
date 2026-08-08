CREATE TABLE `group_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`fingerprint` varchar(128) NOT NULL,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `group_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_group_member` UNIQUE(`groupId`,`fingerprint`)
);
--> statement-breakpoint
CREATE TABLE `groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(12) NOT NULL,
	`name` varchar(64) NOT NULL,
	`ownerFingerprint` varchar(128) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `groups_id` PRIMARY KEY(`id`),
	CONSTRAINT `groups_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE INDEX `idx_group_members_fp` ON `group_members` (`fingerprint`);--> statement-breakpoint
CREATE INDEX `idx_groups_owner` ON `groups` (`ownerFingerprint`);