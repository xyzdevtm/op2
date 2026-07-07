import { Router, Request, Response } from 'express';
import { User } from '../db/models/User.js';
import { Clan } from '../db/models/Clan.js';
import { LeaderboardConfig } from '../db/models/LeaderboardConfig.js';

const router = Router();

// Get players leaderboard
router.get('/players', async (req: Request, res: Response) => {
  try {
    let config = await LeaderboardConfig.findOne();
    if (!config) {
      config = await LeaderboardConfig.create({});
    }

    if (!config.isEnabled) {
      res.json({ players: [], enabled: false });
      return;
    }

    const query: any = { isBanned: false };

    if (config.minWinsRequired > 0) {
      query['stats.wins'] = { $gte: config.minWinsRequired };
    }

    if (config.excludedUsers.length > 0) {
      query._id = { $nin: config.excludedUsers };
    }

    let users = await User.find(query)
      .select('username publicId stats ranked clanTag avatarUrl')
      .sort({ 'stats.wins': -1, 'stats.kdRatio': -1 })
      .limit(100)
      .lean();

    // Apply manual overrides
    for (const override of config.manualOverrides) {
      const idx = users.findIndex(u => u._id.toString() === override.userId.toString());
      if (idx >= 0) {
        const [user] = users.splice(idx, 1);
        users.splice(override.customRank - 1, 0, user);
      }
    }

    const players = users.map((user, i) => ({
      rank: i + 1,
      username: user.username,
      publicId: user.publicId,
      clanTag: user.clanTag,
      avatarUrl: user.avatarUrl,
      elo: user.ranked?.elo || 1000,
      wins: user.stats?.wins || 0,
      losses: user.stats?.losses || 0,
      kd: user.stats?.kdRatio || 0,
    }));

    res.json({ players, enabled: true });
  } catch (error) {
    console.error('[Leaderboard] Players error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Get clans leaderboard
router.get('/clans', async (req: Request, res: Response) => {
  try {
    const clans = await Clan.find({})
      .sort({ 'stats.wins': -1, memberCount: -1 })
      .limit(100)
      .lean();

    const ranked = clans.map((clan, i) => ({
      rank: i + 1,
      name: clan.name,
      tag: clan.tag,
      memberCount: clan.memberCount || 0,
      wins: clan.stats?.wins || 0,
      losses: clan.stats?.losses || 0,
    }));

    res.json({ clans: ranked });
  } catch (error) {
    console.error('[Leaderboard] Clans error:', error);
    res.status(500).json({ error: 'Failed to fetch clans leaderboard' });
  }
});

// Fallback: root endpoint
router.get('/', async (req: Request, res: Response) => {
  try {
    let config = await LeaderboardConfig.findOne();
    if (!config) {
      config = await LeaderboardConfig.create({});
    }

    if (!config.isEnabled) {
      res.json({ leaderboard: [], enabled: false });
      return;
    }

    const query: any = { isBanned: false };
    if (config.minWinsRequired > 0) query['stats.wins'] = { $gte: config.minWinsRequired };
    if (config.excludedUsers.length > 0) query._id = { $nin: config.excludedUsers };

    let users = await User.find(query)
      .select('username publicId stats clanTag')
      .sort({ 'stats.wins': -1, 'stats.kdRatio': -1 })
      .limit(100)
      .lean();

    const ranked = users.map((user, index) => ({
      rank: index + 1,
      ...user,
    }));

    res.json({ leaderboard: ranked, enabled: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

export default router;
