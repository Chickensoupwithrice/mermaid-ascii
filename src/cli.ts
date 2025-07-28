#!/usr/bin/env node

/**
 * CLI implementation for Mermaid ASCII converter
 * Port of cmd/root.go from the Go version
 */

import { Command } from 'commander';
import * as fs from 'fs';
import { mermaidFileToMap } from './parser';
import { Graph } from './types/graph';
import { DrawingCanvas } from './types/drawing';
import { setUseAscii } from './types/common';

// Global flags (equivalent to Go version)
interface GlobalFlags {
  verbose: boolean;
  coords: boolean;
  boxBorderPadding: number;
  paddingBetweenX: number;
  paddingBetweenY: number;
  graphDirection: string;
  useAscii: boolean;
  file?: string;
}

// Default values matching Go version
const defaultFlags: GlobalFlags = {
  verbose: false,
  coords: false,
  boxBorderPadding: 1,
  paddingBetweenX: 5,
  paddingBetweenY: 5,
  graphDirection: 'LR',
  useAscii: false
};

/**
 * Draw map from parsed properties to ASCII art
 * Equivalent to drawMap function from Go version
 */
function drawMap(properties: any): void {
  const graph = Graph.makeGraph(properties.data);
  graph.setStyleClasses(properties);
  graph.createMapping();
  const drawingEngine = graph.draw();
  const output = DrawingCanvas.drawingToString(drawingEngine.getCanvas());
  
  // Output to stdout (equivalent to Go version)
  console.log(output);
}

/**
 * Read input from stdin
 */
function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    
    process.stdin.setEncoding('utf8');
    
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    
    process.stdin.on('end', () => {
      resolve(data);
    });
    
    process.stdin.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Main CLI logic - equivalent to rootCmd.Run in Go version
 */
async function runCLI(flags: GlobalFlags): Promise<void> {
  // Set logging level based on verbose flag
  // Override console.debug to be silent unless verbose mode is enabled
  if (!flags.verbose) {
    console.debug = () => {}; // Disable debug logging
  }
  
  // Set ASCII mode based on flag
  setUseAscii(flags.useAscii);
  
  let mermaidInput: string;
  
  try {
    if (!flags.file || flags.file === '' || flags.file === '-') {
      // Read from stdin
      mermaidInput = await readStdin();
      if (!mermaidInput.trim()) {
        console.error('Failed to read from stdin: no input provided');
        process.exit(1);
      }
    } else {
      // Read from file
      try {
        mermaidInput = fs.readFileSync(flags.file, 'utf8');
      } catch (err) {
        console.error(`Failed to read mermaid file: ${err}`);
        process.exit(1);
      }
    }
    
    // Parse mermaid input
    let properties;
    try {
      properties = mermaidFileToMap(mermaidInput, 'cli');
    } catch (err) {
      console.error(`Failed to parse mermaid input: ${err}`);
      process.exit(1);
    }
    
    // Draw the map
    drawMap(properties);
    
  } catch (err) {
    console.error(`Error: ${err}`);
    process.exit(1);
  }
}

/**
 * Set up and execute the CLI
 * Equivalent to Execute() function in Go version
 */
export function execute(): void {
  const program = new Command();
  
  program
    .name('mermaid-ascii')
    .description('Generate ASCII diagrams from mermaid code.')
    .version('1.0.0');
  
  // Add flags that match the Go version exactly
  program
    .option('-v, --verbose', 'Verbose output', defaultFlags.verbose)
    .option('-a, --ascii', "Don't use extended character set", defaultFlags.useAscii)
    .option('-c, --coords', 'Show coordinates', defaultFlags.coords)
    .option('-x, --paddingX <number>', 'Horizontal space between nodes', 
            (value) => parseInt(value), defaultFlags.paddingBetweenX)
    .option('-y, --paddingY <number>', 'Vertical space between nodes',
            (value) => parseInt(value), defaultFlags.paddingBetweenY)
    .option('-p, --borderPadding <number>', 'Padding between text and border',
            (value) => parseInt(value), defaultFlags.boxBorderPadding)
    .option('-f, --file [path]', "Mermaid file to parse (use '-' for stdin)")
    .action(async (options) => {
      const flags: GlobalFlags = {
        verbose: options.verbose || defaultFlags.verbose,
        coords: options.coords || defaultFlags.coords,
        boxBorderPadding: options.borderPadding || defaultFlags.boxBorderPadding,
        paddingBetweenX: options.paddingX || defaultFlags.paddingBetweenX,
        paddingBetweenY: options.paddingY || defaultFlags.paddingBetweenY,
        graphDirection: defaultFlags.graphDirection,
        useAscii: options.ascii || defaultFlags.useAscii,
        file: options.file
      };
      
      await runCLI(flags);
    });
  
  // Parse arguments and run
  program.parse();
}

// If this file is run directly (like main.go), execute the CLI
if (require.main === module) {
  execute();
}
