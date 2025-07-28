/**
 * Complete drawing engine and rendering system ported from Go draw.go and arrow.go
 * 
 * This module provides pixel-perfect ASCII art generation with:
 * - Unicode and ASCII character modes
 * - Proper line junctions and corners
 * - Arrow head rendering for all directions
 * - Node box drawing with borders
 * - Text rendering and positioning
 * - Character merging and junction handling
 */

import { GridCoord, DrawingCoord, useAscii, max, ceilDiv } from './types/common';
import { Direction, determineDirection, Up, Down, Left, Right, UpperLeft, UpperRight, LowerLeft, LowerRight } from './types/direction';
import { Edge, Node } from './types/graph';

// Junction characters for Unicode drawing (ported from Go)
const junctionChars = [
  "─", // Horizontal line
  "│", // Vertical line
  "┌", // Top-left corner
  "┐", // Top-right corner
  "└", // Bottom-left corner
  "┘", // Bottom-right corner
  "├", // T-junction pointing right
  "┤", // T-junction pointing left
  "┬", // T-junction pointing down
  "┴", // T-junction pointing up
  "┼", // Cross junction
  "╴", // Left end of horizontal line
  "╵", // Top end of vertical line
  "╶", // Right end of horizontal line
  "╷", // Bottom end of vertical line
];

export interface DrawnLine {
  coords: DrawingCoord[];
}

/**
 * Main drawing class that provides all rendering capabilities
 */
export class DrawingEngine {
  private canvas: string[][];
  
  constructor(width: number = 0, height: number = 0) {
    this.canvas = this.makeDrawing(width, height);
  }

  /**
   * Create a new drawing canvas with specified dimensions
   */
  private makeDrawing(x: number, y: number): string[][] {
    const drawing: string[][] = [];
    for (let i = 0; i <= x; i++) {
      drawing[i] = [];
      for (let j = 0; j <= y; j++) {
        drawing[i][j] = " ";
      }
    }
    return drawing;
  }

  /**
   * Get the current drawing canvas
   */
  getCanvas(): string[][] {
    return this.canvas;
  }

  /**
   * Get the size of the current drawing
   */
  getDrawingSize(): [number, number] {
    if (this.canvas.length === 0) return [0, 0];
    return [this.canvas.length - 1, this.canvas[0].length - 1];
  }

  /**
   * Increase the size of the drawing canvas if necessary
   */
  increaseSize(x: number, y: number): void {
    const [currSizeX, currSizeY] = this.getDrawingSize();
    const newDrawing = this.makeDrawing(max(x, currSizeX), max(y, currSizeY));
    
    // Copy existing content
    for (let i = 0; i < this.canvas.length; i++) {
      for (let j = 0; j < this.canvas[i].length; j++) {
        newDrawing[i][j] = this.canvas[i][j];
      }
    }
    
    this.canvas = newDrawing;
  }

  /**
   * Draw text at a specific position (ported from Go drawText)
   */
  drawText(start: DrawingCoord, text: string): void {
    // Increase dimensions if necessary
    this.increaseSize(start.x + text.length, start.y);
    
    for (let x = 0; x < text.length; x++) {
      this.canvas[x + start.x][start.y] = text[x];
    }
  }

  /**
   * Draw a line between two points with offsets (ported from Go drawLine)
   */
  drawLine(from: DrawingCoord, to: DrawingCoord, offsetFrom: number = 0, offsetTo: number = 0): DrawingCoord[] {
    const direction = determineDirection(from, to);
    const drawnCoords: DrawingCoord[] = [];

    // Ensure canvas is large enough
    this.increaseSize(max(from.x, to.x), max(from.y, to.y));

    if (!useAscii) {
      this.drawUnicodeLine(from, to, direction, offsetFrom, offsetTo, drawnCoords);
    } else {
      this.drawAsciiLine(from, to, direction, offsetFrom, offsetTo, drawnCoords);
    }

    return drawnCoords;
  }

