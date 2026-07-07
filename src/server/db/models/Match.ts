import mongoose, { type Document, Schema } from "mongoose";

export interface IMatchPlayer {
  userId?: mongoose.Types.ObjectId;
  persistentId: string;
  username: string;
  team?: string;
  kills: number;
  deaths: number;
  score: number;
  tilesOwned: number;
  result: "win" | "loss" | "abandoned";
  isMvp: boolean;
  hasSpawned: boolean;
}

export interface IMatch extends Document {
  gameId: string;
  gameMode: string;
  gameType: "Public" | "Private" | "Singleplayer";
  mapName: string;
  duration: number;
  players: IMatchPlayer[];
  gameRecord: unknown;
  startedAt: Date;
  endedAt: Date;
}

const MatchPlayerSchema = new Schema<IMatchPlayer>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    persistentId: { type: String, required: true },
    username: { type: String, required: true },
    team: { type: String },
    kills: { type: Number, default: 0 },
    deaths: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    tilesOwned: { type: Number, default: 0 },
    result: {
      type: String,
      enum: ["win", "loss", "abandoned"],
      required: true,
    },
    isMvp: { type: Boolean, default: false },
    hasSpawned: { type: Boolean, default: true },
  },
  { _id: false },
);

const MatchSchema = new Schema<IMatch>(
  {
    gameId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    gameMode: { type: String, required: true },
    gameType: {
      type: String,
      enum: ["Public", "Private", "Singleplayer"],
      required: true,
    },
    mapName: { type: String, required: true },
    duration: { type: Number, required: true },
    players: [MatchPlayerSchema],
    gameRecord: { type: Schema.Types.Mixed },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, required: true },
  },
  { timestamps: true },
);

MatchSchema.index({ "players.persistentId": 1 });
MatchSchema.index({ startedAt: -1 });

export const Match = mongoose.model<IMatch>("Match", MatchSchema);
