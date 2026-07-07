import { decodeJwt } from "jose";
import { UserSettings } from "src/core/game/UserSettings";
import { TokenPayload } from "../core/ApiSchemas";
import { base64urlToUuid } from "../core/Base64";
import { getApiBase, getAudience } from "./Api";
import { generateCryptoRandomUUID } from "./Utils";

export type UserAuth = { jwt: string; claims: TokenPayload } | false;

const PERSISTENT_ID_KEY = "player_persistent_id";
const JWT_KEY = "player_jwt";

let __jwt: string | null = null;

function loadStoredJwt(): string | null {
  if (__jwt) return __jwt;
  __jwt = localStorage.getItem(JWT_KEY);
  return __jwt;
}

export function storeJwt(jwt: string) {
  __jwt = jwt;
  localStorage.setItem(JWT_KEY, jwt);
}

function clearStoredJwt() {
  __jwt = null;
  localStorage.removeItem(JWT_KEY);
}

export async function logOut(): Promise<boolean> {
  try {
    const response = await fetch(getApiBase() + "/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      console.error("Logout failed", response);
      return false;
    }

    return true;
  } catch (e) {
    console.error("Logout failed", e);
    return false;
  } finally {
    clearStoredJwt();
    localStorage.removeItem(PERSISTENT_ID_KEY);
    new UserSettings().clearFlag();
    new UserSettings().setSelectedPatternName(undefined);
  }
}

export async function isLoggedIn(): Promise<boolean> {
  const userAuthResult = await userAuth();
  return userAuthResult !== false;
}

export async function userAuth(): Promise<UserAuth> {
  try {
    const jwt = loadStoredJwt();
    const headers: Record<string, string> = {};
    if (jwt && jwt !== "session-based") headers["Authorization"] = `Bearer ${jwt}`;

    const response = await fetch(getApiBase() + "/auth/me", {
      credentials: "include",
      headers,
    });

    if (response.ok) {
      const data = await response.json();
      if (data.user) {
        // Store the JWT from the server
        if (data.token) {
          storeJwt(data.token);
        }

        const claims: TokenPayload = {
          sub:
            data.user.persistentId ||
            data.user.id ||
            getPersistentIDFromLocalStorage(),
          role: data.user.role || "user",
          iss: getApiBase(),
          aud: getAudience(),
        };

        // Use the server-issued JWT if available, otherwise use stored
        const jwt = data.token || loadStoredJwt() || "session-based";
        return { jwt, claims };
      }
    }

    // Not authenticated via session - clear any stored JWT
    clearStoredJwt();
    return false;
  } catch (e) {
    console.error("userAuth failed", e);
    return false;
  }
}

export async function getPlayToken(): Promise<string> {
  // First try to use stored JWT (from previous login)
  const storedJwt = loadStoredJwt();
  console.log("[getPlayToken] storedJwt:", storedJwt ? storedJwt.substring(0, 30) + "..." : "null");
  if (storedJwt && storedJwt !== "session-based") {
    console.log("[getPlayToken] Using stored JWT");
    return storedJwt;
  }

  // Try to get fresh JWT from server (session-based auth)
  const result = await userAuth();
  if (result !== false && result.jwt !== "session-based") {
    return result.jwt;
  }

  // Anonymous: get a JWT from the server
  try {
    const response = await fetch(getApiBase() + "/auth/anonymous", {
      method: "POST",
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();
      if (data.token) {
        storeJwt(data.token);
        return data.token;
      }
    }
  } catch {
    // Fall through to localStorage
  }

  return getPersistentIDFromLocalStorage();
}

export async function getAuthHeader(): Promise<string> {
  const jwt = loadStoredJwt();
  if (jwt && jwt !== "session-based") {
    return `Bearer ${jwt}`;
  }
  return "";
}

// Kept as no-op for backwards compatibility (TokenLoginModal import)
export async function tempTokenLogin(
  _token: string,
): Promise<string | null> {
  return null;
}

export function getPersistentID(): string {
  const jwt = loadStoredJwt();
  if (!jwt || jwt === "session-based") {
    return getPersistentIDFromLocalStorage();
  }
  try {
    const payload = decodeJwt(jwt);
    const sub = payload.sub;
    if (!sub) return getPersistentIDFromLocalStorage();
    // JWT sub is a plain UUID, not base64url-encoded
    return sub;
  } catch {
    return getPersistentIDFromLocalStorage();
  }
}

function getPersistentIDFromLocalStorage(): string {
  const value = localStorage.getItem(PERSISTENT_ID_KEY);
  if (value) return value;

  const newID = generateCryptoRandomUUID();
  localStorage.setItem(PERSISTENT_ID_KEY, newID);

  return newID;
}
