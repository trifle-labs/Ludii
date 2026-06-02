/**
 * StarOn3464 — faithful 1:1 port stub.
 * @java game/functions/graph/generators/basis/tiling/tiling3464/StarOn3464.java
 * Deferred: star-shape T3464 not in existing named-tilings.
 */
import { Graph } from "../../../../../../../../eval/graph/graph.js";
import { Basis } from "../../Basis.js";
export class StarOn3464 extends Basis {
  public constructor(_dim: number) { super(); this._dim = []; }
  public override eval(_siteType: string): Graph { return new Graph(); }
}
