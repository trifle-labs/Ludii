import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Graph } from "../src/eval/graph/graph.js";
import { Trajectories } from "../src/eval/graph/trajectories.js";

function squareGrid(w: number, h: number): Graph {
  const g = new Graph();
  for (let y = 0; y < h; y += 1)
    for (let x = 0; x < w; x += 1) g.addVertex(x, y);
  const id = (x: number, y: number): number => y * w + x;
  for (let y = 0; y < h; y += 1)
    for (let x = 0; x < w; x += 1) {
      if (x + 1 < w) g.addEdge(id(x, y), id(x + 1, y));
      if (y + 1 < h) g.addEdge(id(x, y), id(x, y + 1));
    }
  g.makeFaces();
  return g;
}

describe("Graph trajectories: square cells reproduce lattice directions", () => {
  it("a 3x3 cell board has 9 cells with correct compass neighbours", () => {
    // 4x4 vertex lattice ⇒ 3x3 = 9 unit-square cells.
    const g = squareGrid(4, 4);
    const t = new Trajectories(g, "Cell");
    assert.equal(t.numSites, 9, "9 cells");

    // Locate the centre cell (centroid ≈ (1.5, 1.5)).
    let centre = -1;
    for (let s = 0; s < t.numSites; s += 1) {
      if (Math.abs(t.xOf(s) - 1.5) < 1e-6 && Math.abs(t.yOf(s) - 1.5) < 1e-6)
        centre = s;
    }
    assert.ok(centre >= 0, "found centre cell");

    // Centre has 4 orthogonal + 4 diagonal neighbours.
    assert.equal(t.neighbours(centre).length, 4, "4 orthogonal neighbours");
    assert.equal(t.group(centre, "Diagonal").length, 4, "4 diagonal");
    assert.equal(t.group(centre, "All").length, 8, "8 total");

    // Compass steps from centre land on the expected centroids.
    const at = (s: number): [number, number] => [t.xOf(s), t.yOf(s)];
    assert.deepEqual(at(t.step(centre, "N")), [1.5, 2.5]);
    assert.deepEqual(at(t.step(centre, "S")), [1.5, 0.5]);
    assert.deepEqual(at(t.step(centre, "E")), [2.5, 1.5]);
    assert.deepEqual(at(t.step(centre, "W")), [0.5, 1.5]);
    assert.deepEqual(at(t.step(centre, "NE")), [2.5, 2.5]);
  });

  it("rays slide across the whole board", () => {
    const g = squareGrid(5, 5); // 4x4 cells
    const t = new Trajectories(g, "Cell");
    // Bottom-left cell centroid (0.5, 0.5).
    let bl = -1;
    for (let s = 0; s < t.numSites; s += 1)
      if (Math.abs(t.xOf(s) - 0.5) < 1e-6 && Math.abs(t.yOf(s) - 0.5) < 1e-6)
        bl = s;
    assert.ok(bl >= 0);
    assert.equal(t.ray(bl, "E").length, 3, "3 cells east of the corner");
    assert.equal(t.ray(bl, "N").length, 3, "3 cells north");
    assert.equal(t.ray(bl, "NE").length, 3, "3 cells along the diagonal");
    assert.equal(t.ray(bl, "S").length, 0, "nothing south of the corner");
  });

  it("vertex mode joins edge-adjacent vertices orthogonally", () => {
    const g = squareGrid(3, 3); // 9 vertices
    const t = new Trajectories(g, "Vertex");
    assert.equal(t.numSites, 9);
    // centre vertex (1,1) = index 4.
    let centre = -1;
    for (let s = 0; s < t.numSites; s += 1)
      if (Math.abs(t.xOf(s) - 1) < 1e-6 && Math.abs(t.yOf(s) - 1) < 1e-6)
        centre = s;
    assert.ok(centre >= 0);
    assert.equal(t.neighbours(centre).length, 4, "N/E/S/W edge neighbours");
    assert.equal(t.group(centre, "Diagonal").length, 4, "4 face diagonals");
  });
});
