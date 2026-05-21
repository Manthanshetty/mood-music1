import { pgTable, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const moodsTable = pgTable("moods", {
  moodId: text("mood_id").primaryKey(),
  moodName: text("mood_name").notNull(),
  description: text("description"),
  emoji: text("emoji").notNull().default("🎵"),
  gradient: text("gradient").notNull().default(""),
});

export const insertMoodSchema = createInsertSchema(moodsTable);
export type InsertMood = z.infer<typeof insertMoodSchema>;
export type Mood = typeof moodsTable.$inferSelect;
