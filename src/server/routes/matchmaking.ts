import { Router, type Request, type Response } from "express";
import { WebSocketServer, type WebSocket } from "ws";
import type http from "http";
import { MatchmakingService } from "../MatchmakingService.js";
import { verifyClientToken } from "../jwt.js";
import { logger } from "../Logger.js";

const log = logger.child({ comp: "matchmaking-ws" });
let matchmakingService: MatchmakingService | null = null;

export function getMatchmakingService(): MatchmakingService {
  if (!matchmakingService) {
    matchmakingService = new MatchmakingService(log);
    matchmakingService.start();
  }
  return matchmakingService;
}

export function setupMatchmakingWebSocket(
  server: http.Server,
) {
  const wss = new WebSocketServer({
    noServer: true,
  });

  server.on("upgrade", (request, socket, head) => {
    const url = new URL(
      request.url || "/",
      `http://${request.headers.host}`,
    );

    if (url.pathname === "/matchmaking/join") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on("connection", (ws: WebSocket, request) => {
    const service = getMatchmakingService();
    let authenticated = false;
    let persistentId = "";
    let username = "";

    const timeout = setTimeout(() => {
      if (!authenticated) {
        ws.close(4001, "Authentication timeout");
      }
    }, 10000);

    ws.on("message", async (data) => {
      try {
        const msg = JSON.parse(data.toString());

        if (msg.type === "join" && !authenticated) {
          const result = await verifyClientToken(msg.jwt);
          if (result.type === "error") {
            ws.close(4002, "Invalid token");
            clearTimeout(timeout);
            return;
          }

          persistentId = result.persistentId;
          username =
            result.claims?.sub?.slice(0, 8) || "Anonymous";
          authenticated = true;
          clearTimeout(timeout);

          service.joinQueue(persistentId, username, ws);
        }
      } catch (error) {
        log.error(`Matchmaking WS error: ${error}`);
        ws.close(4003, "Invalid message");
      }
    });

    ws.on("close", () => {
      clearTimeout(timeout);
      if (authenticated) {
        service.leaveQueue(persistentId);
      }
      service.removeFromQueueByWs(ws);
    });
  });

  return wss;
}

// HTTP endpoint for queue status
const router = Router();

router.get("/status", (_req: Request, res: Response) => {
  const service = getMatchmakingService();
  res.json({ queueSize: service.getQueueSize() });
});

export default router;
