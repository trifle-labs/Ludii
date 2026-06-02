/**
 * Tiling333333_33434 — faithful 1:1 port.
 * @java game/functions/graph/generators/basis/tiling/tiling333333_33434/Tiling333333_33434.java
 */
import { Graph } from "../../../../../../../../eval/graph/graph.js";
import { buildNamedTiling } from "../../../../../../../../eval/graph/named-tilings.js";
import { Basis } from "../../Basis.js";
export class Tiling333333_33434 extends Basis {
  public constructor(dimA: number) { super(); this._dim = [dimA]; }
  public override eval(_siteType: string): Graph {
    return buildNamedTiling("T333333_33434", this._dim[0] ?? 3) ?? new Graph();
  }
}