  /**
   * Draw line using Unicode characters
   */
  private drawUnicodeLine(from: DrawingCoord, to: DrawingCoord, direction: Direction, offsetFrom: number, offsetTo: number, drawnCoords: DrawingCoord[]): void {
    if (direction.equals(Up)) {
      for (let y = from.y - offsetFrom; y >= to.y - offsetTo; y--) {
        drawnCoords.push(new DrawingCoord(from.x, y));
        this.canvas[from.x][y] = "│";
      }
    } else if (direction.equals(Down)) {
      for (let y = from.y + offsetFrom; y <= to.y + offsetTo; y++) {
        drawnCoords.push(new DrawingCoord(from.x, y));
        this.canvas[from.x][y] = "│";
      }
    } else if (direction.equals(Left)) {
      for (let x = from.x - offsetFrom; x >= to.x - offsetTo; x--) {
        drawnCoords.push(new DrawingCoord(x, from.y));
        this.canvas[x][from.y] = "─";
      }
    } else if (direction.equals(Right)) {
      for (let x = from.x + offsetFrom; x <= to.x + offsetTo; x++) {
        drawnCoords.push(new DrawingCoord(x, from.y));
        this.canvas[x][from.y] = "─";
      }
    } else if (direction.equals(UpperLeft)) {
      let x = from.x;
      let y = from.y - offsetFrom;
      while (x >= to.x - offsetTo && y >= to.y - offsetTo) {
        drawnCoords.push(new DrawingCoord(x, y));
        this.canvas[x][y] = "╲";
        x--;
        y--;
      }
    } else if (direction.equals(UpperRight)) {
      let x = from.x;
      let y = from.y - offsetFrom;
      while (x <= to.x + offsetTo && y >= to.y - offsetTo) {
        drawnCoords.push(new DrawingCoord(x, y));
        this.canvas[x][y] = "╱";
        x++;
        y--;
      }
    } else if (direction.equals(LowerLeft)) {
      let x = from.x;
      let y = from.y + offsetFrom;
      while (x >= to.x - offsetTo && y <= to.y + offsetTo) {
        drawnCoords.push(new DrawingCoord(x, y));
        this.canvas[x][y] = "╱";
        x--;
        y++;
      }
    } else if (direction.equals(LowerRight)) {
      let x = from.x;
      let y = from.y + offsetFrom;
      while (x <= to.x + offsetTo && y <= to.y + offsetTo) {
        drawnCoords.push(new DrawingCoord(x, y));
        this.canvas[x][y] = "╲";
        x++;
        y++;
      }
    }
  }

  /**
   * Draw line using ASCII characters
   */
  private drawAsciiLine(from: DrawingCoord, to: DrawingCoord, direction: Direction, offsetFrom: number, offsetTo: number, drawnCoords: DrawingCoord[]): void {
    if (direction.equals(Up)) {
      for (let y = from.y - offsetFrom; y >= to.y - offsetTo; y--) {
        drawnCoords.push(new DrawingCoord(from.x, y));
        this.canvas[from.x][y] = "|";
      }
    } else if (direction.equals(Down)) {
      for (let y = from.y + offsetFrom; y <= to.y + offsetTo; y++) {
        drawnCoords.push(new DrawingCoord(from.x, y));
        this.canvas[from.x][y] = "|";
      }
    } else if (direction.equals(Left)) {
      for (let x = from.x - offsetFrom; x >= to.x - offsetTo; x--) {
        drawnCoords.push(new DrawingCoord(x, from.y));
        this.canvas[x][from.y] = "-";
      }
    } else if (direction.equals(Right)) {
      for (let x = from.x + offsetFrom; x <= to.x + offsetTo; x++) {
        drawnCoords.push(new DrawingCoord(x, from.y));
        this.canvas[x][from.y] = "-";
      }
    } else if (direction.equals(UpperLeft)) {
      let x = from.x;
      let y = from.y - offsetFrom;
      while (x >= to.x - offsetTo && y >= to.y - offsetTo) {
        drawnCoords.push(new DrawingCoord(x, y));
        this.canvas[x][y] = "\\";
        x--;
        y--;
      }
    } else if (direction.equals(UpperRight)) {
      let x = from.x;
      let y = from.y - offsetFrom;
      while (x <= to.x + offsetTo && y >= to.y - offsetTo) {
        drawnCoords.push(new DrawingCoord(x, y));
        this.canvas[x][y] = "/";
        x++;
        y--;
      }
    } else if (direction.equals(LowerLeft)) {
      let x = from.x;
      let y = from.y + offsetFrom;
      while (x >= to.x - offsetTo && y <= to.y + offsetTo) {
        drawnCoords.push(new DrawingCoord(x, y));
        this.canvas[x][y] = "/";
        x--;
        y++;
      }
    } else if (direction.equals(LowerRight)) {
      let x = from.x;
      let y = from.y + offsetFrom;
      while (x <= to.x + offsetTo && y <= to.y + offsetTo) {
        drawnCoords.push(new DrawingCoord(x, y));
        this.canvas[x][y] = "\\";
        x++;
        y++;
      }
    }
  }

