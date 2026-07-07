import { Router, Request, Response } from 'express';
import { Clan } from '../db/models/Clan.js';
import { User } from '../db/models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Create clan
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { tag, name, description } = req.body;

    if (!tag || !name) {
      res.status(400).json({ error: 'Tag and name are required' });
      return;
    }

    if (tag.length > 5) {
      res.status(400).json({ error: 'Tag must be 5 characters or less' });
      return;
    }

    // Check if user already has a clan
    if (user.clanTag) {
      res.status(409).json({ error: 'You are already in a clan' });
      return;
    }

    // Check if tag is taken
    const existing = await Clan.findOne({ tag: tag.toUpperCase() });
    if (existing) {
      res.status(409).json({ error: 'Clan tag already taken' });
      return;
    }

    // Create clan
    const clan = new Clan({
      tag: tag.toUpperCase(),
      name,
      description: description || '',
      leaderId: user._id,
      members: [{ userId: user._id, role: 'leader', joinedAt: new Date() }],
      memberCount: 1,
    });

    await clan.save();

    // Update user's clanTag
    user.clanTag = tag.toUpperCase();
    await user.save();

    res.status(201).json({ clan });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create clan' });
  }
});

// List clans
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;

    const query: any = {};
    if (search) {
      query.$or = [
        { tag: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ];
    }

    const clans = await Clan.find(query)
      .sort({ 'stats.wins': -1, memberCount: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Clan.countDocuments(query);

    res.json({ clans, total, page, limit });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch clans' });
  }
});

// Get clan detail
router.get('/:tag', async (req: Request, res: Response) => {
  try {
    const clan = await Clan.findOne({ tag: req.params.tag.toUpperCase() })
      .populate('members.userId', 'username publicId')
      .lean();

    if (!clan) {
      res.status(404).json({ error: 'Clan not found' });
      return;
    }

    res.json({ clan });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch clan' });
  }
});

// Join clan
router.post('/:tag/join', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const clan = await Clan.findOne({ tag: req.params.tag.toUpperCase() });

    if (!clan) {
      res.status(404).json({ error: 'Clan not found' });
      return;
    }

    if (user.clanTag) {
      res.status(409).json({ error: 'You are already in a clan' });
      return;
    }

    // Check if already a member
    const isMember = clan.members.some(m => m.userId.toString() === user._id.toString());
    if (isMember) {
      res.status(409).json({ error: 'Already a member' });
      return;
    }

    // Add member
    clan.members.push({ userId: user._id, role: 'member', joinedAt: new Date() });
    clan.memberCount = clan.members.length;
    await clan.save();

    // Update user
    user.clanTag = clan.tag;
    await user.save();

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to join clan' });
  }
});

// Leave clan
router.delete('/:tag/leave', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const clan = await Clan.findOne({ tag: req.params.tag.toUpperCase() });

    if (!clan) {
      res.status(404).json({ error: 'Clan not found' });
      return;
    }

    if (user.clanTag !== clan.tag) {
      res.status(400).json({ error: 'You are not in this clan' });
      return;
    }

    // Check if leader is leaving
    if (clan.leaderId.toString() === user._id.toString()) {
      res.status(400).json({ error: 'Leader cannot leave. Transfer leadership first.' });
      return;
    }

    // Remove member
    clan.members = clan.members.filter(m => m.userId.toString() !== user._id.toString());
    clan.memberCount = clan.members.length;
    await clan.save();

    // Update user
    user.clanTag = undefined;
    await user.save();

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to leave clan' });
  }
});

export default router;
