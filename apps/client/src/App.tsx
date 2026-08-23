import React, { useEffect, useRef, useState } from "react";
import {
  HexCoord,
  TileData,
  WorldChunkGenerator,
  GAME_CONFIG,
} from "@webwestmarch/shared";
import {
  GameNetworkClient,
  RemotePlayer,
  ChatMsg,
  ConnectionStatus,
} from "./network/GameClient";
import { HexRenderer } from "./engine/HexRenderer";
import { InputController } from "./engine/InputController";
import { GameHUD } from "./components/HUD/GameHUD";

export const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<HexRenderer | null>(null);
  const inputRef = useRef<InputController | null>(null);

  const [worldGen] = useState(() => new WorldChunkGenerator(GAME_CONFIG.worldSeed));
  const [netClient] = useState(() => GameNetworkClient.getInstance());

  const [status, setStatus] = useState<ConnectionStatus>("DISCONNECTED");
  const [players, setPlayers] = useState<Map<string, RemotePlayer>>(new Map());
  const [localPlayer, setLocalPlayer] = useState<RemotePlayer | undefined>(undefined);
  const [selectedCoord, setSelectedCoord] = useState<HexCoord | null>({ q: 0, r: 0 });
  const [selectedTile, setSelectedTile] = useState<TileData | null>(() => worldGen.getTile({ q: 0, r: 0 }));
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);

  useEffect(() => {
    let isMounted = true;

    const initEngine = async () => {
      if (!containerRef.current || rendererRef.current) return;

      const renderer = new HexRenderer(worldGen);
      await renderer.init(containerRef.current);
      rendererRef.current = renderer;

      const input = new InputController(renderer, netClient, renderer.app.canvas);
      input.onTileSelected = (hex) => {
        if (!isMounted) return;
        setSelectedCoord(hex);
        setSelectedTile(worldGen.getTile(hex));
      };
      inputRef.current = input;

      // Network Event Listeners
      netClient.onStatusChange = (newStatus) => {
        if (isMounted) setStatus(newStatus);
      };

      netClient.onPlayersUpdate = (updatedPlayers) => {
        if (!isMounted) return;
        setPlayers(updatedPlayers);
        const local = netClient.getLocalPlayer();
        setLocalPlayer(local);

        if (rendererRef.current) {
          rendererRef.current.updateTokens(updatedPlayers, netClient.localSessionId);
        }
      };

      netClient.onChatReceived = (msg) => {
        if (!isMounted) return;
        setChatMessages((prev) => [...prev, msg]);
      };

      netClient.onDeltaUpdated = (delta) => {
        worldGen.registerDelta(delta);
        const coord = { q: parseInt(delta.coordKey.split(",")[0], 10), r: parseInt(delta.coordKey.split(",")[1], 10) };
        renderer.refreshSurroundingTerrain(coord, 2);
      };

      // Connect to multiplayer server
      await netClient.connect(`Expedition Party #${Math.floor(100 + Math.random() * 900)}`);
    };

    initEngine();

    return () => {
      isMounted = false;
      if (rendererRef.current) {
        rendererRef.current.destroy();
        rendererRef.current = null;
      }
    };
  }, [worldGen, netClient]);

  const handleSendMessage = (text: string, channel: "GLOBAL" | "PARTY") => {
    netClient.sendChat(text, channel);
  };

  const handleCenterPlayer = () => {
    if (localPlayer && rendererRef.current) {
      rendererRef.current.centerOnHex({ q: localPlayer.q, r: localPlayer.r });
    } else if (rendererRef.current) {
      rendererRef.current.centerOnHex({ q: 0, r: 0 });
    }
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950">
      {/* PixiJS Canvas Container */}
      <div ref={containerRef} className="game-viewport" />

      {/* React Glassmorphism Game HUD */}
      <GameHUD
        status={status}
        localPlayer={localPlayer}
        selectedCoord={selectedCoord}
        selectedTile={selectedTile}
        chatMessages={chatMessages}
        onSendMessage={handleSendMessage}
        onCenterPlayer={handleCenterPlayer}
      />
    </main>
  );
};
export default App;
