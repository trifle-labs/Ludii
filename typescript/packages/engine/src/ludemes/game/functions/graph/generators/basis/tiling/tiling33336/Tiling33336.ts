/**
 * Tiling33336 — faithful 1:1 port.
 * @java game/functions/graph/generators/basis/tiling/tiling33336/Tiling33336.java
 */
import { Graph } from "../../../../../../../../eval/graph/graph.js";
import { buildNamedTiling } from "../../../../../../../../eval/graph/named-tilings.js";
import { Basis } from "../../Basis.js";
export class Tiling33336 extends Basis {
  public constructor(dimA: number) { super(); this._dim = [dimA]; }
  public override eval(_siteType: string): Graph {
    return buildNamedTiling("T33336", this._dim[0] ?? 3) ?? new Graph();
  }
}
