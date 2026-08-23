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

  public onStatusChange?: (status: ConnectionStatus) => void;
  public onPlayersUpdate?: (players: Map<string, RemotePlayer>) => void;
  public onChatReceived?: (msg: ChatMsg) => void;
  public onDeltaUpdated?: (delta: TileDeltaOverride) => void;
  public onLandmarkDiscovered?: (event: { playerName: string; landmark: any; coord: HexCoord }) => void;

  public players: Map<string, RemotePlayer> = new Map();
  public localSessionId: string | null = null;

  private constructor() {
    const wsUrl = import.meta.env.VITE_SERVER_URL || "ws://localhost:2567";
    this.client = new Client(wsUrl);
  }

  public static getInstance(): GameNetworkClient {
    if (!GameNetworkClient.instance) {
      GameNetworkClient.instance = new GameNetworkClient();
    }
    return GameNetworkClient.instance;
  }

  public async connect(playerName: string = "Wanderer"): Promise<void> {
    try {
      this.setStatus("CONNECTING");
      console.log("[GameClient] Connecting to WebWestmarch world room...");
      
      this.room = await this.client.joinOrCreate("world", { playerName });
      this.localSessionId = this.room.sessionId;
      this.setStatus("CONNECTED");
      console.log(`[GameClient] Joined room: ${this.room.id} as session: ${this.localSessionId}`);

      // Handle players state changes
      this.room.state.players.onAdd = (player: any, key: string) => {
        this.updatePlayerFromSchema(key, player);
        player.onChange = () => {
          this.updatePlayerFromSchema(key, player);
        };
      };

      this.room.state.players.onRemove = (_player: any, key: string) => {
        this.players.delete(key);
        this.notifyPlayersUpdate();
      };

      // Handle chat messages
      this.room.state.chatHistory.onAdd = (item: any) => {
        const chatMsg: ChatMsg = {
          id: item.id,
          senderId: item.senderId,
          senderName: item.senderName,
          channel: item.channel,
          content: item.content,
          timestamp: item.timestamp,
        };
        this.onChatReceived?.(chatMsg);
      };

      // Handle custom broadcast messages
      this.room.onMessage("landmark_discovered", (data) => {
        this.onLandmarkDiscovered?.(data);
      });

      this.room.onMessage("delta_updated", (data) => {
        this.onDeltaUpdated?.(data.delta);
      });

      this.room.onMessage("error", (err: { message: string }) => {
        console.warn("[GameClient] Server Warning/Error:", err.message);
      });

      this.room.onLeave((code) => {
        console.log("[GameClient] Left room with code:", code);
        this.setStatus("DISCONNECTED");
      });
    } catch (err) {
      console.error("[GameClient] Connection failed:", err);
      this.setStatus("ERROR");
    }
  }

  private updatePlayerFromSchema(key: string, schema: any): void {
    const members: any[] = [];
    if (schema.members) {
      for (const m of schema.members) {
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
      }
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

    this.notifyPlayersUpdate();
  }

  private notifyPlayersUpdate(): void {
    this.onPlayersUpdate?.(new Map(this.players));
  }

  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    this.onStatusChange?.(status);
  }

  public move(targetHex: HexCoord): void {
    if (this.room && this.status === "CONNECTED") {
      this.room.send("move", targetHex);
    }
  }

  public sendChat(content: string, channel: "GLOBAL" | "PARTY" | "SYSTEM" = "GLOBAL"): void {
    if (this.room && this.status === "CONNECTED") {
      this.room.send("chat", { content, channel });
    }
  }

  public addDelta(delta: TileDeltaOverride): void {
    if (this.room && this.status === "CONNECTED") {
      this.room.send("add_delta", delta);
    }
  }

  public getLocalPlayer(): RemotePlayer | undefined {
    if (!this.localSessionId) return undefined;
    return this.players.get(this.localSessionId);
  }
}
