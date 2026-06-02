/**
 * Celtic — faithful 1:1 port.
 * @java game/functions/graph/generators/basis/celtic/Celtic.java
 *
 * Celtic-knot board: approximated as a rows×cols rectangle grid.
 * The exact Celtic perimeter-curve algorithm is deferred; this class
 * produces a functional rectangular fallback for compilation.
 */

import { Graph } from "../../../../../../../eval/graph/graph.js";
import { genRectangle } from "../../../../../../../eval/graph/generators.js";
import { Basis } from "../Basis.js";

/** @java game/functions/graph/generators/basis/celtic/Celtic.java */
export class Celtic extends Basis {
  public constructor(rows: number, cols?: number) {
    super();
    this._dim = cols !== undefined ? [rows, cols] : [rows];
  }

  /**
   * @java Celtic.eval(Context, SiteType)
   * Approximated as a rectangle (exact Celtic geometry deferred).
   */
  public override eval(_siteType: string): Graph {
    const rows = Math.max(1, this._dim[0] ?? 3);
    const cols = Math.max(1, this._dim[1] ?? rows);
    return genRectangle(rows, cols, false);
  }
}
