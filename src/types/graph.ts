/**
 * Graph, Node, and Edge types ported from Go source files
 * Updated to use the new DrawingEngine
 */

import { 
  GridCoord, 
  DrawingCoord, 
  max, 
  BOX_BORDER_PADDING, 
  PADDING_BETWEEN_X, 
  PADDING_BETWEEN_Y,
  graphDirection
} from './common';
import { Direction, determineStartAndEndDir } from './direction';
import { StyleClass } from './drawing';
import { getPath, mergePath } from '../pathfinding';
import { DrawingEngine, drawBox, drawEdge, mergeDrawings } from '../drawing';

// Text-based structures for parsing
export interface TextNode {
  name: string;
  styleClass: string;
}

export interface TextEdge {
  parent: TextNode;
  child: TextNode;
  label: string;
}

export interface GraphProperties {
  data: Map<string, TextEdge[]>;
  styleClasses: Map<string, StyleClass>;
  graphDirection: string;
  styleType: string;
}

// Core Node interface for drawing system
export interface Node {
  name: string;
  drawing?: DrawingEngine;
  drawingCoord?: DrawingCoord;
  gridCoord?: GridCoord;
  drawn: boolean;
  index: number;
  styleClassName: string;
  styleClass: StyleClass;
  setCoord(c: DrawingCoord): void;
  toString(): string;
}

// Core Edge interface
export interface Edge {
  from: Node;
  to: Node;
  text: string;
  path: GridCoord[];
  labelLine: GridCoord[];
  startDir?: Direction;
  endDir?: Direction;
}

// Core Graph interface
export interface Graph {
  nodes: Node[];
  edges: Edge[];
  drawing?: DrawingEngine;
  grid: Map<string, Node>;
  columnWidth: Map<number, number>;
  rowHeight: Map<number, number>;
  styleClasses: Map<string, StyleClass>;
  styleType: string;
  
  // Methods that are expected in tests and usage
  appendNode(node: Node): void;
  getNode(name: string): Node | null;
  setStyleClasses(properties: any): void;
  createMapping(): void;
  draw(): DrawingEngine;
}

// Node implementation class
export class NodeImpl implements Node {
  public name: string;
  public drawing?: DrawingEngine;
  public drawingCoord?: DrawingCoord;
  public gridCoord?: GridCoord;
  public drawn: boolean = false;
  public index: number;
  public styleClassName: string;
  public styleClass: StyleClass;

  constructor(
    name: string, 
    index: number, 
    styleClassName: string = "",
    styleClass?: StyleClass
  ) {
    this.name = name;
    this.index = index;
    this.styleClassName = styleClassName;
    this.styleClass = styleClass || { name: "", styles: new Map() };
  }

  toString(): string {
    return this.name;
  }

  setCoord(c: DrawingCoord): void {
    this.drawingCoord = c;
  }

  setDrawing(g: GraphImpl): DrawingEngine {
    const columnWidths: number[] = [];
    const rowHeights: number[] = [];
    
    // Convert Maps to arrays for drawBox function
    for (let i = 0; i < 100; i++) {
      columnWidths[i] = g.columnWidth.get(i) || 0;
      rowHeights[i] = g.rowHeight.get(i) || 0;
    }
    
    const d = drawBox(this, columnWidths, rowHeights);
    this.drawing = d;
    return d;
  }
}

// Edge implementation class
export class EdgeImpl implements Edge {
  public from: Node;
  public to: Node;
  public text: string;
  public path: GridCoord[] = [];
  public labelLine: GridCoord[] = [];
  public startDir?: Direction;
  public endDir?: Direction;

  constructor(from: Node, to: Node, text: string = "") {
    this.from = from;
    this.to = to;
    this.text = text;
  }

