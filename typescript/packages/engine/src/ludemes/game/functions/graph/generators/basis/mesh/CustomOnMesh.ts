/**
 * CustomOnMesh — faithful 1:1 port stub.
 * @java game/functions/graph/generators/basis/mesh/CustomOnMesh.java
 * Deferred: full mesh geometry not implemented.
 */
import { Graph } from "../../../../../../../eval/graph/graph.js";
import { Basis } from "../Basis.js";
export class CustomOnMesh extends Basis {
  public constructor(_polyOrSides: [number, number][] | number[], _isPoly = false) {
    super(); this._dim = [];
  }
  public override eval(_siteType: string): Graph { return new Graph(); }
}
