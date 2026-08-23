import { HexCoord, HexMath } from "../grid/hexMath.js";
import { BIOMES, determineBiome } from "./biomes.js";
import { SimplexNoise } from "./noise.js";
import {
  ChunkCoord,
  ChunkData,
  TileData,
  TileDeltaOverride,
  LandmarkData,
} from "../types/world.js";
import { GAME_CONFIG } from "../config/gameConfig.js";

// Built-in starter handcrafted landmarks and overrides
export const DEFAULT_HANDCRAFTED_OVERRIDES: Record<string, TileDeltaOverride> = {
  "0,0": {
    coordKey: "0,0",
    biome: "SETTLEMENT_ENCAMPMENT",
    customLabel: "Haven's Rest (Sanctuary)",
    isPassable: true,
    landmark: {
      id: "haven_rest_sanctuary",
      type: "STARTING_ENCAMPMENT",
      name: "Haven's Rest Sanctuary",
      description: "The primary expedition basecamp. Protected by an ancient ward stone.",
      icon: "tent",
      interactionType: "REST_CAMP",
      dangerTier: 0,
    },
    notes: "Safe zone starting point for all adventuring parties.",
  },
  "2,-2": {
    coordKey: "2,-2",
    customLabel: "Sunken Shrine of Eloria",
    landmark: {
      id: "shrine_eloria",
      type: "FORGOTTEN_SHRINE",
      name: "Sunken Shrine of Eloria",
      description: "Weathered marble altar humming with resonant divine energy.",
      icon: "sparkles",
      interactionType: "INSPECT",
      dangerTier: 1,
    },
  },
  "-3,2": {
    coordKey: "-3,2",
    customLabel: "The Crypt of the Howling King",
    landmark: {
      id: "crypt_howling_king",
      type: "DUNGEON_ENTRANCE",
      name: "Crypt of the Howling King",
      description: "Subterranean mausoleum descended into by forgotten stone stairs.",
      icon: "skull",
      interactionType: "ENTER_DUNGEON",
      dangerTier: 3,
    },
  },
  "4,1": {
    coordKey: "4,1",
    customLabel: "Bloodfang War Camp",
    landmark: {
      id: "goblin_camp_bloodfang",
      type: "GOBLIN_WAR_CAMP",
      name: "Bloodfang War Camp",
      description: "A fortified palisade occupied by aggressive goblin raiders.",
      icon: "swords",
      interactionType: "ENTER_DUNGEON",
      dangerTier: 2,
    },
  },
  "-2,-3": {
    coordKey: "-2,-3",
    customLabel: "Aethelgard Watchtower",
    landmark: {
      id: "watchtower_aethelgard",
      type: "WATCHTOWER",
      name: "Aethelgard Watchtower",
      description: "High stone lookout post that expands regional visibility.",
      icon: "eye",
      interactionType: "INSPECT",
      dangerTier: 1,
    },
  },
};

export class WorldChunkGenerator {
  private elevationNoise: SimplexNoise;
  private moistureNoise: SimplexNoise;
  private temperatureNoise: SimplexNoise;
  private deltaOverrides: Map<string, TileDeltaOverride>;

  constructor(
    public readonly seed: number = GAME_CONFIG.worldSeed,
    initialOverrides: Record<string, TileDeltaOverride> = DEFAULT_HANDCRAFTED_OVERRIDES
  ) {
    this.elevationNoise = new SimplexNoise(this.seed);
    this.moistureNoise = new SimplexNoise(this.seed + 101);
    this.temperatureNoise = new SimplexNoise(this.seed + 202);
    this.deltaOverrides = new Map(Object.entries(initialOverrides));
  }

  /**
   * Register or update a handcrafted delta override (from Supabase or GM tool).
   */
  public registerDelta(delta: TileDeltaOverride): void {
    this.deltaOverrides.set(delta.coordKey, delta);
  }

  /**
   * Bulk load handcrafted delta overrides.
   */
  public loadDeltas(deltas: TileDeltaOverride[]): void {
    for (const delta of deltas) {
      this.deltaOverrides.set(delta.coordKey, delta);
    }
  }

  /**
   * Generate tile data for a single hex coordinate.
   */
  public getTile(coord: HexCoord): TileData {
    const key = HexMath.key(coord);
    const pixel = HexMath.hexToPixel(coord, GAME_CONFIG.hexRadius);

    // Procedural noise samples
    const elevation = this.elevationNoise.fbm2D(
      pixel.x,
      pixel.y,
      GAME_CONFIG.elevationOctaves,
      0.5,
      2.0,
      GAME_CONFIG.elevationScale * 0.01
    );

    const moisture = this.moistureNoise.fbm2D(
      pixel.x,
      pixel.y,
      GAME_CONFIG.moistureOctaves,
      0.5,
      2.0,
      GAME_CONFIG.moistureScale * 0.01
    );

    const temperature = this.temperatureNoise.fbm2D(
      pixel.x,
      pixel.y,
      3,
      0.5,
      2.0,
      GAME_CONFIG.temperatureScale * 0.01
    );

    let biome = determineBiome(elevation, moisture, temperature);
    const biomeMeta = BIOMES[biome];
    let isPassable = biomeMeta.isPassable;
    let movementCost = biomeMeta.movementCost;
    let landmark: LandmarkData | undefined = undefined;
    let customLabel: string | undefined = undefined;
    let isHandcrafted = false;

    // Apply sparse handcrafted delta override if present
    const override = this.deltaOverrides.get(key);
    if (override) {
      isHandcrafted = true;
      if (override.biome) {
        biome = override.biome;
        const ovBiome = BIOMES[override.biome];
        isPassable = override.isPassable ?? ovBiome.isPassable;
        movementCost = ovBiome.movementCost;
      }
      if (override.landmark) {
        landmark = override.landmark;
      }
      if (override.customLabel) {
        customLabel = override.customLabel;
      }
      if (override.isPassable !== undefined) {
        isPassable = override.isPassable;
      }
    }

    return {
      coord,
      key,
      biome,
      elevation,
      moisture,
      temperature,
      isPassable,
      movementCost,
      landmark,
      isHandcrafted,
      customLabel,
    };
  }

  /**
   * Generates a circular or axial chunk of hexes around a chunk origin.
   */
  public generateChunk(chunkCoord: ChunkCoord, radius: number = GAME_CONFIG.chunkSize): ChunkData {
    const centerHex: HexCoord = {
      q: chunkCoord.cx * radius,
      r: chunkCoord.cy * radius,
    };

    const hexes = HexMath.getHexesInRange(centerHex, radius);
    const tiles: Record<string, TileData> = {};

    for (const hex of hexes) {
      const tile = this.getTile(hex);
      tiles[tile.key] = tile;
    }

    return {
      chunkCoord,
      tiles,
    };
  }
}
