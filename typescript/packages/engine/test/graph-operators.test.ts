import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Graph } from "../src/eval/graph/graph.js";
import { genRectangle, genSquare } from "../src/eval/graph/generators.js";
import { dual, merge, remove, rotate, shift } from "../src/eval/graph/operators.js";

describe("Graph operators", () => {
  it("merge fuses coincident vertices of overlapping squares", () => {
    // Two unit squares sharing an edge: square at origin + one shifted right.
    const a = genRectangle(1, 1); // 4 verts, 1 cell
    const b = shift(1, 0, genRectangle(1, 1));
    const m = merge([a, b]);
    // Shared edge fuses 2 vertices ⇒ 6 unique vertices, 2 cells.
    assert.equal(m.vertices.length, 6, "fused to 6 vertices");
    assert.equal(m.faces.length, 2, "two cells");
  });

  it("shift translates without changing topology", () => {
    const g = shift(5, 3, genSquare(2));
    assert.equal(g.vertices.length, 9);
    assert.equal(g.faces.length, 4);
    assert.ok(g.vertices.every((v) => v.x >= 5 && v.y >= 3));
  });

  it("rotate(90) keeps vertex and face counts", () => {
    const g = rotate(90, genSquare(3));
    assert.equal(g.vertices.length, 16);
    assert.equal(g.faces.length, 9);
  });

  it("remove drops a vertex and its incident edges", () => {
    const g = remove(genRectangle(1, 2), { vertices: [0] });
    assert.equal(g.vertices.length, 5, "one of six vertices removed");
  });

  it("dual of a 3x3 cell board has 9 dual vertices", () => {
    const g = dual(genSquare(3)); // 9 faces ⇒ 9 dual vertices
    assert.equal(g.vertices.length, 9);
    // Interior dual edges connect edge-sharing faces: 12 for a 3x3 grid.
    assert.equal(g.edges.length, 12);
  });

  it("trim removes a dangling spur edge and its orphaned vertex (Java Graph.trim)", () => {
    // Unit square (cycle 0-1-2-3) plus a spur vertex 4 hanging off vertex 2.
    const g = new Graph();
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
      [2, 2],
    ].forEach(([x, y]) => g.addVertex(x as number, y as number));
    for (const [a, b] of [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [2, 4],
    ])
      g.addEdge(a as number, b as number);
    g.makeFaces();
    assert.equal(g.vertices.length, 5);
    assert.equal(g.edges.length, 5);
    g.trim();
    // The degree-1 vertex 4 and its edge {2,4} go; the square cycle survives.
    assert.equal(g.vertices.length, 4, "spur vertex removed");
    assert.equal(g.edges.length, 4, "spur edge removed");
    assert.equal(g.faces.length, 1, "the square face is preserved");
  });

  it("trim peels a multi-edge spur back to the cycle, keeping faces", () => {
    // Square cycle 0-1-2-3 plus a two-edge tail 2-4-5.
    const g = new Graph();
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
      [2, 2],
      [3, 3],
    ].forEach(([x, y]) => g.addVertex(x as number, y as number));
    for (const [a, b] of [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [2, 4],
      [4, 5],
    ])
      g.addEdge(a as number, b as number);
    g.makeFaces();
    g.trim();
    // Java's single high→low pass with live degree updates peels both tail edges
    // (5 has degree 1 → drop {4,5}; that leaves 4 degree 1 → drop {2,4}).
    assert.equal(g.vertices.length, 4, "both tail vertices removed");
    assert.equal(g.edges.length, 4, "both tail edges removed");
    assert.equal(g.faces.length, 1);
  });
});
