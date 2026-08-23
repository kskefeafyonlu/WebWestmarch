import { HexCoord } from "../grid/hexMath.js";

export type BiomeType =
  | "DEEP_OCEAN"
  | "COASTAL_SHALLOWS"
  | "PLAINS"
  | "DENSE_FOREST"
  | "HIGH_WOODS"
  | "SWAMPLAND"
  | "HILLS"
  | "MOUNTAIN_PEAK"
  | "SCORCHED_BADLANDS"
  | "SETTLEMENT_ENCAMPMENT";

export interface BiomeMetadata {
  readonly id: BiomeType;
  readonly name: string;
  readonly description: string;
  readonly fillColor: string;
  readonly borderColor: string;
  readonly iconName: string;
  readonly isPassable: boolean;
  readonly movementCost: number;
  readonly hazardRating: number; // 0 (Safe) to 5 (Deadly)
}

export type LandmarkType =
  | "ANCIENT_RUINS"
  | "GOBLIN_WAR_CAMP"
  | "FORGOTTEN_SHRINE"
  | "DUNGEON_ENTRANCE"
  | "MINERS_OUTPOST"
  | "WATCHTOWER"
  | "TOWN_PORTAL"
  | "STARTING_ENCAMPMENT";

export interface LandmarkData {
  readonly id: string;
  readonly type: LandmarkType;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly interactionType: "INSPECT" | "ENTER_DUNGEON" | "REST_CAMP" | "TRADE";
  readonly dangerTier: number;
}

export interface TileData {
  readonly coord: HexCoord;
  readonly key: string; // "q,r"
  readonly biome: BiomeType;
  readonly elevation: number; // 0.0 to 1.0
  readonly moisture: number;  // 0.0 to 1.0
  readonly temperature: number; // 0.0 to 1.0
  readonly isPassable: boolean;
  readonly movementCost: number;
  readonly landmark?: LandmarkData;
  readonly isHandcrafted: boolean;
  readonly customLabel?: string;
}

export interface TileDeltaOverride {
  readonly coordKey: string; // "q,r"
  readonly biome?: BiomeType;
  readonly landmark?: LandmarkData;
  readonly customLabel?: string;
  readonly isPassable?: boolean;
  readonly notes?: string;
  readonly createdBy?: string;
  readonly modifiedAt?: number;
}

export interface ChunkCoord {
  readonly cx: number;
  readonly cy: number;
}

export interface ChunkData {
  readonly chunkCoord: ChunkCoord;
  readonly tiles: Record<string, TileData>;
}

export interface PartyMember {
  readonly id: string;
  readonly name: string;
  readonly classRole: "WARRIOR" | "MAGE" | "RANGER" | "CLERIC" | "ROGUE";
  readonly level: number;
  readonly currentHp: number;
  readonly maxHp: number;
  readonly currentMp: number;
  readonly maxMp: number;
}

export interface PartyToken {
  readonly id: string;
  readonly name: string;
  readonly ownerId: string;
  readonly color: string;
  readonly currentHex: HexCoord;
  readonly targetHex: HexCoord;
  readonly isMoving: boolean;
  readonly members: PartyMember[];
  readonly lastMovedAt: number;
}

export interface ChatMessage {
  readonly id: string;
  readonly senderId: string;
  readonly senderName: string;
  readonly channel: "GLOBAL" | "PARTY" | "SYSTEM";
  readonly content: string;
  readonly timestamp: number;
}

export interface WorldSeedConfig {
  readonly seed: number;
  readonly worldName: string;
  readonly elevationNoiseScale: number;
  readonly moistureNoiseScale: number;
  readonly temperatureNoiseScale: number;
}
