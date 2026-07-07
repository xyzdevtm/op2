import mongoose, { type Document, Schema } from "mongoose";

export interface ILeaderboardOverride {
  userId: mongoose.Types.ObjectId;
  customRank: number;
  reason: string;
}

export interface ILeaderboardConfig extends Document {
  isEnabled: boolean;
  minWinsRequired: number;
  excludedUsers: mongoose.Types.ObjectId[];
  manualOverrides: ILeaderboardOverride[];
  updatedAt: Date;
}

const LeaderboardOverrideSchema = new Schema<ILeaderboardOverride>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    customRank: { type: Number, required: true },
    reason: { type: String, required: true },
  },
  { _id: false },
);

const LeaderboardConfigSchema = new Schema<ILeaderboardConfig>(
  {
    isEnabled: { type: Boolean, default: true },
    minWinsRequired: { type: Number, default: 0 },
    excludedUsers: [
      { type: Schema.Types.ObjectId, ref: "User" },
    ],
    manualOverrides: [LeaderboardOverrideSchema],
  },
  { timestamps: true },
);

export const LeaderboardConfig = mongoose.model<ILeaderboardConfig>(
  "LeaderboardConfig",
  LeaderboardConfigSchema,
);