  determinePath(g: GraphImpl): void {
    if (!this.from.gridCoord || !this.to.gridCoord) {
      return;
    }
    
    // Get both paths and use least amount of steps
    let preferredPath: GridCoord[] = [];
    let alternativePath: GridCoord[] = [];
    
    const isSelfReference = this.from === this.to;
    if (isSelfReference) {
      console.debug(`Self-reference edge from ${this.from.name} to ${this.to.name}`);
    }
    
    const [preferredDir, preferredOppositeDir, alternativeDir, alternativeOppositeDir] = 
      determineStartAndEndDir(this.from.gridCoord, this.to.gridCoord, isSelfReference);
    
    if (isSelfReference) {
      console.debug(`Directions: preferred=${preferredDir.x},${preferredDir.y} -> ${preferredOppositeDir.x},${preferredOppositeDir.y}, alt=${alternativeDir.x},${alternativeDir.y} -> ${alternativeOppositeDir.x},${alternativeOppositeDir.y}`);
    }

    // Get preferred path
    const from = this.from.gridCoord.direction(preferredDir);
    const to = this.to.gridCoord.direction(preferredOppositeDir);
    
    if (isSelfReference) {
      console.debug(`Path from ${from.x},${from.y} to ${to.x},${to.y}`);
    }
    
    try {
      preferredPath = getPath(from, to, (coord) => g.isFreeInGrid(coord));
      preferredPath = mergePath(preferredPath);
      if (isSelfReference) {
        console.debug(`Preferred path: ${preferredPath.map(p => `${p.x},${p.y}`).join(' -> ')}`);
      }
    } catch (err) {
      console.error(`Error getting path from ${from} to ${to}: ${err}`);
      this.startDir = alternativeDir;
      this.endDir = alternativeOppositeDir;
      this.path = alternativePath;
      return;
    }

    // Alternative path
    const altFrom = this.from.gridCoord!.direction(alternativeDir);
    const altTo = this.to.gridCoord!.direction(alternativeOppositeDir);
    
    try {
      alternativePath = getPath(altFrom, altTo, (coord) => g.isFreeInGrid(coord));
      alternativePath = mergePath(alternativePath);
    } catch (err) {
      console.error(`Error getting path from ${altFrom} to ${altTo}: ${err}`);
      this.startDir = preferredDir;
      this.endDir = preferredOppositeDir;
      this.path = preferredPath;
      return;
    }

    const nrStepsPreferred = preferredPath.length;
    const nrStepsAlternative = alternativePath.length;
    
    if (nrStepsPreferred <= nrStepsAlternative) {
      this.startDir = preferredDir;
      this.endDir = preferredOppositeDir;
      this.path = preferredPath;
    } else {
      this.startDir = alternativeDir;
      this.endDir = alternativeOppositeDir;
      this.path = alternativePath;
    }
  }

  determineLabelLine(g: GraphImpl): void {
    const lenLabel = this.text.length;
    if (lenLabel === 0) {
      return;
    }

    let prevStep = this.path[0];
    let largestLineSize = 0;
    let largestLine = [prevStep, this.path[1]];

    for (let i = 1; i < this.path.length; i++) {
      const step = this.path[i];
      const line = [prevStep, step];
      const lineWidth = g.calculateLineWidth(line);
      
      if (lineWidth >= lenLabel) {
        largestLine = line;
        break;
      } else if (lineWidth > largestLineSize) {
        largestLineSize = lineWidth;
        largestLine = line;
      }
      prevStep = step;
    }

    const maxX = Math.max(largestLine[0].x, largestLine[1].x);
    const minX = Math.min(largestLine[0].x, largestLine[1].x);
    const middleX = minX + Math.floor((maxX - minX) / 2);
    
    const currentWidth = g.columnWidth.get(middleX) || 0;
    g.columnWidth.set(middleX, max(currentWidth, lenLabel + 2));
    
    this.labelLine = largestLine;
  }
}

// Factory functions for creating instances while maintaining interface design
export function createNode(name: string, index: number, styleClassName: string = ""): Node {
  return new NodeImpl(name, index, styleClassName);
}

export function createEdge(from: Node, to: Node, text: string = ""): Edge {
  return new EdgeImpl(from, to, text);
}

export function createGraph(): Graph {
  return new GraphImpl();
}

// Create a Graph constructor-like object that includes static methods
export const Graph = Object.assign(createGraph, {
  makeGraph: (data: Map<string, TextEdge[]>): Graph => GraphImpl.makeGraph(data)
});