  /**
   * Convert drawing to string representation (ported from Go drawingToString)
   */
  toString(): string {
    const [maxX, maxY] = this.getDrawingSize();
    let result = "";
    
    for (let y = 0; y <= maxY; y++) {
      for (let x = 0; x <= maxX; x++) {
        result += this.canvas[x][y];
      }
      if (y !== maxY) {
        result += "\n";
      }
    }
    
    return result;
  }
}

/**
 * Draw a node box with proper borders and text centering (ported from Go drawBox)
 */
export function drawBox(node: Node, columnWidths: number[], rowHeights: number[]): DrawingEngine {
  if (!node.gridCoord) {
    return new DrawingEngine(0, 0);
  }
  
  // Box is always 2x2 on the grid (width and height span 2 grid cells)
  let w = 0;
  for (let i = 0; i < 2; i++) {
    if (columnWidths[node.gridCoord.x + i] !== undefined) {
      w += columnWidths[node.gridCoord.x + i];
    }
  }
  
  let h = 0;
  for (let i = 0; i < 2; i++) {
    if (rowHeights[node.gridCoord.y + i] !== undefined) {
      h += rowHeights[node.gridCoord.y + i];
    }
  }

  const from = new DrawingCoord(0, 0);
  const to = new DrawingCoord(w, h);
  const boxDrawing = new DrawingEngine(max(from.x, to.x), max(from.y, to.y));

  if (!useAscii) {
    // Draw Unicode box borders
    // Top border
    for (let x = from.x + 1; x < to.x; x++) {
      boxDrawing.getCanvas()[x][from.y] = "─"; // Horizontal line
    }
    // Bottom border
    for (let x = from.x + 1; x < to.x; x++) {
      boxDrawing.getCanvas()[x][to.y] = "─"; // Horizontal line
    }
    // Left border
    for (let y = from.y + 1; y < to.y; y++) {
      boxDrawing.getCanvas()[from.x][y] = "│"; // Vertical line
    }
    // Right border
    for (let y = from.y + 1; y < to.y; y++) {
      boxDrawing.getCanvas()[to.x][y] = "│"; // Vertical line
    }
    // Draw corners
    boxDrawing.getCanvas()[from.x][from.y] = "┌"; // Top left corner
    boxDrawing.getCanvas()[to.x][from.y] = "┐";   // Top right corner
    boxDrawing.getCanvas()[from.x][to.y] = "└";   // Bottom left corner
    boxDrawing.getCanvas()[to.x][to.y] = "┘";     // Bottom right corner
  } else {
    // Draw ASCII box borders
    // Top border
    for (let x = from.x + 1; x < to.x; x++) {
      boxDrawing.getCanvas()[x][from.y] = "-"; // Horizontal line
    }
    // Bottom border
    for (let x = from.x + 1; x < to.x; x++) {
      boxDrawing.getCanvas()[x][to.y] = "-"; // Horizontal line
    }
    // Left border
    for (let y = from.y + 1; y < to.y; y++) {
      boxDrawing.getCanvas()[from.x][y] = "|"; // Vertical line
    }
    // Right border
    for (let y = from.y + 1; y < to.y; y++) {
      boxDrawing.getCanvas()[to.x][y] = "|"; // Vertical line
    }
    // Draw corners
    boxDrawing.getCanvas()[from.x][from.y] = "+"; // Top left corner
    boxDrawing.getCanvas()[to.x][from.y] = "+";   // Top right corner
    boxDrawing.getCanvas()[from.x][to.y] = "+";   // Bottom left corner
    boxDrawing.getCanvas()[to.x][to.y] = "+";     // Bottom right corner
  }

  // Draw text centered in the box
  const textY = from.y + Math.floor(h / 2);
  const textX = from.x + Math.floor(w / 2) - ceilDiv(node.name.length, 2) + 1;
  
  for (let x = 0; x < node.name.length; x++) {
    const targetX = textX + x;
    if (targetX >= 0 && targetX < boxDrawing.getCanvas().length && 
        textY >= 0 && textY < boxDrawing.getCanvas()[0].length) {
      boxDrawing.getCanvas()[targetX][textY] = node.name[x];
    }
  }

  return boxDrawing;
}

