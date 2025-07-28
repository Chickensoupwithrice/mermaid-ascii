/**
 * Simple test to verify graph creation works
 */

import { Graph, TextEdge, GraphProperties } from './types/graph';
import { StyleClass } from './types/drawing';

// Create test data
const testData = new Map<string, TextEdge[]>();
testData.set("A", [
  {
    parent: { name: "A", styleClass: "" },
    child: { name: "B", styleClass: "" },
    label: "arrow1"
  },
  {
    parent: { name: "A", styleClass: "" },
    child: { name: "C", styleClass: "" },
    label: "arrow2"
  }
]);

testData.set("B", [
  {
    parent: { name: "B", styleClass: "" },
    child: { name: "D", styleClass: "" },
    label: "arrow3"
  }
]);

// Create graph
const graph = Graph.makeGraph(testData);

// Set up properties
const properties: GraphProperties = {
  data: testData,
  styleClasses: new Map<string, StyleClass>(),
  graphDirection: "LR",
  styleType: "cli"
};

graph.setStyleClasses(properties);

// Create mapping
console.log("Creating mapping...");
graph.createMapping();

// Draw the graph
console.log("Drawing graph...");
graph.draw();

console.log("Graph created successfully!");
console.log(`Nodes: ${graph.nodes.length}`);
console.log(`Edges: ${graph.edges.length}`);

// Print node grid coordinates
graph.nodes.forEach(node => {
  console.log(`Node ${node.name}: grid (${node.gridCoord?.x}, ${node.gridCoord?.y})`);
});

// Print edge paths
graph.edges.forEach((edge, i) => {
  console.log(`Edge ${i} (${edge.from.name} -> ${edge.to.name}): path length ${edge.path.length}`);
});
