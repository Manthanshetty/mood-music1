import { pgTable, text, date, time } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { moodsTable } from "./moods";

export const moodSelectionsTable = pgTable("mood_selections", {
  selectionId: text("selection_id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.userId),
  moodId: text("mood_id").notNull().references(() => moodsTable.moodId),
  date: date("date").notNull(),
  time: time("time").notNull(),
});

export const insertMoodSelectionSchema = createInsertSchema(moodSelectionsTable);
export type InsertMoodSelection = z.infer<typeof insertMoodSelectionSchema>;
export type MoodSelection = typeof moodSelectionsTable.$inferSelect;
