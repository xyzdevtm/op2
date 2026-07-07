import { Router, type Request, type Response } from "express";
import { LeaderboardConfig } from "../db/models/LeaderboardConfig.js";
import { User } from "../db/models/User.js";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    let config = await LeaderboardConfig.findOne();
    if (!config) {
      config = await LeaderboardConfig.create({});
    }

    if (!config.isEnabled) {
      res.json({ leaderboard: [], enabled: false });
      return;
    }

    const query: Record<string, unknown> = {
      isBanned: false,
    };

    if (config.minWinsRequired > 0) {
      query["stats.wins"] = { $gte: config.minWinsRequired };
    }

    if (config.excludedUsers.length > 0) {
      query._id = { $nin: config.excludedUsers };
    }

    let users = await User.find(query)
      .select("username publicId stats clanTag")
      .sort({ "stats.wins": -1, "stats.kdRatio": -1 })
      .limit(100)
      .lean();

    for (const override of config.manualOverrides) {
      const userIndex = users.findIndex(
        (u) =>
          u._id.toString() ===
          override.userId.toString(),
      );
      if (userIndex >= 0) {
        const [user] = users.splice(userIndex, 1);
        users.splice(override.customRank - 1, 0, user);
      }
    }

    const ranked = users.map((user, index) => ({
      rank: index + 1,
      ...user,
    }));

    res.json({
      leaderboard: ranked,
      enabled: true,
      config: {
        minWinsRequired: config.minWinsRequired,
      },
    });
  } catch {
    res
      .status(500)
      .json({ error: "Failed to fetch leaderboard" });
  }
});

export default router;
