@@
   setWinner(winner: Player | Team, allPlayersStats: AllPlayersStats): void {
     this._winner = winner;
-    // OFM: snapshot final tiles for standings (bots skipped in recordFinalTiles).
-    for (const player of this.players()) {
-      this.stats().recordFinalTiles(player, player.numTilesOwned());
-    }
+    // OFM: snapshot final tiles for standings. Record for all players
+    // (including dead/disconnected/bots) so analytics and end-of-game
+    // summaries are complete. StatsImpl.recordFinalTiles will be a no-op for
+    // players without clientID, but calling it ensures any implementations
+    // that care about final tiles can capture them.
+    for (const player of this.allPlayers()) {
+      try {
+        this.stats().recordFinalTiles(player, player.numTilesOwned());
+      } catch (e) {
+        // Non-fatal: ensure winner dispatch still happens even if stats
+        // storage can't record for certain player types.
+        // eslint-disable-next-line no-console
+        console.warn(
+          `setWinner: failed to record final tiles for player ${player.name()}: ${e}`,
+        );
+      }
+    }
     this.addUpdate({
       type: GameUpdateType.Win,
       winner: this.makeWinner(winner),
       allPlayersStats,
     });
   }
