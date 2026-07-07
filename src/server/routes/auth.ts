import crypto from "crypto";
import { Router, type Request, type Response } from "express";
import { User } from "../db/models/User.js";
import { signToken } from "../crypto/jwt-keys.js";
import { requireAuth } from "../middleware/auth.js";
import { uuidToBase64url } from "../../core/Base64.js";

const router = Router();

// In-memory password reset codes (short-lived, 10 min expiry)
const resetCodes = new Map<string, { email: string; expiresAt: number }>();

async function issueJWT(user: {
  persistentId: string;
  role: string;
}): Promise<string> {
  return signToken({
    sub: uuidToBase64url(user.persistentId),
    role: user.role,
  });
}

router.post("/register", async (req: Request, res: Response) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password) {
      res
        .status(400)
        .json({ error: "Username and password are required" });
      return;
    }

    if (username.length < 3 || username.length > 20) {
      res
        .status(400)
        .json({ error: "Username must be 3-20 characters" });
      return;
    }

    if (password.length < 6) {
      res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
      return;
    }

    const existing = await User.findOne({
      $or: [{ username }, { email }],
    });
    if (existing) {
      res
        .status(409)
        .json({ error: "Username or email already taken" });
      return;
    }

    const persistentId = crypto.randomUUID();
    const publicId = User.generatePublicId();

    const user = new User({
      username,
      passwordHash: password,
      email,
      persistentId,
      publicId,
    });

    await user.save();

    (req.session as Record<string, unknown>).userId = (
      user as unknown as { _id: { toString(): string } }
    )._id.toString();

    const token = await issueJWT({
      persistentId: user.persistentId,
      role: user.role,
    });

    res.status(201).json({
      user: {
        id: (user as unknown as { _id: unknown })._id,
        username: user.username,
        email: user.email,
        publicId: user.publicId,
        role: user.role,
        persistentId: user.persistentId,
      },
      token,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Registration failed";
    console.error("[Auth] Register error:", error);
    res.status(500).json({ error: message });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res
        .status(400)
        .json({ error: "Username and password are required" });
      return;
    }

    const user = await User.findOne({
      $or: [{ username }, { email: username }],
    });

    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    if (user.isBanned) {
      res
        .status(403)
        .json({ error: "Account is banned", reason: user.banReason });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    (req.session as Record<string, unknown>).userId = (
      user as unknown as { _id: { toString(): string } }
    )._id.toString();

    const token = await issueJWT({
      persistentId: user.persistentId,
      role: user.role,
    });

    res.json({
      user: {
        id: (user as unknown as { _id: unknown })._id,
        username: user.username,
        email: user.email,
        publicId: user.publicId,
        role: user.role,
        persistentId: user.persistentId,
      },
      token,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Login failed";
    console.error("[Auth] Login error:", error);
    res.status(500).json({ error: message });
  }
});

// Anonymous player - get a JWT without creating an account
router.post("/anonymous", async (_req: Request, res: Response) => {
  try {
    const persistentId = crypto.randomUUID();

    const token = await signToken({
      sub: uuidToBase64url(persistentId),
      role: "anonymous",
    });

    res.json({
      user: {
        persistentId,
        username: `Guest-${persistentId.slice(0, 6)}`,
        role: "anonymous",
        publicId: null,
      },
      token,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create anonymous token";
    res.status(500).json({ error: message });
  }
});

router.post("/logout", (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: "Logout failed" });
      return;
    }
    res.clearCookie("connect.sid");
    res.json({ success: true });
  });
});

router.get("/me", requireAuth, async (req: Request, res: Response) => {
  const user = req.user!;

  let token: string | undefined;
  try {
    token = await issueJWT({
      persistentId: user.persistentId,
      role: user.role,
    });
  } catch {
    // Token generation failed, continue without it
  }

  res.json({
    user: {
      id: (user as unknown as { _id: unknown })._id,
      username: user.username,
      email: user.email,
      publicId: user.publicId,
      role: user.role,
      wallet: user.wallet,
      inventory: user.inventory,
      stats: user.stats,
      ranked: user.ranked,
      clanTag: user.clanTag,
      friends: user.friends,
      achievements: user.achievements,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      createdAt: user.createdAt,
      persistentId: user.persistentId,
    },
    token,
  });
});

router.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    res.json({
      message: "If this email is registered, a reset code will be sent.",
    });

    if (user) {
      const code = crypto.randomInt(100000, 999999).toString();
      resetCodes.set(code, {
        email,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      });
      console.log(`[Auth] Password reset code for ${email}: ${code}`);
    }
  } catch {
    res.status(500).json({ error: "Failed to process request" });
  }
});

router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const { code, newPassword, email } = req.body;

    if (!code || !newPassword || !email) {
      res.status(400).json({
        error: "Code, email, and new password are required",
      });
      return;
    }

    // Validate the reset code
    const entry = resetCodes.get(code);
    if (!entry || entry.email !== email) {
      res.status(400).json({ error: "Invalid or expired reset code" });
      return;
    }
    if (Date.now() > entry.expiresAt) {
      resetCodes.delete(code);
      res.status(400).json({ error: "Reset code has expired" });
      return;
    }

    // One-time use
    resetCodes.delete(code);

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    user.passwordHash = newPassword;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch {
    res.status(500).json({ error: "Failed to reset password" });
  }
});

export default router;
