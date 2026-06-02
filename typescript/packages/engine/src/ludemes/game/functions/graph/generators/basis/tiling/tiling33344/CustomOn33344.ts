/**
 * CustomOn33344 — faithful 1:1 port stub.
 * @java game/functions/graph/generators/basis/tiling/tiling33344/CustomOn33344.java
 * Deferred: requires polygon-clip on T33344 lattice geometry.
 */
import { Graph } from "../../../../../../../../eval/graph/graph.js";
import { Basis } from "../../Basis.js";
export class CustomOn33344 extends Basis {
  public constructor(_polyOrSides: [number, number][] | number[], _isPoly = false) {
    super();
    this._dim = [];
  }
  public override eval(_siteType: string): Graph { return new Graph(); }
}
