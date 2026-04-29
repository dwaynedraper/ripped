ALTER TABLE "users"
ALTER COLUMN "city_name" TYPE text
USING "city_name"::text;
