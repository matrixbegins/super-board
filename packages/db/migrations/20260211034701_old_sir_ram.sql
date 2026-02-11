ALTER TABLE "card_activity" ADD COLUMN "externalCreatedByName" varchar(255);--> statement-breakpoint
ALTER TABLE "card_activity" ADD COLUMN "externalCreatedByEmail" varchar(255);--> statement-breakpoint
ALTER TABLE "card" ADD COLUMN "externalCreatedByName" varchar(255);--> statement-breakpoint
ALTER TABLE "card" ADD COLUMN "externalCreatedByEmail" varchar(255);--> statement-breakpoint
ALTER TABLE "card_comments" ADD COLUMN "externalCreatedByName" varchar(255);--> statement-breakpoint
ALTER TABLE "card_comments" ADD COLUMN "externalCreatedByEmail" varchar(255);