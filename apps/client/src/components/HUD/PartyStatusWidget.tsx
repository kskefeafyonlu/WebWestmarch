import React from "react";
import { RemotePlayer } from "../../network/GameClient";
import { Shield, Sparkles, Crosshair, Heart, Zap } from "lucide-react";

interface PartyStatusWidgetProps {
  player?: RemotePlayer;
}

const CLASS_ICONS: Record<string, React.ReactNode> = {
  WARRIOR: <Shield className="w-3.5 h-3.5 text-amber-400" />,
  MAGE: <Sparkles className="w-3.5 h-3.5 text-purple-400" />,
  RANGER: <Crosshair className="w-3.5 h-3.5 text-emerald-400" />,
  CLERIC: <Heart className="w-3.5 h-3.5 text-rose-400" />,
};

export const PartyStatusWidget: React.FC<PartyStatusWidgetProps> = ({ player }) => {
  if (!player) return null;

  return (
    <div className="glass-panel p-4 w-72 flex flex-col gap-3 pointer-events-auto">
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-3.5 h-3.5 rounded-full border border-white shadow-sm"
            style={{ backgroundColor: player.color }}
          />
          <h2 className="font-cinzel text-sm font-bold text-amber-300 tracking-wide">
            {player.name}
          </h2>
        </div>
        <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
          HEX ({player.q}, {player.r})
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {player.members?.map((member) => {
          const hpPercent = Math.round((member.currentHp / member.maxHp) * 100);
          const mpPercent = Math.round((member.currentMp / member.maxMp) * 100);

          return (
            <div
              key={member.id}
              className="bg-slate-900/60 rounded-lg p-2 border border-slate-800/80 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-1.5 font-medium text-slate-200">
                  {CLASS_ICONS[member.classRole] || <Shield className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{member.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">Lv.{member.level}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {member.currentHp}/{member.maxHp} HP
                </span>
              </div>

              {/* HP Bar */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-1">
                <div
                  className="h-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-300"
                  style={{ width: `${hpPercent}%` }}
                />
              </div>

              {/* MP Bar */}
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-300"
                  style={{ width: `${mpPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
