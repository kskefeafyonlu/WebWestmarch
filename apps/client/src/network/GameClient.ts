import { Client, Room } from "colyseus.js";
import { HexCoord, TileDeltaOverride } from "@webwestmarch/shared";

export type ConnectionStatus = "CONNECTING" | "CONNECTED" | "DISCONNECTED" | "ERROR";

export interface RemotePlayer {
  id: string;
  name: string;
  color: string;
  q: number;
  r: number;
  targetQ: number;
  targetR: number;
  isMoving: boolean;
  members: Array<{
    id: string;
    name: string;
    classRole: string;
    level: number;
    currentHp: number;
    maxHp: number;
    currentMp: number;
    maxMp: number;
  }>;
}

export interface ChatMsg {
  id: string;
  senderId: string;
  senderName: string;
  channel: "GLOBAL" | "PARTY" | "SYSTEM";
  content: string;
  timestamp: number;
}

export class GameNetworkClient {
  private static instance: GameNetworkClient;
  private client: Client;
  public room: Room | null = null;
  public status: ConnectionStatus = "DISCONNECTED";
  public serverUrl: string;

  public onStatusChange?: (status: ConnectionStatus) => void;
  public onPlayersUpdate?: (players: Map<string, RemotePlayer>) => void;
  public onChatReceived?: (msg: ChatMsg) => void;
  public onDeltaUpdated?: (delta: TileDeltaOverride) => void;
  public errorMessage: string = "";

  public players: Map<string, RemotePlayer> = new Map();
  public localSessionId: string | null = null;

  private constructor() {
    this.serverUrl = import.meta.env.VITE_SERVER_URL || "wss://webwestmarch.fly.dev";
    this.client = new Client(this.serverUrl);
  }

  public static getInstance(): GameNetworkClient {
    if (!GameNetworkClient.instance) {
      GameNetworkClient.instance = new GameNetworkClient();
    }
    return GameNetworkClient.instance;
  }

  public setServerUrl(newUrl: string): void {
    this.serverUrl = newUrl;
    this.client = new Client(newUrl);
  }

  public async connect(playerName: string = "Wanderer"): Promise<void> {
    try {
      this.setStatus("CONNECTING");
      this.errorMessage = "";
      console.log(`[GameClient] Connecting to WebWestmarch server: ${this.serverUrl}...`);

      this.room = await this.client.joinOrCreate("world", { playerName });
      this.localSessionId = this.room.sessionId;
      this.setStatus("CONNECTED");
      console.log(`[GameClient] Joined room: ${this.room.id} as session: ${this.localSessionId}`);

      // 1. Dedicated player list message broadcast listener
      this.room.onMessage("player_list_update", (data: { players: RemotePlayer[] }) => {
        this.players.clear();
        if (data && Array.isArray(data.players)) {
          for (const p of data.players) {
            this.players.set(p.id, p);
          }
        }
        this.notifyPlayersUpdate();
      });

      // 2. Request current player list immediately upon connection
      this.room.send("get_players");

      // 3. Immediate direct message listener for fast broadcast delivery
      this.room.onMessage("chat_message", (msg: ChatMsg) => {
        this.onChatReceived?.(msg);
      });

      // 3. Fallback schema callbacks
      if (this.room.state?.players?.onAdd) {
        this.room.state.players.onAdd((player: any, key: string) => {
          this.updatePlayerFromSchema(key, player);
          if (typeof player.onChange === "function") {
            player.onChange(() => this.updatePlayerFromSchema(key, player));
          }
        });
      }

      if (this.room.state?.players?.onRemove) {
        this.room.state.players.onRemove((_player: any, key: string) => {
          this.players.delete(key);
          this.notifyPlayersUpdate();
        });
      }

      this.room.onLeave((code) => {
        console.log("[GameClient] Left room with code:", code);
        this.setStatus("DISCONNECTED");
      });
    } catch (err: any) {
      console.error("[GameClient] Connection failed:", err);
      this.errorMessage = err?.message || "Failed to establish WebSocket connection.";
      this.setStatus("ERROR");

      // Local fallback profile
      this.createLocalFallbackPlayer(playerName);
    }
  }

  private createLocalFallbackPlayer(playerName: string): void {
    const localId = `local_${Math.random().toString(36).substring(2, 7)}`;
    this.localSessionId = localId;
    this.players.clear();

    this.players.set(localId, {
      id: localId,
      name: playerName,
      color: "#38bdf8",
      q: 0,
      r: 0,
      targetQ: 0,
      targetR: 0,
      isMoving: false,
      members: [
        { id: "1", name: "Valeria", classRole: "WARRIOR", level: 1, currentHp: 120, maxHp: 120, currentMp: 30, maxMp: 30 },
        { id: "2", name: "Ignis", classRole: "MAGE", level: 1, currentHp: 70, maxHp: 70, currentMp: 110, maxMp: 110 },
        { id: "3", name: "Sylas", classRole: "RANGER", level: 1, currentHp: 85, maxHp: 85, currentMp: 60, maxMp: 60 },
        { id: "4", name: "Lyra", classRole: "CLERIC", level: 1, currentHp: 90, maxHp: 90, currentMp: 95, maxMp: 95 },
      ],
    });

    this.notifyPlayersUpdate();
  }

  private updatePlayerFromSchema(key: string, schema: any): void {
    const members: any[] = [];
    if (schema.members) {
      schema.members.forEach((m: any) => {
        members.push({
          id: m.id,
          name: m.name,
          classRole: m.classRole,
          level: m.level,
          currentHp: m.currentHp,
          maxHp: m.maxHp,
          currentMp: m.currentMp,
          maxMp: m.maxMp,
        });
      });
    }

    this.players.set(key, {
      id: schema.id || key,
      name: schema.name || "Adventurer",
      color: schema.color || "#38bdf8",
      q: schema.q ?? 0,
      r: schema.r ?? 0,
      targetQ: schema.targetQ ?? schema.q ?? 0,
      targetR: schema.targetR ?? schema.r ?? 0,
      isMoving: schema.isMoving ?? false,
      members,
    });
  }

  private notifyPlayersUpdate(): void {
    this.onPlayersUpdate?.(new Map(this.players));
  }

  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    this.onStatusChange?.(status);
  }

  public sendChat(content: string, channel: "GLOBAL" | "PARTY" = "GLOBAL"): void {
    if (this.room && this.status === "CONNECTED") {
      this.room.send("chat", { content, channel });
    } else {
      // Local fallback
      const local = this.getLocalPlayer();
      this.onChatReceived?.({
        id: `msg_${Date.now()}`,
        senderId: this.localSessionId || "me",
        senderName: local?.name || "You",
        channel,
        content,
        timestamp: Date.now(),
      });
    }
  }

  public getLocalPlayer(): RemotePlayer | undefined {
    if (!this.localSessionId) return undefined;
    return this.players.get(this.localSessionId);
  }
}
