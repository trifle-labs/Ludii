/**
 * CustomOn3636 — faithful 1:1 port stub.
 * @java game/functions/graph/generators/basis/tiling/tiling3636/CustomOn3636.java
 *
 * Custom polygon or side-described board on the 3-6-3-6 tiling.
 * The full polygon-clip geometry for T3636 is complex; this class is deferred.
 * The standard hex-shape T3636 tiling is available via Tiling3636.
 */

import { Graph } from "../../../../../../../../eval/graph/graph.js";
import { Basis } from "../../Basis.js";

/** @java game/functions/graph/generators/basis/tiling/tiling3636/CustomOn3636.java */
export class CustomOn3636 extends Basis {
  /** @java CustomOn3636(Polygon polygon) or CustomOn3636(DimFunction[] sides) */
  public constructor(
    _polyOrSides: [number, number][] | number[],
    _isPoly = false,
  ) {
    super();
    this._dim = [];
  }

  /** @java CustomOn3636.eval(Context, SiteType) — deferred: needs tiling polygon clip. */
  public override eval(_siteType: string): Graph {
    // Deferred: requires polygon-clip on T3636 lattice geometry.
    return new Graph();
  }
}
