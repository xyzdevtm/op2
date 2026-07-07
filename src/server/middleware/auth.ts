import type { NextFunction, Request, Response } from "express";
import { User, type IUser } from "../db/models/User.js";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  // 1. Try local session
  const userId = (req.session as Record<string, unknown>)?.userId as string | undefined;
  if (userId) {
    try {
      const user = await User.findById(userId);
      if (user && !user.isBanned) {
        req.user = user;
        return next();
      }
    } catch { /* fall through */ }
  }

  // 2. Try JWT from Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const { getPublicKey, getIssuer, getAudience } = await import("../crypto/jwt-keys.js");
      const { jwtVerify } = await import("jose");
      const { base64urlToUuid } = await import("../../core/Base64.js");
      const { payload } = await jwtVerify(token, await getPublicKey(), {
        algorithms: ["EdDSA"],
        issuer: getIssuer(),
        audience: getAudience(),
      });
      const pid = base64urlToUuid(payload.sub as string);
      if (pid) {
        const user = await User.findOne({ persistentId: pid });
        if (user && !user.isBanned) {
          req.user = user;
          return next();
        }
      }
    } catch { /* fall through */ }
  }

  // 3. Try forwarding connect.sid to panel backend
  const rawCookie = req.headers.cookie || "";
  const sidMatch = rawCookie.match(/(?:^|;\s*)connect\.sid=([^;]*)/);
  if (sidMatch) {
    try {
      const { ServerEnv } = await import("../ServerEnv.js");
      const panelUrl = ServerEnv.panelUrl();
      const resp = await fetch(`${panelUrl}/api/auth/me`, {
        headers: { cookie: `connect.sid=${sidMatch[1]}`, "x-panel-secret": ServerEnv.panelSecret() },
      });
      if (resp.ok) {
        const body = (await resp.json()) as Record<string, unknown>;
        const userData = body.user as Record<string, unknown> | undefined;
        if (userData?.id) {
          const user = await User.findById(userData.id);
          if (user && !user.isBanned) {
            (req.session as Record<string, unknown>).userId = user._id.toString();
            req.user = user;
            return next();
          }
        }
      }
    } catch { /* fall through */ }
  }

  res.status(401).json({ error: "Not authenticated" });
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}

export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const userId = (req.session as Record<string, unknown>)?.userId as
    | string
    | undefined;

  if (!userId) {
    next();
    return;
  }

  try {
    const user = await User.findById(userId);
    if (user && !user.isBanned) {
      req.user = user;
    }
  } catch {
    // Ignore errors for optional auth
  }

  next();
}

export function validatePanelSecret(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const secret = req.headers["x-panel-secret"] as string | undefined;
  const expected = process.env.PANEL_GAME_SECRET || "dev-panel-secret";

  if (!secret || secret !== expected) {
    res.status(401).json({ error: "Invalid panel secret" });
    return;
  }

  next();
}
