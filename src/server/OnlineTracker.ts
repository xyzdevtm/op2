import { User } from "./db/models/User.js";
import { logger } from "./Logger.js";

const log = logger.child({ comp: "online-tracker" });

// Map of persistentId -> last heartbeat timestamp
const onlinePlayers = new Map<string, number>();

const HEARTBEAT_INTERVAL = 30_000; // 30 seconds
const OFFLINE_THRESHOLD = 90_000; // 90 seconds (3 missed heartbeats)

let cleanupInterval: ReturnType<typeof setInterval> | null = null;

export function startOnlineTracker() {
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [persistentId, lastSeen] of onlinePlayers) {
      if (now - lastSeen > OFFLINE_THRESHOLD) {
        onlinePlayers.delete(persistentId);
      }
    }
  }, HEARTBEAT_INTERVAL);

  log.info("Online tracker started");
}

export function stopOnlineTracker() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

export function playerConnected(persistentId: string) {
  onlinePlayers.set(persistentId, Date.now());

  // Update lastSeenAt in DB (fire and forget)
  User.updateOne(
    { persistentId },
    { $set: { lastSeenAt: new Date() } },
  ).catch(() => {});
}

export function playerDisconnected(persistentId: string) {
  onlinePlayers.delete(persistentId);

  // Update lastSeenAt in DB
  User.updateOne(
    { persistentId },
    { $set: { lastSeenAt: new Date() } },
  ).catch(() => {});
}

export function playerHeartbeat(persistentId: string) {
  onlinePlayers.set(persistentId, Date.now());
}

export function isPlayerOnline(persistentId: string): boolean {
  return onlinePlayers.has(persistentId);
}

export function getOnlinePlayerCount(): number {
  return onlinePlayers.size;
}

export function getOnlinePlayerIds(): string[] {
  return Array.from(onlinePlayers.keys());
}
