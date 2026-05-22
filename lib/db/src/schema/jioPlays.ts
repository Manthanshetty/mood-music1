import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const jioPlaysTable = pgTable("jio_plays", {
  jioPlayId: text("jio_play_id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.userId),
  jioSongId: text("jio_song_id").notNull(),
  songName: text("song_name").notNull(),
  artist: text("artist").notNull().default(""),
  imageUrl: text("image_url"),
  moodId: text("mood_id"),
  playedAt: timestamp("played_at").defaultNow().notNull(),
});

export type JioPlay = typeof jioPlaysTable.$inferSelect;
