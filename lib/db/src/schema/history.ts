import { pgTable, text, date, time } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { songsTable } from "./songs";

export const historyTable = pgTable("history", {
  historyId: text("history_id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.userId),
  songId: text("song_id").notNull().references(() => songsTable.songId),
  playedDate: date("played_date").notNull(),
  time: time("time").notNull(),
});

export const insertHistorySchema = createInsertSchema(historyTable);
export type InsertHistory = z.infer<typeof insertHistorySchema>;
export type History = typeof historyTable.$inferSelect;
