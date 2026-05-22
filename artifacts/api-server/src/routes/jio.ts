import { Router } from "express";
import { db, jioPlaysTable, likedJioSongsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";

const router = Router();

router.post("/jio/play", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { jioSongId, songName, artist, imageUrl, moodId } = req.body;
    if (!jioSongId || !songName) {
      res.status(400).json({ error: "jioSongId and songName are required" });
      return;
    }
    const jioPlayId = "JP" + Date.now() + Math.random().toString(36).slice(2, 7);
    await db.insert(jioPlaysTable).values({
      jioPlayId,
      userId: req.dbUserId!,
      jioSongId,
      songName,
      artist: artist ?? "",
      imageUrl: imageUrl ?? null,
      moodId: moodId ?? null,
    });
    res.status(201).json({ jioPlayId });
  } catch (err) {
    console.error("POST /jio/play error:", err);
    res.status(500).json({ error: "Failed to record play" });
  }
});

router.get("/jio/liked", requireAuth, async (req: AuthRequest, res) => {
  try {
    const rows = await db
      .select()
      .from(likedJioSongsTable)
      .where(eq(likedJioSongsTable.userId, req.dbUserId!))
      .orderBy(desc(likedJioSongsTable.likedAt));
    res.json(
      rows.map((r) => ({
        jioSongId: r.jioSongId,
        songName: r.songName,
        artist: r.artist,
        imageUrl: r.imageUrl,
        audioUrl: r.audioUrl,
      })),
    );
  } catch (err) {
    console.error("GET /jio/liked error:", err);
    res.status(500).json({ error: "Failed to fetch liked songs" });
  }
});

router.post("/jio/liked", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { jioSongId, songName, artist, imageUrl, audioUrl } = req.body;
    if (!jioSongId || !songName) {
      res.status(400).json({ error: "jioSongId and songName are required" });
      return;
    }
    await db
      .insert(likedJioSongsTable)
      .values({
        userId: req.dbUserId!,
        jioSongId,
        songName,
        artist: artist ?? "",
        imageUrl: imageUrl ?? null,
        audioUrl: audioUrl ?? null,
      })
      .onConflictDoNothing();
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error("POST /jio/liked error:", err);
    res.status(500).json({ error: "Failed to like song" });
  }
});

router.delete("/jio/liked/:jioSongId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { jioSongId } = req.params;
    await db
      .delete(likedJioSongsTable)
      .where(
        and(
          eq(likedJioSongsTable.userId, req.dbUserId!),
          eq(likedJioSongsTable.jioSongId, jioSongId),
        ),
      );
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /jio/liked error:", err);
    res.status(500).json({ error: "Failed to unlike song" });
  }
});

export default router;
