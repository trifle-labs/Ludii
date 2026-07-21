/**
 * Quadhex — faithful 1:1 port.
 * @java game/functions/graph/generators/basis/quadhex/Quadhex.java
 *
 * A hexagon tessellated by quadrilaterals (Three-Player Chess board).
 * Delegates to genQuadhex from named-tilings.ts.
 */

import { Graph } from "../../../../../../../eval/graph/graph.js";
import { genQuadhex } from "../../../../../../../eval/graph/named-tilings.js";
import type { DimFunction } from "../../../../dim/DimFunction.js";
import { Basis } from "../Basis.js";

/** @java game/functions/graph/generators/basis/quadhex/Quadhex.java */
export class Quadhex extends Basis {
  private readonly thirds: boolean;

  /**
   * @java Quadhex(DimFunction layers, @Opt @Name Boolean thirds)
   * @param layers Number of layers.
   * @param thirds Whether to split the board into three-subsections [False].
   */
  public constructor(layers: DimFunction, thirds?: boolean | null) {
    super();
    this._dim = [layers.eval()];
    this.thirds = thirds ?? false;
  }

  /** @java Quadhex.eval(Context, SiteType) */
  public override eval(_siteType: string): Graph {
    return genQuadhex(this._dim[0] ?? 4, this.thirds);
  }
}
