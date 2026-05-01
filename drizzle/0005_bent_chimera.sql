CREATE TABLE `user_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fingerprint` varchar(128) NOT NULL,
	`nickname` varchar(64),
	`totalVotes` int NOT NULL DEFAULT 0,
	`correctVotes` int NOT NULL DEFAULT 0,
	`points` int NOT NULL DEFAULT 0,
	`streak` int NOT NULL DEFAULT 0,
	`maxStreak` int NOT NULL DEFAULT 0,
	`lastVoteAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_scores_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_scores_fingerprint_unique` UNIQUE(`fingerprint`)
);
