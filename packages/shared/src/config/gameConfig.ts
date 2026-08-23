/**
 * Game Configuration & Balancing Variables
 * All serialized parameters are exposed here to easily tune and experiment with gameplay feel.
 */

export interface GameBalancingConfig {
  // Hex Grid Dimensions
  hexRadius: number;
  hexBorderWidth: number;
  hexBorderColor: number;
  hexSelectedColor: number;
  hexHoverColor: number;

  // Chunk Generation
  chunkSize: number; // radius or width in hexes
  worldSeed: number;
  elevationScale: number;
  moistureScale: number;
  temperatureScale: number;
  elevationOctaves: number;
  moistureOctaves: number;

  // Movement & Networking
  moveStepIntervalMs: number; // Min time between grid hops
  interpolationSpeed: number; // Client-side visual lerp smoothing factor (0.05 to 0.3)
  fogOfWarRadius: number;     // Hex distance revealed around party token
  renderChunkRadius: number;  // How many chunks away from player to render

  // Camera & Viewport
  defaultZoom: number;
  minZoom: number;
  maxZoom: number;
  zoomSpeed: number;
  panSpeed: number;
}

export const GAME_CONFIG: GameBalancingConfig = {
  // Hex Rendering
  hexRadius: 40,
  hexBorderWidth: 1.5,
  hexBorderColor: 0x1f2937,
  hexSelectedColor: 0xf59e0b,
  hexHoverColor: 0x38bdf8,

  // World Generation
  chunkSize: 16,
  worldSeed: 42077,
  elevationScale: 0.045,
  moistureScale: 0.035,
  temperatureScale: 0.02,
  elevationOctaves: 4,
  moistureOctaves: 3,

  // Exploration & Movement
  moveStepIntervalMs: 320,
  interpolationSpeed: 0.18,
  fogOfWarRadius: 4,
  renderChunkRadius: 2,

  // Camera Controls
  defaultZoom: 1.0,
  minZoom: 0.35,
  maxZoom: 2.2,
  zoomSpeed: 0.0015,
  panSpeed: 1.0,
};
