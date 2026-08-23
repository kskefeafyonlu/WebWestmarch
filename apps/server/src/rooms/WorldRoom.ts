import { Room, Client } from "@colyseus/core";
import {
  HexCoord,
  HexMath,
  WorldChunkGenerator,
  GAME_CONFIG,
  TileDeltaOverride,
} from "@webwestmarch/shared";
import {
  WorldRoomState,
  PartyTokenState,
  PartyMemberState,
  ChatMessageState,
  WorldDeltaState,
} from "../schema/WorldState.js";
import { DatabaseService } from "../services/database.js";

const PLAYER_COLORS = [
  "#38bdf8", // Sky Blue
  "#f43f5e", // Rose Crimson
  "#a855f7", // Royal Purple
  "#22c55e", // Emerald
  "#f59e0b", // Amber
  "#06b6d4", // Cyan
  "#ec4899", // Pink
];

export class WorldRoom extends Room<WorldRoomState> {
  public maxClients = 64;
  private worldGen!: WorldChunkGenerator;
  private dbService = DatabaseService.getInstance();

  public async onCreate(options: { seed?: number }): Promise<void> {
    const seed = options.seed ?? GAME_CONFIG.worldSeed;
    this.setState(new WorldRoomState());
    this.state.worldSeed = seed;

    this.worldGen = new WorldChunkGenerator(seed);

    // Load handcrafted delta overrides
    const initialDeltas = await this.dbService.loadAllDeltas();
    this.worldGen.loadDeltas(initialDeltas);

    for (const delta of initialDeltas) {
      const deltaState = new WorldDeltaState();
      deltaState.coordKey = delta.coordKey;
      deltaState.biome = delta.biome ?? "";
      deltaState.customLabel = delta.customLabel ?? "";
      deltaState.isPassable = delta.isPassable ?? true;
      if (delta.landmark) {
        deltaState.landmarkId = delta.landmark.id;
        deltaState.landmarkName = delta.landmark.name;
        deltaState.landmarkType = delta.landmark.type;
        deltaState.dangerTier = delta.landmark.dangerTier;
      }
      this.state.deltas.set(delta.coordKey, deltaState);
    }

    // Register network message handlers
    this.registerMessageHandlers();

    // Server authoritative game loop (10 ticks per second)
    this.setSimulationInterval((deltaTime) => this.update(deltaTime), 100);

    console.log(`[WorldRoom] Created with seed: ${seed}`);
  }

  private registerMessageHandlers(): void {
    // Player requests to step onto an adjacent hex
    this.onMessage("move", (client, targetCoord: HexCoord) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      const currentCoord: HexCoord = { q: player.q, r: player.r };
      const dist = HexMath.distance(currentCoord, targetCoord);

      // Verify that the requested step is an immediate flat-top neighbor
      if (dist !== 1) {
        client.send("error", { message: "Invalid move: Target hex is not an adjacent neighbor." });
        return;
      }

      // Check movement cooldown
      const now = Date.now();
      if (now - player.lastMovedAt < GAME_CONFIG.moveStepIntervalMs) {
        return;
      }

      // Validate destination tile passability in world generator
      const tile = this.worldGen.getTile(targetCoord);
      if (!tile.isPassable) {
        client.send("error", { message: `Cannot move to ${tile.biome}: Terrain is impassable.` });
        return;
      }

      // Authoritative position update
      player.targetQ = targetCoord.q;
      player.targetR = targetCoord.r;
      player.q = targetCoord.q;
      player.r = targetCoord.r;
      player.lastMovedAt = now;
      player.isMoving = true;

      // Broadcast tile event if landmark is discovered
      if (tile.landmark) {
        this.broadcast("landmark_discovered", {
          playerName: player.name,
          landmark: tile.landmark,
          coord: targetCoord,
        });
      }
    });

