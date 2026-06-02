/**
 * @java Core/src/game/functions/graph/operators/Recoordinate.java
 * Regenerates the coordinate labels for the elements of a graph.
 * In Java, the body of eval() is entirely commented out — it returns the
 * graph unchanged. We faithfully replicate that no-op behaviour here.
 */

import { Graph } from "../../../../../eval/graph/graph.js";
import { BaseGraphFunction } from "../BaseGraphFunction.js";
import type { GraphFunction } from "../GraphFunction.js";

/**
 * Recoordinate operator: no-op in current Java (body commented out).
 * @java game/functions/graph/operators/Recoordinate.java
 */
export class Recoordinate extends BaseGraphFunction {
  private readonly graphFn: GraphFunction;

  /** @java Recoordinate(SiteType..., GraphFunction graph) */
  constructor(graphFn: GraphFunction) {
    super();
    this._dim = [];
    this.graphFn = graphFn;
  }

  /** @java Recoordinate.eval(Context, SiteType) — body entirely commented out in Java; just returns graph */
  public override eval(siteType: string): Graph {
    // @java Recoordinate.eval — commented-out body: just returns graph unchanged
    return this.graphFn.eval(siteType);
  }
}
