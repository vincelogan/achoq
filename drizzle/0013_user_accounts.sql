ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `googleSub` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `fingerprint` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_googleSub_unique` UNIQUE(`googleSub`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_fingerprint_unique` UNIQUE(`fingerprint`);