import React, { useState } from "react";
import { X, Swords, Shield, Zap, Skull, Award } from "lucide-react";
import { RemotePlayer } from "../../network/GameClient";

interface CombatPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  player?: RemotePlayer;
}

export const CombatPreviewModal: React.FC<CombatPreviewModalProps> = ({ isOpen, onClose, player }) => {
  const [turnCount, setTurnCount] = useState(1);
  const [combatLog, setCombatLog] = useState<string[]>([
    "Tactical encounter initiated!",
    "Goblin Warband draws weapons on the frontline.",
    "Valeria takes high ground on the tactical hex grid.",
  ]);

  const [enemyHp, setEnemyHp] = useState(160);
  const maxEnemyHp = 160;

  if (!isOpen) return null;

  const handlePartyAction = (action: string, damage: number) => {
    const newEnemyHp = Math.max(0, enemyHp - damage);
    setEnemyHp(newEnemyHp);
    setCombatLog((prev) => [
      ...prev,
      `Turn ${turnCount}: Party executed [${action}] dealing ${damage} damage!`,
      ...(newEnemyHp === 0 ? ["🏆 Victory! Hostiles vanquished. 140 XP & Ancient Relic awarded."] : []),
    ]);
    setTurnCount((c) => c + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="glass-panel w-full max-w-4xl border-rose-600/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Combat Header */}
        <div className="flex items-center justify-between p-4 border-b border-rose-500/30 bg-gradient-to-r from-slate-900 via-rose-950/30 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-400">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-cinzel text-lg font-bold text-rose-200">
                Tactical Battle: Bloodfang Raider Ambush
              </h2>
              <p className="text-xs text-slate-400">Turn-Based Tactical Combat Grid</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-amber-300 bg-amber-950/60 px-3 py-1 rounded-full border border-amber-700/60">
              Round {turnCount}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Combat Grid Arena View */}
        <div className="p-6 flex-1 flex flex-col md:flex-row gap-6 overflow-y-auto">
          {/* Tactical Arena / Enemy Status */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Skull className="w-5 h-5 text-rose-500" />
                  <span className="font-bold text-slate-100 text-sm">Bloodfang Chieftain & Grunts</span>
                </div>
                <span className="text-xs font-mono text-rose-400">
                  {enemyHp} / {maxEnemyHp} HP
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-300"
                  style={{ width: `${(enemyHp / maxEnemyHp) * 100}%` }}
                />
              </div>
            </div>

            {/* Tactical Grid Visualization */}
            <div className="bg-slate-950/80 p-6 rounded-xl border border-slate-800 flex items-center justify-center min-h-[220px]">
              <div className="grid grid-cols-5 gap-3">
                {Array.from({ length: 15 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-14 h-14 rounded-lg border flex items-center justify-center text-xs font-mono transition-all ${
                      i === 1 || i === 6
                        ? "border-cyan-500/60 bg-cyan-950/40 text-cyan-300 shadow-sm shadow-cyan-500/20"
                        : i === 13 || i === 8
                        ? "border-rose-500/60 bg-rose-950/40 text-rose-300 shadow-sm shadow-rose-500/20"
                        : "border-slate-800 bg-slate-900/40 text-slate-600 hover:border-slate-700"
                    }`}
                  >
                    {i === 1 ? "Valeria" : i === 6 ? "Ignis" : i === 13 ? "Goblin" : i === 8 ? "Chief" : `G-${i}`}
                  </div>
                ))}
              </div>
            </div>

            {/* Tactical Action Commands */}
            <div className="grid grid-cols-3 gap-3">
              <button
                disabled={enemyHp === 0}
                onClick={() => handlePartyAction("Cleaving Strike (Warrior)", 38)}
                className="fantasy-btn py-3 bg-amber-500/20 border-amber-500/40 hover:bg-amber-500/30 text-amber-200"
              >
                <Shield className="w-4 h-4 text-amber-400" /> Cleaving Strike (38 DMG)
              </button>
              <button
                disabled={enemyHp === 0}
                onClick={() => handlePartyAction("Fireball Burst (Mage)", 52)}
                className="fantasy-btn py-3 bg-purple-500/20 border-purple-500/40 hover:bg-purple-500/30 text-purple-200"
              >
                <Zap className="w-4 h-4 text-purple-400" /> Fireball (52 DMG)
              </button>
              <button
                disabled={enemyHp === 0}
                onClick={() => handlePartyAction("Piercing Volley (Ranger)", 30)}
                className="fantasy-btn py-3 bg-emerald-500/20 border-emerald-500/40 hover:bg-emerald-500/30 text-emerald-200"
              >
                <Award className="w-4 h-4 text-emerald-400" /> Volley (30 DMG)
              </button>
            </div>
          </div>

          {/* Combat Log */}
          <div className="w-full md:w-72 bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex flex-col">
            <h3 className="font-cinzel text-xs font-bold text-slate-300 mb-2 border-b border-slate-800 pb-1">
              Battle Chronicle
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2 text-xs font-mono max-h-56">
              {combatLog.map((log, idx) => (
                <div key={idx} className="text-slate-300 leading-relaxed border-l-2 border-slate-700 pl-2">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
