import { Application, Container, Graphics, Text, TextStyle } from "pixi.js";
import {
  HexCoord,
  HexMath,
  WorldChunkGenerator,
  GAME_CONFIG,
  BIOMES,
  TileData,
  Point2D,
} from "@webwestmarch/shared";
import { RemotePlayer } from "../network/GameClient.js";

export class HexRenderer {
  public app!: Application;
  public worldContainer!: Container;
  public terrainContainer!: Container;
  public deltaContainer!: Container;
  public gridContainer!: Container;
  public tokenContainer!: Container;
  public fogContainer!: Container;

  private worldGen: WorldChunkGenerator;
  private renderedTiles: Map<string, Graphics> = new Map();
  private renderedTokens: Map<string, Container> = new Map();
  private tokenVisualPositions: Map<string, Point2D> = new Map();

  public cameraX: number = 0;
  public cameraY: number = 0;
  public zoom: number = GAME_CONFIG.defaultZoom;

  public hoveredHex: HexCoord | null = null;
  public selectedHex: HexCoord | null = null;
  public discoveredHexes: Set<string> = new Set();

  private hoverGraphics!: Graphics;
  private selectionGraphics!: Graphics;

  constructor(worldGen: WorldChunkGenerator) {
    this.worldGen = worldGen;
  }

