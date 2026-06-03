/**
 * DiamondOrPrismOnBrick — faithful 1:1 port.
 * @java game/functions/graph/generators/basis/brick/DiamondOrPrismOnBrick.java
 *
 * Diamond or prism shape on a running-bond brick tiling.
 * Uses the same addBrick/addHalfBrick helpers as SquareOrRectangleOnBrick,
 * inlined here as the Java class calls them as static methods on Brick.
 */
import { Graph } from "../../../../../../../eval/graph/graph.js";
import { Basis } from "../Basis.js";

// ---------------------------------------------------------------------------
// Inline brick-cell helpers (Java Brick.addBrick / addHalfBrick)
// Each "brick" is a 2×1 hexagonal cell (6 vertices) at grid position (row, col).
// The col axis is horizontal (x) and the row axis is vertical (y).
// ---------------------------------------------------------------------------

/** Add a standard 2×1 brick (6-vertex hexagonal cell) at grid (row, col). */
function addBrick(g: Graph, row: number, col: number): void {
  // Java: vertices A..F at (col, row), (col, row+1), (col+1, row+1),
  //       (col+2, row+1), (col+2, row), (col+1, row)
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
  // Java: vertices A..D at (col, row), (col, row+1), (col+1, row+1), (col+1, row)
  const a = g.addVertex(col,     row);
  const b = g.addVertex(col,     row + 1);
  const c = g.addVertex(col + 1, row + 1);
  const d = g.addVertex(col + 1, row);
  g.addEdge(a, b);
  g.addEdge(b, c);
  g.addEdge(c, d);
  g.addEdge(d, a);
}

// ---------------------------------------------------------------------------

/** @java game/functions/graph/generators/basis/brick/DiamondOrPrismOnBrick.java */
export class DiamondOrPrismOnBrick extends Basis {
  private readonly trim: boolean;
  /** true → Prism shape, false → Diamond shape */
  private readonly isPrism: boolean;

  /**
   * @param dimA  Primary dimension (side length).
   * @param dimB  Secondary dimension; if provided this is Prism, otherwise Diamond.
   * @param trim  Whether to clip exposed half-bricks on the left/right edges.
   */
  public constructor(dimA: number, dimB?: number, trim = false) {
    super();
    this.isPrism = dimB !== undefined;
    this._dim = this.isPrism
      ? [dimA, dimB as number]
      : [dimA, dimA];
    this.trim = trim;
  }

  /** @java DiamondOrPrismOnBrick.eval(Context, SiteType) */
  public override eval(_siteType: string): Graph {
    const side = this._dim[0] as number;
    const mid  = this.isPrism ? (this._dim[1] as number) : 0;

    const rows = 2 * side + 2 * mid;
    const cols = 2 * side;

    const graph = new Graph();

    for (let r = 0; r < rows; r++) {
      for (let c = (r + 1) % 2; c < cols; c += 2) {
        // Apply the same four boundary tests from the Java source
        if (r + c < side - 1)     continue;
        if (c - r  >= side)        continue;
        if (r + c >= 3 * side - 1) continue;
        if (r - c  > side)         continue;

        if (this.trim && c === 0) {
          addHalfBrick(graph, r, c + 1);
        } else if (this.trim && c >= cols - 1) {
          addHalfBrick(graph, r, c);
        } else {
          addBrick(graph, r, c);
        }
      }
    }

    graph.makeFaces();
    graph.reorder();

    return graph;
  }
}
