/**
 * Flat-Topped Hexagonal Grid Mathematics
 * Uses Axial Coordinates (q, r) and Cube Coordinates (x, y, z) where x + y + z = 0.
 */

export interface HexCoord {
  readonly q: number; // Column (axial)
  readonly r: number; // Row (axial)
}

export interface CubeCoord {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface Point2D {
  readonly x: number;
  readonly y: number;
}

export enum HexDirection {
  EAST = 0,
  NORTH_EAST = 1,
  NORTH_WEST = 2,
  WEST = 3,
  SOUTH_WEST = 4,
  SOUTH_EAST = 5,
}

// 6 Axial direction vectors for flat-topped hexagons
export const HEX_DIRECTIONS: readonly HexCoord[] = [
  { q: 1, r: 0 },   // EAST
  { q: 1, r: -1 },  // NORTH_EAST
  { q: 0, r: -1 },  // NORTH_WEST
  { q: -1, r: 0 },  // WEST
  { q: -1, r: 1 },  // SOUTH_WEST
  { q: 0, r: 1 },   // SOUTH_EAST
] as const;

export const HEX_DIRECTION_NAMES = [
  "East (E)",
  "North-East (NE)",
  "North-West (NW)",
  "West (W)",
  "South-West (SW)",
  "South-East (SE)",
] as const;

export class HexMath {
  public static readonly SQRT_3 = Math.sqrt(3);

  public static axialToCube(hex: HexCoord): CubeCoord {
    const x = hex.q;
    const z = hex.r;
    const y = -x - z;
    return { x, y, z };
  }

  public static cubeToAxial(cube: CubeCoord): HexCoord {
    return { q: cube.x, r: cube.z };
  }

  public static roundCube(frac: CubeCoord): CubeCoord {
    let rx = Math.round(frac.x);
    let ry = Math.round(frac.y);
    let rz = Math.round(frac.z);

    const xDiff = Math.abs(rx - frac.x);
    const yDiff = Math.abs(ry - frac.y);
    const zDiff = Math.abs(rz - frac.z);

    if (xDiff > yDiff && xDiff > zDiff) {
      rx = -ry - rz;
    } else if (yDiff > zDiff) {
      ry = -rx - rz;
    } else {
      rz = -rx - ry;
    }

    return { x: rx, y: ry, z: rz };
  }

  public static roundAxial(hex: { q: number; r: number }): HexCoord {
    return this.cubeToAxial(this.roundCube(this.axialToCube(hex)));
  }

  /**
   * Convert Flat-Topped Hex Axial (q, r) to 2D Pixel position (Center of hex).
   */
  public static hexToPixel(hex: HexCoord, radius: number): Point2D {
    const x = radius * ((3 / 2) * hex.q);
    const y = radius * ((HexMath.SQRT_3 / 2) * hex.q + HexMath.SQRT_3 * hex.r);
    return { x, y };
  }

  /**
   * Convert 2D Pixel position to nearest Flat-Topped Hex Axial (q, r).
   */
  public static pixelToHex(pixel: Point2D, radius: number): HexCoord {
    const q = ((2 / 3) * pixel.x) / radius;
    const r = ((-1 / 3) * pixel.x + (HexMath.SQRT_3 / 3) * pixel.y) / radius;
    return this.roundAxial({ q, r });
  }

  /**
   * Calculates the 6 corner vertices in local pixel coordinates for a flat-topped hex.
   */
  public static getFlatHexCorners(radius: number): Point2D[] {
    const corners: Point2D[] = [];
    for (let i = 0; i < 6; i++) {
      const angleRad = (Math.PI / 180) * (60 * i);
      corners.push({
        x: radius * Math.cos(angleRad),
        y: radius * Math.sin(angleRad),
      });
    }
    return corners;
  }

  /**
   * Distance between two hexes in hex grid step units.
   */
  public static distance(a: HexCoord, b: HexCoord): number {
    const ac = this.axialToCube(a);
    const bc = this.axialToCube(b);
    return (Math.abs(ac.x - bc.x) + Math.abs(ac.y - bc.y) + Math.abs(ac.z - bc.z)) / 2;
  }

  /**
   * Returns neighbor hex in given direction (0 to 5).
   */
  public static getNeighbor(hex: HexCoord, direction: HexDirection | number): HexCoord {
    const dir = HEX_DIRECTIONS[(direction + 6) % 6];
    return { q: hex.q + dir.q, r: hex.r + dir.r };
  }

  /**
   * Returns all 6 immediate neighbors.
   */
  public static getAllNeighbors(hex: HexCoord): HexCoord[] {
    return HEX_DIRECTIONS.map((dir) => ({ q: hex.q + dir.q, r: hex.r + dir.r }));
  }

  /**
   * Returns all hex coordinates within a given range/radius from center.
   */
  public static getHexesInRange(center: HexCoord, range: number): HexCoord[] {
    const results: HexCoord[] = [];
    for (let q = -range; q <= range; q++) {
      const r1 = Math.max(-range, -q - range);
      const r2 = Math.min(range, -q + range);
      for (let r = r1; r <= r2; r++) {
        results.push({ q: center.q + q, r: center.r + r });
      }
    }
    return results;
  }

  /**
   * Linear interpolation between two points for line of sight.
   */
  public static line(a: HexCoord, b: HexCoord): HexCoord[] {
    const n = this.distance(a, b);
    if (n === 0) return [{ ...a }];

    const ac = this.axialToCube(a);
    const bc = this.axialToCube(b);
    const results: HexCoord[] = [];
    const step = 1.0 / Math.max(n, 1);

    for (let i = 0; i <= n; i++) {
      const t = step * i;
      const interpolatedCube: CubeCoord = {
        x: ac.x + (bc.x - ac.x) * t + 1e-6,
        y: ac.y + (bc.y - ac.y) * t + 1e-6,
        z: ac.z + (bc.z - ac.z) * t - 2e-6,
      };
      results.push(this.cubeToAxial(this.roundCube(interpolatedCube)));
    }
    return results;
  }

  /**
   * Serializes a hex coord to a unique string key `q,r`.
   */
  public static key(hex: HexCoord): string {
    return `${hex.q},${hex.r}`;
  }

  /**
   * Deserializes a string key `q,r` back to a HexCoord.
   */
  public static parseKey(key: string): HexCoord {
    const parts = key.split(",");
    return { q: parseInt(parts[0], 10), r: parseInt(parts[1], 10) };
  }
}