// Core Graph implementation class
export class GraphImpl implements Graph {
  public nodes: Node[] = [];
  public edges: Edge[] = [];
  public drawing?: DrawingEngine;
  public grid: Map<string, Node> = new Map();
  public columnWidth: Map<number, number> = new Map();
  public rowHeight: Map<number, number> = new Map();
  public styleClasses: Map<string, StyleClass> = new Map();
  public styleType: string = "";

  constructor() {
    this.drawing = new DrawingEngine(0, 0);
  }

  static makeGraph(data: Map<string, TextEdge[]>): GraphImpl {
    const g = new GraphImpl();
    let index = 0;

    
    for (const [nodeName, children] of Array.from(data.entries())) {
      // Get or create parent node
      let parentNode = g.getNode(nodeName);
      if (!parentNode) {
        parentNode = new NodeImpl(nodeName, index, "");
        g.appendNode(parentNode);
        index++;
      }

      for (const textEdge of children) {
        let childNode = g.getNode(textEdge.child.name);
        if (!childNode) {
          childNode = new NodeImpl(textEdge.child.name, index, textEdge.child.styleClass);
          parentNode.styleClassName = textEdge.parent.styleClass;
          g.appendNode(childNode);
          index++;
        }
        
        const e = new EdgeImpl(parentNode, childNode, textEdge.label);
        g.edges.push(e);
      }
    }

    return g;
  }

  setStyleClasses(properties: GraphProperties): void {
    this.styleClasses = properties.styleClasses;
    this.styleType = properties.styleType;
    
    for (const n of this.nodes) {
      if (n.styleClassName) {
        const styleClass = this.styleClasses.get(n.styleClassName);
        if (styleClass) {
          n.styleClass = styleClass;
        }
      }
    }
  }

  createMapping(): void {
    // Set mapping coord for every node in the graph
    const highestPositionPerLevel: number[] = new Array(100).fill(0);

    // Set root nodes to level 0
    const nodesFound = new Set<string>();
    const rootNodes: Node[] = [];
    
    for (const n of this.nodes) {
      if (!nodesFound.has(n.name)) {
        rootNodes.push(n);
      }
      nodesFound.add(n.name);
      
      for (const child of this.getChildren(n)) {
        nodesFound.add(child.name);
      }
    }

    for (const n of rootNodes) {
      let mappingCoord: GridCoord;
      if (graphDirection === "LR") {
        mappingCoord = this.reserveSpotInGrid(this.nodes[n.index], new GridCoord(0, highestPositionPerLevel[0]));
      } else {
        mappingCoord = this.reserveSpotInGrid(this.nodes[n.index], new GridCoord(highestPositionPerLevel[0], 0));
      }
      
      this.nodes[n.index].gridCoord = mappingCoord;
      highestPositionPerLevel[0] = highestPositionPerLevel[0] + 4;
    }

    for (const n of this.nodes) {
      if (!n.gridCoord) continue;
      
      
      let childLevel: number;
      if (graphDirection === "LR") {
        childLevel = n.gridCoord.x + 4;
      } else {
        childLevel = n.gridCoord.y + 4;
      }
      
      let highestPosition = highestPositionPerLevel[childLevel];
      
      for (const child of this.getChildren(n)) {
        // Skip if the child already has a mapping coord (matches Go logic: child.gridCoord != nil)
        if (child.gridCoord) {
          continue;
        }

        let mappingCoord: GridCoord;
        if (graphDirection === "LR") {
          mappingCoord = this.reserveSpotInGrid(this.nodes[child.index], new GridCoord(childLevel, highestPosition));
        } else {
          mappingCoord = this.reserveSpotInGrid(this.nodes[child.index], new GridCoord(highestPosition, childLevel));
        }
        
        this.nodes[child.index].gridCoord = mappingCoord;
        highestPositionPerLevel[childLevel] = highestPosition + 4;
      }
    }

    for (const n of this.nodes) {
      this.setColumnWidth(n);
    }

    for (const e of this.edges) {
      (e as EdgeImpl).determinePath(this);
      this.increaseGridSizeForPath(e.path);
      (e as EdgeImpl).determineLabelLine(this);
    }

    for (const n of this.nodes) {
      if (n.gridCoord) {
        const dc = this.gridToDrawingCoord(n.gridCoord);
        this.nodes[n.index].setCoord(dc);
        (this.nodes[n.index] as NodeImpl).setDrawing(this);
      }
    }
    
    this.setDrawingSizeToGridConstraints();
  }

