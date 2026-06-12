ALTER TABLE "ban_events" DROP CONSTRAINT "ban_events_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "ban_events" ADD CONSTRAINT "ban_events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;