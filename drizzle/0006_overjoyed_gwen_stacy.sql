DELETE v1 FROM `votes` v1
INNER JOIN `votes` v2
  ON v1.`marketId` = v2.`marketId`
 AND v1.`fingerprint` = v2.`fingerprint`
 AND v1.`id` > v2.`id`;--> statement-breakpoint
ALTER TABLE `votes` ADD CONSTRAINT `uniq_vote_market_fp` UNIQUE(`marketId`,`fingerprint`);--> statement-breakpoint
CREATE INDEX `idx_markets_category` ON `markets` (`category`,`isActive`);--> statement-breakpoint
CREATE INDEX `idx_votes_fingerprint` ON `votes` (`fingerprint`);
