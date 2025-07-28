/**
 * Mermaid parser ported from Go to TypeScript
 * Main entry point for parsing mermaid syntax into GraphProperties
 */

import { TextNode, TextEdge, GraphProperties } from './types/graph';
import { StyleClass } from './types/drawing';
import { setGraphDirection } from './types/common';

/**
 * Parse a node with optional style class
 * Format: nodeName or nodeName:::styleClass
 */
export function parseNode(line: string): TextNode {
  // Trim any whitespace from the line that might be left after comment removal
  const trimmedLine = line.trim();
  
  const nodeWithClassRegex = /^(.+):::(.+)$/;
  const match = nodeWithClassRegex.exec(trimmedLine);
  
  if (match) {
    return {
      name: match[1].trim(),
      styleClass: match[2].trim()
    };
  } else {
    return {
      name: trimmedLine,
      styleClass: ""
    };
  }
}

/**
 * Parse style class definition
 * Format: classDef className style1:value1,style2:value2
 */
export function parseStyleClass(matchedLine: string[]): StyleClass {
  const className = matchedLine[0];
  const styles = matchedLine[1];
  
  // Styles are comma separated and key-values are separated by colon
  // Example: fill:#f9f,stroke:#333,stroke-width:4px
  const styleMap = new Map<string, string>();
  
  for (const style of styles.split(",")) {
    const kv = style.split(":");
    if (kv.length >= 2) {
      styleMap.set(kv[0], kv[1]);
    }
  }
  
  return {
    name: className,
    styles: styleMap
  };
}

/**
 * Set arrow connection with label between nodes
 */
function setArrowWithLabel(
  lhs: TextNode[], 
  rhs: TextNode[], 
  label: string, 
  data: Map<string, TextEdge[]>
): TextNode[] {
  console.debug("Setting arrow from", lhs, "to", rhs, "with label", label);
  
  for (const l of lhs) {
    for (const r of rhs) {
      setData(l, { parent: l, child: r, label }, data);
    }
  }
  
  return rhs;
}

/**
 * Set arrow connection without label between nodes
 */
function setArrow(lhs: TextNode[], rhs: TextNode[], data: Map<string, TextEdge[]>): TextNode[] {
  return setArrowWithLabel(lhs, rhs, "", data);
}

/**
 * Add a node to the data map if it doesn't exist
 */
function addNode(node: TextNode, data: Map<string, TextEdge[]>): void {
  if (!data.has(node.name)) {
    data.set(node.name, []);
  }
}

/**
 * Set edge data in the map
 */
function setData(parent: TextNode, edge: TextEdge, data: Map<string, TextEdge[]>): void {
  // Check if the parent is in the map
  if (data.has(parent.name)) {
    // If it is, append the child to the list of children
    const children = data.get(parent.name)!;
    children.push(edge);
  } else {
    // If it isn't, add it to the map
    data.set(parent.name, [edge]);
  }
  
  // Check if the child is in the map
  if (!data.has(edge.child.name)) {
    // If it isn't, add it to the map
    data.set(edge.child.name, []);
  }
}

/**
 * Parse a single line of mermaid syntax
 */
