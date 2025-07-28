# Mermaid ASCII

[![npm version](https://badge.fury.io/js/mermaid-ascii.svg)](https://badge.fury.io/js/mermaid-ascii)

Convert Mermaid diagrams to ASCII art. A TypeScript library and CLI tool for rendering beautiful text-based diagrams. A port of https://github.com/AlexanderGrooff/mermaid-asci, many thanks to the original author.

## Installation

```bash
npm install mermaid-ascii
```

## Usage

### Library Usage

```typescript
import { mermaidToAscii } from 'mermaid-ascii';

const diagram = `
graph TD
  A[Start] --> B{Decision}
  B -->|Yes| C[Action 1]
  B -->|No| D[Action 2]
  C --> E[End]
  D --> E
`;

const ascii = mermaidToAscii(diagram);
console.log(ascii);
```

Output:
```
┌───────┐     ┌──────────┐     ┌──────────┐
│       │     │          │     │          │
│ Start ├────►│ Decision ├────►│ Action 1 │
│       │     │          │     │          │
└───────┘     └─────┬────┘     └─────┬────┘
                    │                │
                    │                v
                    │          ┌─────────┐
                    │          │         │
                    │          │   End   │
                    │          │         │
                    │          └─────────┘
                    │                ^
                    │                │
                    v          ┌─────┴────┐
              ┌──────────┐     │          │
              │          ├─────┤ Action 2 │
              │ Action 2 │     │          │
              └──────────┘     └──────────┘
```

### ASCII Mode

For environments that don't support Unicode box drawing characters:

```typescript
import { mermaidToAscii } from 'mermaid-ascii';

const ascii = mermaidToAscii(diagram, { useAscii: true });
console.log(ascii);
```

Output:
```
+-------+     +----------+     +----------+
|       |     |          |     |          |
| Start |---->| Decision |---->| Action 1 |
|       |     |          |     |          |
+-------+     +-----+----+     +-----+----+
                    |                |
                    |                v
                    |          +---------+
                    |          |         |
                    |          |   End   |
                    |          |         |
                    |          +---------+
                    |                ^
                    |                |
                    v          +-----+----+
              +----------+     |          |
              |          |-----|  Action  |
              | Action 2 |     |    2     |
              +----------+     +----------+
```

### CLI Usage

```bash
# From stdin
echo "graph LR; A --> B --> C" | mermaid-ascii

# From file
mermaid-ascii -f diagram.mermaid

# ASCII mode
mermaid-ascii -f diagram.mermaid --ascii
```

## API Reference

### `mermaidToAscii(input, options?)`

Convert a Mermaid diagram string to ASCII art.

**Parameters:**
- `input: string` - Mermaid diagram as a string
- `options?: MermaidToAsciiOptions` - Optional configuration

**Options:**
- `useAscii?: boolean` - Use pure ASCII characters instead of Unicode (default: false)
- `styleType?: string` - Style type for the diagram (default: 'basic')

**Returns:** `string` - ASCII art representation of the diagram

### Advanced Usage

For advanced use cases, you can access the core parsing and drawing functions:

```typescript
import { mermaidFileToMap, Graph, DrawingCanvas } from 'mermaid-ascii';

// Parse Mermaid to internal representation
const properties = mermaidFileToMap(diagram, 'basic');

// Create and render graph
const graph = Graph.makeGraph(properties.data);
graph.setStyleClasses(properties);
graph.createMapping();
const drawingEngine = graph.draw();
const output = DrawingCanvas.drawingToString(drawingEngine.getCanvas());
```

## Supported Mermaid Features

Currently supports:
- Basic flowcharts (`graph TD`, `graph LR`, etc.)
- Node definitions with labels
- Arrows and connections
- Multiple connections (`A --> B & C`)
- Chain connections (`A --> B --> C`)
- Self-references (`A --> A`)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
