ALTER TABLE "cities" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "cities" CASCADE;--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "city_id" TO "city_name";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_city_id_cities_id_fk";
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "city_state" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "google_place_id" text;