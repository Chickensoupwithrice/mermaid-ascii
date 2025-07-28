/**
 * Direction type and utilities ported from direction.go
 */

import { GenericCoord, GridCoord, graphDirection } from './common';

export class Direction implements GenericCoord {
  constructor(public x: number, public y: number) {}

  getOpposite(): Direction {
    if (this.equals(Up)) return Down;
    if (this.equals(Down)) return Up;
    if (this.equals(Left)) return Right;
    if (this.equals(Right)) return Left;
    if (this.equals(UpperRight)) return LowerLeft;
    if (this.equals(UpperLeft)) return LowerRight;
    if (this.equals(LowerRight)) return UpperLeft;
    if (this.equals(LowerLeft)) return UpperRight;
    if (this.equals(Middle)) return Middle;
    
    throw new Error("Unknown direction");
  }

  equals(other: Direction): boolean {
    return this.x === other.x && this.y === other.y;
  }
}

// Direction constants
export const Up = new Direction(1, 0);
export const Down = new Direction(1, 2);
export const Left = new Direction(0, 1);
export const Right = new Direction(2, 1);
export const UpperRight = new Direction(2, 0);
export const UpperLeft = new Direction(0, 0);
export const LowerRight = new Direction(2, 2);
export const LowerLeft = new Direction(0, 2);
export const Middle = new Direction(1, 1);

export function determineDirection(from: GenericCoord, to: GenericCoord): Direction {
  if (from.x === to.x) {
    if (from.y < to.y) {
      return Down;
    } else {
      return Up;
    }
  } else if (from.y === to.y) {
    if (from.x < to.x) {
      return Right;
    } else {
      return Left;
    }
  } else if (from.x < to.x) {
    if (from.y < to.y) {
      return LowerRight;
    } else {
      return UpperRight;
    }
  } else {
    if (from.y < to.y) {
      return LowerLeft;
    } else {
      return UpperLeft;
    }
  }
}

export function selfReferenceDirection(): [Direction, Direction, Direction, Direction] {
  if (graphDirection === "LR") {
    return [Right, Down, Down, Right];
  }
  return [Down, Right, Right, Down];
}

export function determineStartAndEndDir(fromCoord: GridCoord, toCoord: GridCoord, isSelfReference: boolean): [Direction, Direction, Direction, Direction] {
  if (isSelfReference) {
    return selfReferenceDirection();
  }

  const d = determineDirection(fromCoord, toCoord);
  let preferredDir: Direction;
  let preferredOppositeDir: Direction;
  let alternativeDir: Direction;
  let alternativeOppositeDir: Direction;

  // LR: prefer vertical over horizontal
  // TD: prefer horizontal over vertical
  switch (true) {
    case d.equals(LowerRight):
      if (graphDirection === "LR") {
        preferredDir = Down;
        preferredOppositeDir = Left;
        alternativeDir = Right;
        alternativeOppositeDir = Up;
      } else {
        preferredDir = Right;
        preferredOppositeDir = Up;
        alternativeDir = Down;
        alternativeOppositeDir = Left;
      }
      break;

    case d.equals(UpperRight):
      if (graphDirection === "LR") {
        preferredDir = Up;
        preferredOppositeDir = Left;
        alternativeDir = Right;
        alternativeOppositeDir = Down;
      } else {
        preferredDir = Right;
        preferredOppositeDir = Down;
        alternativeDir = Up;
        alternativeOppositeDir = Left;
      }
      break;

    case d.equals(LowerLeft):
      if (graphDirection === "LR") {
        preferredDir = Down;
        preferredOppositeDir = Right;
        alternativeDir = Left;
        alternativeOppositeDir = Up;
      } else {
        preferredDir = Left;
        preferredOppositeDir = Up;
        alternativeDir = Down;
        alternativeOppositeDir = Right;
      }
      break;

    case d.equals(UpperLeft):
      if (graphDirection === "LR") {
        preferredDir = Up;
        preferredOppositeDir = Right;
        alternativeDir = Left;
        alternativeOppositeDir = Down;
      } else {
        preferredDir = Left;
        preferredOppositeDir = Down;
        alternativeDir = Up;
        alternativeOppositeDir = Right;
      }
      break;

    default:
      preferredDir = d;
      preferredOppositeDir = preferredDir.getOpposite();
      alternativeDir = d;
      alternativeOppositeDir = preferredOppositeDir;
  }

  return [preferredDir, preferredOppositeDir, alternativeDir, alternativeOppositeDir];
}
