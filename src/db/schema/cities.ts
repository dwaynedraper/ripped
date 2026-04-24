import { char, pgTable, serial, text } from "drizzle-orm/pg-core";

export const cities = pgTable("cities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  countryCode: char("country_code", { length: 2 }).notNull(),
});
