import { Router } from "express";
import { db, playlistsTable, playlistSongsTable, songsTable, moodsTable } from "@workspace/db";
import { eq, count, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";

const router = Router();

router.get("/playlists", requireAuth, async (req: AuthRequest, res) => {
  const rows = await db
    .select({
      playlistId: playlistsTable.playlistId,
      playlistName: playlistsTable.playlistName,
      createdDate: playlistsTable.createdDate,
      songCount: count(playlistSongsTable.songId),
    })
    .from(playlistsTable)
    .leftJoin(playlistSongsTable, eq(playlistsTable.playlistId, playlistSongsTable.playlistId))
    .where(eq(playlistsTable.userId, req.dbUserId!))
    .groupBy(playlistsTable.playlistId, playlistsTable.playlistName, playlistsTable.createdDate);

  res.json(rows);
});

router.post("/playlists", requireAuth, async (req: AuthRequest, res) => {
  const { playlistName } = req.body;
  if (!playlistName) {
    res.status(400).json({ error: "playlistName required" });
    return;
  }

  const playlistId = "PL" + Date.now();
  const createdDate = new Date().toISOString().split("T")[0];

  await db.insert(playlistsTable).values({
    playlistId,
    playlistName,
    createdDate,
    userId: req.dbUserId!,
  });

  res.status(201).json({ playlistId, playlistName, createdDate, songCount: 0 });
});

router.get("/playlists/:playlistId", requireAuth, async (req: AuthRequest, res) => {
  const { playlistId } = req.params;

  const playlist = await db
    .select()
    .from(playlistsTable)
    .where(and(eq(playlistsTable.playlistId, playlistId), eq(playlistsTable.userId, req.dbUserId!)))
    .limit(1);

  if (!playlist.length) {
    res.status(404).json({ error: "Playlist not found" });
    return;
  }

  const songs = await db
    .select({ song: songsTable, moodName: moodsTable.moodName })
    .from(playlistSongsTable)
    .innerJoin(songsTable, eq(playlistSongsTable.songId, songsTable.songId))
    .innerJoin(moodsTable, eq(songsTable.moodId, moodsTable.moodId))
    .where(eq(playlistSongsTable.playlistId, playlistId));

  res.json({
    playlistId: playlist[0].playlistId,
    playlistName: playlist[0].playlistName,
    createdDate: playlist[0].createdDate,
    songs: songs.map((r) => ({
      songId: r.song.songId,
      songName: r.song.songName,
      artist: r.song.artist,
      duration: r.song.duration,
      moodId: r.song.moodId,
      moodName: r.moodName,
      youtubeId: r.song.youtubeId,
      genre: r.song.genre,
      language: r.song.language,
      tempo: r.song.tempo,
      playCount: r.song.playCount,
    })),
  });
});

router.delete("/playlists/:playlistId", requireAuth, async (req: AuthRequest, res) => {
  const { playlistId } = req.params;
  await db.delete(playlistSongsTable).where(eq(playlistSongsTable.playlistId, playlistId));
  await db
    .delete(playlistsTable)
    .where(and(eq(playlistsTable.playlistId, playlistId), eq(playlistsTable.userId, req.dbUserId!)));
  res.json({ message: "Deleted" });
});

router.post("/playlists/:playlistId/songs", requireAuth, async (req: AuthRequest, res) => {
  const { playlistId } = req.params;
  const { songId } = req.body;
  if (!songId) {
    res.status(400).json({ error: "songId required" });
    return;
  }

  await db
    .insert(playlistSongsTable)
    .values({ playlistId, songId })
    .onConflictDoNothing();

  res.status(201).json({ message: "Song added" });
});

router.delete("/playlists/:playlistId/songs/:songId", requireAuth, async (req: AuthRequest, res) => {
  const { playlistId, songId } = req.params;
  await db
    .delete(playlistSongsTable)
    .where(and(eq(playlistSongsTable.playlistId, playlistId), eq(playlistSongsTable.songId, songId)));
  res.json({ message: "Song removed" });
});

export default router;
