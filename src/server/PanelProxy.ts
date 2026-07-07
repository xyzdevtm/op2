import http from "http";
import { Router, type Request, type Response } from "express";
import { logger } from "./Logger.js";
import { ServerEnv } from "./ServerEnv.js";

const log = logger.child({ component: "PanelProxy" });

/**
 * Express router that proxies browser → panel requests.
 *
 * The browser hits /panel/* on the game server, which:
 *   1. Adds the x-panel-secret header (never exposed to the browser).
 *   2. Forwards the request to the panel API.
 *   3. Returns the panel's response.
 *
 * Session handling: the game server reads its own "gp" cookie (game panel
 * session) and forwards it as a Cookie header to the panel. When the panel
 * responds with Set-Cookie, we rewrite it so the browser stores it under
 * the game server's origin instead of the panel's.
 */
export function createPanelProxy(): Router {
  const router = Router();

  router.all("/panel/*splat", async (req: Request, res: Response) => {
    const panelPath = req.path.replace(/^\/panel/, "");
    const panelUrl = `${ServerEnv.panelUrl()}/api${panelPath}`;
    const parsedUrl = new URL(panelUrl);

    const forwardHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      const lower = key.toLowerCase();
      if (lower === "host" || lower === "connection" || lower === "content-length" || lower === "transfer-encoding") {
        continue;
      }
      if (typeof value === "string") {
        forwardHeaders[key] = value;
      } else if (Array.isArray(value)) {
        forwardHeaders[key] = value.join(", ");
      }
    }
    forwardHeaders["x-panel-secret"] = ServerEnv.panelSecret();

    // Read session cookie: prefer "gp" (bridge cookie), fall back to "connect.sid" (shared domain)
    const rawCookie = req.headers.cookie || "";
    const gpMatch = rawCookie.match(/(?:^|;\s*)gp=([^;]*)/);
    const sidMatch = rawCookie.match(/(?:^|;\s*)connect\.sid=([^;]*)/);
    const sessionVal = gpMatch?.[1] || sidMatch?.[1];
    if (sessionVal) {
      forwardHeaders["cookie"] = `connect.sid=${sessionVal}`;
    }

    const isWrite = !["GET", "HEAD"].includes(req.method);
    if (isWrite && !forwardHeaders["content-type"]) {
      forwardHeaders["content-type"] = "application/json";
    }

    try {
      const bodyStr = isWrite ? JSON.stringify(req.body || {}) : undefined;
      if (bodyStr) {
        forwardHeaders["content-length"] = Buffer.byteLength(bodyStr).toString();
      }

      const panelResponse = await new Promise<http.IncomingMessage>((resolve, reject) => {
        const proxyReq = http.request(
          {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port,
            path: parsedUrl.pathname + parsedUrl.search,
            method: req.method,
            headers: forwardHeaders,
            timeout: 15_000,
          },
          (response) => resolve(response),
        );
        proxyReq.on("error", reject);
        proxyReq.on("timeout", () => {
          proxyReq.destroy();
          reject(new Error("timeout"));
        });
        if (bodyStr) proxyReq.write(bodyStr);
        proxyReq.end();
      });

      res.status(panelResponse.statusCode || 502);

      // Copy response headers, rewriting Set-Cookie to use our own session name
      const responseHeaders = panelResponse.headers;
      for (const [key, value] of Object.entries(responseHeaders)) {
        const lower = key.toLowerCase();
        if (lower === "transfer-encoding" || lower === "connection" ||
            lower === "content-encoding" || lower === "content-length") {
          continue;
        }
        if (lower === "set-cookie" && typeof value === "string") {
          const match = value.match(/connect\.sid=([^;]+)/);
          if (match) {
            res.cookie("gp", match[1], {
              httpOnly: false,
              sameSite: "lax",
              path: "/",
              maxAge: 30 * 24 * 60 * 60 * 1000,
            });
          }
          continue;
        }
        if (typeof value === "string") {
          res.setHeader(key, value);
        }
      }

      const chunks: Buffer[] = [];
      for await (const chunk of panelResponse) {
        chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
      }
      res.send(Buffer.concat(chunks));
    } catch (err) {
      const isTimeout = err instanceof Error && err.message === "timeout";
      if (isTimeout) {
        log.warn(`panel proxy timeout: ${req.method} ${panelUrl}`);
      } else {
        log.error(`panel proxy error: ${req.method} ${panelUrl} - ${err instanceof Error ? err.message : String(err)}`, err);
      }
      if (!res.headersSent) {
        res.status(isTimeout ? 504 : 502).json({ error: isTimeout ? "panel_timeout" : "panel_unreachable" });
      }
    }
  });

  return router;
}
