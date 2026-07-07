import mongoose, { type Document, Schema } from "mongoose";

export interface IGameRecord extends Document {
  gameId: string;
  info: Record<string, unknown>;
  turns: unknown[];
  version: string;
  gitCommit: string;
  domain: string;
  createdAt: Date;
}

const GameRecordSchema = new Schema<IGameRecord>(
  {
    gameId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    info: { type: Schema.Types.Mixed, required: true },
    turns: { type: [Schema.Types.Mixed], default: [] },
    version: { type: String, default: "" },
    gitCommit: { type: String, default: "" },
    domain: { type: String, default: "" },
  },
  { timestamps: true },
);

GameRecordSchema.index({ createdAt: -1 });

export const GameRecord = mongoose.model<IGameRecord>(
  "GameRecord",
  GameRecordSchema,
);
