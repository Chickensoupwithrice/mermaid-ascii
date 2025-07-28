/**
 * Main exports for all mermaid-ascii types
 */

// Common utilities and types
export {
  BOX_BORDER_PADDING,
  PADDING_BETWEEN_X,
  PADDING_BETWEEN_Y,
  graphDirection,
  useAscii,
  setGraphDirection,
  setUseAscii,
  min,
  max,
  abs,
  ceilDiv,
  type GenericCoord,
  GridCoord,
  DrawingCoord,
  type DirectionInterface
} from './common';

// Direction types
export {
  Direction,
  Up,
  Down,
  Left,
  Right,
  UpperRight,
  UpperLeft,
  LowerRight,
  LowerLeft,
  Middle,
  determineDirection,
  selfReferenceDirection,
  determineStartAndEndDir
} from './direction';

// Drawing types
export {
  JUNCTION_CHARS,
  type Drawing,
  type StyleClass,
  DrawingCanvas,
  wrapTextInColor
} from './drawing';

// Graph, Node, and Edge types
export {
  type TextNode,
  type TextEdge,
  type GraphProperties,
  type Node as NodeInterface,
  type Edge as EdgeInterface,
  type Graph as GraphInterface,
  createNode as Node,
  createEdge as Edge,
  Graph
} from './graph';
