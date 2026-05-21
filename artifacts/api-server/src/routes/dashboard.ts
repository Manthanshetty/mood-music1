import { Router } from "express";
import {
  db,
  historyTable,
  playlistsTable,
  videosTable,
  moodSelectionsTable,
  songsTable,
  moodsTable,
  playlistSongsTable,
} from "@workspace/db";
import { eq, desc, count } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";

const MOOD_EMOJI: Record<string, string> = {
  M001: "😊", M002: "😢", M003: "😌", M004: "⚡", M005: "💕", M006: "🎯",
};

const router = Router();

router.get("/dashboard", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.dbUserId!;

    const [songsPlayed, playlistsCreated, videosUploaded, moodsSelected] =
      await Promise.all([
        db.select({ c: count() }).from(historyTable).where(eq(historyTable.userId, userId)),
        db.select({ c: count() }).from(playlistsTable).where(eq(playlistsTable.userId, userId)),
        db.select({ c: count() }).from(videosTable).where(eq(videosTable.userId, userId)),
        db.select({ c: count() }).from(moodSelectionsTable).where(eq(moodSelectionsTable.userId, userId)),
      ]);

    const recentHistoryRows = await db
      .select({
        historyId: historyTable.historyId,
        songId: historyTable.songId,
        songName: songsTable.songName,
        artist: songsTable.artist,
        moodId: songsTable.moodId,
        moodName: moodsTable.moodName,
        playedDate: historyTable.playedDate,
        time: historyTable.time,
      })
      .from(historyTable)
      .innerJoin(songsTable, eq(historyTable.songId, songsTable.songId))
      .innerJoin(moodsTable, eq(songsTable.moodId, moodsTable.moodId))
      .where(eq(historyTable.userId, userId))
      .orderBy(desc(historyTable.playedDate))
      .limit(8);

    const recentPlaylistRows = await db
      .select({
        playlistId: playlistsTable.playlistId,
        playlistName: playlistsTable.playlistName,
        createdDate: playlistsTable.createdDate,
        songCount: count(playlistSongsTable.songId),
      })
      .from(playlistsTable)
      .leftJoin(playlistSongsTable, eq(playlistsTable.playlistId, playlistSongsTable.playlistId))
      .where(eq(playlistsTable.userId, userId))
      .groupBy(playlistsTable.playlistId, playlistsTable.playlistName, playlistsTable.createdDate)
      .orderBy(desc(playlistsTable.createdDate))
      .limit(3);

    res.json({
      totalSongsPlayed: Number(songsPlayed[0]?.c ?? 0),
      playlistsCreated: Number(playlistsCreated[0]?.c ?? 0),
      videosUploaded: Number(videosUploaded[0]?.c ?? 0),
      moodsSelected: Number(moodsSelected[0]?.c ?? 0),
      recentHistory: recentHistoryRows.map((r) => ({
        historyId: r.historyId,
        songId: r.songId,
        songName: r.songName,
        artist: r.artist,
        moodId: r.moodId,
        moodName: r.moodName,
        emoji: MOOD_EMOJI[r.moodId] ?? "🎵",
        playedDate: r.playedDate,
        time: r.time,
      })),
      recentPlaylists: recentPlaylistRows,
    });
  } catch (err) {
    console.error("GET /dashboard error:", err);
    res.status(500).json({ error: "Failed to load dashboard" });
  }
});

export default router;
