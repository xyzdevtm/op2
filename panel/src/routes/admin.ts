import { Router, Request, Response } from 'express';
import { User } from '../db/models/User.js';
import { Match } from '../db/models/Match.js';
import { Ticket } from '../db/models/Ticket.js';
import { LeaderboardConfig } from '../db/models/LeaderboardConfig.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// All admin routes require auth + admin role
router.use(requireAuth, requireAdmin);

// Dashboard overview
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const [userCount, matchCount, ticketCount] = await Promise.all([
      User.countDocuments(),
      Match.countDocuments(),
      Ticket.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
    ]);

    res.json({ userCount, matchCount, ticketCount });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

// List users
router.get('/users', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { publicId: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await User.countDocuments(query);

    res.json({ users, total, page, limit });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Adjust user wallet
router.patch('/users/:id/wallet', async (req: Request, res: Response) => {
  try {
    const { amount, reason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    user.wallet.balance += amount;
    if (user.wallet.balance < 0) user.wallet.balance = 0;
    await user.save();

    res.json({ success: true, balance: user.wallet.balance });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to adjust wallet' });
  }
});

// Ban/unban user
router.patch('/users/:id/ban', async (req: Request, res: Response) => {
  try {
    const { banned, reason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    user.isBanned = banned;
    user.banReason = reason;
    await user.save();

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update ban status' });
  }
});

// Get leaderboard config
router.get('/leaderboard-config', async (req: Request, res: Response) => {
  try {
    let config = await LeaderboardConfig.findOne();
    if (!config) {
      config = await LeaderboardConfig.create({});
    }
    res.json({ config });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch config' });
  }
});

// Update leaderboard config
router.patch('/leaderboard-config', async (req: Request, res: Response) => {
  try {
    const { isEnabled, minWinsRequired, excludedUsers, manualOverrides } = req.body;
    
    let config = await LeaderboardConfig.findOne();
    if (!config) {
      config = new LeaderboardConfig({});
    }

    if (isEnabled !== undefined) config.isEnabled = isEnabled;
    if (minWinsRequired !== undefined) config.minWinsRequired = minWinsRequired;
    if (excludedUsers !== undefined) config.excludedUsers = excludedUsers;
    if (manualOverrides !== undefined) config.manualOverrides = manualOverrides;

    await config.save();

    res.json({ config });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update config' });
  }
});

// List tickets
router.get('/tickets', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const tickets = await Ticket.find()
      .populate('userId', 'username publicId')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Ticket.countDocuments();

    res.json({ tickets, total, page, limit });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Update ticket
router.patch('/tickets/:id', async (req: Request, res: Response) => {
  try {
    const { status, reply } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    if (status) ticket.status = status;
    if (reply) {
      ticket.messages.push({
        senderId: req.user!._id,
        senderRole: 'admin',
        content: reply,
        createdAt: new Date(),
      });
    }

    await ticket.save();

    res.json({ ticket });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update ticket' });
  }
});

// List matches
router.get('/matches', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const matches = await Match.find()
      .sort({ endedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Match.countDocuments();

    res.json({ matches, total, page, limit });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

export default router;
