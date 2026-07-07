import { Router, type Request, type Response } from "express";
import { Clan } from "../db/models/Clan.js";
import { User } from "../db/models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { tag, name, description } = req.body;

    if (!tag || !name) {
      res
        .status(400)
        .json({ error: "Tag and name are required" });
      return;
    }

    if (tag.length > 5) {
      res.status(400).json({
        error: "Tag must be 5 characters or less",
      });
      return;
    }

    if (user.clanTag) {
      res
        .status(409)
        .json({ error: "You are already in a clan" });
      return;
    }

    const existing = await Clan.findOne({
      tag: tag.toUpperCase(),
    });
    if (existing) {
      res
        .status(409)
        .json({ error: "Clan tag already taken" });
      return;
    }

    const clan = new Clan({
      tag: tag.toUpperCase(),
      name,
      description: description || "",
      leaderId: user._id,
      members: [
        {
          userId: user._id,
          role: "leader",
          joinedAt: new Date(),
        },
      ],
      memberCount: 1,
    });

    await clan.save();

    user.clanTag = tag.toUpperCase();
    await user.save();

    res.status(201).json({ clan });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create clan";
    res.status(500).json({ error: message });
  }
});

router.get("/", async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;

    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { tag: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
      ];
    }

    const clans = await Clan.find(query)
      .sort({ "stats.wins": -1, memberCount: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Clan.countDocuments(query);

    res.json({ clans, total, page, limit });
  } catch {
    res
      .status(500)
      .json({ error: "Failed to fetch clans" });
  }
});

router.get("/:tag", async (req: Request, res: Response) => {
  try {
    const clan = await Clan.findOne({
      tag: req.params.tag.toUpperCase(),
    })
      .populate("members.userId", "username publicId")
      .lean();

    if (!clan) {
      res.status(404).json({ error: "Clan not found" });
      return;
    }

    res.json({ clan });
  } catch {
    res
      .status(500)
      .json({ error: "Failed to fetch clan" });
  }
});

router.post(
  "/:tag/join",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const clan = await Clan.findOne({
        tag: req.params.tag.toUpperCase(),
      });

      if (!clan) {
        res.status(404).json({ error: "Clan not found" });
        return;
      }

      if (user.clanTag) {
        res
          .status(409)
          .json({ error: "You are already in a clan" });
        return;
      }

      const isMember = clan.members.some(
        (m) =>
          m.userId.toString() ===
          (user._id as unknown as { toString(): string }).toString(),
      );
      if (isMember) {
        res
          .status(409)
          .json({ error: "Already a member" });
        return;
      }

      clan.members.push({
        userId: user._id,
        role: "member",
        joinedAt: new Date(),
      });
      clan.memberCount = clan.members.length;
      await clan.save();

      user.clanTag = clan.tag;
      await user.save();

      res.json({ success: true });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to join clan";
      res.status(500).json({ error: message });
    }
  },
);

router.delete(
  "/:tag/leave",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const clan = await Clan.findOne({
        tag: req.params.tag.toUpperCase(),
      });

      if (!clan) {
        res.status(404).json({ error: "Clan not found" });
        return;
      }

      if (user.clanTag !== clan.tag) {
        res
          .status(400)
          .json({ error: "You are not in this clan" });
        return;
      }

      if (
        clan.leaderId.toString() ===
        (user._id as unknown as { toString(): string }).toString()
      ) {
        res.status(400).json({
          error:
            "Leader cannot leave. Transfer leadership first.",
        });
        return;
      }

      clan.members = clan.members.filter(
        (m) =>
          m.userId.toString() !==
          (user._id as unknown as { toString(): string }).toString(),
      );
      clan.memberCount = clan.members.length;
      await clan.save();

      user.clanTag = undefined;
      await user.save();

      res.json({ success: true });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to leave clan";
      res.status(500).json({ error: message });
    }
  },
);

export default router;
