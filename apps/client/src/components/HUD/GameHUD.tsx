import React, { useState } from "react";
import { HexCoord, TileData } from "@webwestmarch/shared";
import { RemotePlayer, ChatMsg, ConnectionStatus } from "../../network/GameClient";
import { PartyStatusWidget } from "./PartyStatusWidget";
import { TileInspectorWidget } from "./TileInspectorWidget";
import { ChatWidget } from "./ChatWidget";
import { EncampmentModal } from "./EncampmentModal";
import { CombatPreviewModal } from "./CombatPreviewModal";
import {
  Compass,
  Map as MapIcon,
  Tent,
  Swords,
  Layers,
  Sparkles,
  Wifi,
  WifiOff,
  Navigation,
} from "lucide-react";

interface GameHUDProps {
  status: ConnectionStatus;
  localPlayer?: RemotePlayer;
  selectedCoord: HexCoord | null;
  selectedTile: TileData | null;
  chatMessages: ChatMsg[];
  onSendMessage: (text: string, channel: "GLOBAL" | "PARTY") => void;
  onCenterPlayer: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  status,
  localPlayer,
  selectedCoord,
  selectedTile,
  chatMessages,
  onSendMessage,
  onCenterPlayer,
}) => {
  const [isEncampmentOpen, setIsEncampmentOpen] = useState(false);
  const [isCombatOpen, setIsCombatOpen] = useState(false);
  const [showControlsHint, setShowControlsHint] = useState(true);

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-4">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pointer-events-auto">
        {/* Title & Server Status */}
        <div className="glass-panel px-4 py-2 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h1 className="font-cinzel text-base font-bold gold-glow-text">
              WebWestmarch
            </h1>
          </div>
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex items-center gap-1.5 text-xs font-mono">
            {status === "CONNECTED" ? (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="pulse-indicator" /> Realm Live
              </span>
            ) : status === "CONNECTING" ? (
              <span className="text-amber-400 animate-pulse">Connecting...</span>
            ) : (
              <span className="flex items-center gap-1 text-rose-400">
                <WifiOff className="w-3.5 h-3.5" /> Standalone / Disconnected
              </span>
            )}
          </div>
        </div>

        {/* Mode Switcher & Quick Navigation */}
        <div className="glass-panel p-1.5 flex items-center gap-1.5">
          <button
            onClick={onCenterPlayer}
            className="fantasy-btn py-1.5 px-3 text-xs"
            title="Center Camera on Party (Spacebar)"
          >
            <Navigation className="w-3.5 h-3.5 text-amber-400" /> Focus Party
          </button>
          <button
            onClick={() => setIsEncampmentOpen(true)}
            className="fantasy-btn py-1.5 px-3 text-xs"
          >
            <Tent className="w-3.5 h-3.5 text-yellow-400" /> Sanctuary Camp
          </button>
          <button
            onClick={() => setIsCombatOpen(true)}
            className="fantasy-btn py-1.5 px-3 text-xs"
          >
            <Swords className="w-3.5 h-3.5 text-rose-400" /> Tactical Arena
          </button>
        </div>
      </div>

      {/* Center Notification / Controls Banner */}
      {showControlsHint && (
        <div className="self-center glass-panel px-4 py-1.5 flex items-center gap-4 text-xs text-slate-300 pointer-events-auto border-amber-500/20">
          <span>
            🗺️ <strong>Explore</strong>: Click adjacent hex or use <strong>Q / W / E / A / S / D</strong> keys. Drag mouse to pan. Scroll to zoom.
          </span>
          <button
            onClick={() => setShowControlsHint(false)}
            className="text-slate-400 hover:text-slate-200 font-mono text-[10px]"
          >
            [dismiss]
          </button>
        </div>
      )}

      {/* Bottom Interface Bar: Party, Tile Inspector, Chat */}
      <div className="flex items-end justify-between gap-4">
        {/* Left Side: Party Health & Roles */}
        <div className="flex flex-col gap-2">
          <PartyStatusWidget player={localPlayer} />
        </div>

        {/* Middle: Selected Tile Inspector */}
        <div className="flex flex-col items-center">
          <TileInspectorWidget
            coord={selectedCoord}
            tileData={selectedTile}
            onEnterEncounter={() => setIsCombatOpen(true)}
            onOpenEncampment={() => setIsEncampmentOpen(true)}
          />
        </div>

        {/* Right Side: Chat System */}
        <div className="flex flex-col items-end">
          <ChatWidget messages={chatMessages} onSendMessage={onSendMessage} />
        </div>
      </div>

      {/* Encampment & Combat Modals */}
      <EncampmentModal isOpen={isEncampmentOpen} onClose={() => setIsEncampmentOpen(false)} />
      <CombatPreviewModal
        isOpen={isCombatOpen}
        onClose={() => setIsCombatOpen(false)}
        player={localPlayer}
      />
    </div>
  );
};
