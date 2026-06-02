/**
 * HexagonOn3464 — faithful 1:1 port.
 * @java game/functions/graph/generators/basis/tiling/tiling3464/HexagonOn3464.java
 * Hexagon-shaped 3-4-6-4 tiling.
 */
import { Graph } from "../../../../../../../../eval/graph/graph.js";
import { buildNamedTiling } from "../../../../../../../../eval/graph/named-tilings.js";
import { Basis } from "../../Basis.js";
export class HexagonOn3464 extends Basis {
  public constructor(dimA: number) {
    super();
    this._dim = [dimA];
  }
  public override eval(_siteType: string): Graph {
    return buildNamedTiling("T3464", this._dim[0] ?? 3) ?? new Graph();
  }
}
