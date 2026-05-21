import { pgTable, text, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { moodsTable } from "./moods";

export const songsTable = pgTable("songs", {
  songId: text("song_id").primaryKey(),
  songName: text("song_name").notNull(),
  artist: text("artist").notNull(),
  duration: text("duration"),
  moodId: text("mood_id").notNull().references(() => moodsTable.moodId),
  youtubeId: text("youtube_id"),
  genre: text("genre"),
  language: text("language"),
  tempo: text("tempo"),
  playCount: integer("play_count").notNull().default(0),
});

export const insertSongSchema = createInsertSchema(songsTable);
export type InsertSong = z.infer<typeof insertSongSchema>;
export type Song = typeof songsTable.$inferSelect;
