import { pgTable, text, primaryKey } from "drizzle-orm/pg-core";
import { playlistsTable } from "./playlists";
import { songsTable } from "./songs";

export const playlistSongsTable = pgTable(
  "playlist_songs",
  {
    playlistId: text("playlist_id").notNull().references(() => playlistsTable.playlistId),
    songId: text("song_id").notNull().references(() => songsTable.songId),
  },
  (t) => [primaryKey({ columns: [t.playlistId, t.songId] })],
);
