import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { FlatTopology } from "../src/index.js";

describe("FlatTopology", () => {
  it("indexes vertices in row-major order", () => {
    const t = new FlatTopology(3, 3);
    assert.equal(t.vertices.length, 9);
    assert.deepEqual(t.vertices[0], { index: 0, x: 0, y: 0 });
    assert.deepEqual(t.vertices[4], { index: 4, x: 1, y: 1 });
    assert.deepEqual(t.vertices[8], { index: 8, x: 2, y: 2 });
  });

  it("produces W*(H-1) + H*(W-1) edges", () => {
    const t = new FlatTopology(3, 3);
    assert.equal(t.edges.length, 3 * 2 + 3 * 2);
  });

  it("reports correct orthogonal neighbours for corners, edges, interior", () => {
    const t = new FlatTopology(3, 3);
    assert.deepEqual([...t.orthogonalNeighbours(0)].sort(), [1, 3]);
    assert.deepEqual([...t.orthogonalNeighbours(4)].sort(), [1, 3, 5, 7]);
    assert.deepEqual([...t.orthogonalNeighbours(8)].sort(), [5, 7]);
  });

  it("reports diagonal neighbours for interior vertices", () => {
    const t = new FlatTopology(3, 3);
    assert.deepEqual([...t.diagonalNeighbours(4)].sort(), [0, 2, 6, 8]);
  });

  it("size(SiteType) reports vertex/edge/cell counts", () => {
    const t = new FlatTopology(4, 2);
    assert.equal(t.size("Vertex"), 8);
    assert.equal(t.size("Cell"), 8);
    // 4*1 horizontal + 3*2 vertical = 4 + 6 = 10
    assert.equal(t.size("Edge"), 10);
  });

  it("rejects non-positive dimensions", () => {
    assert.throws(() => new FlatTopology(0, 3));
    assert.throws(() => new FlatTopology(3, -1));
  });
});
