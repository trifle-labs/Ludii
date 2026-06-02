/**
 * CustomOn3464 — faithful 1:1 port stub.
 * @java game/functions/graph/generators/basis/tiling/tiling3464/CustomOn3464.java
 * Deferred: requires polygon-clip on T3464 lattice geometry.
 */
import { Graph } from "../../../../../../../../eval/graph/graph.js";
import { Basis } from "../../Basis.js";
export class CustomOn3464 extends Basis {
  public constructor(_polyOrSides: [number, number][] | number[], _isPoly = false) {
    super(); this._dim = [];
  }
  public override eval(_siteType: string): Graph { return new Graph(); }
}
