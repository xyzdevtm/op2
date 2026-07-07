import { Router, type Request, type Response } from "express";
import { User } from "../db/models/User.js";
import { GameRecord } from "../db/models/GameRecord.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Get player stats tree (aggregated from GameRecords)

router.patch("/@me", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { username, email } = req.body;

    if (username && username !== user.username) {
      const existing = await User.findOne({
        username,
        _id: { $ne: user._id },
      });
      if (existing) {
        res.status(409).json({ error: "Username already taken" });
        return;
      }
      user.username = username;
    }

    if (email && email !== user.email) {
      const existing = await User.findOne({
        email,
        _id: { $ne: user._id },
      });
      if (existing) {
        res
          .status(409)
          .json({ error: "Email already registered" });
        return;
      }
      user.email = email;
    }

    await user.save();

    res.json({
      user: {
        id: (user as unknown as { _id: unknown })._id,
        username: user.username,
        email: user.email,
        publicId: user.publicId,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Update failed";
    res.status(500).json({ error: message });
  }
});

// Get player stats tree (aggregated from GameRecords)
router.get("/:publicId/stats", async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({ publicId: req.params.publicId })
      .select("persistentId username publicId")
      .lean();
    if (!user) {
      res.status(404).json({ error: "Player not found" });
      return;
    }

    const records = await GameRecord.find({
      "info.players.persistentID": user.persistentId,
    })
      .select("info")
      .lean();

    const tree: Record<string, any> = {};

    for (const record of records) {
      const info = record.info as any;
      const gameType = info.config?.gameType || "Public";
      const gameMode = info.config?.gameMode || "FFA";
      const difficulty = info.config?.difficulty || "Medium";

      const player = info.players?.find(
        (p: any) => p.persistentID === user.persistentId,
      );
      if (!player?.stats) continue;

      // Check if player actually placed capital and played
      const hasSpawned = player.hasSpawned ?? true; // default true for old records

      if (!tree[gameType]) tree[gameType] = {};
      if (!tree[gameType][gameMode]) tree[gameType][gameMode] = {};
      if (!tree[gameType][gameMode][difficulty]) {
        tree[gameType][gameMode][difficulty] = {
          wins: 0n,
          losses: 0n,
          total: 0n,
          stats: null,
        };
      }

      const leaf = tree[gameType][gameMode][difficulty];

      // Only count win/loss if player actually played (spawned)
      if (hasSpawned) {
        const isWin =
          info.winner?.[0] === "player" && info.winner?.[1] === player.clientID;
        leaf.wins += isWin ? 1n : 0n;
        leaf.losses += isWin ? 0n : 1n;
        leaf.total += 1n;
      } else {
        // Player joined but never played — count as match only
        leaf.total += 1n;
      }

      // Merge detailed stats
      if (player.stats) {
        if (!leaf.stats) {
          leaf.stats = {
            attacks: player.stats.attacks
              ? [...player.stats.attacks]
              : undefined,
            betrayals: player.stats.betrayals,
            conquests: player.stats.conquests
              ? [...player.stats.conquests]
              : undefined,
            boats: player.stats.boats
              ? { ...player.stats.boats }
              : undefined,
            bombs: player.stats.bombs
              ? { ...player.stats.bombs }
              : undefined,
            gold: player.stats.gold
              ? [...player.stats.gold]
              : undefined,
            units: player.stats.units
              ? { ...player.stats.units }
              : undefined,
          };
        } else {
          // Merge BigInt arrays
          const mergeArr = (
            a: bigint[] | undefined,
            b: bigint[] | undefined,
          ): bigint[] | undefined => {
            if (!a && !b) return undefined;
            const len = Math.max(a?.length ?? 0, b?.length ?? 0);
            return Array.from({ length: len }, (_, i) =>
              (a?.[i] ?? 0n) + (b?.[i] ?? 0n),
            );
          };
          const mergeRec = (
            a: Record<string, bigint[]> | undefined,
            b: Record<string, bigint[]> | undefined,
          ): Record<string, bigint[]> | undefined => {
            if (!a && !b) return undefined;
            const keys = new Set([
              ...Object.keys(a ?? {}),
              ...Object.keys(b ?? {}),
            ]);
            const out: Record<string, bigint[]> = {};
            for (const k of keys) {
              const merged = mergeArr(a?.[k], b?.[k]);
              if (merged) out[k] = merged;
            }
            return Object.keys(out).length ? out : undefined;
          };
          leaf.stats.attacks = mergeArr(
            leaf.stats.attacks,
            player.stats.attacks,
          );
          leaf.stats.betrayals =
            (leaf.stats.betrayals ?? 0n) + (player.stats.betrayals ?? 0n);
          leaf.stats.conquests = mergeArr(
            leaf.stats.conquests,
            player.stats.conquests,
          );
          leaf.stats.boats = mergeRec(leaf.stats.boats, player.stats.boats);
          leaf.stats.bombs = mergeRec(leaf.stats.bombs, player.stats.bombs);
          leaf.stats.gold = mergeArr(leaf.stats.gold, player.stats.gold);
          leaf.stats.units = mergeRec(leaf.stats.units, player.stats.units);
        }
      }
    }

    // Convert BigInt to string for JSON serialization
    const serialize = (obj: any): any => {
      if (obj === null || obj === undefined) return obj;
      if (typeof obj === "bigint") return obj.toString();
      if (Array.isArray(obj)) return obj.map(serialize);
      if (typeof obj === "object") {
        const out: any = {};
        for (const [k, v] of Object.entries(obj)) {
          out[k] = serialize(v);
        }
        return out;
      }
      return obj;
    };

    res.json({ statsTree: serialize(tree) });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed";
    res.status(500).json({ error: msg });
  }
});

router.get("/:publicId", async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({
      publicId: req.params.publicId,
    })
      .select("username publicId stats ranked clanTag avatarUrl bio createdAt")
      .lean();

    if (!user) {
      res.status(404).json({ error: "Player not found" });
      return;
    }

    res.json({ user });
  } catch {
    res
      .status(500)
      .json({ error: "Failed to fetch profile" });
  }
});

export default router;
