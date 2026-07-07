import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  username: string;
  email?: string;
  phone?: string;
  phoneVerified: boolean;
  passwordHash: string;
  role: 'user' | 'admin';
  persistentId: string;
  publicId: string;
  avatarUrl?: string;
  bio?: string;
  wallet: {
    balance: number;
  };
  inventory: {
    skins: string[];
    flags: string[];
    patterns: string[];
  };
  stats: {
    totalMatches: number;
    wins: number;
    losses: number;
    totalKills: number;
    totalDeaths: number;
    kdRatio: number;
    longestWinStreak: number;
    currentWinStreak: number;
    totalPlayTime: number;
    lastPlayedAt?: Date;
  };
  ranked: {
    elo: number;
    peakElo: number;
    gamesPlayed: number;
    wins: number;
    losses: number;
  };
  achievements: string[];
  friends: mongoose.Types.ObjectId[];
  clanTag?: string;
  isBanned: boolean;
  banReason?: string;
  lastSeenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, minlength: 3, maxlength: 10 },
    email: { type: String, unique: true, sparse: true },
    phone: { type: String, unique: true, sparse: true },
    phoneVerified: { type: Boolean, default: false },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    persistentId: { type: String, required: true, unique: true, index: true },
    publicId: { type: String, required: true, unique: true },
    avatarUrl: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 200 },
    wallet: {
      balance: { type: Number, default: 0, min: 0 },
    },
    inventory: {
      skins: [{ type: String }],
      flags: [{ type: String }],
      patterns: [{ type: String }],
    },
    stats: {
      totalMatches: { type: Number, default: 0 },
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      totalKills: { type: Number, default: 0 },
      totalDeaths: { type: Number, default: 0 },
      kdRatio: { type: Number, default: 0 },
      longestWinStreak: { type: Number, default: 0 },
      currentWinStreak: { type: Number, default: 0 },
      totalPlayTime: { type: Number, default: 0 },
      lastPlayedAt: { type: Date },
    },
    ranked: {
      elo: { type: Number, default: 1000 },
      peakElo: { type: Number, default: 1000 },
      gamesPlayed: { type: Number, default: 0 },
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
    },
    achievements: [{ type: String }],
    friends: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    clanTag: { type: String },
    isBanned: { type: Boolean, default: false },
    banReason: { type: String },
    lastSeenAt: { type: Date },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Generate unique public ID
UserSchema.statics.generatePublicId = function (): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const User = mongoose.model<IUser>('User', UserSchema);
