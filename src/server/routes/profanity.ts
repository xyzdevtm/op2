import { Router, type Request, type Response } from "express";
import {
  requireAuth,
  validatePanelSecret,
} from "../middleware/auth.js";

const router = Router();

// Profanity word list (used by PrivilegeRefresher)
// For now, returns a static list. In production, store in MongoDB or file.
const PROFANE_WORDS: string[] = [];

router.get(
  "/",
  validatePanelSecret,
  (_req: Request, res: Response) => {
    res.json(PROFANE_WORDS);
  },
);

// Allow authenticated users to report words (optional)
router.post(
  "/report",
  requireAuth,
  (req: Request, res: Response) => {
    // TODO: Store reported words for admin review
    res.json({ success: true });
  },
);

export default router;
