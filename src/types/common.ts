/**
 * Common utility functions and constants ported from Go math.go and root.go
 */

// Constants from root.go
export const BOX_BORDER_PADDING = 1;
export const PADDING_BETWEEN_X = 5;
export const PADDING_BETWEEN_Y = 5;

// Global configuration
export let graphDirection: "LR" | "TD" = "LR";
export let useAscii = false;

export function setGraphDirection(direction: "LR" | "TD"): void {
  graphDirection = direction;
}

export function setUseAscii(ascii: boolean): void {
  useAscii = ascii;
}

// Utility functions from math.go
export function min(x: number, y: number): number {
  return x < y ? x : y;
}

export function max(x: number, y: number): number {
  return x > y ? x : y;
}

export function abs(x: number): number {
  return x < 0 ? -x : x;
}

export function ceilDiv(x: number, y: number): number {
  if (x % y === 0) {
    return x / y;
  }
  return Math.floor(x / y) + 1;
}

// Generic coordinate interface
export interface GenericCoord {
  x: number;
  y: number;
}

// Grid coordinate class
export class GridCoord implements GenericCoord {
  constructor(public x: number, public y: number) {}

  equals(other: GridCoord): boolean {
    return this.x === other.x && this.y === other.y;
  }

  direction(dir: DirectionInterface): GridCoord {
    return new GridCoord(this.x + dir.x, this.y + dir.y);
  }
}

// Drawing coordinate class
export class DrawingCoord implements GenericCoord {
  constructor(public x: number, public y: number) {}

  equals(other: DrawingCoord): boolean {
    return this.x === other.x && this.y === other.y;
  }

  direction(dir: DirectionInterface): DrawingCoord {
    return new DrawingCoord(this.x + dir.x, this.y + dir.y);
  }
}

// Forward declaration for Direction - will be properly defined in direction.ts
export interface DirectionInterface extends GenericCoord {
  getOpposite(): DirectionInterface;
}
