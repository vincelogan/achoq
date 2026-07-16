CREATE TABLE `market_boosts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`marketId` int NOT NULL,
	`fingerprint` varchar(128) NOT NULL,
	`startsAt` timestamp NOT NULL DEFAULT (now()),
	`endsAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `market_boosts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `q_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fingerprint` varchar(128) NOT NULL,
	`amount` int NOT NULL,
	`type` varchar(32) NOT NULL,
	`refType` varchar(16),
	`refId` int,
	`idempotencyKey` varchar(160) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `q_transactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `q_transactions_idempotencyKey_unique` UNIQUE(`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `shop_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`kind` enum('frame','title','streak_shield','boost') NOT NULL,
	`price` int NOT NULL,
	`imageUrl` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shop_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `shop_items_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `user_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fingerprint` varchar(128) NOT NULL,
	`itemId` int NOT NULL,
	`isEquipped` boolean NOT NULL DEFAULT false,
	`acquiredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_user_item` UNIQUE(`fingerprint`,`itemId`)
);
--> statement-breakpoint
ALTER TABLE `user_scores` ADD `qBalance` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `user_scores` ADD `dailyStreak` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `user_scores` ADD `lastCheckinDate` varchar(10);--> statement-breakpoint
ALTER TABLE `user_scores` ADD `streakShields` int DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_boosts_endsAt` ON `market_boosts` (`endsAt`);--> statement-breakpoint
CREATE INDEX `idx_qtx_fingerprint` ON `q_transactions` (`fingerprint`,`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_user_items_fp` ON `user_items` (`fingerprint`);--> statement-breakpoint
INSERT INTO `shop_items` (`code`, `name`, `description`, `kind`, `price`) VALUES
('shield-streak', 'Proteção de Streak', 'Protege sua sequência diária se você pular 1 dia. Consumida automaticamente. Máximo de 2 em estoque.', 'streak_shield', 150),
('boost-24h', 'Impulsionar Enquete', 'Coloca a enquete que você escolher em destaque na home por 24 horas.', 'boost', 200),
('frame-bronze', 'Moldura Bronze', 'Moldura bronze para seu apelido no ranking.', 'frame', 100),
('frame-prata', 'Moldura Prata', 'Moldura prata para seu apelido no ranking.', 'frame', 250),
('frame-fogo', 'Moldura Fogo', 'Moldura flamejante para quem está em sequência quente.', 'frame', 400),
('frame-ouro', 'Moldura Ouro', 'Moldura dourada — o topo do prestígio no ranking.', 'frame', 500),
('title-vidente', 'Título: Vidente', 'Exibe o título "Vidente" ao lado do seu apelido.', 'title', 150),
('title-pequente', 'Título: Pé Quente', 'Exibe o título "Pé Quente" ao lado do seu apelido.', 'title', 200),
('title-cravou', 'Título: Cravou', 'Exibe o título "Cravou" ao lado do seu apelido.', 'title', 300),
('title-oraculo', 'Título: Oráculo de Plantão', 'Exibe o título "Oráculo de Plantão" ao lado do seu apelido.', 'title', 400);
