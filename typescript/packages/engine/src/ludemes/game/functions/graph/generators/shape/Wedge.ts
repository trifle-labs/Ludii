/**
 * @java Core/src/game/functions/graph/generators/shape/Wedge.java
 * Defines a triangular wedge shaped graph.
 */

import { Graph } from "../../../../../../eval/graph/graph.js";
import { BaseGraphFunction } from "../../BaseGraphFunction.js";

/** Linear interpolation — @java MathRoutines.lerp */
function lerp(t: number, a: number, b: number): number {
  return a + t * (b - a);
}

/**
 * Wedge board: apex at top, rows below expanding outward.
 * @java game/functions/graph/generators/shape/Wedge.java
 */
export class Wedge extends BaseGraphFunction {
  private readonly rows: number;
  private readonly columns: number;

  /** @java Wedge(DimFunction rows, DimFunction columns) */
  constructor(
    rows: number | { eval(): number },
    columns?: number | { eval(): number } | null,
  ) {
    super();
    // The ArgCompiler passes DimConstant objects (declared param type
    // DimFunction), not raw numbers. They lack valueOf(), so any `+` with one
    // operand string-concatenates ("1" + DimConstant(4) → "140") and corrupts
    // the generated vertex/edge ids. Resolve to plain numbers up front so all
    // arithmetic in eval() is numeric — mirrors Rectangle.construct().
    const toNum = (v: number | { eval(): number }): number =>
      typeof v === "number" ? v : v.eval();
    const rowsNum = toNum(rows);
    const colsNum = columns != null ? toNum(columns) : 3;
    this._dim = columns != null ? [rowsNum, colsNum] : [rowsNum];
    this.rows = rowsNum;
    this.columns = colsNum;
  }

  /** @java Wedge.eval(Context, SiteType) */
  public override eval(_siteType: string): Graph {
    const rows = this.rows;
    const columns = this.columns;
    const graph = new Graph();

    // Create vertices
    const mid = rows - 1;
    for (let r = 0; r < rows; r += 1) {
      if (r === 0) {
        // Apex
        graph.addVertex(mid, mid);
      } else {
        // Non-apex row
        const left = mid - r;
        const right = mid + r;
        for (let c = 0; c < columns; c += 1) {
          const t = c / (columns - 1);
          const x = lerp(t, left, right);
          const y = mid - r;
          graph.addVertex(x, y);
        }
      }
    }

    // Create edges
    for (let r = 0; r < rows; r += 1) {
      if (r === 0) {
        // Apex to first row
        for (let c = 0; c < columns; c += 1) graph.addEdge(0, c + 1);
      } else {
        const from = r * columns - columns + 1;
        // Edges across
        for (let c = 0; c < columns - 1; c += 1)
          graph.addEdge(from + c, from + c + 1);
        // Edges down
        if (r < rows - 1) {
          for (let c = 0; c < columns; c += 1)
            graph.addEdge(from + c, from + columns + c);
        }
      }
    }

    return graph;
  }
}
