CREATE TABLE `markets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(128) NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`category` varchar(64) NOT NULL DEFAULT 'politica',
	`optionA` varchar(128) NOT NULL,
	`optionB` varchar(128) NOT NULL,
	`labelA` varchar(64) NOT NULL,
	`labelB` varchar(64) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`endsAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `markets_id` PRIMARY KEY(`id`),
	CONSTRAINT `markets_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `votes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`marketId` int NOT NULL,
	`choice` enum('A','B') NOT NULL,
	`fingerprint` varchar(128) NOT NULL,
	`userId` int,
	`country` varchar(64),
	`region` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `votes_id` PRIMARY KEY(`id`)
);