  draw(): DrawingEngine {
    // Draw all nodes
    for (const node of this.nodes) {
      if (!node.drawn) {
        this.drawNode(node);
      }
    }

    const lineDrawings: DrawingEngine[] = [];
    const cornerDrawings: DrawingEngine[] = [];
    const arrowHeadDrawings: DrawingEngine[] = [];
    const boxStartDrawings: DrawingEngine[] = [];
    const labelDrawings: DrawingEngine[] = [];

    for (const edge of this.edges) {
      const [line, boxStart, arrowHead, corners, label] = this.drawEdge(edge);
      lineDrawings.push(line);
      cornerDrawings.push(corners);
      arrowHeadDrawings.push(arrowHead);
      boxStartDrawings.push(boxStart);
      labelDrawings.push(label);
    }

    // Draw in order
    this.drawing = mergeDrawings(this.drawing!, new DrawingCoord(0, 0), ...lineDrawings);
    this.drawing = mergeDrawings(this.drawing!, new DrawingCoord(0, 0), ...cornerDrawings);
    this.drawing = mergeDrawings(this.drawing!, new DrawingCoord(0, 0), ...arrowHeadDrawings);
    this.drawing = mergeDrawings(this.drawing!, new DrawingCoord(0, 0), ...boxStartDrawings);
    this.drawing = mergeDrawings(this.drawing!, new DrawingCoord(0, 0), ...labelDrawings);
    
    return this.drawing!;
  }

  getNode(nodeName: string): Node | null {
    for (const n of this.nodes) {
      if (n.name === nodeName) {
        return n;
      }
    }
    return null;
  }

  appendNode(n: Node): void {
    this.nodes.push(n);
  }

  getEdgesFromNode(n: Node): Edge[] {
    const edges: Edge[] = [];
    for (const edge of this.edges) {
      if (edge.from.name === n.name) {
        edges.push(edge);
      }
    }
    return edges;
  }

  getChildren(n: Node): Node[] {
    const edges = this.getEdgesFromNode(n);
    const children: Node[] = [];
    for (const edge of edges) {
      if (edge.from.name === n.name) {
        children.push(edge.to);
      }
    }
    return children;
  }

  gridToDrawingCoord(c: GridCoord, dir?: Direction): DrawingCoord {
    let x = 0;
    let y = 0;
    let target: GridCoord;
    
    if (!dir) {
      target = c;
    } else {
      target = new GridCoord(c.x + dir.x, c.y + dir.y);
    }

    for (let column = 0; column < target.x; column++) {
      x += this.columnWidth.get(column) || 0;
    }
    
    for (let row = 0; row < target.y; row++) {
      y += this.rowHeight.get(row) || 0;
    }

    const columnWidth = this.columnWidth.get(target.x) || 0;
    const rowHeight = this.rowHeight.get(target.y) || 0;
    
    return new DrawingCoord(
      x + Math.floor(columnWidth / 2), 
      y + Math.floor(rowHeight / 2)
    );
  }

  lineToDrawing(line: GridCoord[]): DrawingCoord[] {
    const dc: DrawingCoord[] = [];
    for (const c of line) {
      dc.push(this.gridToDrawingCoord(c));
    }
    return dc;
  }

