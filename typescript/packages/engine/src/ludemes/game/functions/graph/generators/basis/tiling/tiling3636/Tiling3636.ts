/**
 * Tiling3636 — faithful 1:1 port.
 * @java game/functions/graph/generators/basis/tiling/tiling3636/Tiling3636.java
 *
 * 3-6-3-6 (tri-hex) tiling board. Delegates to buildNamedTiling("T3636").
 */

import { Graph } from "../../../../../../../../eval/graph/graph.js";
import { buildNamedTiling } from "../../../../../../../../eval/graph/named-tilings.js";
import { Basis } from "../../Basis.js";

/** @java game/functions/graph/generators/basis/tiling/tiling3636/Tiling3636.java */
export class Tiling3636 extends Basis {
  /**
   * @java Tiling3636(DimFunction dimA, DimFunction dimB)
   * @param dimA Primary dimension.
   * @param dimB Secondary dimension (optional).
   */
  public constructor(dimA: number, dimB?: number) {
    super();
    this._dim = dimB !== undefined ? [dimA, dimB] : [dimA];
  }

  /** @java Tiling3636.eval(Context, SiteType) */
  public override eval(_siteType: string): Graph {
    const a = this._dim[0] ?? 3;
    const b = this._dim[1];
    return buildNamedTiling("T3636", a, b) ?? new Graph();
  }
}
