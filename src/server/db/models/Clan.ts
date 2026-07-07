import mongoose, { type Document, Schema } from "mongoose";

export interface IClanMember {
  userId: mongoose.Types.ObjectId;
  role: "leader" | "officer" | "member";
  joinedAt: Date;
}

export interface IClan extends Document {
  tag: string;
  name: string;
  description: string;
  leaderId: mongoose.Types.ObjectId;
  members: IClanMember[];
  memberCount: number;
  stats: {
    wins: number;
    losses: number;
    totalMatches: number;
  };
  isOpen: boolean;
  createdAt: Date;
}

const ClanMemberSchema = new Schema<IClanMember>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["leader", "officer", "member"],
      default: "member",
    },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const ClanSchema = new Schema<IClan>(
  {
    tag: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      maxlength: 5,
    },
    name: { type: String, required: true, maxlength: 35 },
    description: { type: String, default: "", maxlength: 200 },
    leaderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [ClanMemberSchema],
    memberCount: { type: Number, default: 1 },
    stats: {
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      totalMatches: { type: Number, default: 0 },
    },
    isOpen: { type: Boolean, default: true },
  },
  { timestamps: true },
);

ClanSchema.index({ "stats.wins": -1 });

export const Clan = mongoose.model<IClan>("Clan", ClanSchema);
