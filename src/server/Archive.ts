import z from "zod";
import { GameType } from "../core/game/Game";
import {
  GameID,
  GameRecord,
  GameRecordSchema,
  ID,
  PartialGameRecord,
} from "../core/Schemas";
import { replacer } from "../core/Util";
import { GameRecord as GameRecordModel } from "./db/models/GameRecord.js";
import { Match } from "./db/models/Match.js";
import { User } from "./db/models/User.js";
import { Clan } from "./db/models/Clan.js";
import { logger } from "./Logger";

const log = logger.child({ component: "Archive" });

export async function archive(
  gameRecord: GameRecord,
  trustedCosmeticFlagUrls: Set<string> = new Set(),
) {
  try {
    if (gameRecord.info.config.gameType === GameType.Singleplayer) {
      stripUntrustedFlagUrls(gameRecord, trustedCosmeticFlagUrls);
    }

    // Report match to local panel (stats aggregation)
    await reportMatchToPanel(gameRecord);

    // Validate but don't skip on error — save anyway for stats
    const parsed = GameRecordSchema.safeParse(gameRecord);
    if (!parsed.success) {
      log.warn(`game record validation warning: ${z.prettifyError(parsed.error).substring(0, 200)}`, {
        gameID: gameRecord.info.gameID,
      });
    }

    // Save full game record to MongoDB
    const turnsJson = JSON.stringify(gameRecord, replacer);
    const turns = JSON.parse(turnsJson);

    await GameRecordModel.findOneAndUpdate(
      { gameId: gameRecord.info.gameID },
      {
        gameId: gameRecord.info.gameID,
        info: gameRecord.info,
        turns: turns.turns || [],
        version: turns.version || "",
        gitCommit: ServerEnv.gitCommit(),
        domain: ServerEnv.domain(),
      },
      { upsert: true },
    );

    log.info(`archived game record: ${gameRecord.info.gameID}`);
  } catch (error) {
    log.error(`error archiving game record: ${error}`, {
      gameID: gameRecord.info.gameID,
    });
  }
}

import { ServerEnv } from "./ServerEnv";

/**
 * Report completed match to the local panel for stats aggregation.
 */
async function reportMatchToPanel(gameRecord: GameRecord): Promise<void> {
  try {
    const players = gameRecord.info.players.map((p) => ({
      persistentId: p.persistentID,
      username: p.username,
      team: p.team,
      kills: p.stats?.kills?.length ?? 0,
      deaths: 0,
      score: p.stats?.finalTiles ?? 0,
      tilesOwned: p.stats?.finalTiles ?? 0,
      result: determineResult(p, gameRecord),
      isMvp: false,
      hasSpawned: (p as any).hasSpawned ?? true, // default true for old records
    }));

    // Mark MVP (highest score)
    if (players.length > 0) {
      const sorted = [...players].sort((a, b) => b.score - a.score);
      sorted[0].isMvp = true;
    }

    const gameId = gameRecord.info.gameID;

    // Save match record
    await Match.findOneAndUpdate(
      { gameId },
      {
        gameId,
        gameMode: gameRecord.info.config.gameMode ?? "FFA",
        gameType: gameRecord.info.config.gameType,
        mapName: gameRecord.info.config.map ?? "Unknown",
        duration: gameRecord.info.duration ?? 0,
        players: players.map(({ hasSpawned, ...rest }) => ({ ...rest, hasSpawned })),
        gameRecord,
        startedAt: new Date(
          Date.now() - (gameRecord.info.duration ?? 0) * 1000,
        ),
        endedAt: new Date(),
      },
      { upsert: true },
    );

    // Update player stats
    for (const p of players) {
      if (!p.persistentId) continue;

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(p.persistentId)) continue;

      // Skip anonymous players
      const user = await User.findOne({
        persistentId: p.persistentId,
      });
      if (!user) continue;

      const isWin = p.result === "win" && p.hasSpawned;
      const isLoss = p.result === "loss" && p.hasSpawned;

      const newTotalKills = user.stats.totalKills + (p.kills || 0);
      const newTotalDeaths =
        user.stats.totalDeaths + (p.deaths || 0);
      const newKd =
        newTotalDeaths > 0
          ? newTotalKills / newTotalDeaths
          : newTotalKills;

      await User.updateOne(
        { persistentId: p.persistentId },
        {
          $inc: {
            "stats.totalMatches": 1,
            "stats.wins": isWin ? 1 : 0,
            "stats.losses": isLoss ? 1 : 0,
            "stats.totalKills": p.kills || 0,
            "stats.totalDeaths": p.deaths || 0,
          },
          $set: {
            "stats.kdRatio": Math.round(newKd * 100) / 100,
            "stats.lastPlayedAt": new Date(),
          },
        },
      );

      // Update clan stats
      if (user.clanTag) {
        await Clan.updateOne(
          { tag: user.clanTag },
          {
            $inc: {
              "stats.totalMatches": 1,
              "stats.wins": isWin ? 1 : 0,
              "stats.losses": isLoss ? 1 : 0,
            },
          },
        );
      }
    }
  } catch (error) {
    log.error(`error reporting match to panel: ${error}`, {
      gameID: gameRecord.info.gameID,
    });
  }
}

function determineResult(
  player: { clientID?: string; persistentID?: string },
  gameRecord: GameRecord,
): "win" | "loss" | "abandoned" {
  const winner = gameRecord.info.winner as any;
  if (!winner) return "loss";
  // winner is a tuple like ["player", "clientID"] or ["team", "teamName"]
  const winnerType = winner[0];
  if (winnerType === "player") {
    const winningClientID = winner[1];
    if (winningClientID === player.clientID) return "win";
  } else if (winnerType === "team") {
    // For team games, check if player is on the winning team
    const winningTeam = winner[1];
    // We can't determine team membership here, so default to loss
  }
  return "loss";
}

export async function readGameRecord(
  gameId: GameID,
): Promise<GameRecord | null> {
  try {
    if (!ID.safeParse(gameId).success) {
      log.error(`invalid game ID: ${gameId}`);
      return null;
    }

    const record = await GameRecordModel.findOne({
      gameId,
    }).lean();

    if (!record) {
      log.error(`game record not found: ${gameId}`);
      return null;
    }

    // Reconstruct the GameRecord from stored data
    const gameRecord: GameRecord = {
      info: record.info as GameRecord["info"],
      turns: record.turns as GameRecord["turns"],
      version: record.version,
      gitCommit: record.gitCommit,
      subdomain: ServerEnv.subdomain(),
      domain: record.domain,
    };

    return GameRecordSchema.parse(gameRecord);
  } catch (error) {
    log.error(`error reading game record: ${error}`, {
      gameID: gameId,
    });
    return null;
  }
}

export function finalizeGameRecord(
  clientRecord: PartialGameRecord,
): GameRecord {
  return {
    ...clientRecord,
    gitCommit: ServerEnv.gitCommit(),
    subdomain: ServerEnv.subdomain(),
    domain: ServerEnv.domain(),
  };
}

function stripUntrustedFlagUrls(
  gameRecord: GameRecord,
  trustedCosmeticFlagUrls: Set<string>,
): void {
  for (const player of gameRecord.info.players) {
    const flag = player.cosmetics?.flag;
    if (
      flag === undefined ||
      !/^https?:\/\//i.test(flag) ||
      trustedCosmeticFlagUrls.has(flag)
    ) {
      continue;
    }
    log.warn("dropping untrusted singleplayer replay flag", {
      gameID: gameRecord.info.gameID,
      clientID: player.clientID,
    });
    player.cosmetics!.flag = undefined;
  }
}
