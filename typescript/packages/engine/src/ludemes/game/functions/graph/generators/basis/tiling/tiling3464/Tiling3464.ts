/**
 * Tiling3464 — faithful 1:1 port.
 * @java game/functions/graph/generators/basis/tiling/tiling3464/Tiling3464.java
 */
import { Graph } from "../../../../../../../../eval/graph/graph.js";
import { buildNamedTiling } from "../../../../../../../../eval/graph/named-tilings.js";
import { Basis } from "../../Basis.js";
export class Tiling3464 extends Basis {
  public constructor(dimA: number, dimB?: number) {
    super();
    this._dim = dimB !== undefined ? [dimA, dimB] : [dimA];
  }
  public override eval(_siteType: string): Graph {
    return buildNamedTiling("T3464", this._dim[0] ?? 3, this._dim[1]) ?? new Graph();
  }
}
