import { jwtVerify } from "jose";
import { z } from "zod";
import {
  TokenPayload,
  TokenPayloadSchema,
  UserMeResponse,
  UserMeResponseSchema,
} from "../core/ApiSchemas";
import { GameEnv } from "../core/configuration/Config";
import { PersistentIdSchema } from "../core/Schemas";
import { ServerEnv } from "./ServerEnv";

type TokenVerificationResult =
  | {
      type: "success";
      persistentId: string;
      claims: TokenPayload | null;
    }
  | { type: "error"; message: string };

export async function verifyClientToken(
  token: string,
): Promise<TokenVerificationResult> {
  // In dev mode, accept raw persistent UUIDs
  if (PersistentIdSchema.safeParse(token).success) {
    if (ServerEnv.env() === GameEnv.Dev) {
      return { type: "success", persistentId: token, claims: null };
    } else {
      return {
        type: "error",
        message: "persistent ID not allowed in production",
      };
    }
  }

  // Accept "session-based" token for panel-authenticated users
  if (token === "session-based") {
    // Session-based tokens are validated via the session cookie
    // The actual persistentId comes from the /auth/me call
    return {
      type: "error",
      message:
        "session-based token must be resolved to JWT before WebSocket join",
    };
  }

  try {
    const { getPublicKey, getIssuer, getAudience } = await import(
      "./crypto/jwt-keys.js"
    );

    const issuer = getIssuer();
    const audience = getAudience();
    const key = await getPublicKey();

    const { payload } = await jwtVerify(token, key, {
      algorithms: ["EdDSA"],
      issuer,
      audience,
    });

    const result = TokenPayloadSchema.safeParse(payload);
    if (!result.success) {
      return {
        type: "error",
        message: z.prettifyError(result.error),
      };
    }

    const claims = result.data;
    const persistentId = claims.sub;
    return { type: "success", persistentId, claims };
  } catch (e) {
    const message =
      e instanceof Error
        ? e.message
        : typeof e === "string"
          ? e
          : "An unknown error occurred";

    return { type: "error", message };
  }
}

/**
 * Fetch user profile from the local panel API.
 * Transforms the panel response to match the UserMeResponse schema.
 */
export async function getUserMe(
  token: string,
): Promise<
  | { type: "success"; response: UserMeResponse }
  | { type: "error"; message: string }
> {
  try {
    // For anonymous tokens, construct a minimal response
    if (token === "session-based") {
      return {
        type: "error",
        message: "getUserMe requires a real JWT token",
      };
    }

    // Verify the JWT to get the persistentId
    const { getPublicKey, getIssuer, getAudience } = await import(
      "./crypto/jwt-keys.js"
    );
    const issuer = getIssuer();
    const audience = getAudience();
    const key = await getPublicKey();

    let persistentId: string;
    let role: string;
    try {
      const { payload } = await jwtVerify(token, key, {
        algorithms: ["EdDSA"],
        issuer,
        audience,
      });
      persistentId = payload.sub as string;
      role = (payload.role as string) || "user";
    } catch {
      return {
        type: "error",
        message: "Invalid JWT token",
      };
    }

    // Anonymous users don't have panel accounts
    if (role === "anonymous") {
      return {
        type: "success",
        response: {
          user: {
            discord: undefined,
            google: undefined,
            email: undefined,
          },
          player: {
            publicId: persistentId.slice(0, 8),
            adfree: false,
            flares: [],
            achievements: { singleplayerMap: [] },
            friends: [],
            subscription: null,
          },
        },
      };
    }

    // Fetch from panel backend using panel secret
    const panelUrl = ServerEnv.panelUrl();
    const response = await fetch(
      `${panelUrl}/api/users/by-persistent-id/${encodeURIComponent(persistentId)}`,
      {
        headers: {
          "x-panel-secret": ServerEnv.panelSecret(),
        },
      },
    );

    if (response.status === 404) {
      // User doesn't exist yet
      return {
        type: "success",
        response: {
          user: { discord: undefined, google: undefined, email: undefined },
          player: {
            publicId: persistentId.slice(0, 8),
            adfree: false,
            flares: [],
            achievements: { singleplayerMap: [] },
            friends: [],
            subscription: null,
          },
        },
      };
    }

    if (response.status !== 200) {
      return {
        type: "error",
        message: `Failed to fetch user me: ${response.statusText}`,
      };
    }

    const body = (await response.json()) as Record<string, unknown>;
    const userData = body.user as Record<string, unknown> | undefined;

    if (!userData) {
      return {
        type: "error",
        message: "No user data in response",
      };
    }

    const response_data: UserMeResponse = {
      user: {
        discord: undefined,
        google: undefined,
        email: userData.email as string | undefined,
      },
      player: {
        publicId: (userData.publicId as string) || persistentId.slice(0, 8),
        adfree: false,
        flares: [
          ...((userData.inventory as Record<string, string[]>)?.skins || []).map(
            (s: string) => `skin:${s}`,
          ),
          ...((userData.inventory as Record<string, string[]>)?.flags || []).map(
            (f: string) => `flag:${f}`,
          ),
          ...((userData.inventory as Record<string, string[]>)?.patterns || []).map(
            (p: string) => `pattern:${p}`,
          ),
        ],
        achievements: { singleplayerMap: [] },
        friends: ((userData.friends as unknown[]) || []).map((f: unknown) =>
          String(f),
        ),
        subscription: null,
      },
    };

    return { type: "success", response: response_data };
  } catch (e) {
    return {
      type: "error",
      message: `Failed to fetch user me: ${e}`,
    };
  }
}