/**
 * Draw an edge with all its components (ported from Go drawEdge)
 */
export function drawEdge(
  _from: GridCoord,
  _to: GridCoord,
  edge: Edge,
  gridToDrawingCoord: (coord: GridCoord, dir?: Direction) => DrawingCoord,
  baseDrawing: DrawingEngine
): [DrawingEngine, DrawingEngine, DrawingEngine, DrawingEngine, DrawingEngine] {
  if (edge.path.length === 0) {
    const empty = new DrawingEngine(0, 0);
    return [empty, empty, empty, empty, empty];
  }

  const dLabel = drawArrowLabel(edge, gridToDrawingCoord, baseDrawing);
  const [dPath, linesDrawn] = drawPath(edge.path, gridToDrawingCoord, baseDrawing);
  const dBoxStart = drawBoxStart(edge.path, linesDrawn[0], baseDrawing);
  const dArrowHead = drawArrowHead(linesDrawn[linesDrawn.length - 1], baseDrawing);
  const dCorners = drawCorners(edge.path, gridToDrawingCoord, baseDrawing);

  return [dPath, dBoxStart, dArrowHead, dCorners, dLabel];
}

/**
 * Draw the path of an edge (ported from Go drawPath)
 */
function drawPath(
  path: GridCoord[],
  gridToDrawingCoord: (coord: GridCoord, dir?: Direction) => DrawingCoord,
  baseDrawing: DrawingEngine
): [DrawingEngine, DrawnLine[]] {
  const d = new DrawingEngine();
  // Copy base drawing size
  const [baseX, baseY] = baseDrawing.getDrawingSize();
  d.increaseSize(baseX, baseY);
  
  let previousCoord = path[0];
  const linesDrawn: DrawnLine[] = [];
  
  for (let idx = 1; idx < path.length; idx++) {
    const nextCoord = path[idx];
    const previousDrawingCoord = gridToDrawingCoord(previousCoord);
    const nextDrawingCoord = gridToDrawingCoord(nextCoord);
    
    if (previousDrawingCoord.equals(nextDrawingCoord)) {
      continue;
    }
    
    let drawnCoords: DrawingCoord[];
    if (idx === 1) {
      // Don't cross the node border on first line
      drawnCoords = d.drawLine(previousDrawingCoord, nextDrawingCoord, 1, -1);
    } else {
      drawnCoords = d.drawLine(previousDrawingCoord, nextDrawingCoord, 1, -1);
    }
    
    linesDrawn.push({ coords: drawnCoords });
    previousCoord = nextCoord;
  }
  
  return [d, linesDrawn];
}

/**
 * Draw box start junction (ported from Go drawBoxStart)
 */
