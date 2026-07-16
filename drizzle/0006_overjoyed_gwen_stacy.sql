DELETE FROM `votes` WHERE `id` NOT IN (
  SELECT keep_id FROM (
    SELECT MIN(`id`) AS keep_id FROM `votes` GROUP BY `marketId`, `fingerprint`
  ) AS keepers
);--> statement-breakpoint
ALTER TABLE `votes` ADD CONSTRAINT `uniq_vote_market_fp` UNIQUE(`marketId`,`fingerprint`);--> statement-breakpoint
CREATE INDEX `idx_markets_category` ON `markets` (`category`,`isActive`);--> statement-breakpoint
CREATE INDEX `idx_votes_fingerprint` ON `votes` (`fingerprint`);
