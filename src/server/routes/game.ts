import { Router, type Request, type Response } from "express";
import { GameRecord } from "../db/models/GameRecord.js";

const router = Router();

// Get archived game record by ID
router.get("/:gameId", async (req: Request, res: Response) => {
  try {
    const record = await GameRecord.findOne({
      gameId: req.params.gameId,
    }).lean();

    if (!record) {
      res.status(404).json({ error: "Game record not found" });
      return;
    }

    res.json(record);
  } catch {
    res
      .status(500)
      .json({ error: "Failed to fetch game record" });
  }
});

// Get list of recent games
router.get("/", async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const records = await GameRecord.find()
      .select("gameId info createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await GameRecord.countDocuments();

    res.json({ records, total, page, limit });
  } catch {
    res
      .status(500)
      .json({ error: "Failed to fetch game records" });
  }
});

export default router;
