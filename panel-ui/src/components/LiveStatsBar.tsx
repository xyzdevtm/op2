import React from 'react';

interface LiveStats {
  playerId: string;
  kills?: number;
  deaths?: number;
  tiles?: number;
  gold?: number;
  gameMode?: string;
  isAlive?: boolean;
  timestamp: number;
}

interface LiveStatsBarProps {
  stats: LiveStats | null;
  connected: boolean;
}

export default function LiveStatsBar({ stats, connected }: LiveStatsBarProps) {
  if (!stats) return null;

  const age = Math.floor((Date.now() - stats.timestamp) / 1000);
  const isStale = age > 60;

  return (
    <div className={`rounded-lg border p-3 ${stats.isAlive ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-400">Live Stats</span>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          {isStale && (
            <span className="text-xs text-yellow-500">Stale ({age}s)</span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">K/D</span>
          <span className="font-mono">{stats.kills ?? 0}/{stats.deaths ?? 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Tiles</span>
          <span className="font-mono">{stats.tiles ?? 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Gold</span>
          <span className="font-mono">{stats.gold ?? 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Status</span>
          <span className={`font-mono ${stats.isAlive ? 'text-green-400' : 'text-red-400'}`}>
            {stats.isAlive ? 'Alive' : 'Dead'}
          </span>
        </div>
      </div>
      {stats.gameMode && (
        <div className="mt-2 text-xs text-gray-500">
          Mode: {stats.gameMode}
        </div>
      )}
    </div>
  );
}
