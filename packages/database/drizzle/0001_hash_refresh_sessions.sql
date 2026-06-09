DELETE FROM "sessions";--> statement-breakpoint
DROP INDEX IF EXISTS "session_token_idx";--> statement-breakpoint
ALTER TABLE "sessions" DROP CONSTRAINT IF EXISTS "sessions_session_token_unique";--> statement-breakpoint
ALTER TABLE "sessions" RENAME COLUMN "session_token" TO "refresh_token_hash";--> statement-breakpoint
CREATE UNIQUE INDEX "session_refresh_token_hash_idx" ON "sessions" USING btree ("refresh_token_hash");--> statement-breakpoint
UPDATE "users" SET "banned" = false WHERE "banned" IS NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "banned" SET NOT NULL;--> statement-breakpoint
DELETE FROM "verifications"
WHERE NOT EXISTS (
  SELECT 1 FROM "users" WHERE "users"."id" = "verifications"."user_id"
);--> statement-breakpoint
ALTER TABLE "verifications" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "verifications" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
