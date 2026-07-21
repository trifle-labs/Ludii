/**
 * Tiling31212 — faithful 1:1 port.
 * @java game/functions/graph/generators/basis/tiling/tiling31212/Tiling31212.java
 */
import { Graph } from "../../../../../../../../eval/graph/graph.js";
import { buildNamedTiling } from "../../../../../../../../eval/graph/named-tilings.js";
import { Basis } from "../../Basis.js";
export class Tiling31212 extends Basis {
  public constructor(dimA: number) { super(); this._dim = [dimA]; }
  public override eval(_siteType: string): Graph {
    return buildNamedTiling("T31212", this._dim[0] ?? 3) ?? new Graph();
  }
}
