/**
 * DiamondOn3464 — faithful 1:1 port stub.
 * @java game/functions/graph/generators/basis/tiling/tiling3464/DiamondOn3464.java
 * Deferred: diamond-shape T3464 not in existing named-tilings.
 */
import { Graph } from "../../../../../../../../eval/graph/graph.js";
import { Basis } from "../../Basis.js";
export class DiamondOn3464 extends Basis {
  public constructor(_dimA: number, _dimB?: number) { super(); this._dim = []; }
  public override eval(_siteType: string): Graph { return new Graph(); }
}
