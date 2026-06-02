/**
 * DiamondOrPrismOnBrick — faithful 1:1 port stub.
 * @java game/functions/graph/generators/basis/brick/DiamondOrPrismOnBrick.java
 * Deferred: diamond/prism shape on brick tiling geometry not implemented.
 */
import { Graph } from "../../../../../../../eval/graph/graph.js";
import { Basis } from "../Basis.js";
export class DiamondOrPrismOnBrick extends Basis {
  public constructor(_dimA: number, _dimB?: number) { super(); this._dim = []; }
  public override eval(_siteType: string): Graph { return new Graph(); }
}
