import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../db/models/User.js';
import { Cosmetics } from '../db/models/Cosmetics.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Get all shop items
router.get('/items', async (req: Request, res: Response) => {
  try {
    const items = await Cosmetics.find({ active: true }).lean();
    
    // Group by type
    const grouped = {
      patterns: items.filter(i => i.type === 'pattern'),
      flags: items.filter(i => i.type === 'flag'),
      skins: items.filter(i => i.type === 'skin'),
      packs: items.filter(i => i.type === 'pack'),
    };

    res.json(grouped);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch shop items' });
  }
});

// Purchase item
router.post('/purchase', requireAuth, async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = req.user!;
    const { itemId } = req.body;

    if (!itemId) {
      res.status(400).json({ error: 'Item ID is required' });
      return;
    }

    // Get item
    const item = await Cosmetics.findById(itemId).session(session);
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    if (!item.active) {
      res.status(400).json({ error: 'Item is no longer available' });
      return;
    }

    // Check if already owned
    const inventory = user.inventory;
    const alreadyOwned =
      (item.type === 'skin' && inventory.skins.includes(item.name)) ||
      (item.type === 'flag' && inventory.flags.includes(item.name)) ||
      (item.type === 'pattern' && inventory.patterns.includes(item.name));

    if (alreadyOwned) {
      res.status(400).json({ error: 'You already own this item' });
      return;
    }

    // Check balance
    if (user.wallet.balance < item.price) {
      res.status(400).json({ error: 'Insufficient balance' });
      return;
    }

    // Atomic: deduct balance + add to inventory
    user.wallet.balance -= item.price;
    
    if (item.type === 'skin') user.inventory.skins.push(item.name);
    else if (item.type === 'flag') user.inventory.flags.push(item.name);
    else if (item.type === 'pattern') user.inventory.patterns.push(item.name);

    await user.save({ session });
    await session.commitTransaction();

    res.json({
      success: true,
      item: { name: item.name, type: item.type },
      wallet: user.wallet,
      inventory: user.inventory,
    });
  } catch (error: any) {
    await session.abortTransaction();
    console.error('[Shop] Purchase error:', error);
    res.status(500).json({ error: error.message || 'Purchase failed' });
  } finally {
    session.endSession();
  }
});

// Get user's purchases
router.get('/purchases', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    res.json({
      inventory: user.inventory,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch purchases' });
  }
});

export default router;