    // Chat message dispatch
    this.onMessage("chat", (client, data: { content: string; channel?: "GLOBAL" | "PARTY" | "SYSTEM" }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || !data.content || data.content.trim().length === 0) return;

      const msg = new ChatMessageState();
      msg.id = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      msg.senderId = client.sessionId;
      msg.senderName = player.name;
      msg.channel = data.channel ?? "GLOBAL";
      msg.content = data.content.trim().slice(0, 300);
      msg.timestamp = Date.now();

      // Keep recent 50 messages in state
      if (this.state.chatHistory.length >= 50) {
        this.state.chatHistory.shift();
      }
      this.state.chatHistory.push(msg);

      // Fast immediate broadcast to all connected clients
      this.broadcast("chat_message", {
        id: msg.id,
        senderId: msg.senderId,
        senderName: msg.senderName,
        channel: msg.channel,
        content: msg.content,
        timestamp: msg.timestamp,
      });
    });

    // Admin / GM Handcrafted Delta Override creation
    this.onMessage("add_delta", async (client, delta: TileDeltaOverride) => {
      this.worldGen.registerDelta(delta);
      await this.dbService.saveDelta(delta);

      const deltaState = new WorldDeltaState();
      deltaState.coordKey = delta.coordKey;
      deltaState.biome = delta.biome ?? "";
      deltaState.customLabel = delta.customLabel ?? "";
      deltaState.isPassable = delta.isPassable ?? true;
      if (delta.landmark) {
        deltaState.landmarkId = delta.landmark.id;
        deltaState.landmarkName = delta.landmark.name;
        deltaState.landmarkType = delta.landmark.type;
        deltaState.dangerTier = delta.landmark.dangerTier;
      }
      this.state.deltas.set(delta.coordKey, deltaState);

      this.broadcast("delta_updated", { delta });
    });
  }

  public onJoin(client: Client, options: { playerName?: string }): void {
    const playerIndex = this.state.players.size;
    const color = PLAYER_COLORS[playerIndex % PLAYER_COLORS.length];
    const name = options.playerName || `Party ${playerIndex + 1}`;

    const player = new PartyTokenState();
    player.id = client.sessionId;
    player.ownerId = client.sessionId;
    player.name = name;
    player.color = color;
    player.q = 0;
    player.r = 0;
    player.targetQ = 0;
    player.targetR = 0;
    player.lastMovedAt = Date.now();

    // Default starter party members
    const roles: Array<{ name: string; role: string; hp: number; mp: number }> = [
      { name: "Valeria", role: "WARRIOR", hp: 120, mp: 30 },
      { name: "Ignis", role: "MAGE", hp: 70, mp: 110 },
      { name: "Sylas", role: "RANGER", hp: 85, mp: 60 },
      { name: "Lyra", role: "CLERIC", hp: 90, mp: 95 },
    ];

    for (let i = 0; i < roles.length; i++) {
      const r = roles[i];
      const member = new PartyMemberState();
      member.id = `pm_${client.sessionId}_${i}`;
      member.name = r.name;
      member.classRole = r.role;
      member.level = 1;
      member.currentHp = r.hp;
      member.maxHp = r.hp;
      member.currentMp = r.mp;
      member.maxMp = r.mp;
      player.members.push(member);
    }

    this.state.players.set(client.sessionId, player);

    // Send system welcome message
    const welcomeMsg = new ChatMessageState();
    welcomeMsg.id = `welcome_${client.sessionId}`;
    welcomeMsg.senderId = "system";
    welcomeMsg.senderName = "Chronicle";
    welcomeMsg.channel = "SYSTEM";
    welcomeMsg.content = `${player.name} has entered the gathering hall.`;
    welcomeMsg.timestamp = Date.now();
    this.state.chatHistory.push(welcomeMsg);

    this.broadcast("chat_message", {
      id: welcomeMsg.id,
      senderId: welcomeMsg.senderId,
      senderName: welcomeMsg.senderName,
      channel: welcomeMsg.channel,
      content: welcomeMsg.content,
      timestamp: welcomeMsg.timestamp,
    });

    console.log(`[WorldRoom] Client joined: ${client.sessionId} as ${name}`);
  }

  public onLeave(client: Client): void {
    const player = this.state.players.get(client.sessionId);
    if (player) {
      const leaveMsg = new ChatMessageState();
      leaveMsg.id = `leave_${client.sessionId}`;
      leaveMsg.senderId = "system";
      leaveMsg.senderName = "Chronicle";
      leaveMsg.channel = "SYSTEM";
      leaveMsg.content = `${player.name} returned to the shadows.`;
      leaveMsg.timestamp = Date.now();
      this.state.chatHistory.push(leaveMsg);
    }

    this.state.players.delete(client.sessionId);
    console.log(`[WorldRoom] Client left: ${client.sessionId}`);
  }

  private update(_deltaTime: number): void {
    this.state.serverTick++;
  }
}
