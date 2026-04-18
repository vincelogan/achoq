CREATE TABLE `market_news` (
	`id` int AUTO_INCREMENT NOT NULL,
	`marketId` int NOT NULL,
	`tickerText` varchar(200) NOT NULL,
	`contextText` text NOT NULL,
	`sourceName` varchar(128) NOT NULL,
	`sourceUrl` text,
	`newsDate` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `market_news_id` PRIMARY KEY(`id`)
);