function drawBoxStart(
  path: GridCoord[],
  firstLine: DrawnLine,
  baseDrawing: DrawingEngine
): DrawingEngine {
  const d = new DrawingEngine();
  const [baseX, baseY] = baseDrawing.getDrawingSize();
  d.increaseSize(baseX, baseY);
  
  if (!firstLine || firstLine.coords.length === 0 || path.length < 2) {
    return d;
  }
  
  const from = firstLine.coords[0];
  const direction = determineDirection(path[0], path[1]);

  if (useAscii) {
    return d;
  }

  // Apply box start characters based on direction
  if (direction.equals(Up)) {
    if (from.y + 1 >= 0 && from.y + 1 < d.getCanvas()[0].length) {
      d.getCanvas()[from.x][from.y + 1] = "┴";
    }
  } else if (direction.equals(Down)) {
    if (from.y - 1 >= 0 && from.y - 1 < d.getCanvas()[0].length) {
      d.getCanvas()[from.x][from.y - 1] = "┬";
    }
  } else if (direction.equals(Left)) {
    if (from.x + 1 >= 0 && from.x + 1 < d.getCanvas().length) {
      d.getCanvas()[from.x + 1][from.y] = "┤";
    }
  } else if (direction.equals(Right)) {
    if (from.x - 1 >= 0 && from.x - 1 < d.getCanvas().length) {
      d.getCanvas()[from.x - 1][from.y] = "├";
    }
  }

  return d;
}

/**
 * Draw arrow head (ported from Go drawArrowHead)
 */
function drawArrowHead(line: DrawnLine, baseDrawing: DrawingEngine): DrawingEngine {
  const d = new DrawingEngine();
  const [baseX, baseY] = baseDrawing.getDrawingSize();
  d.increaseSize(baseX, baseY);
  
  if (!line || line.coords.length < 1) {
    return d;
  }
  
  let from: DrawingCoord;
  let lastPos: DrawingCoord;
  let direction: Direction;
  
  if (line.coords.length >= 2) {
    // Normal case: use first and last coordinates
    from = line.coords[0];
    lastPos = line.coords[line.coords.length - 1];
    direction = determineDirection(from, lastPos);
  } else {
    // Special case: only one coordinate, assume upward direction for self-reference
    lastPos = line.coords[0];
    direction = Up;
  }
  
  let char: string;
  if (!useAscii) {
    if (direction.equals(Up)) {
      char = "▲";
    } else if (direction.equals(Down)) {
      char = "▼";
    } else if (direction.equals(Left)) {
      char = "◄";
    } else if (direction.equals(Right)) {
      char = "►";
    } else if (direction.equals(UpperRight)) {
      char = "◥";
    } else if (direction.equals(UpperLeft)) {
      char = "◤";
    } else if (direction.equals(LowerRight)) {
      char = "◢";
    } else if (direction.equals(LowerLeft)) {
      char = "◣";
    } else {
      char = "●";
    }
  } else {
    if (direction.equals(Up)) {
      char = "^";
    } else if (direction.equals(Down)) {
      char = "v";
    } else if (direction.equals(Left)) {
      char = "<";
    } else if (direction.equals(Right)) {
      char = ">";
    } else {
      char = "*";
    }
  }

  // Ensure canvas is large enough
  d.increaseSize(lastPos.x, lastPos.y);
  d.getCanvas()[lastPos.x][lastPos.y] = char;

  return d;
}

/**
 * Draw corners for path changes (ported from Go drawCorners)
 */
