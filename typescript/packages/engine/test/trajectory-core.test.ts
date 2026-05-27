// Validates the faithful Trajectories core (src/eval/graph/trajectory/) against
// hand-computed adjacency on small square boards. Geometry-based assertions
// (centroid coordinates) so they don't depend on face-id assignment order.

import assert from "node:assert/strict";
import { test } from "node:test";

import { genSquare } from "../src/eval/graph/generators.js";
import {
  type GElement,
  SiteType,
} from "../src/eval/graph/trajectory/graph-element.js";
import { AbsoluteDirection } from "../src/eval/graph/trajectory/absolute-direction.js";
import { TrajectoriesCore } from "../src/eval/graph/trajectory/trajectories.js";

/** Round to 1 dp for centroid comparisons (always one decimal: 2 → "2.0"). */
const r1 = (n: number): string => (Math.round(n * 10) / 10).toFixed(1);
const ptKey = (e: GElement): string => `${r1(e.pt.x)},${r1(e.pt.y)}`;

/** Find the face whose centroid is nearest to (x, y). */
function faceAt(core: TrajectoriesCore, x: number, y: number): number {
  let best = -1;
  let bestD = Infinity;
  for (const f of core.topo.faceEls) {
    const d = (f.pt.x - x) ** 2 + (f.pt.y - y) ** 2;
    if (d < bestD) {
      bestD = d;
      best = f.id;
    }
  }
  return best;
}

/** Centroid keys of the `.to` Cell of each step. */
function toKeys(steps: { to: GElement }[]): Set<string> {
  return new Set(steps.map((s) => ptKey(s.to)));
}

test("3x3 square Cell: centre face has 4 orthogonal, 4 diagonal, 8 adjacent", () => {
  const core = new TrajectoriesCore(genSquare(3));
  const centre = faceAt(core, 1.5, 1.5);
  assert.equal(ptKey(core.topo.faceEls[centre]!), "1.5,1.5");

  const ortho = core.stepsToTypeInDirection(
    SiteType.Cell, centre, SiteType.Cell, AbsoluteDirection.Orthogonal,
  );
  assert.equal(ortho.length, 4, "4 orthogonal cell neighbours");
  assert.deepEqual(
    toKeys(ortho),
    new Set(["1.5,0.5", "1.5,2.5", "0.5,1.5", "2.5,1.5"]),
  );

  const diag = core.stepsToTypeInDirection(
    SiteType.Cell, centre, SiteType.Cell, AbsoluteDirection.Diagonal,
  );
  assert.equal(diag.length, 4, "4 diagonal cell neighbours");
  assert.deepEqual(
    toKeys(diag),
    new Set(["0.5,0.5", "2.5,0.5", "0.5,2.5", "2.5,2.5"]),
  );

  const adj = core.stepsToTypeInDirection(
    SiteType.Cell, centre, SiteType.Cell, AbsoluteDirection.Adjacent,
  );
  assert.equal(adj.length, 8, "8 adjacent cell neighbours");
});

test("3x3 square Cell: corner face has 2 orthogonal, 1 diagonal cell neighbours", () => {
  const core = new TrajectoriesCore(genSquare(3));
  const corner = faceAt(core, 0.5, 0.5);
  const ortho = core.stepsToTypeInDirection(
    SiteType.Cell, corner, SiteType.Cell, AbsoluteDirection.Orthogonal,
  );
  assert.equal(ortho.length, 2, "2 orthogonal neighbours at a corner");
  assert.deepEqual(toKeys(ortho), new Set(["1.5,0.5", "0.5,1.5"]));

  const diag = core.stepsToTypeInDirection(
    SiteType.Cell, corner, SiteType.Cell, AbsoluteDirection.Diagonal,
  );
  assert.equal(diag.length, 1, "1 diagonal neighbour at a corner");
  assert.deepEqual(toKeys(diag), new Set(["1.5,1.5"]));
});

test("3x3 square Cell: ray N from centre reaches the north face only", () => {
  const core = new TrajectoriesCore(genSquare(3));
  const centre = faceAt(core, 1.5, 1.5);
  const rays = core.radialsInDirection(SiteType.Cell, centre, AbsoluteDirection.N);
  assert.equal(rays.length, 1, "one radial north");
  const steps = rays[0]!.steps;
  assert.equal(steps.length, 2, "centre + one face north");
  assert.equal(ptKey(steps[0]!), "1.5,1.5");
  assert.equal(ptKey(steps[1]!), "1.5,2.5");
});

test("2x2 square Vertex: centre vertex has 4 orthogonal, 4 diagonal", () => {
  // genSquare(2): 3x3 vertices numbered y*3+x; centre vertex id 4 at (1,1).
  const core = new TrajectoriesCore(genSquare(2));
  const centre = 4;
  assert.equal(core.topo.verts[centre]!.pt.x, 1);
  assert.equal(core.topo.verts[centre]!.pt.y, 1);

  const ortho = core.stepsToTypeInDirection(
    SiteType.Vertex, centre, SiteType.Vertex, AbsoluteDirection.Orthogonal,
  );
  assert.equal(ortho.length, 4, "4 orthogonal vertex neighbours");
  assert.deepEqual(
    toKeys(ortho),
    new Set(["1.0,0.0", "1.0,2.0", "0.0,1.0", "2.0,1.0"]),
  );

  const diag = core.stepsToTypeInDirection(
    SiteType.Vertex, centre, SiteType.Vertex, AbsoluteDirection.Diagonal,
  );
  assert.equal(diag.length, 4, "4 diagonal vertex neighbours");
  assert.deepEqual(
    toKeys(diag),
    new Set(["0.0,0.0", "2.0,0.0", "0.0,2.0", "2.0,2.0"]),
  );
});

test("2x2 square Vertex: ray E from centre reaches the east vertex only", () => {
  const core = new TrajectoriesCore(genSquare(2));
  const rays = core.radialsInDirection(SiteType.Vertex, 4, AbsoluteDirection.E);
  assert.equal(rays.length, 1, "one radial east");
  const steps = rays[0]!.steps;
  assert.equal(steps.length, 2, "centre + one vertex east");
  assert.equal(ptKey(steps[1]!), "2.0,1.0");
});
