import { Router } from "express";
import { db, moodsTable, moodSelectionsTable } from "@workspace/db";
import { eq, desc, count } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";

const router = Router();

const MOOD_META: Record<string, { emoji: string; gradient: string }> = {
  M001: { emoji: "😊", gradient: "linear-gradient(135deg, #f7971e, #ffd200)" },
  M002: { emoji: "😢", gradient: "linear-gradient(135deg, #4facfe, #00f2fe)" },
  M003: { emoji: "😌", gradient: "linear-gradient(135deg, #43e97b, #38f9d7)" },
  M004: { emoji: "⚡", gradient: "linear-gradient(135deg, #f953c6, #b91d73)" },
  M005: { emoji: "💕", gradient: "linear-gradient(135deg, #fc5c7d, #6a3093)" },
  M006: { emoji: "😠", gradient: "linear-gradient(135deg, #c0392b, #8e44ad)" },
};

router.get("/moods", async (_req, res) => {
  const moods = await db.select().from(moodsTable);
  res.json(
    moods.map((m) => ({
      moodId: m.moodId,
      moodName: m.moodName,
      description: m.description,
      emoji: MOOD_META[m.moodId]?.emoji ?? "🎵",
      gradient: MOOD_META[m.moodId]?.gradient ?? "",
    })),
  );
});

router.post("/moods/select", requireAuth, async (req: AuthRequest, res) => {
  const { moodId } = req.body;
  if (!moodId) {
    res.status(400).json({ error: "moodId required" });
    return;
  }

  const now = new Date();
  const date = now.toISOString().split("T")[0];
  const time = now.toTimeString().split(" ")[0];
  const selectionId = "MS" + now.getTime();

  await db.insert(moodSelectionsTable).values({
    selectionId,
    userId: req.dbUserId!,
    moodId,
    date,
    time,
  });

  const mood = await db
    .select()
    .from(moodsTable)
    .where(eq(moodsTable.moodId, moodId))
    .limit(1);

  res.status(201).json({
    selectionId,
    moodId,
    moodName: mood[0]?.moodName ?? moodId,
    emoji: MOOD_META[moodId]?.emoji ?? "🎵",
    date,
    time,
  });
});

router.get("/moods/history", requireAuth, async (req: AuthRequest, res) => {
  const rows = await db
    .select({
      selectionId: moodSelectionsTable.selectionId,
      moodId: moodSelectionsTable.moodId,
      moodName: moodsTable.moodName,
      date: moodSelectionsTable.date,
      time: moodSelectionsTable.time,
    })
    .from(moodSelectionsTable)
    .innerJoin(moodsTable, eq(moodSelectionsTable.moodId, moodsTable.moodId))
    .where(eq(moodSelectionsTable.userId, req.dbUserId!))
    .orderBy(desc(moodSelectionsTable.date))
    .limit(10);

  res.json(
    rows.map((r) => ({
      selectionId: r.selectionId,
      moodId: r.moodId,
      moodName: r.moodName,
      emoji: MOOD_META[r.moodId]?.emoji ?? "🎵",
      date: r.date,
      time: r.time,
    })),
  );
});

router.get("/moods/stats", requireAuth, async (req: AuthRequest, res) => {
  const rows = await db
    .select({
      moodId: moodSelectionsTable.moodId,
      moodName: moodsTable.moodName,
      count: count(),
    })
    .from(moodSelectionsTable)
    .innerJoin(moodsTable, eq(moodSelectionsTable.moodId, moodsTable.moodId))
    .where(eq(moodSelectionsTable.userId, req.dbUserId!))
    .groupBy(moodSelectionsTable.moodId, moodsTable.moodName);

  res.json(
    rows.map((r) => ({
      moodId: r.moodId,
      moodName: r.moodName,
      emoji: MOOD_META[r.moodId]?.emoji ?? "🎵",
      count: r.count,
    })),
  );
});

export default router;
