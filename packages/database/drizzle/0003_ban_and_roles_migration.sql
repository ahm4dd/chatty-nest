CREATE TYPE "public"."ban_action" AS ENUM('BANNED', 'UNBANNED');--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'SUPPORT' BEFORE 'USER';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'MODERATOR' BEFORE 'USER';--> statement-breakpoint
CREATE TABLE "ban_events" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"action" "ban_action" NOT NULL,
	"reason" varchar(1000),
	"expires_at" timestamp with time zone,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_expires_at_only_for_bans" CHECK ("ban_events"."action" = 'BANNED' OR "ban_events"."expires_at" IS NULL)
);
--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "role" TO "roles";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "roles" SET DATA TYPE user_role[] USING ARRAY["roles"]::user_role[];--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "roles" SET DEFAULT '{"USER"}'::user_role[];--> statement-breakpoint
ALTER TABLE "ban_events" ADD CONSTRAINT "ban_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ban_events" ADD CONSTRAINT "ban_events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ban_events_user_created_idx" ON "ban_events" USING btree ("user_id","created_at");--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "banned";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "ban_reason";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "ban_expires";