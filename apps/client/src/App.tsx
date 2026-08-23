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
  Check,
} from "lucide-react";

const HERO_ROLES = [
  {
    id: "WARRIOR",
    name: "Vanguard Knight",
    icon: <Shield className="w-5 h-5 text-amber-400" />,
    desc: "Heavy armor tank with cleaving strikes.",
    baseHp: 140,
    baseMp: 30,
  },
  {
    id: "MAGE",
    name: "Arcane Pyromancer",
    icon: <Sparkles className="w-5 h-5 text-purple-400" />,
    desc: "Destructive elemental spellcaster.",
    baseHp: 75,
    baseMp: 120,
  },
  {
    id: "RANGER",
    name: "Shadow Scout",
    icon: <Crosshair className="w-5 h-5 text-emerald-400" />,
    desc: "Wilderness archer and scout.",
    baseHp: 95,
    baseMp: 60,
  },
  {
    id: "CLERIC",
    name: "Dawn Templar",
    icon: <Heart className="w-5 h-5 text-rose-400" />,
    desc: "Radiant healer and protector.",
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
    <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#070a12", color: "#f8fafc" }}>
      {/* Top Header Bar */}
      <header className="lobby-header">
        <div className="brand-wrapper">
          <div className="brand-icon">
            <Compass style={{ width: 24, height: 24 }} />
          </div>
          <div>
            <h1 className="font-cinzel gold-glow-text" style={{ fontSize: 18, fontWeight: "bold", margin: 0 }}>
              WebWestmarch
            </h1>
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
              Multiplayer Gathering Hall & Lobby
            </p>
          </div>
        </div>

        {/* Server URL & Status Indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {isEditingServerUrl ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(15,23,42,0.9)", padding: "4px 8px", borderRadius: 8, border: "1px solid var(--border-gold)" }}>
              <input
                type="text"
                value={serverUrlInput}
                onChange={(e) => setServerUrlInput(e.target.value)}
                placeholder="wss://webwestmarch.fly.dev"
                className="fantasy-input"
                style={{ width: 230, padding: "4px 8px", fontSize: 11 }}
              />
              <button onClick={handleSaveServerUrl} className="fantasy-btn fantasy-btn-primary" style={{ padding: "4px 10px", fontSize: 11 }}>
                <Check style={{ width: 14, height: 14 }} /> Connect
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingServerUrl(true)}
              className="card-item"
              style={{ padding: "6px 12px", display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 11, fontFamily: "var(--font-mono)" }}
              title="Click to edit server WebSocket URL"
            >
              <span style={{ color: "var(--text-muted)" }}>Server:</span>
              <strong style={{ color: "var(--accent-gold)" }}>{netClient.serverUrl}</strong>
              <Edit2 style={{ width: 12, height: 12, opacity: 0.7 }} />
            </button>
          )}

          <div className="status-pill">
            {status === "CONNECTED" ? (
              <span style={{ color: "var(--accent-emerald)", display: "flex", alignItems: "center", gap: 6 }}>
                <span className="pulse-indicator" /> Realm Live
              </span>
            ) : status === "CONNECTING" ? (
              <span style={{ color: "var(--accent-gold)", display: "flex", alignItems: "center", gap: 6 }}>
                <Clock style={{ width: 14, height: 14 }} /> Connecting...
              </span>
            ) : (
              <span style={{ color: "var(--accent-gold)", display: "flex", alignItems: "center", gap: 6 }}>
                <AlertTriangle style={{ width: 14, height: 14 }} /> Offline Preview
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Notice Banner when offline */}
      {status === "ERROR" && (
        <div className="notice-banner">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <AlertTriangle style={{ width: 16, height: 16, color: "var(--accent-gold)" }} />
            <span>
              Could not reach WebSocket at <code>{netClient.serverUrl}</code>. (Make sure URL is <code>wss://webwestmarch.fly.dev</code> without <code>-server</code>).
            </span>
          </div>
          <button
            onClick={() => {
              netClient.setServerUrl("wss://webwestmarch.fly.dev");
              setServerUrlInput("wss://webwestmarch.fly.dev");
              netClient.connect(inputName || "Adventurer");
            }}
            style={{ background: "none", border: "none", color: "var(--accent-gold)", cursor: "pointer", textDecoration: "underline", fontWeight: "bold", fontSize: 11 }}
          >
            Switch to wss://webwestmarch.fly.dev
          </button>
        </div>
      )}

      {/* Main Content Body */}
      {!hasJoinedLobby ? (
        /* Welcome / Name Entry View */
        <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="glass-panel" style={{ width: "100%", maxWidth: 480, padding: 32, display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{ padding: 12, borderRadius: "50%", background: "rgba(245, 158, 11, 0.2)", border: "1px solid var(--border-gold)", color: "var(--accent-gold)", display: "flex" }}>
                <Flame style={{ width: 32, height: 32 }} />
              </div>
              <h2 className="font-cinzel gold-glow-text" style={{ fontSize: 24, margin: 0 }}>
                Enter Haven's Sanctuary
              </h2>
              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
                Choose your Adventurer Name and Starting Class Role to join the live gathering hall.
              </p>
            </div>

            <form onSubmit={handleJoinLobby} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-main)", display: "flex", alignItems: "center", gap: 6 }}>
                  <Shield style={{ width: 14, height: 14, color: "var(--accent-gold)" }} /> Adventurer Name
                </label>
                <input
                  type="text"
                  autoFocus
                  maxLength={24}
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  placeholder="e.g. Valeria Ironheart"
                  className="fantasy-input"
                  style={{ padding: 12, fontSize: 14 }}
                />
              </div>

              {/* Class Role Picker */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-main)" }}>
                  Select Starting Class
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {HERO_ROLES.map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRole(role.id)}
                      className="card-item"
                      style={{
                        padding: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        cursor: "pointer",
                        borderColor: selectedRole === role.id ? "var(--accent-gold)" : "var(--border-subtle)",
                        background: selectedRole === role.id ? "rgba(245, 158, 11, 0.15)" : "var(--bg-card)",
                      }}
                    >
                      {role.icon}
                      <div style={{ textAlign: "left" }}>
                        <span style={{ fontSize: 12, fontWeight: "bold", display: "block", color: selectedRole === role.id ? "var(--text-gold)" : "var(--text-main)" }}>
                          {role.name}
                        </span>
                        <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                          {role.baseHp} HP • {role.baseMp} MP
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button type="submit" className="fantasy-btn fantasy-btn-primary" style={{ padding: 14, fontSize: 14 }}>
                <LogIn style={{ width: 16, height: 16 }} /> Enter Gathering Hall
              </button>
            </form>
          </div>
        </main>
      ) : (
        /* Active Multiplayer Lobby Room */
        <main className="lobby-layout">
          {/* Left Column: Your Profile & Party Status */}
          <div className="lobby-col">
            <div className="glass-panel" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", pb: 12, paddingBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: localPlayer?.color || "#38bdf8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px solid #fff",
                    }}
                  >
                    <Shield style={{ width: 20, height: 20, color: "#fff" }} />
                  </div>
                  <div>
                    <h2 className="font-cinzel" style={{ fontSize: 15, fontWeight: "bold", color: "var(--text-gold)", margin: 0 }}>
                      {localPlayer?.name || inputName || "Adventurer"}
                    </h2>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                      Level 1 • Party Leader
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", padding: "2px 8px", borderRadius: 4, background: "rgba(245,158,11,0.2)", color: "var(--text-gold)", fontWeight: "bold", border: "1px solid var(--border-gold)" }}>
                  YOU
                </span>
              </div>

              {/* Party Members Roster */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-main)" }}>
                  Active Party Members
                </span>
                {localPlayer?.members?.map((m) => (
                  <div key={m.id} className="card-item" style={{ padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-emerald)" }} />
                      <strong style={{ color: "var(--text-main)" }}>{m.name}</strong>
                      <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>({m.classRole})</span>
                    </div>
                    <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--accent-rose)" }}>
                      {m.currentHp}/{m.maxHp} HP
                    </span>
                  </div>
                ))}
              </div>

              {/* Ready Up Button */}
              <button
                onClick={() => setIsReady(!isReady)}
                className={`fantasy-btn ${isReady ? "fantasy-btn-ready" : "fantasy-btn-primary"}`}
                style={{ width: "100%", padding: 12, fontSize: 13 }}
              >
                {isReady ? (
                  <>
                    <CheckCircle2 style={{ width: 16, height: 16 }} /> Ready for Expedition
                  </>
                ) : (
                  <>
                    <Clock style={{ width: 16, height: 16 }} /> Click to Ready Up
                  </>
                )}
              </button>
            </div>

            {/* Bounties Notice Board */}
            <div className="glass-panel" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: "bold", color: "var(--text-gold)", borderBottom: "1px solid var(--border-subtle)", paddingBottom: 8 }}>
                <Scroll style={{ width: 16, height: 16 }} /> Expedition Bounties
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div className="card-item" style={{ fontSize: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <strong style={{ color: "var(--text-main)" }}>Sunken Shrine of Eloria</strong>
                    <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--accent-emerald)" }}>Tier 1</span>
                  </div>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
                    Ancient marble shrine humming with forgotten divine relics.
                  </p>
                </div>
                <div className="card-item" style={{ fontSize: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <strong style={{ color: "var(--text-main)" }}>Crypt of the Howling King</strong>
                    <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--accent-rose)" }}>Tier 3 Dungeon</span>
                  </div>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
                    Subterranean crypt harboring skeletal raiders.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Center Column: Live Adventurers in Room */}
          <div className="lobby-col glass-panel" style={{ padding: 18, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Users style={{ width: 18, height: 18, color: "var(--accent-cyan)" }} />
                <h3 className="font-cinzel" style={{ fontSize: 14, fontWeight: "bold", margin: 0 }}>
                  Gathering Hall Adventurers
                </h3>
              </div>
              <span className="status-pill" style={{ color: "var(--accent-emerald)" }}>
                {playerList.length} Online
              </span>
            </div>

            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, paddingRight: 4 }}>
              {playerList.length === 0 ? (
                <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, padding: 32, fontStyle: "italic" }}>
                  Connecting to realm server...
                </div>
              ) : (
                playerList.map((p) => {
                  const isLocal = p.id === netClient.localSessionId;

                  return (
                    <div key={p.id} className={`player-list-item ${isLocal ? "is-local" : ""}`}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            backgroundColor: p.color,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "1.5px solid #fff",
                          }}
                        >
                          <Shield style={{ width: 18, height: 18, color: "#fff" }} />
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <strong style={{ fontSize: 13, color: isLocal ? "var(--text-gold)" : "var(--text-main)" }}>
                              {p.name}
                            </strong>
                            {isLocal && (
                              <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", padding: "1px 6px", borderRadius: 3, background: "rgba(245,158,11,0.2)", color: "var(--text-gold)", fontWeight: "bold", border: "1px solid var(--border-gold)" }}>
                                YOU
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                            4 Heroes • Ready for Frontier
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--accent-emerald)", fontFamily: "var(--font-mono)" }}>
                        <span className="pulse-indicator" /> Ready
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Real-Time Tavern Chat */}
          <div className="lobby-col glass-panel" style={{ overflow: "hidden" }}>
            <div style={{ padding: 14, borderBottom: "1px solid var(--border-subtle)", background: "rgba(15,23,42,0.6)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <MessageSquare style={{ width: 16, height: 16, color: "var(--accent-gold)" }} />
                <span className="font-cinzel" style={{ fontSize: 13, fontWeight: "bold" }}>
                  Tavern Chronicle Chat
                </span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => setActiveChannel("GLOBAL")}
                  style={{
                    padding: "3px 8px",
                    borderRadius: 4,
                    fontSize: 11,
                    cursor: "pointer",
                    border: "1px solid",
                    borderColor: activeChannel === "GLOBAL" ? "var(--accent-gold)" : "transparent",
                    background: activeChannel === "GLOBAL" ? "rgba(245,158,11,0.2)" : "transparent",
                    color: activeChannel === "GLOBAL" ? "var(--text-gold)" : "var(--text-muted)",
                  }}
                >
                  Realm
                </button>
                <button
                  onClick={() => setActiveChannel("PARTY")}
                  style={{
                    padding: "3px 8px",
                    borderRadius: 4,
                    fontSize: 11,
                    cursor: "pointer",
                    border: "1px solid",
                    borderColor: activeChannel === "PARTY" ? "var(--accent-cyan)" : "transparent",
                    background: activeChannel === "PARTY" ? "rgba(56,189,248,0.2)" : "transparent",
                    color: activeChannel === "PARTY" ? "var(--accent-cyan)" : "var(--text-muted)",
                  }}
                >
                  Party
                </button>
              </div>
            </div>

            {/* Messages Feed */}
            <div className="chat-messages-box">
              {chatMessages.map((msg) => {
                const timeStr = new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                if (msg.channel === "SYSTEM") {
                  return (
                    <div key={msg.id} style={{ background: "rgba(120,53,15,0.25)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8, padding: "8px 10px", fontSize: 11, color: "#fde68a", fontStyle: "italic" }}>
                      🔔 <strong>[Chronicle]</strong> {msg.content}
                    </div>
                  );
                }

                return (
                  <div key={msg.id} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{timeStr}</span>
                      <strong style={{ fontSize: 12, color: msg.channel === "PARTY" ? "var(--accent-cyan)" : "var(--text-gold)" }}>
                        {msg.senderName}:
                      </strong>
                    </div>
                    <div className="chat-bubble">
                      {msg.content}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="chat-input-row">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={`Message ${activeChannel.toLowerCase()}...`}
                className="fantasy-input"
              />
              <button type="submit" className="fantasy-btn fantasy-btn-primary" style={{ padding: "8px 14px" }}>
                <Send style={{ width: 14, height: 14 }} />
              </button>
            </form>
          </div>
        </main>
      )}
    </div>
  );
};
export default App;
