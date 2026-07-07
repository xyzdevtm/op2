import { Router, type Request, type Response } from "express";
import mongoose from "mongoose";
import { Cosmetics } from "../db/models/Cosmetics.js";
import { User } from "../db/models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Cosmetics endpoint in CosmeticsSchema format (used by PrivilegeRefresher)
router.get("/cosmetics.json", async (_req: Request, res: Response) => {
  try {
    const items = await Cosmetics.find({ active: true }).lean();

    // Transform to CosmeticsSchema format: { patterns: Record<string, Pattern>, flags: Record<string, Flag>, ... }
    const patterns: Record<string, unknown> = {};
    const flags: Record<string, unknown> = {};
    const skins: Record<string, unknown> = {};

    for (const item of items) {
      const entry = {
        name: item.name,
        url: item.url || "",
        previewUrl: item.previewUrl || "",
        price: item.price,
        currencyType: item.currencyType,
      };

      if (item.type === "pattern") {
        patterns[item.name] = { ...entry, patternData: "" };
      } else if (item.type === "flag") {
        flags[item.name] = entry;
      } else if (item.type === "skin") {
        skins[item.name] = entry;
      }
    }

    res.json({ patterns, flags, skins });
  } catch {
    res.status(500).json({ error: "Failed to fetch cosmetics" });
  }
});

router.get("/items", async (_req: Request, res: Response) => {
  try {
    const items = await Cosmetics.find({ active: true }).lean();

    const grouped = {
      patterns: items.filter((i) => i.type === "pattern"),
      flags: items.filter((i) => i.type === "flag"),
      skins: items.filter((i) => i.type === "skin"),
      packs: items.filter((i) => i.type === "pack"),
    };

    res.json(grouped);
  } catch {
    res
      .status(500)
      .json({ error: "Failed to fetch shop items" });
  }
});

router.post(
  "/purchase",
  requireAuth,
  async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = req.user!;
      const { itemId } = req.body;

      if (!itemId) {
        res
          .status(400)
          .json({ error: "Item ID is required" });
        return;
      }

      const item = await Cosmetics.findById(itemId).session(
        session,
      );
      if (!item) {
        res.status(404).json({ error: "Item not found" });
        return;
      }

      if (!item.active) {
        res.status(400).json({
          error: "Item is no longer available",
        });
        return;
      }

      const inventory = user.inventory;
      const alreadyOwned =
        (item.type === "skin" &&
          inventory.skins.includes(item.name)) ||
        (item.type === "flag" &&
          inventory.flags.includes(item.name)) ||
        (item.type === "pattern" &&
          inventory.patterns.includes(item.name));

      if (alreadyOwned) {
        res
          .status(400)
          .json({ error: "You already own this item" });
        return;
      }

      if (user.wallet.balance < item.price) {
        res
          .status(400)
          .json({ error: "Insufficient balance" });
        return;
      }

      user.wallet.balance -= item.price;

      if (item.type === "skin")
        user.inventory.skins.push(item.name);
      else if (item.type === "flag")
        user.inventory.flags.push(item.name);
      else if (item.type === "pattern")
        user.inventory.patterns.push(item.name);

      await user.save({ session });
      await session.commitTransaction();

      res.json({
        success: true,
        item: { name: item.name, type: item.type },
        wallet: user.wallet,
        inventory: user.inventory,
      });
    } catch (error: unknown) {
      await session.abortTransaction();
      const message =
        error instanceof Error
          ? error.message
          : "Purchase failed";
      console.error("[Shop] Purchase error:", error);
      res.status(500).json({ error: message });
    } finally {
      session.endSession();
    }
  },
);

router.get(
  "/purchases",
  requireAuth,
  (req: Request, res: Response) => {
    const user = req.user!;
    res.json({ inventory: user.inventory });
  },
);

export default router;
