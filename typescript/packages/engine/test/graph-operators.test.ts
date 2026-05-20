import assert from "node:assert/strict";
import { describe, it } from "node:test";

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
});
