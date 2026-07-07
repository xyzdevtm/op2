import { Router, Request, Response } from 'express';
import { User } from '../db/models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Get friends list
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const populated = await User.findById(user._id)
      .populate('friends', 'username publicId stats.clanTag')
      .lean();

    res.json({ friends: populated?.friends || [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

// Send friend request
router.post('/request/:publicId', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const target = await User.findOne({ publicId: req.params.publicId });

    if (!target) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (target._id.toString() === user._id.toString()) {
      res.status(400).json({ error: 'Cannot add yourself' });
      return;
    }

    // Check if already friends
    if (user.friends.includes(target._id)) {
      res.status(409).json({ error: 'Already friends' });
      return;
    }

    // Add friend (simplified - in production, use a friend request system)
    if (!user.friends.includes(target._id)) {
      user.friends.push(target._id);
      await user.save();
    }

    if (!target.friends.includes(user._id)) {
      target.friends.push(user._id);
      await target.save();
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to add friend' });
  }
});

// Accept friend request (simplified)
router.post('/accept/:publicId', requireAuth, async (req: Request, res: Response) => {
  // In production, this would accept a pending request
  res.json({ success: true });
});

// Remove friend
router.delete('/:publicId', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const target = await User.findOne({ publicId: req.params.publicId });

    if (!target) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    user.friends = user.friends.filter(id => id.toString() !== target._id.toString());
    await user.save();

    target.friends = target.friends.filter(id => id.toString() !== user._id.toString());
    await target.save();

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to remove friend' });
  }
});

export default router;
