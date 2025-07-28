/**
 * A* pathfinding algorithm ported from arrow.go
 */

import { GridCoord } from './types/common';
import { determineDirection } from './types/direction';

interface PriorityQueueItem {
  coord: GridCoord;
  priority: number;
}

class PriorityQueue {
  private items: PriorityQueueItem[] = [];

  push(item: PriorityQueueItem): void {
    this.items.push(item);
    this.items.sort((a, b) => a.priority - b.priority);
  }

  pop(): PriorityQueueItem | undefined {
    return this.items.shift();
  }

  length(): number {
    return this.items.length;
  }
}

function heuristic(a: GridCoord, b: GridCoord): number {
  const absX = Math.abs(a.x - b.x);
  const absY = Math.abs(a.y - b.y);
  
  if (absX === 0 || absY === 0) {
    return absX + absY;
  } else {
    // Punish for taking extra corner, we prefer straight (less complex) lines
    return absX + absY + 1;
  }
}

export function getPath(
  from: GridCoord, 
  to: GridCoord, 
  isFreeInGrid: (coord: GridCoord) => boolean
): GridCoord[] {
  const pq = new PriorityQueue();
  pq.push({ coord: from, priority: 0 });

  const costSoFar = new Map<string, number>();
  const cameFrom = new Map<string, GridCoord | null>();
  
  const fromKey = `${from.x},${from.y}`;
  const toKey = `${to.x},${to.y}`;
  
  costSoFar.set(fromKey, 0);
  cameFrom.set(fromKey, null);

  const directions = [
    new GridCoord(1, 0),   // Right
    new GridCoord(-1, 0),  // Left
    new GridCoord(0, 1),   // Down
    new GridCoord(0, -1)   // Up
  ];

  while (pq.length() > 0) {
    const currentItem = pq.pop()!;
    const current = currentItem.coord;
    const currentKey = `${current.x},${current.y}`;

    if (currentKey === toKey) {
      // Reconstruct path
      const path: GridCoord[] = [];
      let c: GridCoord | null = current;
      
      while (c !== null) {
        path.unshift(c);
        const key: string = `${c.x},${c.y}`;
        c = cameFrom.get(key) || null;
      }
      
      return path;
    }

    for (const dir of directions) {
      const next = new GridCoord(current.x + dir.x, current.y + dir.y);
      const nextKey = `${next.x},${next.y}`;
      
      if (!isFreeInGrid(next) && nextKey !== toKey) {
        continue;
      }

      const newCost = costSoFar.get(currentKey)! + 1;
      const existingCost = costSoFar.get(nextKey);
      
      if (existingCost === undefined || newCost < existingCost) {
        costSoFar.set(nextKey, newCost);
        const priority = newCost + heuristic(next, to);
        pq.push({ coord: next, priority });
        cameFrom.set(nextKey, current);
      }
    }
  }

  throw new Error("No path found");
}

export function mergePath(path: GridCoord[]): GridCoord[] {
  // If two steps are in the same direction, merge them to one step.
  if (path.length <= 2) {
    return path;
  }

  const indexToRemove: number[] = [];
  let step0 = path[0];
  let step1 = path[1];

  for (let idx = 0; idx < path.length - 2; idx++) {
    const step2 = path[idx + 2];
    
    const prevDir = determineDirection(step0, step1);
    const dir = determineDirection(step1, step2);
    
    if (prevDir.equals(dir)) {
      indexToRemove.push(idx + 1); // +1 because we skip the initial step
    }
    
    step0 = step1;
    step1 = step2;
  }

  const newPath: GridCoord[] = [];
  for (let idx = 0; idx < path.length; idx++) {
    if (!indexToRemove.includes(idx)) {
      newPath.push(path[idx]);
    }
  }

  return newPath;
}


