import newsItemsFallback from "resources/news.json";
import {
  type NewsItem,
  type PlayerProfile,
  type RankedLeaderboardResponse,
  type UserMeResponse,
} from "../core/ApiSchemas";
import { type AnalyticsRecord } from "../core/Schemas";
import { RankedType } from "../core/game/Game";
import { logOut, userAuth } from "./Auth";

export function hasLinkedAccount(
  userMe: UserMeResponse | null | undefined,
): boolean {
  if (!userMe?.user) return false;
  return true;
}

export function getApiBase(): string {
  return "/panel/api";
}

export function getAudience(): string {
  return window.location.hostname;
}

export async function fetchPlayerById(
  playerId: string,
): Promise<PlayerProfile | false> {
  try {
    const url = `${getApiBase()}/users/${encodeURIComponent(playerId)}`;
    const jwt = localStorage.getItem("player_jwt");
    const headers: Record<string, string> = {};
    if (jwt) headers["Authorization"] = `Bearer ${jwt}`;

    const res = await fetch(url, {
      credentials: "include",
      headers,
    });

    if (res.status !== 200) {
      console.warn("fetchPlayerById: unexpected status", res.status);
      return false;
    }

    const json = await res.json();

    // Fetch detailed stats tree from GameRecords
    let statsTree = {};
    try {
      const statsRes = await fetch(
        `${getApiBase()}/users/${encodeURIComponent(playerId)}/stats`,
        { credentials: "include", headers },
      );
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        statsTree = statsData.statsTree || {};
      }
    } catch {
      // Fallback to flat stats
    }

    const profile: PlayerProfile = {
      createdAt: new Date().toISOString(),
      user: json.user || json,
      games: [],
      stats: statsTree,
    };
    return profile;
  } catch (err) {
    console.warn("fetchPlayerById: request failed", err);
    return false;
  }
}

let __userMe: Promise<UserMeResponse | false> | null = null;

export async function getUserMe(): Promise<UserMeResponse | false> {
  if (__userMe !== null) {
    return __userMe;
  }
  __userMe = (async () => {
    try {
      const response = await fetch(getApiBase() + "/auth/me", {
        credentials: "include",
      });

      if (response.status === 401) {
        return false;
      }

      if (response.status !== 200) return false;

      const body = await response.json();
      if (!body.user) return false;

      const user = body.user;
      const response_data: UserMeResponse = {
        user: {
          discord: undefined,
          google: undefined,
          email: user.email,
        },
        player: {
          publicId: user.publicId,
          adfree: false,
          flares: [
            ...(user.inventory?.skins || []).map(
              (s: string) => `skin:${s}`,
            ),
            ...(user.inventory?.flags || []).map(
              (f: string) => `flag:${f}`,
            ),
            ...(user.inventory?.patterns || []).map(
              (p: string) => `pattern:${p}`,
            ),
          ],
          achievements: { singleplayerMap: [] },
          friends: (
            (user.friends as unknown[]) || []
          ).map((f: unknown) => String(f)),
          subscription: null,
        },
      };

      return response_data;
    } catch (e) {
      console.error("getUserMe failed", e);
      return false;
    }
  })();
  return __userMe;
}

export function invalidateUserMe() {
  __userMe = null;
}

export async function purchaseWithCurrency(
  cosmeticType: "pattern" | "skin" | "flag",
  cosmeticName: string,
  _currencyType: "hard" | "soft",
  _colorPaletteName?: string,
): Promise<boolean> {
  try {
    const response = await fetch(getApiBase() + "/shop/purchase", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        itemId: cosmeticName,
        type: cosmeticType,
      }),
    });

    if (response.status === 401) {
      await logOut();
      return false;
    }

    return response.ok;
  } catch (e) {
    console.error("purchaseWithCurrency failed", e);
    return false;
  }
}

export async function fetchPlayerLeaderboard(
  page = 1,
  limit = 50,
): Promise<RankedLeaderboardResponse | false> {
  try {
    const response = await fetch(
      `${getApiBase()}/leaderboard?page=${page}&limit=${limit}`,
      { credentials: "include" },
    );

    if (!response.ok) return false;

    const data = await response.json();
    const result: RankedLeaderboardResponse = {
      [RankedType.OneVOne]: (data.leaderboard || []).map(
        (
          entry: Record<string, unknown>,
          index: number,
        ) => ({
          rank:
            (entry.rank as number) || index + 1,
          username: entry.username as string,
          public_id: entry.publicId as string,
          elo: 0,
          wins: (entry.stats as Record<string, number>)
            ?.wins || 0,
          losses: (entry.stats as Record<string, number>)
            ?.losses || 0,
          total:
            (entry.stats as Record<string, number>)
              ?.totalMatches || 0,
        }),
      ),
    };
    return result;
  } catch (err) {
    console.error("fetchPlayerLeaderboard failed", err);
    return false;
  }
}

export async function getNews(): Promise<NewsItem[]> {
  try {
    const response = await fetch("/news.json");
    if (!response.ok) return newsItemsFallback;
    const data = await response.json();
    return data;
  } catch {
    return newsItemsFallback;
  }
}

export async function fetchGameById(
  gameId: string,
): Promise<AnalyticsRecord | false> {
  try {
    const response = await fetch(
      `${getApiBase()}/game/${encodeURIComponent(gameId)}`,
      { credentials: "include" },
    );

    if (!response.ok) return false;

    const data = await response.json();
    return data as AnalyticsRecord;
  } catch {
    return false;
  }
}

export async function createCheckoutSession(
  _priceId?: string,
  _colorPaletteName?: string,
): Promise<string | false> {
  return false;
}

export async function cancelSubscription(): Promise<boolean> {
  return false;
}

export async function changeSubscriptionTier(
  _tier?: string,
): Promise<boolean> {
  return false;
}

export async function openSubscriptionPortal(): Promise<string | false> {
  return false;
}
