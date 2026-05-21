import { Router } from "express";
import { db, historyTable, songsTable, moodsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";

const MOOD_EMOJI: Record<string, string> = {
  M001: "😊", M002: "😢", M003: "😌", M004: "⚡", M005: "💕", M006: "🎯",
};

const router = Router();

router.get("/history", requireAuth, async (req: AuthRequest, res) => {
  try {
    const rows = await db
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
      .where(eq(historyTable.userId, req.dbUserId!))
      .orderBy(desc(historyTable.playedDate))
      .limit(20);

    res.json(
      rows.map((r) => ({
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
    );
  } catch (err) {
    console.error("GET /history error:", err);
    res.status(500).json({ error: "Failed to load history" });
  }
});

export default router;
