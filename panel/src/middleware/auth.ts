import { Request, Response, NextFunction } from 'express';
import { User, IUser } from '../db/models/User.js';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

// Session auth middleware - checks if user is logged in via session
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const userId = (req.session as any)?.userId;
  
  if (!userId) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    if (user.isBanned) {
      res.status(403).json({ error: 'Account is banned', reason: user.banReason });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Auth error' });
  }
}

// Admin role check middleware (must be used after requireAuth)
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}

// Optional auth - attaches user if logged in, but doesn't require it
export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const userId = (req.session as any)?.userId;
  
  if (!userId) {
    next();
    return;
  }

  try {
    const user = await User.findById(userId);
    if (user && !user.isBanned) {
      req.user = user;
    }
  } catch {
    // Ignore errors for optional auth
  }
  
  next();
}

// Panel secret validation for internal API calls (game server → panel)
export function validatePanelSecret(req: Request, res: Response, next: NextFunction): void {
  const secret = req.headers['x-panel-secret'];
  const expected = process.env.PANEL_GAME_SECRET || "dev-panel-secret";

  if (!secret || secret !== expected) {
    res.status(401).json({ error: 'Invalid panel secret' });
    return;
  }

  next();
}
