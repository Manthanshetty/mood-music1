import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { db, videosTable, songsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.resolve(__dirname, "../../uploads");
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "video/mp4" || file.originalname.toLowerCase().endsWith(".mp4")) {
      cb(null, true);
    } else {
      cb(new Error("Only MP4 files are allowed"));
    }
  },
});

const router = Router();

router.get("/videos", requireAuth, async (req: AuthRequest, res) => {
  const rows = await db
    .select({
      video: videosTable,
      songName: songsTable.songName,
      artist: songsTable.artist,
      youtubeId: songsTable.youtubeId,
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
      youtubeId: r.youtubeId,
      filePath: r.video.filePath,
    })),
  );
});

router.post("/videos", requireAuth, upload.single("video_file"), async (req: AuthRequest, res) => {
  const { title, songId, editType } = req.body;
  if (!title || !songId) {
    res.status(400).json({ error: "title and songId are required" });
    return;
  }

  const videoId = "VID" + Date.now();
  const uploadDate = new Date().toISOString().split("T")[0];
  const filePath = req.file ? `uploads/${req.file.filename}` : null;

  await db.insert(videosTable).values({
    videoId,
    title,
    uploadDate,
    editType: editType ?? "Normal",
    songId,
    userId: req.dbUserId!,
    filePath,
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
    youtubeId: song[0]?.youtubeId ?? "",
    filePath,
  });
});

router.delete("/videos/:videoId", requireAuth, async (req: AuthRequest, res) => {
  const { videoId } = req.params;
  const rows = await db
    .select()
    .from(videosTable)
    .where(and(eq(videosTable.videoId, videoId), eq(videosTable.userId, req.dbUserId!)))
    .limit(1);

  if (rows[0]?.filePath) {
    const abs = path.resolve(__dirname, "../../", rows[0].filePath);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  }

  await db
    .delete(videosTable)
    .where(and(eq(videosTable.videoId, videoId), eq(videosTable.userId, req.dbUserId!)));

  res.json({ message: "Deleted" });
});

export default router;
