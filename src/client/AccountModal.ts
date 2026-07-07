import { html, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { UserMeResponse } from "../core/ApiSchemas";
import { fetchPlayerById, getApiBase, invalidateUserMe } from "./Api";
import { logOut, storeJwt } from "./Auth";
import "./components/baseComponents/stats/GameList";
import "./components/baseComponents/stats/PlayerStatsTable";
import "./components/baseComponents/stats/PlayerStatsTree";
import { BaseModal } from "./components/BaseModal";
import "./components/CopyButton";
import { modalHeader } from "./components/ui/ModalHeader";
import { translateText } from "./Utils";

@customElement("account-modal")
export class AccountModal extends BaseModal {
  protected routerName = "account";

  @state() private isLoadingUser: boolean = false;

  private userMeResponse: UserMeResponse | null = null;
  private statsTree: any = null;
  private recentGames: any[] = [];
  private authCheckInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    super();

    // Listen for custom event
    document.addEventListener("userMeResponse", (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        this.userMeResponse = customEvent.detail as UserMeResponse;
      } else {
        this.statsTree = null;
        this.recentGames = [];
        this.requestUpdate();
      }
    });

    this.loadStoredUser();
  }

  disconnectedCallback() {
    this.stopAuthCheck();
    super.disconnectedCallback();
  }

  private startAuthCheck() {
    this.stopAuthCheck();
    this.authCheckInterval = setInterval(() => this.checkSession(), 30000);
  }

  private stopAuthCheck() {
    if (this.authCheckInterval !== null) {
      clearInterval(this.authCheckInterval);
      this.authCheckInterval = null;
    }
  }

  private async checkSession() {
    if (!this.isLoggedIn()) return;
    try {
      const jwt = localStorage.getItem("player_jwt");
      const headers: Record<string, string> = {};
      if (jwt) headers["Authorization"] = `Bearer ${jwt}`;

      const res = await fetch(`${getApiBase()}/auth/me`, {
        credentials: "include",
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          this.userMeResponse = { user: data.user } as UserMeResponse;
          localStorage.setItem("panel_user", JSON.stringify(data.user));
          if (data.token) {
            storeJwt(data.token);
          }
        }
      }
      // On 401 or error: don't clear user state — user stays logged in
      // until they explicitly log out
    } catch {
      // Network error — ignore, keep current state
    }
  }

  private loadStoredUser() {
    const stored = localStorage.getItem("panel_user");
    if (stored) {
      try {
        const user = JSON.parse(stored);
        this.userMeResponse = { user } as UserMeResponse;
      } catch {
        localStorage.removeItem("panel_user");
      }
    }
  }

  private isLoggedIn(): boolean {
    return !!this.userMeResponse?.user;
  }

  protected renderHeaderSlot() {
    const loggedIn = this.isLoggedIn();

    return modalHeader({
      title: translateText("account_modal.title"),
      onBack: () => this.goToDefault(),
      ariaLabel: translateText("common.back"),
      rightContent: loggedIn
        ? html`
            <button
              @click=${() => this.openPanelDashboard()}
              class="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Back to Panel
            </button>
          `
        : undefined,
    });
  }

  protected modalConfig() {
    const loggedIn = this.isLoggedIn();
    return {
      tabs: loggedIn
        ? [
            { key: "account", label: translateText("account_modal.tab_account") },
            { key: "friends", label: translateText("account_modal.tab_friends") || "Friends" },
            { key: "stats", label: translateText("account_modal.tab_stats") },
            { key: "games", label: translateText("account_modal.tab_games") },
          ]
        : [
            { key: "account", label: translateText("account_modal.tab_account") },
          ],
    };
  }

  private goToDefault() {
    this.activeTab = "account";
    this.requestUpdate();
  }

  protected renderBody(tab: string) {
    if (this.isLoadingUser) {
      return this.renderLoadingSpinner(
        translateText("account_modal.fetching_account"),
      );
    }

    if (!this.isLoggedIn()) {
      if (tab === "account") {
        return html`<div class="custom-scrollbar mr-1">
          ${this.renderLoginButton()}
        </div>`;
      }
      return html`<div class="custom-scrollbar mr-1">
        <div class="p-6">
          <div
            class="bg-white/5 rounded-xl border border-white/10 p-12 flex flex-col items-center justify-center text-center"
          >
            <div class="text-4xl mb-3">🔒</div>
            <p class="text-white/60 text-sm">Login to view your ${tab}.</p>
          </div>
        </div>
      </div>`;
    }

    return html`
      <div class="custom-scrollbar mr-1">
        <div class="p-6">${this.renderTab(tab)}</div>
      </div>
    `;
  }

  private renderTab(tab: string): TemplateResult {
    switch (tab) {
      case "stats":
        return this.renderStatsTab();
      case "friends":
        return this.renderFriendsTab();
      case "games":
        return this.renderGamesTab();
      default:
        return this.renderAccountTab();
    }
  }

  private renderStatsTab(): TemplateResult {
    return html`
      <div class="bg-white/5 rounded-xl border border-white/10 p-6">
        <player-stats-tree-view .statsTree=${this.statsTree}></player-stats-tree-view>
      </div>
    `;
  }

  private renderAccountTab(): TemplateResult {
    const user = this.userMeResponse?.user;
    const username = user?.username || "Unknown";
    const wallet = (user as any)?.wallet?.balance || 0;

    return html`
      <div class="flex flex-col gap-6">
        <div class="bg-white/5 rounded-xl border border-white/10 p-6">
          <div class="flex flex-col items-center gap-4">
            <div
              class="text-xs text-white/40 uppercase tracking-widest font-bold border-b border-white/5 pb-2 px-8"
            >
              Logged in as
            </div>
            <div class="text-white text-xl font-bold">${username}</div>
            <div class="text-white/60 text-sm">
              Coins: ${wallet.toLocaleString()}
            </div>
          </div>
        </div>

        <button
          @click=${() => this.openPanelDashboard()}
          class="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors"
        >
          Open Panel
        </button>

        <button
          @click=${this.handleLogout}
          class="w-full px-6 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-xl transition-colors"
        >
          Logout
        </button>
      </div>
    `;
  }

  private renderFriendsTab(): TemplateResult {
    return html`
      <div
        class="bg-white/5 rounded-xl border border-white/10 p-12 flex flex-col items-center justify-center text-center"
      >
        <div class="text-4xl mb-3">👥</div>
        <p class="text-white/60 text-sm">Friends list coming soon.</p>
      </div>
    `;
  }

  private renderGamesTab(): TemplateResult {
    if (this.recentGames.length === 0) {
      return html`
        <div
          class="bg-white/5 rounded-xl border border-white/10 p-12 flex flex-col items-center justify-center text-center"
        >
          <div class="text-4xl mb-3">🎮</div>
          <p class="text-white/60 text-sm">No games played yet.</p>
        </div>
      `;
    }
    return html`
      <div class="bg-white/5 rounded-xl border border-white/10 p-6">
        <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span class="text-blue-400">🎮</span>
          Recent Games
        </h3>
        <game-list
          .games=${this.recentGames}
          .onViewGame=${(id: string) => void this.viewGame(id)}
        ></game-list>
      </div>
    `;
  }

  private renderLoginButton() {
    return html`
      <div class="flex items-center justify-center p-6 min-h-full">
        <div class="w-full max-w-md bg-white/5 rounded-2xl border border-white/10 p-8">
          <div class="text-center mb-8">
            <h2 class="text-xl font-bold text-white mb-2">Welcome</h2>
            <p class="text-white/50 text-sm">Login to sync your stats and purchases</p>
          </div>
          <button
            @click=${() => this.openPanel()}
            class="w-full px-6 py-4 text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors font-bold"
          >
            Login to Panel
          </button>
        </div>
      </div>
    `;
  }

  private openPanel() {
    const panelUrl = this.getPanelUrl();
    window.location.href = `${panelUrl}/login?game=true`;
  }

  private async handleLogin() {
    // not used - login happens on panel
  }

  private openPanelDashboard() {
    const panelUrl = this.getPanelUrl();
    window.location.href = panelUrl;
  }

  private getPanelUrl(): string {
    const origin = window.location.origin;
    if (origin.includes("localhost")) {
      return "http://localhost:4001";
    }
    return origin.replace(":9000", ":4001");
  }

  protected onOpen(): void {
    this.isLoadingUser = true;
    this.loadStoredUser();
    this.requestUpdate();

    // Refresh user data from API
    this.refreshUserFromApi();

    this.startAuthCheck();
  }

  private async refreshUserFromApi() {
    try {
      const jwt = localStorage.getItem("player_jwt");
      const headers: Record<string, string> = {};
      if (jwt) headers["Authorization"] = `Bearer ${jwt}`;

      const res = await fetch(`${getApiBase()}/auth/me`, {
        credentials: "include",
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          this.userMeResponse = { user: data.user } as UserMeResponse;
          localStorage.setItem("panel_user", JSON.stringify(data.user));
          // Store JWT from server so getPlayToken() can use it
          if (data.token) {
            storeJwt(data.token);
          }
          this.isLoadingUser = false;
          this.requestUpdate();

          if (data.user.publicId) {
            this.loadPlayerProfile(data.user.publicId);
          }
          return;
        }
      }
    } catch {
      // ignore
    }
    this.isLoadingUser = false;
    this.requestUpdate();
  }

  protected onClose(): void {
    this.stopAuthCheck();
    this.dispatchEvent(
      new CustomEvent("close", { bubbles: true, composed: true }),
    );
  }

  private async handleLogout() {
    localStorage.removeItem("panel_user");
    invalidateUserMe();
    await logOut();
    this.userMeResponse = null;
    this.statsTree = null;
    this.recentGames = [];
    this.activeTab = "account";
    this.requestUpdate();
  }

  private async viewGame(gameId: string): Promise<void> {
    this.close();
    history.pushState({ join: gameId }, "", `/${gameId}`);
    window.dispatchEvent(
      new CustomEvent("join-changed", { detail: { gameId } }),
    );
  }

  private async loadPlayerProfile(publicId: string): Promise<void> {
    try {
      const data = await fetchPlayerById(publicId);
      if (data) {
        this.statsTree = (data as any).stats || null;
        this.recentGames = (data as any).games || [];
      }
      this.requestUpdate();
    } catch (err) {
      console.warn("Failed to load player profile:", err);
    }
  }
}
