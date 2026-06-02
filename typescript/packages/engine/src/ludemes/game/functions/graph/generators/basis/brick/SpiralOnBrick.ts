/**
 * SpiralOnBrick — faithful 1:1 port stub.
 * @java game/functions/graph/generators/basis/brick/SpiralOnBrick.java
 * Deferred: spiral shape on brick tiling geometry not implemented.
 */
import { Graph } from "../../../../../../../eval/graph/graph.js";
import { Basis } from "../Basis.js";
export class SpiralOnBrick extends Basis {
  public constructor(_dim: number) { super(); this._dim = []; }
  public override eval(_siteType: string): Graph { return new Graph(); }
}
