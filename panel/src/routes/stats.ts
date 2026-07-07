import { Router, Request, Response } from 'express';
import { User } from '../db/models/User.js';
import { Match } from '../db/models/Match.js';
import { Clan } from '../db/models/Clan.js';
import { requireAuth, validatePanelSecret } from '../middleware/auth.js';

const router = Router();

// Internal: Called by game server after match completes
router.post('/match-complete', validatePanelSecret, async (req: Request, res: Response) => {
  try {
    const { gameId, gameMode, gameType, mapName, duration, players, gameRecord } = req.body;

    if (!gameId || !players || !Array.isArray(players)) {
      res.status(400).json({ error: 'Invalid match data' });
      return;
    }

    // Save match record
    await Match.findOneAndUpdate(
      { gameId },
      {
        gameId,
        gameMode,
        gameType,
        mapName,
        duration,
        players,
        gameRecord,
        startedAt: new Date(Date.now() - (duration || 0) * 1000),
        endedAt: new Date(),
      },
      { upsert: true }
    );

    // Update each player's stats atomically
    for (const p of players) {
      if (!p.persistentId) continue;

      const isWin = p.result === 'win';
      const isLoss = p.result === 'loss';

      // Calculate new K/D ratio
      const user = await User.findOne({ persistentId: p.persistentId });
      if (!user) continue;

      const newTotalKills = user.stats.totalKills + (p.kills || 0);
      const newTotalDeaths = user.stats.totalDeaths + (p.deaths || 0);
      const newKd = newTotalDeaths > 0 ? newTotalKills / newTotalDeaths : newTotalKills;

      await User.updateOne(
        { persistentId: p.persistentId },
        {
          $inc: {
            'stats.totalMatches': 1,
            'stats.wins': isWin ? 1 : 0,
            'stats.losses': isLoss ? 1 : 0,
            'stats.totalKills': p.kills || 0,
            'stats.totalDeaths': p.deaths || 0,
          },
          $set: {
            'stats.kdRatio': Math.round(newKd * 100) / 100,
            'stats.lastPlayedAt': new Date(),
          },
        }
      );

      // Update clan stats if player has a clan
      if (user.clanTag) {
        await Clan.updateOne(
          { tag: user.clanTag },
          {
            $inc: {
              'stats.totalMatches': 1,
              'stats.wins': isWin ? 1 : 0,
              'stats.losses': isLoss ? 1 : 0,
            },
          }
        );
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('[Stats] Match complete error:', error);
    res.status(500).json({ error: error.message || 'Failed to record match' });
  }
});

// Get user's stats overview
router.get('/overview', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    res.json({
      stats: user.stats,
      wallet: user.wallet,
      inventory: user.inventory,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get user's match history
router.get('/history', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const matches = await Match.find({ 'players.persistentId': user.persistentId })
      .sort({ endedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Match.countDocuments({ 'players.persistentId': user.persistentId });

    res.json({
      matches,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch match history' });
  }
});

// Get public player stats
router.get('/public/:publicId', async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({ publicId: req.params.publicId })
      .select('username publicId stats clanTag createdAt')
      .lean();

    if (!user) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }

    res.json({ stats: user.stats });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
