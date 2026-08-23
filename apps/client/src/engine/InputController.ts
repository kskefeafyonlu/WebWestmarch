import { HexCoord, HexMath, GAME_CONFIG } from "@webwestmarch/shared";
import { HexRenderer } from "./HexRenderer.js";
import { GameNetworkClient } from "../network/GameClient.js";

export class InputController {
  private renderer: HexRenderer;
  private netClient: GameNetworkClient;
  private canvasElement: HTMLCanvasElement;

  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private dragCameraStartX: number = 0;
  private dragCameraStartY: number = 0;
  private hasMovedWhileDragging: boolean = false;

  public onTileSelected?: (hex: HexCoord) => void;

  constructor(renderer: HexRenderer, netClient: GameNetworkClient, canvasElement: HTMLCanvasElement) {
    this.renderer = renderer;
    this.netClient = netClient;
    this.canvasElement = canvasElement;
    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    // Mouse Drag (Pan) & Click
    this.canvasElement.addEventListener("mousedown", (e) => this.onMouseDown(e));
    window.addEventListener("mousemove", (e) => this.onMouseMove(e));
    window.addEventListener("mouseup", (e) => this.onMouseUp(e));

    // Mouse Wheel (Zoom)
    this.canvasElement.addEventListener("wheel", (e) => this.onWheel(e), { passive: false });

    // Keyboard navigation
    window.addEventListener("keydown", (e) => this.onKeyDown(e));
  }

  private onMouseDown(e: MouseEvent): void {
    if (e.button === 0 || e.button === 1 || e.button === 2) {
      this.isDragging = true;
      this.hasMovedWhileDragging = false;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      this.dragCameraStartX = this.renderer.cameraX;
      this.dragCameraStartY = this.renderer.cameraY;
    }
  }

  private onMouseMove(e: MouseEvent): void {
    // Update hovered hex
    const worldPos = this.renderer.screenToWorld(e.clientX, e.clientY);
    const hex = HexMath.pixelToHex(worldPos, GAME_CONFIG.hexRadius);
    this.renderer.updateHover(hex);

    if (this.isDragging) {
      const dx = e.clientX - this.dragStartX;
      const dy = e.clientY - this.dragStartY;

      if (Math.hypot(dx, dy) > 5) {
        this.hasMovedWhileDragging = true;
      }

      this.renderer.cameraX = this.dragCameraStartX + dx;
      this.renderer.cameraY = this.dragCameraStartY + dy;
      this.renderer.updateCameraTransform();
    }
  }

  private onMouseUp(e: MouseEvent): void {
    if (this.isDragging) {
      this.isDragging = false;

      // If it was a quick click without dragging, process tile selection or movement
      if (!this.hasMovedWhileDragging && e.button === 0) {
        const worldPos = this.renderer.screenToWorld(e.clientX, e.clientY);
        const clickedHex = HexMath.pixelToHex(worldPos, GAME_CONFIG.hexRadius);

        this.renderer.updateSelection(clickedHex);
        this.onTileSelected?.(clickedHex);

        // If clicked hex is adjacent neighbor to player, trigger move
        const localPlayer = this.netClient.getLocalPlayer();
        if (localPlayer) {
          const playerHex: HexCoord = { q: localPlayer.q, r: localPlayer.r };
          const dist = HexMath.distance(playerHex, clickedHex);
          if (dist === 1) {
            this.netClient.move(clickedHex);
            this.renderer.setTokenTargetPosition(localPlayer.id, clickedHex);
            this.renderer.refreshSurroundingTerrain(clickedHex, 8);
          }
        }
      }
    }
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newZoom = Math.max(
      GAME_CONFIG.minZoom,
      Math.min(GAME_CONFIG.maxZoom, this.renderer.zoom * zoomFactor)
    );

    // Zoom towards mouse cursor position
    const mouseWorldBefore = this.renderer.screenToWorld(e.clientX, e.clientY);
    this.renderer.zoom = newZoom;
    this.renderer.cameraX = e.clientX - mouseWorldBefore.x * newZoom;
    this.renderer.cameraY = e.clientY - mouseWorldBefore.y * newZoom;
    this.renderer.updateCameraTransform();
  }

  private onKeyDown(e: KeyboardEvent): void {
    // Ignore input if typing in chat
    if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
      return;
    }

    const localPlayer = this.netClient.getLocalPlayer();
    if (!localPlayer) return;

    const currentHex: HexCoord = { q: localPlayer.q, r: localPlayer.r };
    let targetHex: HexCoord | null = null;

    // Flat-topped Hexagonal 6-Directional Keybindings
    // Q: NW, W: NE, E: East, A: West, S: SE, D: SE / SW
    switch (e.key.toUpperCase()) {
      case "D":
      case "ARROW_RIGHT":
        targetHex = HexMath.getNeighbor(currentHex, 0); // East
        break;
      case "E":
        targetHex = HexMath.getNeighbor(currentHex, 1); // North-East
        break;
      case "W":
      case "ARROW_UP":
      case "Q":
        targetHex = HexMath.getNeighbor(currentHex, 2); // North-West
        break;
      case "A":
      case "ARROW_LEFT":
        targetHex = HexMath.getNeighbor(currentHex, 3); // West
        break;
      case "Z":
        targetHex = HexMath.getNeighbor(currentHex, 4); // South-West
        break;
      case "S":
      case "ARROW_DOWN":
      case "X":
        targetHex = HexMath.getNeighbor(currentHex, 5); // South-East
        break;
      case " ": // Space to re-center camera
        e.preventDefault();
        this.renderer.centerOnHex(currentHex);
        break;
    }

    if (targetHex) {
      this.netClient.move(targetHex);
      this.renderer.setTokenTargetPosition(localPlayer.id, targetHex);
      this.renderer.refreshSurroundingTerrain(targetHex, 8);
    }
  }
}
