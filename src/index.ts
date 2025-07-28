/**
 * Mermaid ASCII - Convert Mermaid diagrams to ASCII art
 * 
 * @example
 * ```typescript
 * import { mermaidToAscii } from 'mermaid-ascii';
 * 
 * const diagram = `
 * graph LR
 *   A --> B
 *   B --> C
 * `;
 * 
 * const ascii = mermaidToAscii(diagram);
 * console.log(ascii);
 * ```
 */

import { mermaidFileToMap } from './parser';
import { Graph } from './types/graph';
import { DrawingCanvas } from './types/drawing';
import { setUseAscii } from './types/common';

// Export all types for library usage
export * from './types';

// Export core functions for advanced usage
export { mermaidFileToMap } from './parser';
export { DrawingEngine, drawBox, drawEdge, mergeDrawings } from './drawing';

/**
 * Options for mermaid to ASCII conversion
 */
export interface MermaidToAsciiOptions {
  /** Use pure ASCII characters instead of Unicode box drawing characters */
  useAscii?: boolean;
  /** Style type for the diagram (currently supports basic styling) */
  styleType?: string;
}

/**
 * Convert a Mermaid diagram string to ASCII art
 * 
 * This is the main high-level function for converting Mermaid diagrams to ASCII.
 * 
 * @param input - Mermaid diagram as a string
 * @param options - Optional configuration for the conversion
 * @returns ASCII art representation of the diagram
 * 
 * @example
 * ```typescript
 * const diagram = `
 * graph TD
 *   A[Start] --> B{Decision}
 *   B -->|Yes| C[Action 1]
 *   B -->|No| D[Action 2]
 *   C --> E[End]
 *   D --> E
 * `;
 * 
 * const ascii = mermaidToAscii(diagram, { useAscii: true });
 * console.log(ascii);
 * ```
 */
export function mermaidToAscii(input: string, options: MermaidToAsciiOptions = {}): string {
  const { useAscii = false, styleType = 'basic' } = options;
  
  // Set global ASCII mode if requested
  if (useAscii) {
    setUseAscii(true);
  }
  
  try {
    // Parse the mermaid input
    const properties = mermaidFileToMap(input, styleType);
    
    // Create graph and generate ASCII
    const graph = Graph.makeGraph(properties.data);
    graph.setStyleClasses(properties);
    graph.createMapping();
    const drawingEngine = graph.draw();
    const output = DrawingCanvas.drawingToString(drawingEngine.getCanvas());
    
    return output;
  } catch (error) {
    throw new Error(`Failed to convert Mermaid to ASCII: ${error instanceof Error ? error.message : String(error)}`);
  }
}
