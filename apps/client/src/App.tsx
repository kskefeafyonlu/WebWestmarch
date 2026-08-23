import React, { useState, useEffect } from "react";
import {
  GameNetworkClient,
  RemotePlayer,
  ChatMsg,
  ConnectionStatus,
} from "./network/GameClient";
import {
  Shield,
  Sparkles,
  Crosshair,
  Heart,
  Users,
  MessageSquare,
  Send,
  Wifi,
  WifiOff,
  Flame,
  CheckCircle2,
  Clock,
  Compass,
  Scroll,
  LogIn,
  AlertTriangle,
  RefreshCw,
  Edit2,
} from "lucide-react";

const HERO_ROLES = [
  {
    id: "WARRIOR",
    name: "Vanguard Knight",
    icon: <Shield className="w-5 h-5 text-amber-400" />,
    color: "from-amber-600/30 to-amber-900/30 border-amber-500/40 text-amber-300",
    desc: "Heavy armor specialist with defensive taunts and cleaving strikes.",
    baseHp: 140,
    baseMp: 30,
  },
  {
    id: "MAGE",
    name: "Arcane Pyromancer",
    icon: <Sparkles className="w-5 h-5 text-purple-400" />,
    color: "from-purple-600/30 to-purple-900/30 border-purple-500/40 text-purple-300",
    desc: "Wields destructive elemental magic to annihilate enemy formations.",
    baseHp: 75,
    baseMp: 120,
  },
  {
    id: "RANGER",
    name: "Shadow Scout",
    icon: <Crosshair className="w-5 h-5 text-emerald-400" />,
    color: "from-emerald-600/30 to-emerald-900/30 border-emerald-500/40 text-emerald-300",
    desc: "Master of long-range precision and traps in the deep wilderness.",
    baseHp: 95,
    baseMp: 60,
  },
  {
    id: "CLERIC",
    name: "Dawn Templar",
    icon: <Heart className="w-5 h-5 text-rose-400" />,
    color: "from-rose-600/30 to-rose-900/30 border-rose-500/40 text-rose-300",
    desc: "Channels radiant blessings to mend party wounds and purge curses.",
    baseHp: 105,
    baseMp: 100,
  },
];

