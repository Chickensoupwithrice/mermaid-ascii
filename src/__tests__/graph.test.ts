import * as fs from 'fs';
import * as path from 'path';
import { mermaidFileToMap } from '../parser';
import { Graph } from '../types/graph';
import { DrawingCanvas } from '../types/drawing';
import { setUseAscii } from '../types/common';

interface TestCase {
  mermaid: string;
  expectedMap: string;
}

/**
 * Reads a test case file and parses it into mermaid input and expected output
 * @param filePath Path to the test case file
 * @returns Object containing mermaid input and expected ASCII output
 */
function readTestCase(filePath: string): TestCase {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  let mermaidLines: string[] = [];
  let expectedMapLines: string[] = [];
  let inMermaid = true;
  
  for (const line of lines) {
    if (line === '---') {
      inMermaid = false;
      continue;
    }
    
    if (inMermaid) {
      mermaidLines.push(line);
    } else {
      expectedMapLines.push(line);
    }
  }
  
  return {
    mermaid: mermaidLines.join('\n'),
    expectedMap: expectedMapLines.join('\n').replace(/\n$/, '')
  };
}

/**
 * Draw map from parsed properties to ASCII art
 * This creates a graph from the properties and renders it
 */
function drawMap(properties: any): string {
  const graph = Graph.makeGraph(properties.data);
  graph.setStyleClasses(properties);
  graph.createMapping();
  const drawingEngine = graph.draw();
  return DrawingCanvas.drawingToString(drawingEngine.getCanvas());
}

/**
 * Global variable to control ASCII vs extended character mode
 */
let useAscii = true;

/**
 * Verifies that a test case produces the expected ASCII output
 * @param testCaseFile Path to the test case file
 */
function verifyMap(testCaseFile: string): void {
  const { mermaid, expectedMap } = readTestCase(testCaseFile);
  
  // Set the ASCII mode based on global variable
  setUseAscii(useAscii);
  
  const properties = mermaidFileToMap(mermaid, 'cli');
  const actualMap = drawMap(properties);
  
  if (expectedMap !== actualMap) {
    const expectedWithSpaces = expectedMap.replace(/ /g, '·');
    const actualWithSpaces = actualMap.replace(/ /g, '·');
    throw new Error(
      `Map didn't match actual map\nExpected:\n${expectedWithSpaces}\nActual:\n${actualWithSpaces}`
    );
  }
}

/**
 * Gets all test files from a directory
 * @param dir Directory path
 * @returns Array of test file names
 */
function getTestFiles(dir: string): string[] {
  const files = fs.readdirSync(dir);
  return files.filter(file => file.endsWith('.txt'));
}

describe('ASCII Mode Tests', () => {
  beforeAll(() => {
    useAscii = true;
  });

  const testDir = path.join(__dirname, '../testdata/ascii');
  const testFiles = getTestFiles(testDir);

  // Ensure we have all 22 test cases
  test('should have 22 ASCII test cases', () => {
    expect(testFiles.length).toBe(22);
  });

  // Data-driven tests for each ASCII test case
  testFiles.forEach(fileName => {
    test(`ASCII: ${fileName}`, () => {
      const testCaseFile = path.join(testDir, fileName);
      verifyMap(testCaseFile);
    });
  });
});

describe('Extended Characters Mode Tests', () => {
  beforeAll(() => {
    useAscii = false;
  });

  const testDir = path.join(__dirname, '../testdata/extended-chars');
  const testFiles = getTestFiles(testDir);

  // Ensure we have all 22 test cases
  test('should have 22 extended character test cases', () => {
    expect(testFiles.length).toBe(22);
  });

  // Data-driven tests for each extended character test case
  testFiles.forEach(fileName => {
    test(`Extended Chars: ${fileName}`, () => {
      const testCaseFile = path.join(testDir, fileName);
      verifyMap(testCaseFile);
    });
  });
});

// Export functions for potential use in other test files
export { readTestCase, verifyMap, getTestFiles };