export function parseString(
  line: string, 
  data: Map<string, TextEdge[]>, 
  styleClasses: Map<string, StyleClass>
): TextNode[] {
  console.debug("Parsing line:", line);
  
  let lhs: TextNode[] = [];
  let rhs: TextNode[] = [];
  
  // Patterns are matched in order
  const patterns = [
    {
      // Empty lines
      regex: /^\s*$/,
      handler: (_match: RegExpMatchArray): TextNode[] => {
        // Ignore empty lines
        return [];
      }
    },
    {
      // Arrow: A --> B
      regex: /^(.+)\s+-->\s+(.+)$/,
      handler: (match: RegExpMatchArray): TextNode[] => {
        try {
          lhs = parseString(match[1], data, styleClasses);
        } catch {
          lhs = [parseNode(match[1])];
        }
        
        try {
          rhs = parseString(match[2], data, styleClasses);
        } catch {
          rhs = [parseNode(match[2])];
        }
        
        return setArrow(lhs, rhs, data);
      }
    },
    {
      // Arrow with label: A -->|label| B
      regex: /^(.+)\s+-->\|(.+)\|\s+(.+)$/,
      handler: (match: RegExpMatchArray): TextNode[] => {
        try {
          lhs = parseString(match[1], data, styleClasses);
        } catch {
          lhs = [parseNode(match[1])];
        }
        
        try {
          rhs = parseString(match[3], data, styleClasses);
        } catch {
          rhs = [parseNode(match[3])];
        }
        
        return setArrowWithLabel(lhs, rhs, match[2], data);
      }
    },
    {
      // Style class definition: classDef className styles
      regex: /^classDef\s+(.+)\s+(.+)$/,
      handler: (match: RegExpMatchArray): TextNode[] => {
        const styleClass = parseStyleClass([match[1], match[2]]);
        styleClasses.set(styleClass.name, styleClass);
        return [];
      }
    },
    {
      // Multiple nodes: A & B
      regex: /^(.+) & (.+)$/,
      handler: (match: RegExpMatchArray): TextNode[] => {
        console.debug("Found & pattern node", match[1], "to", match[2]);
        
        let node: TextNode;
        try {
          lhs = parseString(match[1], data, styleClasses);
        } catch {
          node = parseNode(match[1]);
          lhs = [node];
        }
        
        try {
          rhs = parseString(match[2], data, styleClasses);
        } catch {
          node = parseNode(match[2]);
          rhs = [node];
        }
        
        return [...lhs, ...rhs];
      }
    }
  ];
  
  for (const pattern of patterns) {
    const match = pattern.regex.exec(line);
    if (match) {
      const nodes = pattern.handler(match);
      return nodes;
    }
  }
  
  throw new Error("Could not parse line: " + line);
}

/**
 * Main parser function - convert mermaid string to GraphProperties
 */
export function mermaidFileToMap(mermaid: string, styleType: string): GraphProperties {
  // Allow split on both \n and the actual string "\n" for curl compatibility
  const newlinePattern = /\n|\\n/;
  const rawLines = mermaid.split(newlinePattern);
  
  // Process lines to remove comments
  const lines: string[] = [];
  for (let line of rawLines) {
    // Stop processing at "---" separator (used in test files)
    if (line === "---") {
      break;
    }
    
    // Skip lines that start with %% (comment lines)
    if (line.trim().startsWith("%%")) {
      continue;
    }
    
    // Remove inline comments (anything after %%) and trim resulting whitespace
    const commentIndex = line.indexOf("%%");
    if (commentIndex !== -1) {
      line = line.substring(0, commentIndex).trim();
    }
    
    // Skip empty lines after comment removal
    if (line.trim().length > 0) {
      lines.push(line);
    }
  }
  
  const data = new Map<string, TextEdge[]>();
  const styleClasses = new Map<string, StyleClass>();
  
  // First line should either say "graph TD" or "graph LR"
  if (lines.length === 0) {
    throw new Error("Empty mermaid content");
  }
  
  const firstLine = lines[0];
  let graphDirectionValue = "";
  
  switch (firstLine) {
    case "graph LR":
    case "flowchart LR":
      graphDirectionValue = "LR";
      setGraphDirection("LR");
      break;
    case "graph TD":
    case "flowchart TD":
      graphDirectionValue = "TD";
      setGraphDirection("TD");
      break;
    default:
      throw new Error("first line should define the graph");
  }
  
  // Process remaining lines
  const contentLines = lines.slice(1);
  
  for (const line of contentLines) {
    try {
      const nodes = parseString(line, data, styleClasses);
      // Ensure all nodes are in the map, even if they don't have an edge
      for (const node of nodes) {
        addNode(node, data);
      }
    } catch (err) {
      console.debug("Parsing remaining text to node", line);
      const node = parseNode(line);
      addNode(node, data);
    }
  }
  
  return {
    data,
    styleClasses,
    graphDirection: graphDirectionValue,
    styleType
  };
}
