import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";

export class PartyMemberState extends Schema {
  @type("string") id: string = "";
  @type("string") name: string = "";
  @type("string") classRole: string = "WARRIOR";
  @type("number") level: number = 1;
  @type("number") currentHp: number = 100;
  @type("number") maxHp: number = 100;
  @type("number") currentMp: number = 50;
  @type("number") maxMp: number = 50;
}

export class PartyTokenState extends Schema {
  @type("string") id: string = "";
  @type("string") name: string = "";
  @type("string") ownerId: string = "";
  @type("string") color: string = "#38bdf8";
  
  // Flat-top Hex axial coordinates
  @type("number") q: number = 0;
  @type("number") r: number = 0;
  @type("number") targetQ: number = 0;
  @type("number") targetR: number = 0;
  @type("boolean") isMoving: boolean = false;
  @type("number") lastMovedAt: number = 0;

  @type([PartyMemberState]) members = new ArraySchema<PartyMemberState>();
}

export class ChatMessageState extends Schema {
  @type("string") id: string = "";
  @type("string") senderId: string = "";
  @type("string") senderName: string = "";
  @type("string") channel: string = "GLOBAL";
  @type("string") content: string = "";
  @type("number") timestamp: number = 0;
}

export class WorldDeltaState extends Schema {
  @type("string") coordKey: string = "";
  @type("string") biome: string = "";
  @type("string") customLabel: string = "";
  @type("boolean") isPassable: boolean = true;
  @type("string") landmarkId: string = "";
  @type("string") landmarkName: string = "";
  @type("string") landmarkType: string = "";
  @type("number") dangerTier: number = 0;
}

export class WorldRoomState extends Schema {
  @type({ map: PartyTokenState }) players = new MapSchema<PartyTokenState>();
  @type([ChatMessageState]) chatHistory = new ArraySchema<ChatMessageState>();
  @type({ map: WorldDeltaState }) deltas = new MapSchema<WorldDeltaState>();
  @type("number") serverTick: number = 0;
  @type("number") worldSeed: number = 42077;
}
