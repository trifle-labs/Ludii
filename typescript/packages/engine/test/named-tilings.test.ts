import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildNamedTiling,
  genBrick,
  genHex,
  genQuadhex,
  genSpiral,
  genTri,
} from "../src/eval/graph/named-tilings.js";

const NAMES = [
  "T3636",
  "T33344",
  "T33434",
  "T488",
  "T3464",
  "T333333_33434",
  "T4612",
  "T31212",
  "T33336",
];

describe("Named Archimedean tilings", () => {
  for (const name of NAMES) {
    it(`${name} builds a non-empty planar graph`, () => {
      const g = buildNamedTiling(name, 3);
      assert.ok(g, `${name} should build`);
      assert.ok(g.vertices.length > 0, "has vertices");
      assert.ok(g.edges.length > 0, "has edges");
      assert.ok(g.faces.length > 0, "has at least one cell");
      // Cells of these tilings are 3–12-gons.
      for (const f of g.faces) {
        assert.ok(
          f.vertices.length >= 3 && f.vertices.length <= 12,
          `face has 3..12 corners (got ${f.vertices.length})`,
        );
      }
    });
  }

  it("returns undefined for an unknown tiling name", () => {
    assert.equal(buildNamedTiling("TXYZ", 3), undefined);
  });

  it("T3636 with two dims (rhombus) has no hex clip", () => {
    const hexShape = buildNamedTiling("T3636", 3);
    const rhombus = buildNamedTiling("T3636", 3, 3);
    assert.ok(hexShape && rhombus);
    // The rhombus fills its bounding parallelogram, so it has at least as
    // many cells as the clipped hexagon of the same primary dimension.
    assert.ok(rhombus.faces.length >= hexShape.faces.length);
  });
});

describe("Hex / Tri board generators", () => {
  it("(hex 3) is a hexagon of 19 hexagonal cells", () => {
    const g = genHex(undefined, 3);
    // A hex board of side 3 has 3*3 - 3 + 1 ... = 19 cells.
    assert.equal(g.faces.length, 19);
    for (const f of g.faces) assert.equal(f.vertices.length, 6);
  });

  it("(hex Rectangle 2 3) tiles a rectangular hex patch", () => {
    const g = genHex("Rectangle", 2, 3);
    assert.ok(g.faces.length > 0);
    for (const f of g.faces) assert.equal(f.vertices.length, 6);
  });

  it("(tri 4) triangle board has triangular cells", () => {
    const g = genTri(undefined, 4);
    assert.ok(g.faces.length > 0);
    for (const f of g.faces) assert.equal(f.vertices.length, 3);
  });

  it("(tri Hexagon 2) builds a hexagon of triangles", () => {
    const g = genTri("Hexagon", 2);
    assert.ok(g.faces.length > 0);
    for (const f of g.faces) assert.equal(f.vertices.length, 3);
  });
});

describe("Brick / Quadhex generators", () => {
  it("(brick 3) makes hexagonal brick cells", () => {
    const g = genBrick(undefined, 3);
    assert.ok(g.faces.length > 0);
    // Interior bricks are hexagons (mid-edge vertices); boundary cells may be
    // 4- or 5-gons where half-bricks abut, so just bound the corner count.
    for (const f of g.faces)
      assert.ok(f.vertices.length >= 4 && f.vertices.length <= 6);
  });

  it("(quadhex L) has exactly 6·L² quadrilateral cells", () => {
    for (const L of [2, 3, 4]) {
      const g = genQuadhex(L);
      assert.equal(g.faces.length, 6 * L * L, `quadhex ${L} cell count`);
      for (const f of g.faces) assert.equal(f.vertices.length, 4);
    }
  });

  it("(spiral turns:5 sites:88) is an 88-vertex path", () => {
    const g = genSpiral(5, 88);
    assert.equal(g.vertices.length, 88, "exact site count, no dedup");
    assert.equal(g.edges.length, 87, "consecutive path edges");
  });
});
