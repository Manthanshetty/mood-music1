import { pgTable, text, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { songsTable } from "./songs";

export const videosTable = pgTable("videos", {
  videoId: text("video_id").primaryKey(),
  title: text("title").notNull(),
  uploadDate: date("upload_date").notNull(),
  editType: text("edit_type").notNull().default("Normal"),
  songId: text("song_id").notNull().references(() => songsTable.songId),
  userId: text("user_id").notNull().references(() => usersTable.userId),
  filePath: text("file_path"),
});

export const insertVideoSchema = createInsertSchema(videosTable);
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Video = typeof videosTable.$inferSelect;
