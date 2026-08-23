import { BiomeMetadata, BiomeType } from "../types/world.js";

export const BIOMES: Record<BiomeType, BiomeMetadata> = {
  DEEP_OCEAN: {
    id: "DEEP_OCEAN",
    name: "Abyssal Waters",
    description: "Deep, treacherous ocean waters. Impassable without sea vessels.",
    fillColor: "#0f172a", // Deep obsidian navy
    borderColor: "#1e293b",
    iconName: "waves",
    isPassable: false,
    movementCost: 999,
    hazardRating: 4,
  },
  COASTAL_SHALLOWS: {
    id: "COASTAL_SHALLOWS",
    name: "Coastal Shallows",
    description: "Shallow shoals and tide pools. Slow moving but passable.",
    fillColor: "#0284c7", // Cerulean
    borderColor: "#38bdf8",
    iconName: "droplet",
    isPassable: true,
    movementCost: 2.0,
    hazardRating: 1,
  },
  PLAINS: {
    id: "PLAINS",
    name: "Golden Steppes",
    description: "Wide open grasslands with clear visibility and swift travel.",
    fillColor: "#4ade80", // Verdant green
    borderColor: "#22c55e",
    iconName: "sun",
    isPassable: true,
    movementCost: 1.0,
    hazardRating: 0,
  },
  DENSE_FOREST: {
    id: "DENSE_FOREST",
    name: "Whispering Woods",
    description: "Ancient canopy of dense oak and pine. Obscures line of sight.",
    fillColor: "#15803d", // Deep forest green
    borderColor: "#166534",
    iconName: "trees",
    isPassable: true,
    movementCost: 1.5,
    hazardRating: 1,
  },
  HIGH_WOODS: {
    id: "HIGH_WOODS",
    name: "Elderwood Highlands",
    description: "Towering ancient sequoias nestled on steep hillsides.",
    fillColor: "#047857", // Emerald pine
    borderColor: "#065f46",
    iconName: "mountain-snow",
    isPassable: true,
    movementCost: 1.8,
    hazardRating: 2,
  },
  SWAMPLAND: {
    id: "SWAMPLAND",
    name: "Mire of Sorrows",
    description: "Toxic marshlands infested with bog creatures. Travel is severely slowed.",
    fillColor: "#3f6212", // Murky moss
    borderColor: "#365314",
    iconName: "skull",
    isPassable: true,
    movementCost: 2.5,
    hazardRating: 3,
  },
  HILLS: {
    id: "HILLS",
    name: "Windswept Foothills",
    description: "Rugged rocky ridges providing excellent tactical vantage points.",
    fillColor: "#78716c", // Slate stone
    borderColor: "#57534e",
    iconName: "compass",
    isPassable: true,
    movementCost: 1.6,
    hazardRating: 1,
  },
  MOUNTAIN_PEAK: {
    id: "MOUNTAIN_PEAK",
    name: "Dragonspine Crags",
    description: "Towering impassable alpine peaks capped with perpetual snow.",
    fillColor: "#e2e8f0", // Ice white / silver
    borderColor: "#94a3b8",
    iconName: "mountain",
    isPassable: false,
    movementCost: 999,
    hazardRating: 5,
  },
  SCORCHED_BADLANDS: {
    id: "SCORCHED_BADLANDS",
    name: "Ashen Wastes",
    description: "Barren volcanic fissures radiating intense subterranean heat.",
    fillColor: "#b45309", // Crimson amber
    borderColor: "#9a3412",
    iconName: "flame",
    isPassable: true,
    movementCost: 1.4,
    hazardRating: 3,
  },
  SETTLEMENT_ENCAMPMENT: {
    id: "SETTLEMENT_ENCAMPMENT",
    name: "Outpost Haven",
    description: "Fortified survivor encampment. Safe rest zone with merchants and quest boards.",
    fillColor: "#eab308", // Radiant gold
    borderColor: "#ca8a04",
    iconName: "shield",
    isPassable: true,
    movementCost: 0.8,
    hazardRating: 0,
  },
};

/**
 * Determine biome based on elevation [0-1], moisture [0-1], and temperature [0-1].
 */
export function determineBiome(elevation: number, moisture: number, temperature: number): BiomeType {
  // Deep Ocean & Shallows
  if (elevation < 0.22) {
    return "DEEP_OCEAN";
  }
  if (elevation < 0.32) {
    return "COASTAL_SHALLOWS";
  }

  // High Mountain Peaks
  if (elevation > 0.82) {
    return "MOUNTAIN_PEAK";
  }

  // Rugged Hills
  if (elevation > 0.68) {
    if (moisture > 0.5) {
      return "HIGH_WOODS";
    }
    return "HILLS";
  }

  // Lowlands / Mid-elevation
  if (moisture < 0.25) {
    return "SCORCHED_BADLANDS";
  }

  if (moisture > 0.7) {
    return "SWAMPLAND";
  }

  if (moisture > 0.45) {
    return "DENSE_FOREST";
  }

  return "PLAINS";
}
