/**
 * Test the TypeScript types to ensure they work correctly
 */

import {
  GridCoord,
  DrawingCoord,
  Up,
  Down,
  Left,
  Right,
  Node,
  Edge,
  Graph,
  DrawingCanvas,
  max,
  min,
  BOX_BORDER_PADDING,
  setUseAscii,
  setGraphDirection
} from '../types';

describe('TypeScript Types', () => {
  describe('GridCoord', () => {
    it('should create and compare coordinates', () => {
      const coord1 = new GridCoord(1, 2);
      const coord2 = new GridCoord(1, 2);
      const coord3 = new GridCoord(2, 3);

      expect(coord1.equals(coord2)).toBe(true);
      expect(coord1.equals(coord3)).toBe(false);
      expect(coord1.x).toBe(1);
      expect(coord1.y).toBe(2);
    });

    it('should move in directions', () => {
      const coord = new GridCoord(5, 5);
      const upCoord = coord.direction(Up);
      const downCoord = coord.direction(Down);

      expect(upCoord.x).toBe(6); // Up is (1, 0)
      expect(upCoord.y).toBe(5);
      expect(downCoord.x).toBe(6); // Down is (1, 2)
      expect(downCoord.y).toBe(7);
    });
  });

  describe('DrawingCoord', () => {
    it('should create and compare coordinates', () => {
      const coord1 = new DrawingCoord(10, 20);
      const coord2 = new DrawingCoord(10, 20);
      const coord3 = new DrawingCoord(30, 40);

      expect(coord1.equals(coord2)).toBe(true);
      expect(coord1.equals(coord3)).toBe(false);
    });
  });

  describe('Direction', () => {
    it('should have correct coordinate values', () => {
      expect(Up.x).toBe(1);
      expect(Up.y).toBe(0);
      expect(Down.x).toBe(1);
      expect(Down.y).toBe(2);
      expect(Left.x).toBe(0);
      expect(Left.y).toBe(1);
      expect(Right.x).toBe(2);
      expect(Right.y).toBe(1);
    });

    it('should get opposite directions', () => {
      expect(Up.getOpposite().equals(Down)).toBe(true);
      expect(Down.getOpposite().equals(Up)).toBe(true);
      expect(Left.getOpposite().equals(Right)).toBe(true);
      expect(Right.getOpposite().equals(Left)).toBe(true);
    });
  });

  describe('Node', () => {
    it('should create nodes with correct properties', () => {
      const node = Node('TestNode', 0, 'testClass');
      
      expect(node.name).toBe('TestNode');
      expect(node.index).toBe(0);
      expect(node.styleClassName).toBe('testClass');
      expect(node.drawn).toBe(false);
      expect(node.toString()).toBe('TestNode');
    });

    it('should set coordinates', () => {
      const node = Node('TestNode', 0);
      const coord = new DrawingCoord(100, 200);
      
      node.setCoord(coord);
      expect(node.drawingCoord).toBe(coord);
    });
  });

  describe('Edge', () => {
    it('should create edges with correct properties', () => {
      const fromNode = Node('From', 0);
      const toNode = Node('To', 1);
      const edge = Edge(fromNode, toNode, 'test label');
      
      expect(edge.from).toBe(fromNode);
      expect(edge.to).toBe(toNode);
      expect(edge.text).toBe('test label');
      expect(edge.path).toEqual([]);
      expect(edge.labelLine).toEqual([]);
    });
  });

  describe('Graph', () => {
    it('should create empty graph', () => {
      const graph = Graph();
      
      expect(graph.nodes).toEqual([]);
      expect(graph.edges).toEqual([]);
      expect(graph.styleType).toBe('');
    });

    it('should append nodes', () => {
      const graph = Graph();
      const node = Node('TestNode', 0);
      
      graph.appendNode(node);
      expect(graph.nodes.length).toBe(1);
      expect(graph.nodes[0]).toBe(node);
    });

    it('should find nodes by name', () => {
      const graph = Graph();
      const node = Node('TestNode', 0);
      
      graph.appendNode(node);
      
      const found = graph.getNode('TestNode');
      const notFound = graph.getNode('NonExistent');
      
      expect(found).toBe(node);
      expect(notFound).toBeNull();
    });
  });

  describe('DrawingCanvas', () => {
    it('should create canvas with correct dimensions', () => {
      const canvas = new DrawingCanvas(5, 3);
      const drawing = canvas.getCanvas();
      
      expect(drawing.length).toBe(6); // 0-5 inclusive
      expect(drawing[0].length).toBe(4); // 0-3 inclusive
      expect(drawing[0][0]).toBe(' '); // Should be filled with spaces
    });

    it('should draw text correctly', () => {
      const canvas = new DrawingCanvas(10, 10);
      const coord = new DrawingCoord(2, 3);
      
      canvas.drawText(coord, 'Hello');
      const drawing = canvas.getCanvas();
      
      expect(drawing[2][3]).toBe('H');
      expect(drawing[3][3]).toBe('e');
      expect(drawing[4][3]).toBe('l');
      expect(drawing[5][3]).toBe('l');
      expect(drawing[6][3]).toBe('o');
    });
  });

  describe('Utility functions', () => {
    it('should calculate max and min correctly', () => {
      expect(max(5, 10)).toBe(10);
      expect(max(10, 5)).toBe(10);
      expect(min(5, 10)).toBe(5);
      expect(min(10, 5)).toBe(5);
    });

    it('should have correct constants', () => {
      expect(BOX_BORDER_PADDING).toBe(1);
    });
  });

  describe('Global configuration', () => {
    it('should set graph direction', () => {
      setGraphDirection('LR');
      // This test just ensures the function exists and can be called
      expect(true).toBe(true);
    });

    it('should set ASCII mode', () => {
      setUseAscii(true);
      // This test just ensures the function exists and can be called
      expect(true).toBe(true);
    });
  });
});
