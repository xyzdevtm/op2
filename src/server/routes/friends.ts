import { Router, type Request, type Response } from "express";
import { User } from "../db/models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const populated = await User.findById(user._id)
      .populate("friends", "username publicId stats.clanTag")
      .lean();

    res.json({ friends: populated?.friends || [] });
  } catch {
    res
      .status(500)
      .json({ error: "Failed to fetch friends" });
  }
});

router.get(
  "/requests",
  requireAuth,
  async (_req: Request, res: Response) => {
    res.json({ requests: [] });
  },
);

router.post(
  "/request/:publicId",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const target = await User.findOne({
        publicId: req.params.publicId,
      });

      if (!target) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      if (
        target._id.toString() ===
        (user._id as unknown as { toString(): string }).toString()
      ) {
        res
          .status(400)
          .json({ error: "Cannot add yourself" });
        return;
      }

      if (
        user.friends.some(
          (id) =>
            id.toString() ===
            (target._id as unknown as { toString(): string }).toString(),
        )
      ) {
        res
          .status(409)
          .json({ error: "Already friends" });
        return;
      }

      user.friends.push(target._id);
      await user.save();

      target.friends.push(user._id);
      await target.save();

      res.json({ success: true });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to add friend";
      res.status(500).json({ error: message });
    }
  },
);

router.post(
  "/accept/:publicId",
  requireAuth,
  async (_req: Request, res: Response) => {
    res.json({ success: true });
  },
);

router.delete(
  "/:publicId",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const target = await User.findOne({
        publicId: req.params.publicId,
      });

      if (!target) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      user.friends = user.friends.filter(
        (id) =>
          id.toString() !==
          (target._id as unknown as { toString(): string }).toString(),
      );
      await user.save();

      target.friends = target.friends.filter(
        (id) =>
          id.toString() !==
          (user._id as unknown as { toString(): string }).toString(),
      );
      await target.save();

      res.json({ success: true });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to remove friend";
      res.status(500).json({ error: message });
    }
  },
);

export default router;