function drawCorners(
  path: GridCoord[],
  gridToDrawingCoord: (coord: GridCoord, dir?: Direction) => DrawingCoord,
  baseDrawing: DrawingEngine
): DrawingEngine {
  const d = new DrawingEngine();
  const [baseX, baseY] = baseDrawing.getDrawingSize();
  d.increaseSize(baseX, baseY);

  for (let idx = 1; idx < path.length - 1; idx++) {
    const coord = path[idx];
    const drawingCoord = gridToDrawingCoord(coord);

    const prevDir = determineDirection(path[idx - 1], coord);
    const nextDir = determineDirection(coord, path[idx + 1]);

    let corner: string;
    if (!useAscii) {
      // Determine corner character based on direction change
      if ((prevDir.equals(Right) && nextDir.equals(Down)) || (prevDir.equals(Up) && nextDir.equals(Left))) {
        corner = "┐";
      } else if ((prevDir.equals(Right) && nextDir.equals(Up)) || (prevDir.equals(Down) && nextDir.equals(Left))) {
        corner = "┘";
      } else if ((prevDir.equals(Left) && nextDir.equals(Down)) || (prevDir.equals(Up) && nextDir.equals(Right))) {
        corner = "┌";
      } else if ((prevDir.equals(Left) && nextDir.equals(Up)) || (prevDir.equals(Down) && nextDir.equals(Right))) {
        corner = "└";
      } else {
        corner = "+";
      }
    } else {
      corner = "+";
    }

    d.increaseSize(drawingCoord.x, drawingCoord.y);
    d.getCanvas()[drawingCoord.x][drawingCoord.y] = corner;
  }

  return d;
}

/**
 * Draw arrow label text (ported from Go drawArrowLabel)
 */
function drawArrowLabel(
  edge: Edge,
  gridToDrawingCoord: (coord: GridCoord, dir?: Direction) => DrawingCoord,
  baseDrawing: DrawingEngine
): DrawingEngine {
  const d = new DrawingEngine();
  const [baseX, baseY] = baseDrawing.getDrawingSize();
  d.increaseSize(baseX, baseY);
  
  const lenLabel = edge.text.length;
  if (lenLabel === 0) {
    return d;
  }

  if (edge.labelLine.length >= 2) {
    const line = edge.labelLine.map(coord => gridToDrawingCoord(coord));
    drawTextOnLine(d, line, edge.text);
  }

  return d;
}

/**
 * Draw text on a line (ported from Go drawTextOnLine)
 */
function drawTextOnLine(drawing: DrawingEngine, line: DrawingCoord[], label: string): void {
  if (line.length < 2) return;
  
  const minX = Math.min(line[0].x, line[1].x);
  const maxX = Math.max(line[0].x, line[1].x);
  const minY = Math.min(line[0].y, line[1].y);
  const maxY = Math.max(line[0].y, line[1].y);
  
  const middleX = minX + Math.floor((maxX - minX) / 2);
  const middleY = minY + Math.floor((maxY - minY) / 2);
  const startLabelCoord = new DrawingCoord(middleX - Math.floor(label.length / 2), middleY);
  
  drawing.drawText(startLabelCoord, label);
}

/**
 * Merge junction characters for proper line intersections (ported from Go mergeJunctions)
 */
export function mergeJunctions(c1: string, c2: string): string {
  // Define all possible junction combinations
  const junctionMap: Record<string, Record<string, string>> = {
    "─": {"│": "┼", "┌": "┬", "┐": "┬", "└": "┴", "┘": "┴", "├": "┼", "┤": "┼", "┬": "┬", "┴": "┴"},
    "│": {"─": "┼", "┌": "├", "┐": "┤", "└": "├", "┘": "┤", "├": "├", "┤": "┤", "┬": "┼", "┴": "┼"},
    "┌": {"─": "┬", "│": "├", "┐": "┬", "└": "├", "┘": "┼", "├": "├", "┤": "┼", "┬": "┬", "┴": "┼"},
    "┐": {"─": "┬", "│": "┤", "┌": "┬", "└": "┼", "┘": "┤", "├": "┼", "┤": "┤", "┬": "┬", "┴": "┼"},
    "└": {"─": "┴", "│": "├", "┌": "├", "┐": "┼", "┘": "┴", "├": "├", "┤": "┼", "┬": "┼", "┴": "┴"},
    "┘": {"─": "┴", "│": "┤", "┌": "┼", "┐": "┤", "└": "┴", "├": "┼", "┤": "┤", "┬": "┼", "┴": "┴"},
    "├": {"─": "┼", "│": "├", "┌": "├", "┐": "┼", "└": "├", "┘": "┼", "┤": "┼", "┬": "┼", "┴": "┼"},
    "┤": {"─": "┼", "│": "┤", "┌": "┼", "┐": "┤", "└": "┼", "┘": "┤", "├": "┼", "┬": "┼", "┴": "┼"},
    "┬": {"─": "┬", "│": "┼", "┌": "┬", "┐": "┬", "└": "┼", "┘": "┼", "├": "┼", "┤": "┼", "┴": "┼"},
    "┴": {"─": "┴", "│": "┼", "┌": "┼", "┐": "┼", "└": "┴", "┘": "┴", "├": "┼", "┤": "┼", "┬": "┼"},
  };

  // Check if there's a defined merge for the two characters
  if (junctionMap[c1] && junctionMap[c1][c2]) {
    return junctionMap[c1][c2];
  }

  // If no merge is defined, return c1 as a fallback
  return c1;
}

