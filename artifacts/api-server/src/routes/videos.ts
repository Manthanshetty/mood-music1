import { Router } from "express";
import { db, videosTable, songsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";

const router = Router();

router.get("/videos", requireAuth, async (req: AuthRequest, res) => {
  const rows = await db
    .select({
      video: videosTable,
      songName: songsTable.songName,
      artist: songsTable.artist,
    })
    .from(videosTable)
    .innerJoin(songsTable, eq(videosTable.songId, songsTable.songId))
    .where(eq(videosTable.userId, req.dbUserId!));

  res.json(
    rows.map((r) => ({
      videoId: r.video.videoId,
      title: r.video.title,
      uploadDate: r.video.uploadDate,
      editType: r.video.editType,
      songId: r.video.songId,
      songName: r.songName,
      artist: r.artist,
      filePath: r.video.filePath,
    })),
  );
});

router.post("/videos", requireAuth, async (req: AuthRequest, res) => {
  const { title, songId, editType, filePath } = req.body;
  if (!title || !songId) {
    res.status(400).json({ error: "title and songId are required" });
    return;
  }

  const videoId = "VID" + Date.now();
  const uploadDate = new Date().toISOString().split("T")[0];

  await db.insert(videosTable).values({
    videoId,
    title,
    uploadDate,
    editType: editType ?? "Normal",
    songId,
    userId: req.dbUserId!,
    filePath: filePath ?? null,
  });

  const song = await db
    .select()
    .from(songsTable)
    .where(eq(songsTable.songId, songId))
    .limit(1);

  res.status(201).json({
    videoId,
    title,
    uploadDate,
    editType: editType ?? "Normal",
    songId,
    songName: song[0]?.songName ?? "",
    artist: song[0]?.artist ?? "",
    filePath: filePath ?? null,
  });
});

router.delete("/videos/:videoId", requireAuth, async (req: AuthRequest, res) => {
  const { videoId } = req.params;
  await db
    .delete(videosTable)
    .where(and(eq(videosTable.videoId, videoId), eq(videosTable.userId, req.dbUserId!)));
  res.json({ message: "Deleted" });
});

export default router;
