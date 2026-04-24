CREATE EXTENSION IF NOT EXISTS citext;
--> statement-breakpoint
CREATE TYPE "public"."staff_role" AS ENUM('content_creator', 'admin', 'super_admin');--> statement-breakpoint
CREATE TYPE "public"."subscription_tier" AS ENUM('free', 'premium');--> statement-breakpoint
CREATE TABLE "cities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"country_code" char(2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text NOT NULL,
	"email" text NOT NULL,
	"display_name" "citext" NOT NULL,
	"country_code" char(2) NOT NULL,
	"city_id" integer NOT NULL,
	"timezone" text NOT NULL,
	"subscription_tier" "subscription_tier" DEFAULT 'free' NOT NULL,
	"contribution_points" integer DEFAULT 0 NOT NULL,
	"public_profile" boolean DEFAULT false NOT NULL,
	"first_name" text,
	"last_name" text,
	"bio" text,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"banned_at" timestamp with time zone,
	"billing_name" text,
	"billing_address" jsonb,
	"phone" text,
	"stripe_customer_id" text,
	"staff_role" "staff_role",
	"legal_name" text,
	"contact_email" text,
	"contact_phone" text,
	"invited_by_user_id" uuid,
	"invited_at" timestamp with time zone,
	"accepted_at" timestamp with time zone,
	"removed_at" timestamp with time zone,
	"is_bar_member" boolean DEFAULT false NOT NULL,
	"is_planning_committee" boolean DEFAULT false NOT NULL,
	"bar_granted_at" timestamp with time zone,
	"planning_committee_granted_at" timestamp with time zone,
	CONSTRAINT "users_clerk_user_id_unique" UNIQUE("clerk_user_id"),
	CONSTRAINT "users_display_name_unique" UNIQUE("display_name"),
	CONSTRAINT "contribution_points_non_negative" CHECK ("users"."contribution_points" >= 0)
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" text NOT NULL,
	"actor_user_id" uuid,
	"target_user_id" uuid,
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_invited_by_user_id_fkey" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;