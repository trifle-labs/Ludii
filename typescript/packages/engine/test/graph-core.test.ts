import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Graph } from "../src/eval/graph/graph.js";

// Build a w×h lattice of unit squares as a graph and return it.
function squareGrid(w: number, h: number): Graph {
  const g = new Graph();
  const id = (x: number, y: number): number => g.addVertex(x, y);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      id(x, y);
    }
  }
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (x + 1 < w) g.addEdge(id(x, y), id(x + 1, y));
      if (y + 1 < h) g.addEdge(id(x, y), id(x, y + 1));
    }
  }
  return g;
}

describe("Graph core: makeFaces", () => {
  it("finds one face for a single unit square", () => {
    const g = new Graph();
    const a = g.addVertex(0, 0);
    const b = g.addVertex(1, 0);
    const c = g.addVertex(1, 1);
    const d = g.addVertex(0, 1);
    g.addEdge(a, b);
    g.addEdge(b, c);
    g.addEdge(c, d);
    g.addEdge(d, a);
    g.makeFaces();
    assert.equal(g.faces.length, 1, "one bounded face");
    const f = g.faces[0];
    assert.ok(f);
    assert.equal(f.vertices.length, 4, "quad face");
    assert.ok(Math.abs(f.cx - 0.5) < 1e-9, "centroid x");
    assert.ok(Math.abs(f.cy - 0.5) < 1e-9, "centroid y");
  });

  it("finds 4 faces for a 3x3 vertex lattice (2x2 cells)", () => {
    const g = squareGrid(3, 3);
    g.makeFaces();
    assert.equal(g.faces.length, 4, "2x2 = 4 unit-square faces");
    for (const f of g.faces) assert.equal(f.vertices.length, 4);
  });

  it("finds 9 faces for a 4x4 vertex lattice (3x3 cells)", () => {
    const g = squareGrid(4, 4);
    g.makeFaces();
    assert.equal(g.faces.length, 9);
  });

  it("finds one triangular face", () => {
    const g = new Graph();
    const a = g.addVertex(0, 0);
    const b = g.addVertex(2, 0);
    const c = g.addVertex(1, 1.732);
    g.addEdge(a, b);
    g.addEdge(b, c);
    g.addEdge(c, a);
    g.makeFaces();
    assert.equal(g.faces.length, 1);
    assert.equal(g.faces[0]?.vertices.length, 3);
  });

  it("dedups coincident vertices and edges", () => {
    const g = new Graph();
    const a = g.addVertex(0, 0);
    const a2 = g.addVertex(0.005, 0); // within tolerance
    assert.equal(a, a2, "coincident vertex reused");
    const b = g.addVertex(1, 0);
    const e1 = g.addEdge(a, b);
    const e2 = g.addEdge(b, a); // same undirected edge
    assert.equal(e1, e2, "undirected edge deduped");
    assert.equal(g.edges.length, 1);
  });

  it("computes average edge length", () => {
    const g = new Graph();
    const a = g.addVertex(0, 0);
    const b = g.addVertex(3, 0);
    const c = g.addVertex(3, 4);
    g.addEdge(a, b); // length 3
    g.addEdge(b, c); // length 4
    assert.ok(Math.abs(g.averageEdgeLength() - 3.5) < 1e-9);
  });
});
