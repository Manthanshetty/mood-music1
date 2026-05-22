import { pgTable, text, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const likedJioSongsTable = pgTable(
  "liked_jio_songs",
  {
    userId: text("user_id").notNull().references(() => usersTable.userId),
    jioSongId: text("jio_song_id").notNull(),
    songName: text("song_name").notNull(),
    artist: text("artist").notNull().default(""),
    imageUrl: text("image_url"),
    audioUrl: text("audio_url"),
    likedAt: timestamp("liked_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.jioSongId] })],
);

export type LikedJioSong = typeof likedJioSongsTable.$inferSelect;
