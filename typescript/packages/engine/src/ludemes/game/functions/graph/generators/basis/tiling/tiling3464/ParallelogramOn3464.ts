/**
 * ParallelogramOn3464 — faithful 1:1 port.
 * @java game/functions/graph/generators/basis/tiling/tiling3464/ParallelogramOn3464.java
 * Parallelogram-shaped 3-4-6-4 tiling.
 */
import { Graph } from "../../../../../../../../eval/graph/graph.js";
import { buildNamedTiling } from "../../../../../../../../eval/graph/named-tilings.js";
import { Basis } from "../../Basis.js";
export class ParallelogramOn3464 extends Basis {
  public constructor(dimA: number, dimB: number) {
    super();
    this._dim = [dimA, dimB];
  }
  public override eval(_siteType: string): Graph {
    return buildNamedTiling("T3464", this._dim[0] ?? 3, this._dim[1]) ?? new Graph();
  }
}
