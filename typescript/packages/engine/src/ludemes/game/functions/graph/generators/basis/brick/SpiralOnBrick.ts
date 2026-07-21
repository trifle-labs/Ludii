/**
 * SpiralOnBrick — faithful 1:1 port.
 * @java game/functions/graph/generators/basis/brick/SpiralOnBrick.java
 *
 * Spiral shape on a running-bond brick tiling.
 * Uses the same addBrick / addHalfBrick / addVerticalBrick helpers
 * as the other Brick generators, inlined here.
 */
import { Graph } from "../../../../../../../eval/graph/graph.js";
import { Basis } from "../Basis.js";

// ---------------------------------------------------------------------------
// Inline brick-cell helpers (Java Brick.addBrick / addHalfBrick / addVerticalBrick)
// ---------------------------------------------------------------------------

/** Add a standard 2×1 horizontal brick (6-vertex cell) at grid (row, col). */
function addBrick(g: Graph, row: number, col: number): void {
  const a = g.addVertex(col,     row);
  const b = g.addVertex(col,     row + 1);
  const c = g.addVertex(col + 1, row + 1);
  const d = g.addVertex(col + 2, row + 1);
  const e = g.addVertex(col + 2, row);
  const f = g.addVertex(col + 1, row);
  g.addEdge(a, b);
  g.addEdge(b, c);
  g.addEdge(c, d);
  g.addEdge(d, e);
  g.addEdge(e, f);
  g.addEdge(f, a);
}

/** Add a 1×1 half-brick (4-vertex square cell) at grid (row, col). */
function addHalfBrick(g: Graph, row: number, col: number): void {
  const a = g.addVertex(col,     row);
  const b = g.addVertex(col,     row + 1);
  const c = g.addVertex(col + 1, row + 1);
  const d = g.addVertex(col + 1, row);
  g.addEdge(a, b);
  g.addEdge(b, c);
  g.addEdge(c, d);
  g.addEdge(d, a);
}

/** Add a 1×2 vertical brick (6-vertex cell) at grid (row, col). */
function addVerticalBrick(g: Graph, row: number, col: number): void {
  // Java: A..F at (col, row), (col, row+1), (col, row+2),
  //       (col+1, row+2), (col+1, row+1), (col+1, row)
  const a = g.addVertex(col,     row);
  const b = g.addVertex(col,     row + 1);
  const c = g.addVertex(col,     row + 2);
  const d = g.addVertex(col + 1, row + 2);
  const e = g.addVertex(col + 1, row + 1);
  const f = g.addVertex(col + 1, row);
  g.addEdge(a, b);
  g.addEdge(b, c);
  g.addEdge(c, d);
  g.addEdge(d, e);
  g.addEdge(e, f);
  g.addEdge(f, a);
}

// ---------------------------------------------------------------------------

/** @java game/functions/graph/generators/basis/brick/SpiralOnBrick.java */
export class SpiralOnBrick extends Basis {
  public constructor(dim: number) {
    super();
    this._dim = [dim];
  }

  /** @java SpiralOnBrick.eval(Context, SiteType) */
  public override eval(_siteType: string): Graph {
    const rings = this._dim[0] as number;

    const graph = new Graph();

    for (let ring = 0; ring < rings; ring++) {
      if (ring === 0) {
        // Centre half-brick
        addHalfBrick(graph, rings - 1, rings - 1);
      } else {
        for (let n = 0; n < 2 * ring; n += 2) {
          addVerticalBrick(graph, rings - ring + n,     rings - ring - 1);
          addBrick         (graph, rings + ring - 1,    rings - ring + n);
          addVerticalBrick (graph, rings - ring - 1 + n, rings + ring - 1);
          addBrick         (graph, rings - ring - 1,    rings - ring - 1 + n);
        }
      }
    }

    graph.makeFaces();
    graph.reorder();

    return graph;
  }
}
