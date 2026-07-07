import { Router, Request, Response } from 'express';
import { User } from '../db/models/User.js';
import { requireAuth } from '../middleware/auth.js';
import crypto from 'crypto';
import {
  generateVerificationCode,
  verifyCode,
  sendVerificationSMS,
  isPhoneRegistered,
  getResendCooldown,
} from '../services/sms.js';

const router = Router();

// In-memory password reset codes (short-lived, 10 min expiry)
const resetCodes = new Map<string, { email: string; expiresAt: number }>();

// ============ PHONE VERIFICATION ============

// Send verification code to phone
router.post('/send-code', async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      res.status(400).json({ error: 'Phone number is required' });
      return;
    }

    // Validate Iranian phone number format
    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(phone)) {
      res.status(400).json({ error: 'Invalid phone number format. Must be 09XXXXXXXXX' });
      return;
    }

    // Check if phone is already registered
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      res.status(409).json({ error: 'This phone number is already registered' });
      return;
    }

    // Check cooldown
    const cooldown = getResendCooldown(phone);
    if (cooldown > 0) {
      res.status(429).json({ error: `Please wait ${cooldown} seconds before requesting a new code` });
      return;
    }

    // Generate and send code
    const code = generateVerificationCode(phone);
    const smsResult = await sendVerificationSMS(phone, code);

    if (!smsResult.success) {
      res.status(500).json({ error: smsResult.error || 'Failed to send verification code' });
      return;
    }

    res.json({ message: 'Verification code sent successfully' });
  } catch (error: any) {
    console.error('[Auth] Send code error:', error);
    res.status(500).json({ error: error.message || 'Failed to send code' });
  }
});

// Verify phone code
router.post('/verify-code', async (req: Request, res: Response) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      res.status(400).json({ error: 'Phone and code are required' });
      return;
    }

    const result = verifyCode(phone, code);

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({ message: 'Phone verified successfully', phone });
  } catch (error: any) {
    console.error('[Auth] Verify code error:', error);
    res.status(500).json({ error: error.message || 'Verification failed' });
  }
});

// Check if phone is available
router.post('/check-phone', async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      res.status(400).json({ error: 'Phone number is required' });
      return;
    }

    const isRegistered = await isPhoneRegistered(phone);
    res.json({ available: !isRegistered });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Check failed' });
  }
});

// Check if username is available
router.post('/check-username', async (req: Request, res: Response) => {
  try {
    const { username } = req.body;

    if (!username) {
      res.status(400).json({ error: 'Username is required' });
      return;
    }

    if (username.length < 3 || username.length > 10) {
      res.json({ available: false, error: 'Username must be 3-10 characters' });
      return;
    }

    // Only allow lowercase English letters, numbers, and underscore
    const usernameRegex = /^[a-z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      const invalidChars: string[] = [];
      for (const char of username) {
        if (!/[a-z0-9_]/.test(char) && !invalidChars.includes(char)) {
          invalidChars.push(char);
        }
      }
      const errorMsg = invalidChars.length > 0
        ? `Characters [${invalidChars.join(', ')}] are not allowed`
        : 'Only lowercase English letters, numbers, and underscore allowed';
      res.json({ available: false, error: errorMsg });
      return;
    }

    const existing = await User.findOne({ username });
    res.json({ available: !existing });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Check failed' });
  }
});

// ============ REGISTRATION ============

// Register with phone verification
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password, email, phone } = req.body;

    if (!username || !password || !phone) {
      res.status(400).json({ error: 'Username, password, and phone are required' });
      return;
    }

    if (username.length < 3 || username.length > 10) {
      res.status(400).json({ error: 'Username must be 3-10 characters' });
      return;
    }

    // Only allow lowercase English letters, numbers, and underscore
    const usernameRegex = /^[a-z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      // Find which characters are invalid
      const invalidChars = username.replace(/[a-z0-9_]/g, '').split('').filter((c, i, a) => a.indexOf(c) === i);
      const errorMsg = invalidChars.length > 0
        ? `Characters "${invalidChars.join('", "')}" are not allowed. Use only lowercase English letters, numbers, and underscore`
        : 'Username can only contain lowercase English letters, numbers, and underscore';
      res.status(400).json({ error: errorMsg });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    // Validate phone format
    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(phone)) {
      res.status(400).json({ error: 'Invalid phone number format' });
      return;
    }

    // Check if phone is verified (must have called verify-code first)
    // In sandbox mode, we skip this check for testing
    // In production, you'd store verified phones in a Set or Redis

    // Check if username exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      res.status(409).json({ error: 'Username already taken' });
      return;
    }

    // Check if phone exists
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      res.status(409).json({ error: 'Phone number already registered' });
      return;
    }

    // Check if email exists (if provided)
    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        res.status(409).json({ error: 'Email already registered' });
        return;
      }
    }

    // Create user
    const persistentId = crypto.randomUUID();
    const publicId = User.generatePublicId();

    const user = new User({
      username,
      passwordHash: password,
      email: email || undefined,
      phone,
      phoneVerified: true, // In sandbox mode, auto-verify
      persistentId,
      publicId,
    });

    await user.save();

    // Create session
    (req.session as any).userId = user._id;

    res.status(201).json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        publicId: user.publicId,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('[Auth] Register error:', error);
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

// ============ LOGIN ============

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    // Create session
    (req.session as any).userId = user._id;

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        publicId: user.publicId,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({ error: error.message || 'Login failed' });
  }
});

// ============ SESSION ============

// Get current user
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        publicId: user.publicId,
        role: user.role,
        wallet: user.wallet,
        inventory: user.inventory,
        stats: user.stats,
        ranked: user.ranked,
        friends: user.friends,
        achievements: user.achievements,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get user' });
  }
});

// Logout
router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: 'Logout failed' });
      return;
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// ============ PASSWORD RESET ============

// Send reset code
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { identifier } = req.body; // username or email

    if (!identifier) {
      res.status(400).json({ error: 'Username or email is required' });
      return;
    }

    const user = await User.findOne({
      $or: [{ username: identifier }, { email: identifier }],
    });

    if (!user) {
      // Don't reveal if user exists
      res.json({ message: 'If this account exists, a reset code will be sent.' });
      return;
    }

    const resetCode = crypto.randomInt(100000, 999999).toString();
    resetCodes.set(identifier, {
      email: user.email || '',
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    // In production, send email/SMS with resetCode
    console.log(`[Auth] Reset code for ${identifier}: ${resetCode}`);

    res.json({ message: 'If this account exists, a reset code will be sent.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to process request' });
  }
});

// Reset password
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { identifier, code, newPassword } = req.body;

    if (!identifier || !code || !newPassword) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    const stored = resetCodes.get(identifier);
    if (!stored || stored.expiresAt < Date.now()) {
      res.status(400).json({ error: 'Invalid or expired reset code' });
      return;
    }

    resetCodes.delete(identifier);

    const user = await User.findOne({
      $or: [{ username: identifier }, { email: identifier }],
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    user.passwordHash = newPassword; // Will be hashed by pre-save hook
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to reset password' });
  }
});

export default router;
