import { Router } from "express";
import { db, songsTable, moodsTable, historyTable } from "@workspace/db";
import { eq, or, desc, count, sql } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";

const router = Router();

function songRow(s: typeof songsTable.$inferSelect, moodName: string) {
  return {
    songId: s.songId,
    songName: s.songName,
    artist: s.artist,
    duration: s.duration,
    moodId: s.moodId,
    moodName,
    youtubeId: s.youtubeId,
    spotifyId: s.spotifyId,
    genre: s.genre,
    language: s.language,
    tempo: s.tempo,
    playCount: s.playCount,
  };
}

router.get("/songs", async (req, res) => {
  try {
    const { moodId, genre, tempo, language } = req.query as Record<string, string>;

    const rows = await db
      .select({
        song: songsTable,
        moodName: moodsTable.moodName,
      })
      .from(songsTable)
      .innerJoin(moodsTable, eq(songsTable.moodId, moodsTable.moodId))
      .where(moodId ? eq(songsTable.moodId, moodId) : undefined);

    let result = rows.map((r) => songRow(r.song, r.moodName));

    if (genre && genre !== "all") result = result.filter((s) => s.genre?.toLowerCase() === genre.toLowerCase());
    if (tempo && tempo !== "all") result = result.filter((s) => s.tempo?.toLowerCase() === tempo.toLowerCase());
    if (language && language !== "all") result = result.filter((s) => s.language?.toLowerCase() === language.toLowerCase());

    res.json(result);
  } catch (err) {
    console.error("GET /songs error:", err);
    res.status(500).json({ error: "Failed to load songs" });
  }
});

router.get("/songs/search", async (req, res) => {
  try {
    const { q, moodId } = req.query as Record<string, string>;
    if (!q || !q.trim()) {
      res.json([]);
      return;
    }

    const decodedQ = decodeURIComponent(q.trim());
    const words = decodedQ.split(/\s+/).filter(Boolean);

    const rows = await db
      .select({ song: songsTable, moodName: moodsTable.moodName })
      .from(songsTable)
      .innerJoin(moodsTable, eq(songsTable.moodId, moodsTable.moodId))
      .where(
        or(
          ...words.flatMap((word) => [
            sql`${songsTable.songName} ILIKE ${"%" + word + "%"}`,
            sql`${songsTable.artist} ILIKE ${"%" + word + "%"}`,
            sql`${songsTable.genre} ILIKE ${"%" + word + "%"}`,
            sql`${songsTable.language} ILIKE ${"%" + word + "%"}`,
          ]),
        ),
      );

    let result = rows.map((r) => songRow(r.song, r.moodName));
    if (moodId && moodId !== "all") {
      result = result.filter((s) => s.moodId === moodId);
    }

    res.json(result);
  } catch (err) {
    console.error("GET /songs/search error:", err);
    res.status(500).json({ error: "Search failed" });
  }
});

router.post("/songs/:songId/play", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { songId } = req.params;

    const now = new Date();
    const playedDate = now.toISOString().split("T")[0];
    const time = now.toTimeString().split(" ")[0];
    const historyId = "HIS" + now.getTime();

    await db.insert(historyTable).values({
      historyId,
      userId: req.dbUserId!,
      songId,
      playedDate,
      time,
    });

    await db
      .update(songsTable)
      .set({ playCount: sql`${songsTable.playCount} + 1` })
      .where(eq(songsTable.songId, songId));

    const song = await db
      .select({ song: songsTable, moodName: moodsTable.moodName })
      .from(songsTable)
      .innerJoin(moodsTable, eq(songsTable.moodId, moodsTable.moodId))
      .where(eq(songsTable.songId, songId))
      .limit(1);

    res.status(201).json({
      historyId,
      songId,
      songName: song[0]?.song.songName ?? "",
      artist: song[0]?.song.artist ?? "",
      moodId: song[0]?.song.moodId ?? "",
      moodName: song[0]?.moodName ?? "",
      emoji: "",
      playedDate,
      time,
    });
  } catch (err) {
    console.error("POST /songs/:songId/play error:", err);
    res.status(500).json({ error: "Failed to record play" });
  }
});

router.get("/songs/recommended/:moodId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { moodId } = req.params;

    const allSongs = await db
      .select({ song: songsTable, moodName: moodsTable.moodName })
      .from(songsTable)
      .innerJoin(moodsTable, eq(songsTable.moodId, moodsTable.moodId))
      .where(eq(songsTable.moodId, moodId))
      .orderBy(desc(songsTable.playCount));

    const playedRows = await db
      .select({ songId: historyTable.songId })
      .from(historyTable)
      .where(eq(historyTable.userId, req.dbUserId!));

    const playedIds = new Set(playedRows.map((r) => r.songId));

    const popular = allSongs
      .filter((r) => playedIds.has(r.song.songId))
      .map((r) => songRow(r.song, r.moodName));

    const discover = allSongs
      .filter((r) => !playedIds.has(r.song.songId))
      .map((r) => songRow(r.song, r.moodName));

    res.json({ popular, discover });
  } catch (err) {
    console.error("GET /songs/recommended error:", err);
    res.status(500).json({ error: "Failed to load recommended songs" });
  }
});

export default router;
