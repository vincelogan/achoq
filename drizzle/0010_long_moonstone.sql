CREATE TABLE `market_suggestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fingerprint` varchar(128) NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`category` varchar(64) NOT NULL DEFAULT 'geral',
	`optionA` varchar(128) NOT NULL,
	`optionB` varchar(128) NOT NULL,
	`labelA` varchar(64) NOT NULL,
	`labelB` varchar(64) NOT NULL,
	`endsAt` timestamp,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`reviewNote` varchar(300),
	`marketId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `market_suggestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_suggestions_status` ON `market_suggestions` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_suggestions_fp` ON `market_suggestions` (`fingerprint`);--> statement-breakpoint
INSERT INTO `badges` (`code`, `name`, `description`, `icon`, `tier`, `qReward`) VALUES
('ideia-aprovada', 'Pauteiro', 'Teve uma sugestão de enquete aprovada e publicada.', 'lightbulb', 'prata', 30);
