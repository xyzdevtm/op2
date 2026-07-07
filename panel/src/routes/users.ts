import { Router, Request, Response } from 'express';
import { User } from '../db/models/User.js';
import { requireAuth, optionalAuth, validatePanelSecret } from '../middleware/auth.js';

const router = Router();

// Internal: Get user by persistentId (game server → panel, uses panel secret)
router.get('/by-persistent-id/:persistentId', validatePanelSecret, async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({ persistentId: req.params.persistentId })
      .select('-passwordHash')
      .lean();

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Get current user profile
router.get('/@me', requireAuth, (req: Request, res: Response) => {
  const user = req.user!;
  res.json({
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      publicId: user.publicId,
      role: user.role,
      wallet: user.wallet,
      inventory: user.inventory,
      stats: user.stats,
      clanTag: user.clanTag,
      friends: user.friends,
      createdAt: user.createdAt,
    },
  });
});

// Update current user profile
router.patch('/@me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { username, email } = req.body;

    if (username && username !== user.username) {
      const existing = await User.findOne({ username, _id: { $ne: user._id } });
      if (existing) {
        res.status(409).json({ error: 'Username already taken' });
        return;
      }
      user.username = username;
    }

    if (email && email !== user.email) {
      const existing = await User.findOne({ email, _id: { $ne: user._id } });
      if (existing) {
        res.status(409).json({ error: 'Email already registered' });
        return;
      }
      user.email = email;
    }

    await user.save();

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        publicId: user.publicId,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Update failed' });
  }
});

// Get public player profile
router.get('/:publicId', async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({ publicId: req.params.publicId })
      .select('username publicId stats clanTag createdAt')
      .lean();

    if (!user) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

export default router;
