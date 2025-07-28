/**
 * Drawing types and utilities ported from draw.go
 */

import { DrawingCoord, max, useAscii } from './common';
import { Direction, determineDirection, Up, Down, Left, Right, UpperLeft, UpperRight, LowerLeft, LowerRight } from './direction';

// Junction characters for Unicode drawing
export const JUNCTION_CHARS = [
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

export type Drawing = string[][];

export interface StyleClass {
  name: string;
  styles: Map<string, string>;
}

export class DrawingCanvas {
  private canvas: Drawing;

  constructor(width: number, height: number) {
    this.canvas = this.makeDrawing(width, height);
  }

  private makeDrawing(x: number, y: number): Drawing {
    const drawing: Drawing = [];
    for (let i = 0; i <= x; i++) {
      drawing[i] = [];
      for (let j = 0; j <= y; j++) {
        drawing[i][j] = " ";
      }
    }
    return drawing;
  }

  getCanvas(): Drawing {
    return this.canvas;
  }

  drawText(start: DrawingCoord, text: string): void {
    // Increase dimensions if necessary
    this.increaseSize(start.x + text.length, start.y);
    
    for (let x = 0; x < text.length; x++) {
      this.canvas[x + start.x][start.y] = text[x];
    }
  }

  drawLine(from: DrawingCoord, to: DrawingCoord, offsetFrom: number = 0, offsetTo: number = 0): DrawingCoord[] {
    const direction = determineDirection(from, to);
    const drawnCoords: DrawingCoord[] = [];

    if (!useAscii) {
      this.drawUnicodeLine(from, to, direction, offsetFrom, offsetTo, drawnCoords);
    } else {
      this.drawAsciiLine(from, to, direction, offsetFrom, offsetTo, drawnCoords);
    }

    return drawnCoords;
  }

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

  getDrawingSize(): [number, number] {
    return [this.canvas.length - 1, this.canvas[0].length - 1];
  }

  static copyCanvas(toBeCopied: Drawing): DrawingCanvas {
    const [x, y] = DrawingCanvas.getStaticDrawingSize(toBeCopied);
    return new DrawingCanvas(x, y);
  }

  static getStaticDrawingSize(d: Drawing): [number, number] {
    return [d.length - 1, d[0].length - 1];
  }

  static mergeJunctions(c1: string, c2: string): string {
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

    if (junctionMap[c1] && junctionMap[c1][c2]) {
      return junctionMap[c1][c2];
    }

    return c1;
  }

  static isJunctionChar(c: string): boolean {
    return JUNCTION_CHARS.includes(c);
  }

  static mergeDrawings(baseDrawing: Drawing, mergeCoord: DrawingCoord, ...drawings: Drawing[]): Drawing {
    // Find the maximum dimensions
    let [maxX, maxY] = DrawingCanvas.getStaticDrawingSize(baseDrawing);
    
    for (const d of drawings) {
      const [dX, dY] = DrawingCanvas.getStaticDrawingSize(d);
      maxX = max(maxX, dX + mergeCoord.x);
      maxY = max(maxY, dY + mergeCoord.y);
    }

    // Create a new merged drawing with the maximum dimensions
    const mergedCanvas = new DrawingCanvas(maxX, maxY);
    const mergedDrawing = mergedCanvas.getCanvas();

    // Copy the base drawing
    for (let x = 0; x <= maxX; x++) {
      for (let y = 0; y <= maxY; y++) {
        if (x < baseDrawing.length && y < baseDrawing[0].length) {
          mergedDrawing[x][y] = baseDrawing[x][y];
        }
      }
    }

    // Merge all other drawings
    for (const d of drawings) {
      for (let x = 0; x < d.length; x++) {
        for (let y = 0; y < d[0].length; y++) {
          const c = d[x][y];
          if (c !== " ") {
            const currentChar = mergedDrawing[x + mergeCoord.x][y + mergeCoord.y];
            if (!useAscii && DrawingCanvas.isJunctionChar(c) && DrawingCanvas.isJunctionChar(currentChar)) {
              mergedDrawing[x + mergeCoord.x][y + mergeCoord.y] = DrawingCanvas.mergeJunctions(currentChar, c);
            } else {
              mergedDrawing[x + mergeCoord.x][y + mergeCoord.y] = c;
            }
          }
        }
      }
    }

    return mergedDrawing;
  }

  static drawingToString(d: Drawing): string {
    const [maxX, maxY] = DrawingCanvas.getStaticDrawingSize(d);
    let result = "";
    
    for (let y = 0; y <= maxY; y++) {
      for (let x = 0; x <= maxX; x++) {
        result += d[x][y];
      }
      if (y !== maxY) {
        result += "\n";
      }
    }
    
    return result;
  }
}

export function wrapTextInColor(text: string, color: string, styleType: string): string {
  if (!color) {
    return text;
  }
  
  if (styleType === "html") {
    return `<span style='color: ${color}'>${text}</span>`;
  } else if (styleType === "cli") {
    // For CLI colors, we'd need a color library equivalent
    // For now, just return the text
    console.warn("CLI color styling not implemented in TypeScript version");
    return text;
  } else {
    console.warn(`Unknown style type ${styleType}`);
    return text;
  }
}
