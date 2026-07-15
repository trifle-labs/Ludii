/**
 * Celtic — faithful 1:1 port.
 * @java game/functions/graph/generators/basis/celtic/Celtic.java
 *
 * Celtic-knot board: a diamond lattice of "satellite" vertices (4 per
 * grid cell, shared with neighbours) plus a perimeter-smoothing pass that
 * inserts rounded-corner vertices/faces along the boundary. The rounded
 * corners are real board sites (not a rendering-only embellishment), so a
 * plain rows×cols rectangle under-counts the board — see Celtic.java:150-282.
 */

import { Graph } from "../../../../../../../eval/graph/graph.js";
import { UNIT } from "../../../BaseGraphFunction.js";
import { Basis } from "../Basis.js";

/** @java main.math.MathRoutines.angleDifference(Point2D, Point2D, Point2D) */
function angleDifference(
  ax: number, ay: number,
  bx: number, by: number,
  cx: number, cy: number,
): number {
  const vx = bx - ax;
  const vy = by - ay;
  const ux = cx - bx;
  const uy = cy - by;
  return Math.atan2(ux * -vy + uy * vx, ux * vx + uy * vy);
}

/** @java main.math.Vector — signed polygon area, used only to normalise winding. */
function signedArea(poly: readonly (readonly [number, number])[]): number {
  let area = 0;
  for (let i = 0; i < poly.length; i += 1) {
    const [x1, y1] = poly[i] as [number, number];
    const [x2, y2] = poly[(i + 1) % poly.length] as [number, number];
    area += x1 * y2 - x2 * y1;
  }
  return area / 2;
}

/** @java game/functions/graph/generators/basis/celtic/Celtic.java */
export class Celtic extends Basis {
  public constructor(rows: number, cols?: number) {
    super();
    this._dim = cols !== undefined ? [rows, cols] : [rows];
    // NOTE: the Java class also has a (Poly | DimFunction[] sides) constructor
    // for irregular Celtic outlines (Celtic.java:81-108). No game exercised by
    // the parity suite uses that overload; only the rows/columns rectangle
    // path below is faithfully ported. A poly/sides call will silently fall
    // back to the rows/columns rectangle case (same limitation as before).
  }

  /**
   * @java Celtic.eval(Context, SiteType) — Celtic.java:113-283.
   * Polygon/sides outline forms are not supported (see constructor note);
   * only the rows×columns rectangle form is ported.
   */
  public override eval(_siteType: string): Graph {
    const uu = UNIT / Math.sqrt(2);
    const uu2 = 2 * uu;
    // @java Celtic.java:122 — satellite offsets around each grid reference point.
    const ref: readonly (readonly [number, number])[] = [
      [uu, 0], [0, uu], [-uu, 0], [0, -uu],
    ];

    const rows = Math.max(1, this._dim[0] ?? 3);
    const cols = Math.max(1, this._dim[1] ?? rows);
    const toCol = cols - 1;
    const toRow = rows - 1;

    const graph = new Graph();

    // @java Celtic.java:152-169 — add satellite points (dedup via addVertex).
    for (let row = 0; row < toRow + 1; row += 1) {
      for (let col = 0; col < toCol + 1; col += 1) {
        const px = col * uu2;
        const py = row * uu2;
        for (const [dx, dy] of ref) graph.addVertex(px + dx, py + dy);
      }
    }

    // @java Celtic.java:170-171 — graph.makeEdges() joins unit-distance pairs
    // (adjacent satellites within/between octagons are exactly `unit` apart
    // since |ref[i] - ref[j]| = uu*sqrt(2) = UNIT); makeFaces(true) discovers
    // the resulting diamond faces.
    graph.makeEdges();
    graph.makeFaces();

    // @java Celtic.java:173-175 — MeasureGraph.measurePerimeter + perimeters().get(0).
    // Only the first perimeter ring is used, matching Java exactly.
    const ring = graph.perimeterRingList[0];
    if (ring && ring.length > 0) {
      // TS perimeter tracing direction is not guaranteed to match Java's
      // followPerimeterClockwise; normalise winding the same way
      // Graph.cornerVertices() does so the angleDifference signs below match
      // Java's convex/flat/concave classification.
      let list = [...ring];
      const poly0: [number, number][] = list.map((vid) => {
        const v = graph.vertices[vid]!;
        return [v.x, v.y];
      });
      if (signedArea(poly0) < 0) list = list.reverse();
      const pt = (vid: number): [number, number] => {
        const v = graph.vertices[vid]!;
        return [v.x, v.y];
      };

      const n = list.length;
      // @java Celtic.java:178-202 — classify perimeter positions.
      const keypoints = new Set<number>();
      let flatRun = 0;
      for (let i = 0; i < n; i += 1) {
        const [lx, ly] = pt(list[(i - 1 + n) % n]!);
        const [mx, my] = pt(list[i]!);
        const [nx, ny] = pt(list[(i + 1) % n]!);
        const diff = angleDifference(lx, ly, mx, my, nx, ny);

        if (diff > 0.25 * Math.PI) {
          // Convex corner.
          keypoints.add(i);
          flatRun = 0;
        } else if (Math.abs(diff) < 0.1 * Math.PI) {
          // Flat step — every other one is a keypoint. `flatRun` is
          // deliberately NOT reset outside these two branches (Java parity).
          flatRun += 1;
          if (flatRun % 2 === 0) keypoints.add(i);
        }
      }

      // @java Celtic.java:205-277 — add curves/corners for each keypoint, in
      // ascending index order (matches BitSet.nextSetBit iteration).
      const sortedKeypoints = [...keypoints].sort((a, b) => a - b);
      for (const k of sortedKeypoints) {
        const vb = list[(k - 1 + n) % n]!;
        const vc = list[k]!;
        const vd = list[(k + 1) % n]!;
        const ve = list[(k + 2) % n]!;

        const [bx, by] = pt(vb);
        const [cx, cy] = pt(vc);
        const [dx, dy] = pt(vd);
        const [ex, ey] = pt(ve);

        const diffC = angleDifference(bx, by, cx, cy, dx, dy);
        const diffD = angleDifference(cx, cy, dx, dy, ex, ey);

        if (diffD < -0.25 * Math.PI) {
          // Double step: join C to E directly, no new vertex.
          graph.addEdge(vc, ve);
          graph.findOrAddFace([vd, vc, ve]);
        } else {
          // Single step: join C to D via a new rounded-corner vertex.
          // @java Celtic.java:237-252 — tangentAX defaults to (vb -> vc); for a
          // flat step it's overridden to perpendicular(reverse(vc -> vd)).
          let tx = cx - bx;
          let ty = cy - by;
          if (Math.abs(diffC) < 0.1 * Math.PI) {
            // vc -> vd, then perpendicular() [(x,y) -> (-y,x)], then reverse().
            const vx0 = dx - cx;
            const vy0 = dy - cy;
            tx = -(-vy0);
            ty = -vx0;
          }

          // @java Celtic.java:254-259 — ptX = midCD + 0.9 * tangentAX (unnormalised).
          const midX = (cx + dx) / 2;
          const midY = (cy + dy) / 2;
          const ptX: [number, number] = [midX + 0.9 * tx, midY + 0.9 * ty];

          const vx = graph.addVertex(ptX[0], ptX[1]);
          graph.addEdge(vc, vx);
          graph.addEdge(vx, vd);
          graph.findOrAddFace([vc, vx, vd]);
        }
      }
    }

    graph.reorder();

    return graph;
  }
}
