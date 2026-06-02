/**
 * Quadhex — faithful 1:1 port.
 * @java game/functions/graph/generators/basis/quadhex/Quadhex.java
 *
 * A hexagon tessellated by quadrilaterals (Three-Player Chess board).
 * Delegates to genQuadhex from named-tilings.ts.
 */

import { Graph } from "../../../../../../../eval/graph/graph.js";
import { genQuadhex } from "../../../../../../../eval/graph/named-tilings.js";
import { Basis } from "../Basis.js";

/** @java game/functions/graph/generators/basis/quadhex/Quadhex.java */
export class Quadhex extends Basis {
  /**
   * @java Quadhex(DimFunction layers)
   * @param layers Number of layers per sextant.
   */
  public constructor(layers: number) {
    super();
    this._dim = [layers];
  }

  /** @java Quadhex.eval(Context, SiteType) */
  public override eval(_siteType: string): Graph {
    return genQuadhex(this._dim[0] ?? 4);
  }
}
