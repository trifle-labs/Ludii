import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  genCircle,
  genConcentricPolygon,
  genRectangle,
  genSquare,
} from "../src/eval/graph/generators.js";

describe("Graph generators", () => {
  it("square(3) → 16 vertices, 9 cells", () => {
    const g = genSquare(3);
    assert.equal(g.vertices.length, 16);
    assert.equal(g.faces.length, 9);
  });

  it("rectangle(2,3) → 12 vertices, 6 cells", () => {
    const g = genRectangle(2, 3);
    assert.equal(g.vertices.length, 12);
    assert.equal(g.faces.length, 6);
  });

  it("circle {1 8} → 9 vertices (centre + ring of 8)", () => {
    const g = genCircle([1, 8]);
    assert.equal(g.vertices.length, 9);
  });

  it("concentric Square rings:3 → 24 vertices (Nine Men's Morris)", () => {
    const g = genConcentricPolygon("Square", 3, false, false);
    assert.equal(g.vertices.length, 24, "3 rings × 8 points");
    // Default join connects the four midpoint spokes between rings: 4 per gap.
    // Perimeter edges: each ring has 8 edges → 24; spokes: 2 gaps × 4 = 8.
    assert.equal(g.edges.length, 24 + 8, "perimeter + midpoint spokes");
  });

  it("concentric Square rings:3 joinCorners adds corner spokes", () => {
    const g = genConcentricPolygon("Square", 3, true, false);
    // joinCorners only ⇒ 2 gaps × 4 corner spokes = 8 spokes.
    assert.equal(g.edges.length, 24 + 8);
    assert.equal(g.vertices.length, 24);
  });

  it("concentric Triangle rings:3 → 18 vertices", () => {
    const g = genConcentricPolygon("Triangle", 3, false, false);
    assert.equal(g.vertices.length, 18, "3 rings × 6 points (3 corners+3 mids)");
  });
});
