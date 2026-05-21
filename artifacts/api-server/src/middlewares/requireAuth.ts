import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export interface AuthRequest extends Request {
  dbUserId?: string;
  clerkUserId?: string;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const auth = getAuth(req);
  const clerkId = auth?.userId;

  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  req.clerkUserId = clerkId;

  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId))
    .limit(1);

  if (user.length === 0) {
    const newUserId = "USR" + Math.floor(Math.random() * 1000000).toString().padStart(6, "0");
    const clerkUser = auth as any;
    const email = clerkUser?.sessionClaims?.email as string ?? "";
    const userName = (clerkUser?.sessionClaims?.firstName as string ?? "") + " " + (clerkUser?.sessionClaims?.lastName as string ?? "");

    await db.insert(usersTable).values({
      userId: newUserId,
      clerkId,
      userName: userName.trim() || "User",
      email: email || `${clerkId}@placeholder.com`,
    });

    req.dbUserId = newUserId;
  } else {
    req.dbUserId = user[0].userId;
  }

  next();
};
