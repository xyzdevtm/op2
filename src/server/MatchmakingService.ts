import crypto from "crypto";
import { Logger } from "winston";

interface QueueEntry {
  persistentId: string;
  username: string;
  joinedAt: number;
  ws: import("ws").WebSocket;
}

interface GameAssignment {
  gameId: string;
  players: QueueEntry[];
}

export class MatchmakingService {
  private queue: QueueEntry[] = [];
  private log: Logger;
  private matchInterval: ReturnType<typeof setInterval> | null = null;

  constructor(parentLog: Logger) {
    this.log = parentLog.child({ comp: "matchmaking" });
  }

  start(intervalMs = 5000) {
    this.log.info(
      `Starting matchmaking service (check interval: ${intervalMs}ms)`,
    );
    this.matchInterval = setInterval(
      () => this.processQueue(),
      intervalMs,
    );
  }

  stop() {
    if (this.matchInterval) {
      clearInterval(this.matchInterval);
      this.matchInterval = null;
    }
  }

  joinQueue(
    persistentId: string,
    username: string,
    ws: import("ws").WebSocket,
  ) {
    // Don't add if already in queue
    const existing = this.queue.find(
      (e) => e.persistentId === persistentId,
    );
    if (existing) {
      this.log.info(
        `Player ${username} already in queue, skipping`,
      );
      return;
    }

    this.queue.push({
      persistentId,
      username,
      joinedAt: Date.now(),
      ws,
    });

    this.log.info(
      `Player ${username} joined matchmaking queue (${this.queue.length} in queue)`,
    );
  }

  leaveQueue(persistentId: string) {
    const index = this.queue.findIndex(
      (e) => e.persistentId === persistentId,
    );
    if (index >= 0) {
      const entry = this.queue[index];
      this.queue.splice(index, 1);
      this.log.info(
        `Player ${entry.username} left matchmaking queue`,
      );
    }
  }

  removeFromQueueByWs(ws: import("ws").WebSocket) {
    this.queue = this.queue.filter((e) => e.ws !== ws);
  }

  private processQueue() {
    if (this.queue.length < 2) return;

    // Simple matchmaking: take the first 2 players
    // In production, implement Elo-based matching
    const player1 = this.queue.shift()!;
    const player2 = this.queue.shift()!;

    const gameId = this.generateGameId();

    this.log.info(
      `Matched players: ${player1.username} vs ${player2.username} (game: ${gameId})`,
    );

    // Notify both players
    const assignment: GameAssignment = {
      gameId,
      players: [player1, player2],
    };

    for (const player of assignment.players) {
      try {
        if (player.ws.readyState === 1) {
          // WebSocket.OPEN
          player.ws.send(
            JSON.stringify({
              type: "match-assignment",
              gameId,
            }),
          );
        }
      } catch (error) {
        this.log.error(
          `Failed to notify player ${player.username}: ${error}`,
        );
      }
    }
  }

  private generateGameId(): string {
    return `mm_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  }

  getQueueSize(): number {
    return this.queue.length;
  }
}
