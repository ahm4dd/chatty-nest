ALTER TABLE "sessions" RENAME COLUMN "session_token" TO "refresh_token_hash";--> statement-breakpoint
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_session_token_unique";--> statement-breakpoint
DROP INDEX "session_token_idx";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "banned" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "verifications" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "verifications" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "session_refresh_token_hash_idx" ON "sessions" USING btree ("refresh_token_hash");--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_refresh_token_hash_unique" UNIQUE("refresh_token_hash");