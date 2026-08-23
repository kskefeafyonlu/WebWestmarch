import React, { useState } from "react";
import { RemotePlayer } from "../../network/GameClient";
import { Users, ChevronDown, ChevronUp, UserCheck, Shield } from "lucide-react";

interface PlayerListWidgetProps {
  players: Map<string, RemotePlayer>;
  localSessionId: string | null;
}

export const PlayerListWidget: React.FC<PlayerListWidgetProps> = ({
  players,
  localSessionId,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const playerList = Array.from(players.values());

  return (
    <div className="glass-panel w-64 flex flex-col pointer-events-auto transition-all duration-200">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between p-2.5 bg-slate-900/60 hover:bg-slate-900/80 rounded-t-xl transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-400" />
          <span className="font-cinzel text-xs font-bold text-slate-200">
            Adventurers Online
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 font-semibold">
            {playerList.length}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        )}
      </button>

      {/* Expanded Player List */}
      {isExpanded && (
        <div className="p-2 flex flex-col gap-1.5 max-h-48 overflow-y-auto border-t border-slate-800">
          {playerList.length === 0 ? (
            <span className="text-xs text-slate-500 italic p-1">No adventurers connected</span>
          ) : (
            playerList.map((player) => {
              const isLocal = player.id === localSessionId;

              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-1.5 rounded-lg text-xs transition-colors ${
                    isLocal
                      ? "bg-amber-500/15 border border-amber-500/30 text-amber-200"
                      : "bg-slate-900/40 hover:bg-slate-900/70 border border-slate-800/60 text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: player.color }}
                    />
                    <span className="font-medium truncate">{player.name}</span>
                  </div>

                  {isLocal && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 flex-shrink-0">
                      YOU
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
