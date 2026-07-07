import { z } from "zod";

const TurnstileVerdictSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("approved") }),
  z.object({ status: z.literal("rejected"), reason: z.string() }),
]);

type TurnstileVerdict = z.infer<typeof TurnstileVerdictSchema>;

export type TurnstileResponse =
  | TurnstileVerdict
  | { status: "error"; reason: string };

// Simple IP-based rate limiting for anti-bot
const connectionAttempts = new Map<
  string,
  { count: number; resetAt: number }
>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = connectionAttempts.get(ip);

  if (!entry || now > entry.resetAt) {
    connectionAttempts.set(ip, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });
    return true;
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return false;
  }

  entry.count++;
  return true;
}

/**
 * Local anti-bot verification.
 * Replaces Cloudflare Turnstile with IP-based rate limiting.
 * In dev mode, always approves.
 */
export async function verifyTurnstileToken(
  ip: string,
  _turnstileToken: string | null,
): Promise<TurnstileResponse> {
  // In development, always approve
  if (process.env.GAME_ENV === "dev") {
    return { status: "approved" };
  }

  // Rate limit check
  if (!checkRateLimit(ip)) {
    return {
      status: "rejected",
      reason: "Too many connection attempts. Please try again later.",
    };
  }

  // If a token is provided, accept it (for future proof-of-work implementation)
  if (_turnstileToken) {
    return { status: "approved" };
  }

  // No token provided - allow but log
  return { status: "approved" };
}
