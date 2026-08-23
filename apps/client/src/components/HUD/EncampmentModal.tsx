import React, { useState } from "react";
import { X, Flame, Shield, Hammer, Users, ShoppingBag, BedDouble } from "lucide-react";

interface EncampmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EncampmentModal: React.FC<EncampmentModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<"TAVERN" | "WORKSHOP" | "RECRUIT" | "SETTLEMENT">("TAVERN");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="glass-panel w-full max-w-3xl border-amber-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-amber-500/30 bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-cinzel text-lg font-bold text-amber-200">Haven's Rest Sanctuary</h2>
              <p className="text-xs text-slate-400">Overworld Expedition Encampment & Bastion</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-4 pt-2 gap-2">
          {[
            { id: "TAVERN", label: "Hearth & Rest", icon: <BedDouble className="w-4 h-4" /> },
            { id: "WORKSHOP", label: "Blacksmith & Gear", icon: <Hammer className="w-4 h-4" /> },
            { id: "RECRUIT", label: "Guild Hall", icon: <Users className="w-4 h-4" /> },
            { id: "SETTLEMENT", label: "Expand Encampment", icon: <Shield className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all ${
                activeTab === tab.id
                  ? "border-amber-400 text-amber-300 bg-amber-500/10"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4 text-sm text-slate-300">
          {activeTab === "TAVERN" && (
            <div className="flex flex-col gap-4">
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <h3 className="font-cinzel font-bold text-amber-300 mb-1">Sanctuary Hearth</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Rest by the ancient warmth of the sanctuary hearth. Fully restores party Hit Points and Mana.
                </p>
                <button className="fantasy-btn bg-amber-500/20 text-amber-200 border-amber-500/50 hover:bg-amber-500/30">
                  <Flame className="w-4 h-4 text-amber-400" /> Long Rest & Replenish (0 Gold)
                </button>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <h3 className="font-cinzel font-bold text-amber-300 mb-2">Expedition Rumors & Bounties</h3>
                <div className="space-y-2">
                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">The Sunken Shrine of Eloria</h4>
                      <p className="text-[11px] text-slate-400">Located northeast at Hex (2, -2). High relic energy detected.</p>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-2 py-1 rounded border border-emerald-800">
                      Tier 1
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">Crypt of the Howling King</h4>
                      <p className="text-[11px] text-slate-400">Subterranean tomb at Hex (-3, 2). Undead restless.</p>
                    </div>
                    <span className="text-[10px] text-rose-400 font-mono bg-rose-950/60 px-2 py-1 rounded border border-rose-800">
                      Tier 3 Dungeon
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "WORKSHOP" && (
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
              <h3 className="font-cinzel font-bold text-amber-300">Expedition Armorer</h3>
              <p className="text-xs text-slate-400">Craft and reinforce weapon artifacts discovered across the realm.</p>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                  <span className="text-xs font-bold text-slate-200">Runic Broadsword</span>
                  <p className="text-[11px] text-slate-400 mt-1">+18 Physical ATK, +5 Bleed</p>
                  <button className="fantasy-btn mt-3 text-xs w-full">Equip Valeria</button>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                  <span className="text-xs font-bold text-slate-200">Arcane Focus Staff</span>
                  <p className="text-[11px] text-slate-400 mt-1">+24 Spell Power, +15 Max MP</p>
                  <button className="fantasy-btn mt-3 text-xs w-full">Equip Ignis</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "RECRUIT" && (
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
              <h3 className="font-cinzel font-bold text-amber-300">Guild Mercenaries</h3>
              <p className="text-xs text-slate-400">Swap party formations and level up active hero abilities.</p>
            </div>
          )}

          {activeTab === "SETTLEMENT" && (
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
              <h3 className="font-cinzel font-bold text-amber-300">Expand Settlement Territory</h3>
              <p className="text-xs text-slate-400">
                Found watchtowers, trading posts, and fortified walls onto adjacent explored hexes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
