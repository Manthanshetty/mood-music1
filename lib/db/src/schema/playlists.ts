import { pgTable, text, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const playlistsTable = pgTable("playlists", {
  playlistId: text("playlist_id").primaryKey(),
  playlistName: text("playlist_name").notNull(),
  createdDate: date("created_date").notNull(),
  userId: text("user_id").notNull().references(() => usersTable.userId),
});

export const insertPlaylistSchema = createInsertSchema(playlistsTable);
export type InsertPlaylist = z.infer<typeof insertPlaylistSchema>;
export type Playlist = typeof playlistsTable.$inferSelect;
