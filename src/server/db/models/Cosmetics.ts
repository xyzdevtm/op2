import mongoose, { type Document, Schema } from "mongoose";

export interface ICosmetic extends Document {
  type: "pattern" | "flag" | "skin" | "pack";
  name: string;
  url?: string;
  previewUrl?: string;
  price: number;
  currencyType: string;
  active: boolean;
}

const CosmeticsSchema = new Schema<ICosmetic>(
  {
    type: {
      type: String,
      enum: ["pattern", "flag", "skin", "pack"],
      required: true,
    },
    name: { type: String, required: true },
    url: { type: String },
    previewUrl: { type: String },
    price: { type: Number, default: 0 },
    currencyType: { type: String, default: "coin" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

CosmeticsSchema.index({ type: 1, name: 1 }, { unique: true });

export const Cosmetics = mongoose.model<ICosmetic>("Cosmetics", CosmeticsSchema);
