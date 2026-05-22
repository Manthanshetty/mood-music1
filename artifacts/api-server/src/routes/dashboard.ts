import { Router } from "express";
import {
  db,
  playlistsTable,
  moodSelectionsTable,
  playlistSongsTable,
  jioPlaysTable,
  likedJioSongsTable,
} from "@workspace/db";
import { eq, desc, count } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";

const MOOD_EMOJI: Record<string, string> = {
  M001: "😊", M002: "😢", M003: "😌", M004: "⚡", M005: "💕", M006: "🎯",
};

const MOOD_NAMES: Record<string, string> = {
  M001: "Happy", M002: "Sad", M003: "Chill", M004: "Energetic", M005: "Romantic", M006: "Focus",
};

const router = Router();

router.get("/dashboard", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.dbUserId!;

    const [songsPlayed, playlistsCreated, likedCount, moodsSelected] =
      await Promise.all([
        db.select({ c: count() }).from(jioPlaysTable).where(eq(jioPlaysTable.userId, userId)),
        db.select({ c: count() }).from(playlistsTable).where(eq(playlistsTable.userId, userId)),
        db.select({ c: count() }).from(likedJioSongsTable).where(eq(likedJioSongsTable.userId, userId)),
        db.select({ c: count() }).from(moodSelectionsTable).where(eq(moodSelectionsTable.userId, userId)),
      ]);

    const recentPlays = await db
      .select()
      .from(jioPlaysTable)
      .where(eq(jioPlaysTable.userId, userId))
      .orderBy(desc(jioPlaysTable.playedAt))
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
      likedSongs: Number(likedCount[0]?.c ?? 0),
      moodsSelected: Number(moodsSelected[0]?.c ?? 0),
      recentHistory: recentPlays.map((r) => ({
        historyId: r.jioPlayId,
        songId: r.jioSongId,
        songName: r.songName,
        artist: r.artist,
        imageUrl: r.imageUrl,
        moodId: r.moodId ?? "",
        moodName: MOOD_NAMES[r.moodId ?? ""] ?? "Unknown",
        emoji: MOOD_EMOJI[r.moodId ?? ""] ?? "🎵",
        playedDate: r.playedAt.toISOString().split("T")[0],
        time: new Date(r.playedAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      })),
      recentPlaylists: recentPlaylistRows,
    });
  } catch (err) {
    console.error("GET /dashboard error:", err);
    res.status(500).json({ error: "Failed to load dashboard" });
  }
});

export default router;