/**
 * Check if a character is a junction character (ported from Go isJunctionChar)
 */
export function isJunctionChar(c: string): boolean {
  return junctionChars.includes(c);
}

/**
 * Merge multiple drawings into one (ported from Go mergeDrawings)
 */
export function mergeDrawings(
  baseDrawing: DrawingEngine,
  mergeCoord: DrawingCoord,
  ...drawings: DrawingEngine[]
): DrawingEngine {
  // Find the maximum dimensions
  let [maxX, maxY] = baseDrawing.getDrawingSize();
  
  for (const d of drawings) {
    const [dX, dY] = d.getDrawingSize();
    maxX = max(maxX, dX + mergeCoord.x);
    maxY = max(maxY, dY + mergeCoord.y);
  }

  // Create a new merged drawing with the maximum dimensions
  const mergedDrawing = new DrawingEngine(maxX, maxY);

  // Copy the base drawing
  const baseCanvas = baseDrawing.getCanvas();
  const mergedCanvas = mergedDrawing.getCanvas();
  
  for (let x = 0; x <= maxX; x++) {
    for (let y = 0; y <= maxY; y++) {
      if (x < baseCanvas.length && y < baseCanvas[0].length) {
        mergedCanvas[x][y] = baseCanvas[x][y];
      }
    }
  }

  // Merge all other drawings
  for (const d of drawings) {
    const dCanvas = d.getCanvas();
    for (let x = 0; x < dCanvas.length; x++) {
      for (let y = 0; y < dCanvas[0].length; y++) {
        const c = dCanvas[x][y];
        if (c !== " ") {
          const mergeX = x + mergeCoord.x;
          const mergeY = y + mergeCoord.y;
          if (mergeX < mergedCanvas.length && mergeY < mergedCanvas[0].length) {
            const currentChar = mergedCanvas[mergeX][mergeY];
            if (!useAscii && isJunctionChar(c) && isJunctionChar(currentChar)) {
              mergedCanvas[mergeX][mergeY] = mergeJunctions(currentChar, c);
            } else {
              mergedCanvas[mergeX][mergeY] = c;
            }
          }
        }
      }
    }
  }

  return mergedDrawing;
}

/**
 * Text color wrapping utility (ported from Go wrapTextInColor)
 */
export function wrapTextInColor(text: string, color: string, styleType: string): string {
  if (!color) {
    return text;
  }
  
  if (styleType === "html") {
    return `<span style='color: ${color}'>${text}</span>`;
  } else if (styleType === "cli") {
    // For CLI colors, we'd need a color library equivalent
    console.warn("CLI color styling not implemented in TypeScript version");
    return text;
  } else {
    console.warn(`Unknown style type ${styleType}`);
    return text;
  }
}

/**
 * Copy a drawing canvas (utility function)
 */
export function copyCanvas(toBeCopied: DrawingEngine): DrawingEngine {
  const [x, y] = toBeCopied.getDrawingSize();
  const newDrawing = new DrawingEngine(x, y);
  const sourceCanvas = toBeCopied.getCanvas();
  const newCanvas = newDrawing.getCanvas();
  
  for (let i = 0; i < sourceCanvas.length; i++) {
    for (let j = 0; j < sourceCanvas[i].length; j++) {
      newCanvas[i][j] = sourceCanvas[i][j];
    }
  }
  
  return newDrawing;
}
