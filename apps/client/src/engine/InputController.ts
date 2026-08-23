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
    // Mouse Drag (Pan) & Tile Click
    this.canvasElement.addEventListener("mousedown", (e) => this.onMouseDown(e));
    window.addEventListener("mousemove", (e) => this.onMouseMove(e));
    window.addEventListener("mouseup", (e) => this.onMouseUp(e));

    // Mouse Wheel (Zoom)
    this.canvasElement.addEventListener("wheel", (e) => this.onWheel(e), { passive: false });

    // Keyboard Spacebar for Camera Re-center
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

      // Click on hex -> select and inspect tile
      if (!this.hasMovedWhileDragging && e.button === 0) {
        const worldPos = this.renderer.screenToWorld(e.clientX, e.clientY);
        const clickedHex = HexMath.pixelToHex(worldPos, GAME_CONFIG.hexRadius);

        this.renderer.updateSelection(clickedHex);
        this.onTileSelected?.(clickedHex);
        this.renderer.refreshSurroundingTerrain(clickedHex, 6);
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
    if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
      return;
    }

    if (e.key === " ") {
      e.preventDefault();
      const localPlayer = this.netClient.getLocalPlayer();
      if (localPlayer) {
        this.renderer.centerOnHex({ q: localPlayer.q, r: localPlayer.r });
      } else {
        this.renderer.centerOnHex({ q: 0, r: 0 });
      }
    }
  }
}