export const App: React.FC = () => {
  const [netClient] = useState(() => GameNetworkClient.getInstance());
  const [status, setStatus] = useState<ConnectionStatus>("DISCONNECTED");
  const [players, setPlayers] = useState<Map<string, RemotePlayer>>(new Map());
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);

  // Lobby Profile State
  const [hasJoinedLobby, setHasJoinedLobby] = useState(false);
  const [inputName, setInputName] = useState("");
  const [selectedRole, setSelectedRole] = useState("WARRIOR");
  const [isReady, setIsReady] = useState(false);

  // Server URL editor
  const [serverUrlInput, setServerUrlInput] = useState(netClient.serverUrl);
  const [isEditingServerUrl, setIsEditingServerUrl] = useState(false);

  // Chat State
  const [chatInput, setChatInput] = useState("");
  const [activeChannel, setActiveChannel] = useState<"GLOBAL" | "PARTY">("GLOBAL");

  useEffect(() => {
    let isMounted = true;

    netClient.onStatusChange = (newStatus) => {
      if (isMounted) setStatus(newStatus);
    };

    netClient.onPlayersUpdate = (updatedPlayers) => {
      if (!isMounted) return;
      setPlayers(updatedPlayers);
    };

    netClient.onChatReceived = (msg) => {
      if (!isMounted) return;
      setChatMessages((prev) => [...prev, msg]);
    };

    return () => {
      isMounted = false;
    };
  }, [netClient]);

  const handleJoinLobby = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = inputName.trim() || `Adventurer #${Math.floor(100 + Math.random() * 900)}`;
    setHasJoinedLobby(true);
    await netClient.connect(finalName);
  };

  const handleSaveServerUrl = () => {
    netClient.setServerUrl(serverUrlInput);
    setIsEditingServerUrl(false);
    if (hasJoinedLobby) {
      netClient.connect(inputName || "Adventurer");
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    netClient.sendChat(chatInput.trim(), activeChannel);
    setChatInput("");
  };

  const playerList = Array.from(players.values());
  const localPlayer = netClient.getLocalPlayer();

  return (
    <div className="w-screen h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden font-sans select-none">
      {/* Top Header Bar */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shadow-md shadow-amber-500/20">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-cinzel text-lg font-bold gold-glow-text leading-tight">
              WebWestmarch
            </h1>
            <p className="text-[11px] text-slate-400 tracking-wider">
              Multiplayer Gathering Hall & Lobby
            </p>
          </div>
        </div>

        {/* Server & Status Indicator */}
        <div className="flex items-center gap-3">
          {isEditingServerUrl ? (
            <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-700 text-xs">
              <input
                type="text"
                value={serverUrlInput}
                onChange={(e) => setServerUrlInput(e.target.value)}
                placeholder="ws://localhost:2567"
                className="bg-transparent text-slate-200 px-2 py-0.5 outline-none font-mono text-xs w-56"
              />
              <button
                onClick={handleSaveServerUrl}
                className="fantasy-btn py-0.5 px-2 text-[11px] bg-amber-500/20 text-amber-300"
              >
                Connect
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingServerUrl(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-[11px] font-mono text-slate-400 transition-colors"
              title="Click to edit game server WebSocket URL"
            >
              <span>{netClient.serverUrl}</span>
              <Edit2 className="w-3 h-3 text-slate-500" />
            </button>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono">
            {status === "CONNECTED" ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="pulse-indicator" /> Lobby Live
              </span>
            ) : status === "CONNECTING" ? (
              <span className="text-amber-400 animate-pulse flex items-center gap-1.5 font-semibold">
                <Clock className="w-3.5 h-3.5" /> Connecting...
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" /> Offline Mode
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Connection Notice Banner if Server Unreachable */}
      {status === "ERROR" && (
        <div className="bg-amber-950/60 border-b border-amber-800/60 px-6 py-2 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              <strong>Notice</strong>: Game server at <code>{netClient.serverUrl}</code> is offline. Running in local preview mode. (Deploy to Fly.io to connect players across the internet).
            </span>
          </div>
          <button
            onClick={() => netClient.connect(inputName || "Adventurer")}
            className="flex items-center gap-1 font-mono text-[11px] text-amber-400 hover:text-amber-200 underline"
          >
            <RefreshCw className="w-3 h-3" /> Retry Connection
          </button>
        </div>
      )}

      {/* Main Content Body */}
      {!hasJoinedLobby ? (
        /* Welcome / Name Entry View */
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg p-8 border-amber-500/30 flex flex-col gap-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="text-center flex flex-col items-center gap-2">
              <div className="p-3 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 mb-1">
                <Flame className="w-8 h-8" />
              </div>
              <h2 className="font-cinzel text-2xl font-bold text-amber-200">
                Enter Haven's Sanctuary
              </h2>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Join the gathering hall to form adventuring parties, prepare tactical builds, and coordinate expeditions.
              </p>
            </div>

            <form onSubmit={handleJoinLobby} className="flex flex-col gap-5">
              {/* Adventurer Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-400" /> Adventurer / Party Name
                </label>
                <input
                  type="text"
                  autoFocus
                  maxLength={24}
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  placeholder="e.g. Valeria Ironheart"
                  className="bg-slate-900/90 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors font-medium"
                />
              </div>

              {/* Class Role Picker */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-300">
                  Select Starting Role
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {HERO_ROLES.map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRole(role.id)}
                      className={`p-3 rounded-xl border flex items-center gap-3 transition-all text-left ${
                        selectedRole === role.id
                          ? `bg-gradient-to-br ${role.color} ring-1 ring-amber-400/50 scale-[1.02]`
                          : "bg-slate-900/40 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:bg-slate-900/70"
                      }`}
                    >
                      <div className="flex-shrink-0">{role.icon}</div>
                      <div>
                        <span className="font-semibold text-xs text-slate-200 block">
                          {role.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {role.baseHp} HP • {role.baseMp} MP
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="fantasy-btn py-3 px-6 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-medium text-sm rounded-xl shadow-lg shadow-amber-900/30 flex items-center justify-center gap-2 mt-2"
              >
                <LogIn className="w-4 h-4" /> Enter Gathering Hall
              </button>
            </form>
          </div>
        </main>
      ) : (
        /* Active Multiplayer Lobby Room */
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 overflow-hidden">
          {/* Left Column: Local Player Card & Expedition Status */}
          <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto">
            {/* Player Profile Card */}
            <div className="glass-panel p-5 flex flex-col gap-4 border-amber-500/30">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/20 shadow-md"
                    style={{ backgroundColor: localPlayer?.color || "#38bdf8" }}
                  >
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-cinzel font-bold text-sm text-amber-200">
                      {localPlayer?.name || inputName || "Adventurer"}
                    </h2>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Level 1 • Expedition Leader
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                  YOU
                </span>
              </div>

              {/* Party Member Breakdown */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300 block">
                  Active Party Roster
                </span>
                {localPlayer?.members?.map((m) => (
                  <div
                    key={m.id}
                    className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="font-medium text-slate-200">{m.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({m.classRole})</span>
                    </div>
                    <span className="text-[10px] font-mono text-rose-300">
                      {m.currentHp}/{m.maxHp} HP
                    </span>
                  </div>
                ))}
              </div>

              {/* Ready Status Toggle */}
              <button
                onClick={() => setIsReady(!isReady)}
                className={`fantasy-btn py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  isReady
                    ? "bg-gradient-to-r from-emerald-600 to-emerald-700 border-emerald-500 text-white shadow-lg shadow-emerald-900/30"
                    : "bg-slate-900/80 border-slate-700 hover:border-amber-500/60 text-slate-200"
                }`}
              >
                {isReady ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-300" /> Ready for Expedition
                  </>
                ) : (
                  <>
                    <Clock className="w-5 h-5 text-slate-400" /> Click to Ready Up
                  </>
                )}
              </button>
            </div>

            {/* Expedition Notice Board */}
            <div className="glass-panel p-4 flex flex-col gap-3 flex-1">
              <div className="flex items-center gap-2 text-xs font-cinzel font-bold text-amber-300 border-b border-slate-800 pb-2">
                <Scroll className="w-4 h-4 text-amber-400" /> Active Realm Bounties
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800/80">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-slate-200">The Sunken Shrine of Eloria</span>
                    <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800">
                      Tier 1
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Ancient relic altar pulsing northeast of Haven's sanctuary.
                  </p>
                </div>

                <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800/80">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-slate-200">Crypt of the Howling King</span>
                    <span className="text-[10px] text-rose-400 font-mono bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800">
                      Tier 3 Dungeon
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Subterranean crypt harboring restless undead. High danger.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Center Column: Live Connected Adventurers in Lobby */}
          <div className="lg:col-span-4 glass-panel p-4 flex flex-col gap-3 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <h3 className="font-cinzel text-xs font-bold text-slate-200">
                  Gathering Hall Adventurers
                </h3>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 font-semibold">
                {playerList.length} Online
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {playerList.length === 0 ? (
                <div className="text-center text-slate-500 text-xs py-8 italic">
                  Connecting to realm server...
                </div>
              ) : (
                playerList.map((p) => {
                  const isLocal = p.id === netClient.localSessionId;

                  return (
                    <div
                      key={p.id}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                        isLocal
                          ? "bg-amber-500/10 border-amber-500/30"
                          : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/20 shadow-sm"
                          style={{ backgroundColor: p.color }}
                        >
                          <Shield className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-xs text-slate-100">
                              {p.name}
                            </span>
                            {isLocal && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                                YOU
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            4 Party Members • Level 1
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          Ready
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Real-Time Realm & Lobby Chat */}
          <div className="lg:col-span-4 glass-panel flex flex-col overflow-hidden">
            <div className="p-3 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <span className="font-cinzel text-xs font-bold text-slate-200">
                  Tavern Chronicle Chat
                </span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveChannel("GLOBAL")}
                  className={`text-[11px] px-2.5 py-0.5 rounded transition-colors ${
                    activeChannel === "GLOBAL"
                      ? "bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Realm
                </button>
                <button
                  onClick={() => setActiveChannel("PARTY")}
                  className={`text-[11px] px-2.5 py-0.5 rounded transition-colors ${
                    activeChannel === "PARTY"
                      ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Party
                </button>
              </div>
            </div>

            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 text-xs font-sans">
              {chatMessages.length === 0 ? (
                <div className="text-slate-500 italic text-[11px] py-4 text-center">
                  Welcome to the gathering hall. Chat with fellow adventurers!
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const timeStr = new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  if (msg.channel === "SYSTEM") {
                    return (
                      <div
                        key={msg.id}
                        className="p-2 rounded-lg bg-amber-950/30 border border-amber-800/40 text-amber-300/90 text-[11px] italic"
                      >
                        🔔 <strong>[Chronicle]</strong> {msg.content}
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id} className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500 font-mono">{timeStr}</span>
                        <span
                          className={`font-semibold ${
                            msg.channel === "PARTY" ? "text-cyan-400" : "text-amber-300"
                          }`}
                        >
                          {msg.senderName}
                        </span>
                      </div>
                      <p className="text-slate-200 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80 break-words">
                        {msg.content}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-900/40 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={`Message ${activeChannel.toLowerCase()}...`}
                className="flex-1 bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400/60"
              />
              <button
                type="submit"
                className="fantasy-btn py-2 px-3.5 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 rounded-xl"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </main>
      )}
    </div>
  );
};
export default App;