  private setColumnWidth(n: Node): void {
    if (!n.gridCoord) return;
    
    // For every node there are three columns:
    // - 2 lines of border
    // - 1 line of text
    // - 2x padding
    // - 2x margin
    const col1 = 1;
    const col2 = 2 * BOX_BORDER_PADDING + n.name.length;
    const col3 = 1;
    const colsToBePlaced = [col1, col2, col3];
    const rowsToBePlaced = [1, 1 + 2 * BOX_BORDER_PADDING, 1];

    for (let idx = 0; idx < colsToBePlaced.length; idx++) {
      const col = colsToBePlaced[idx];
      const xCoord = n.gridCoord.x + idx;
      const currentWidth = this.columnWidth.get(xCoord) || 0;
      this.columnWidth.set(xCoord, max(currentWidth, col));
    }

    for (let idx = 0; idx < rowsToBePlaced.length; idx++) {
      const row = rowsToBePlaced[idx];
      const yCoord = n.gridCoord.y + idx;
      const currentHeight = this.rowHeight.get(yCoord) || 0;
      this.rowHeight.set(yCoord, max(currentHeight, row));
    }

    // Set padding before node
    if (n.gridCoord.x > 0) {
      this.columnWidth.set(n.gridCoord.x - 1, PADDING_BETWEEN_X);
    }
    if (n.gridCoord.y > 0) {
      this.rowHeight.set(n.gridCoord.y - 1, PADDING_BETWEEN_Y);
    }
  }

  private increaseGridSizeForPath(path: GridCoord[]): void {
    for (const c of path) {
      if (!this.columnWidth.has(c.x)) {
        this.columnWidth.set(c.x, Math.floor(PADDING_BETWEEN_X / 2));
      }
      if (!this.rowHeight.has(c.y)) {
        this.rowHeight.set(c.y, Math.floor(PADDING_BETWEEN_Y / 2));
      }
    }
  }

  private reserveSpotInGrid(n: Node, requestedCoord: GridCoord): GridCoord {
    const key = `${requestedCoord.x},${requestedCoord.y}`;
    if (this.grid.has(key)) {
      if (graphDirection === "LR") {
        return this.reserveSpotInGrid(n, new GridCoord(requestedCoord.x, requestedCoord.y + 4));
      } else {
        return this.reserveSpotInGrid(n, new GridCoord(requestedCoord.x + 4, requestedCoord.y));
      }
    }

    // Reserve border + middle + border for node
    for (let x = 0; x < 3; x++) {
      for (let y = 0; y < 3; y++) {
        const reservedCoord = new GridCoord(requestedCoord.x + x, requestedCoord.y + y);
        const reservedKey = `${reservedCoord.x},${reservedCoord.y}`;
        this.grid.set(reservedKey, n);
      }
    }
    
    n.gridCoord = requestedCoord;
    return requestedCoord;
  }

  private setDrawingSizeToGridConstraints(): void {
    let maxX = 0;
    let maxY = 0;
    
    for (const w of Array.from(this.columnWidth.values())) {
      maxX += w;
    }
    
    for (const h of Array.from(this.rowHeight.values())) {
      maxY += h;
    }

    if (this.drawing) {
      this.drawing.increaseSize(maxX - 1, maxY - 1);
    }
  }

  private drawNode(n: Node): void {
    if (!n.drawingCoord || !n.drawing) return;
    
    this.drawing = mergeDrawings(this.drawing!, n.drawingCoord, n.drawing);
    n.drawn = true;
  }

  private drawEdge(e: Edge): [DrawingEngine, DrawingEngine, DrawingEngine, DrawingEngine, DrawingEngine] {
    if (!e.startDir || !e.endDir || !e.from.gridCoord || !e.to.gridCoord) {
      const empty = new DrawingEngine(0, 0);
      return [empty, empty, empty, empty, empty];
    }

    const from = e.from.gridCoord.direction(e.startDir);
    const to = e.to.gridCoord.direction(e.endDir);
    
    return drawEdge(from, to, e, (coord, dir) => this.gridToDrawingCoord(coord, dir), this.drawing!);
  }

  calculateLineWidth(line: GridCoord[]): number {
    let totalSize = 0;
    for (const c of line) {
      totalSize += this.columnWidth.get(c.x) || 0;
    }
    return totalSize;
  }

  isFreeInGrid(c: GridCoord): boolean {
    // We'll fix it later if we overshoot the grid size
    if (c.x < 0 || c.y < 0) {
      return false;
    }
    const key = `${c.x},${c.y}`;
    return !this.grid.has(key);
  }
}