  public async init(containerElement: HTMLElement): Promise<void> {
    this.app = new Application();
    await this.app.init({
      resizeTo: window,
      backgroundColor: 0x080c14,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    containerElement.appendChild(this.app.canvas);

    // Root World Container (scaled and shifted by camera)
    this.worldContainer = new Container();
    this.app.stage.addChild(this.worldContainer);

    // Layer Hierarchy
    this.terrainContainer = new Container();
    this.deltaContainer = new Container();
    this.gridContainer = new Container();
    this.tokenContainer = new Container();
    this.fogContainer = new Container();

    this.worldContainer.addChild(this.terrainContainer);
    this.worldContainer.addChild(this.deltaContainer);
    this.worldContainer.addChild(this.gridContainer);
    this.worldContainer.addChild(this.tokenContainer);
    this.worldContainer.addChild(this.fogContainer);

    // Dynamic Hover and Selection indicators
    this.hoverGraphics = new Graphics();
    this.selectionGraphics = new Graphics();
    this.gridContainer.addChild(this.hoverGraphics);
    this.gridContainer.addChild(this.selectionGraphics);

    // Center camera on origin (0, 0)
    this.cameraX = window.innerWidth / 2;
    this.cameraY = window.innerHeight / 2;
    this.updateCameraTransform();

    // Initial render radius
    this.refreshSurroundingTerrain({ q: 0, r: 0 }, 10);

    // PixiJS Game Render Loop
    this.app.ticker.add((time) => {
      this.onTick(time.deltaTime);
    });
  }

  public updateCameraTransform(): void {
    if (!this.worldContainer) return;
    this.worldContainer.x = this.cameraX;
    this.worldContainer.y = this.cameraY;
    this.worldContainer.scale.set(this.zoom);
  }

  public screenToWorld(screenX: number, screenY: number): Point2D {
    return {
      x: (screenX - this.cameraX) / this.zoom,
      y: (screenY - this.cameraY) / this.zoom,
    };
  }

  public worldToScreen(worldX: number, worldY: number): Point2D {
    return {
      x: worldX * this.zoom + this.cameraX,
      y: worldY * this.zoom + this.cameraY,
    };
  }

  public refreshSurroundingTerrain(center: HexCoord, radius: number = 8): void {
    const hexes = HexMath.getHexesInRange(center, radius);
    for (const hex of hexes) {
      const key = HexMath.key(hex);
      if (!this.renderedTiles.has(key)) {
        this.renderHexTile(hex);
      }
    }
  }

  private renderHexTile(coord: HexCoord): void {
    const key = HexMath.key(coord);
    const tile = this.worldGen.getTile(coord);
    const centerPixel = HexMath.hexToPixel(coord, GAME_CONFIG.hexRadius);
    const corners = HexMath.getFlatHexCorners(GAME_CONFIG.hexRadius);

    const hexGraphics = new Graphics();
    const biomeMeta = BIOMES[tile.biome];
    const baseColor = parseInt(biomeMeta.fillColor.replace("#", ""), 16);

    // Polygon flat-topped hex fill
    hexGraphics.poly(corners.map((c) => ({ x: c.x + centerPixel.x, y: c.y + centerPixel.y })));
    hexGraphics.fill({ color: baseColor, alpha: 0.9 });
    hexGraphics.stroke({ width: GAME_CONFIG.hexBorderWidth, color: GAME_CONFIG.hexBorderColor, alpha: 0.45 });

    this.terrainContainer.addChild(hexGraphics);
    this.renderedTiles.set(key, hexGraphics);

    // Render Landmark / Delta Visuals
    if (tile.landmark || tile.isHandcrafted) {
      this.renderLandmarkBadge(tile, centerPixel);
    }
  }

  private renderLandmarkBadge(tile: TileData, center: Point2D): void {
    const landmarkGfx = new Graphics();
    
    // Glowing circle badge
    landmarkGfx.circle(center.x, center.y, GAME_CONFIG.hexRadius * 0.42);
    
    if (tile.landmark?.interactionType === "REST_CAMP") {
      landmarkGfx.fill({ color: 0xf59e0b, alpha: 0.85 });
      landmarkGfx.stroke({ width: 2.5, color: 0xfef08a });
    } else if (tile.landmark?.interactionType === "ENTER_DUNGEON") {
      landmarkGfx.fill({ color: 0xef4444, alpha: 0.85 });
      landmarkGfx.stroke({ width: 2.5, color: 0xfca5a5 });
    } else {
      landmarkGfx.fill({ color: 0x38bdf8, alpha: 0.85 });
      landmarkGfx.stroke({ width: 2.5, color: 0xbae6fd });
    }

    this.deltaContainer.addChild(landmarkGfx);

    // Add landmark text label
    const label = new Text({
      text: tile.landmark ? tile.landmark.name.slice(0, 16) : (tile.customLabel || "Landmark"),
      style: new TextStyle({
        fontFamily: "Inter, sans-serif",
        fontSize: 10,
        fontWeight: "600",
        fill: 0xffffff,
        align: "center",
        stroke: { color: 0x000000, width: 3 },
      }),
    });
    label.anchor.set(0.5, 0.5);
    label.x = center.x;
    label.y = center.y + GAME_CONFIG.hexRadius * 0.65;
    this.deltaContainer.addChild(label);
  }

  public updateHover(hex: HexCoord | null): void {
    this.hoveredHex = hex;
    this.hoverGraphics.clear();

    if (hex) {
      const centerPixel = HexMath.hexToPixel(hex, GAME_CONFIG.hexRadius);
      const corners = HexMath.getFlatHexCorners(GAME_CONFIG.hexRadius);
      this.hoverGraphics.poly(corners.map((c) => ({ x: c.x + centerPixel.x, y: c.y + centerPixel.y })));
      this.hoverGraphics.fill({ color: GAME_CONFIG.hexHoverColor, alpha: 0.15 });
      this.hoverGraphics.stroke({ width: 2, color: GAME_CONFIG.hexHoverColor, alpha: 0.8 });
    }
  }

  public updateSelection(hex: HexCoord | null): void {
    this.selectedHex = hex;
    this.selectionGraphics.clear();

    if (hex) {
      const centerPixel = HexMath.hexToPixel(hex, GAME_CONFIG.hexRadius);
      const corners = HexMath.getFlatHexCorners(GAME_CONFIG.hexRadius);
      this.selectionGraphics.poly(corners.map((c) => ({ x: c.x + centerPixel.x, y: c.y + centerPixel.y })));
      this.selectionGraphics.stroke({ width: 3, color: GAME_CONFIG.hexSelectedColor, alpha: 0.95 });
    }
  }

  public updateTokens(players: Map<string, RemotePlayer>, localSessionId: string | null): void {
    // Remove stale tokens
    for (const [id, container] of this.renderedTokens.entries()) {
      if (!players.has(id)) {
        this.tokenContainer.removeChild(container);
        this.renderedTokens.delete(id);
        this.tokenVisualPositions.delete(id);
      }
    }

    // Update / create active player tokens
    for (const [id, player] of players.entries()) {
      let container = this.renderedTokens.get(id);
      const targetPixel = HexMath.hexToPixel({ q: player.q, r: player.r }, GAME_CONFIG.hexRadius);

      if (!container) {
        container = new Container();
        
        // Outer glowing aura for local player
        if (id === localSessionId) {
          const aura = new Graphics();
          aura.circle(0, 0, 18);
          aura.fill({ color: 0xf59e0b, alpha: 0.3 });
          aura.stroke({ width: 2, color: 0xfbbf24, alpha: 0.7 });
          container.addChild(aura);
        }

        // Party dot / token
        const tokenGfx = new Graphics();
        const colorHex = parseInt(player.color.replace("#", ""), 16) || 0x38bdf8;
        tokenGfx.circle(0, 0, 12);
        tokenGfx.fill({ color: colorHex, alpha: 1.0 });
        tokenGfx.stroke({ width: 2.5, color: 0xffffff, alpha: 0.9 });
        container.addChild(tokenGfx);

        // Name tag
        const nameTag = new Text({
          text: player.name,
          style: new TextStyle({
            fontFamily: "Inter, sans-serif",
            fontSize: 11,
            fontWeight: "600",
            fill: id === localSessionId ? 0xfef08a : 0xffffff,
            stroke: { color: 0x080c14, width: 3 },
          }),
        });
        nameTag.anchor.set(0.5, 1.0);
        nameTag.y = -16;
        container.addChild(nameTag);

        this.tokenContainer.addChild(container);
        this.renderedTokens.set(id, container);
        this.tokenVisualPositions.set(id, { x: targetPixel.x, y: targetPixel.y });
        container.x = targetPixel.x;
        container.y = targetPixel.y;
      }
    }
  }

  private onTick(_delta: number): void {
    // Smooth LERP movement interpolation between hex cells
    for (const [id, container] of this.renderedTokens.entries()) {
      const currentPos = this.tokenVisualPositions.get(id);
      if (!currentPos) continue;

      // Desired position is the current target hex
      const lerpFactor = GAME_CONFIG.interpolationSpeed;
      container.x += (currentPos.x - container.x) * lerpFactor;
      container.y += (currentPos.y - container.y) * lerpFactor;
    }
  }

  public setTokenTargetPosition(id: string, targetCoord: HexCoord): void {
    const pixel = HexMath.hexToPixel(targetCoord, GAME_CONFIG.hexRadius);
    this.tokenVisualPositions.set(id, pixel);
  }

  public centerOnHex(hex: HexCoord): void {
    const pixel = HexMath.hexToPixel(hex, GAME_CONFIG.hexRadius);
    this.cameraX = window.innerWidth / 2 - pixel.x * this.zoom;
    this.cameraY = window.innerHeight / 2 - pixel.y * this.zoom;
    this.updateCameraTransform();
  }

  public destroy(): void {
    this.app.destroy(true, { children: true, texture: true });
  }
}
