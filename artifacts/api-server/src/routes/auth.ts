import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";

const router = Router();

router.get("/auth/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.userId, req.dbUserId!))
      .limit(1);

    if (!user.length) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const u = user[0];
    res.json({
      userId: u.userId,
      userName: u.userName,
      email: u.email,
      mobileNumber: u.mobileNumber,
      createdAt: u.createdAt?.toISOString() ?? null,
    });
  } catch (err) {
    console.error("GET /auth/me error:", err);
    res.status(500).json({ error: "Failed to load user" });
  }
});

router.patch("/auth/profile", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { userName, email, mobileNumber } = req.body;

    await db
      .update(usersTable)
      .set({
        ...(userName ? { userName } : {}),
        ...(email ? { email } : {}),
        ...(mobileNumber !== undefined ? { mobileNumber } : {}),
      })
      .where(eq(usersTable.userId, req.dbUserId!));

    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.userId, req.dbUserId!))
      .limit(1);

    const u = user[0];
    res.json({
      userId: u.userId,
      userName: u.userName,
      email: u.email,
      mobileNumber: u.mobileNumber,
      createdAt: u.createdAt?.toISOString() ?? null,
    });
  } catch (err) {
    console.error("PATCH /auth/profile error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

router.post("/auth/password", requireAuth, async (_req: AuthRequest, res) => {
  res.json({ message: "Password management is handled by Clerk" });
});

router.post("/auth/delete", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { confirmation } = req.body;
    if (confirmation !== "DELETE") {
      res.status(400).json({ error: "Confirmation text must be DELETE" });
      return;
    }

    await db.delete(usersTable).where(eq(usersTable.userId, req.dbUserId!));
    res.json({ message: "Account deleted" });
  } catch (err) {
    console.error("POST /auth/delete error:", err);
    res.status(500).json({ error: "Failed to delete account" });
  }
});

export default router;
