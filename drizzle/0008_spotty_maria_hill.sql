CREATE TABLE `badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`icon` varchar(64),
	`tier` enum('bronze','prata','ouro') NOT NULL DEFAULT 'bronze',
	`qReward` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `badges_id` PRIMARY KEY(`id`),
	CONSTRAINT `badges_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `league_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`seasonId` int NOT NULL,
	`fingerprint` varchar(128) NOT NULL,
	`division` enum('bronze','prata','ouro','diamante') NOT NULL DEFAULT 'bronze',
	`finalRank` int,
	`finalQs` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `league_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_league_member` UNIQUE(`seasonId`,`fingerprint`)
);
--> statement-breakpoint
CREATE TABLE `league_seasons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`weekStart` varchar(10) NOT NULL,
	`status` enum('active','closed') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `league_seasons_id` PRIMARY KEY(`id`),
	CONSTRAINT `league_seasons_weekStart_unique` UNIQUE(`weekStart`)
);
--> statement-breakpoint
CREATE TABLE `user_badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fingerprint` varchar(128) NOT NULL,
	`badgeId` int NOT NULL,
	`awardedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_badges_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_user_badge` UNIQUE(`fingerprint`,`badgeId`)
);
--> statement-breakpoint
CREATE INDEX `idx_league_members` ON `league_members` (`seasonId`,`division`);--> statement-breakpoint
CREATE INDEX `idx_user_badges_fp` ON `user_badges` (`fingerprint`);--> statement-breakpoint
INSERT INTO `badges` (`code`, `name`, `description`, `icon`, `tier`, `qReward`) VALUES
('primeira-opiniao', 'Primeira Opinião', 'Registrou sua primeira opinião no AchoQ.', 'sprout', 'bronze', 10),
('dez-opinioes', 'Opinador', 'Registrou 10 opiniões.', 'message-circle', 'bronze', 20),
('cinquenta-opinioes', 'Voz Ativa', 'Registrou 50 opiniões.', 'megaphone', 'prata', 50),
('cem-opinioes', 'Formador de Opinião', 'Registrou 100 opiniões.', 'radio-tower', 'ouro', 100),
('primeiro-acerto', 'Na Mosca', 'Acertou sua primeira previsão.', 'target', 'bronze', 20),
('dez-acertos', 'Certeiro', 'Acertou 10 previsões.', 'crosshair', 'prata', 50),
('vidente-5', 'Vidente', 'Acertou 5 previsões seguidas.', 'eye', 'ouro', 50),
('assiduo-3', 'Assíduo', 'Check-in por 3 dias seguidos.', 'flame', 'bronze', 15),
('assiduo-7', 'Fiel', 'Check-in por 7 dias seguidos.', 'flame', 'prata', 30),
('assiduo-30', 'Inabalável', 'Check-in por 30 dias seguidos.', 'flame', 'ouro', 100),
('madrugador', 'Madrugador', 'Opinou cedo (primeiras 48h) em 10 enquetes.', 'sunrise', 'prata', 30),
('comentarista', 'Comentarista', 'Publicou 10 comentários.', 'message-square', 'bronze', 20);
