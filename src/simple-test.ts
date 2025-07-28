/**
 * Simple test to verify the drawing system works
 */

import { DrawingEngine, drawBox } from './drawing';
import { DrawingCoord, GridCoord, setUseAscii } from './types/common';
import { NodeImpl } from './types/graph';

// Test basic drawing
console.log("=== Testing Basic Drawing ===");

const drawing = new DrawingEngine(15, 8);
drawing.drawText(new DrawingCoord(2, 3), "Hello World!");

console.log("Text drawing:");
console.log(drawing.toString());
console.log();

// Test line drawing
console.log("=== Testing Line Drawing ===");

setUseAscii(false);
const lineDrawing = new DrawingEngine(20, 10);

// Horizontal line
lineDrawing.drawLine(new DrawingCoord(2, 2), new DrawingCoord(15, 2));
// Vertical line  
lineDrawing.drawLine(new DrawingCoord(8, 1), new DrawingCoord(8, 6));

console.log("Unicode lines:");
console.log(lineDrawing.toString());
console.log();

// Test ASCII lines
setUseAscii(true);
const asciiDrawing = new DrawingEngine(20, 10);

// Horizontal line
asciiDrawing.drawLine(new DrawingCoord(2, 2), new DrawingCoord(15, 2));
// Vertical line
asciiDrawing.drawLine(new DrawingCoord(8, 1), new DrawingCoord(8, 6));

console.log("ASCII lines:");
console.log(asciiDrawing.toString());
console.log();

// Test box drawing
console.log("=== Testing Box Drawing ===");

const node = new NodeImpl("TestNode", 0);
node.gridCoord = new GridCoord(0, 0);

// Test Unicode box
setUseAscii(false);
let boxDrawing = drawBox(node, [0, 12, 12], [0, 6, 6]);
console.log("Unicode box:");
console.log(boxDrawing.toString());
console.log();

// Test ASCII box
setUseAscii(true);
boxDrawing = drawBox(node, [0, 12, 12], [0, 6, 6]);
console.log("ASCII box:");
console.log(boxDrawing.toString());
console.log();

console.log("All tests completed successfully!");
