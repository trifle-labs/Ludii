/**
 * @java Core/src/game/functions/graph/operators/Recoordinate.java
 * Regenerates the coordinate labels for the elements of a graph.
 * In Java, the body of eval() is entirely commented out — it returns the
 * graph unchanged. We faithfully replicate that no-op behaviour here.
 */

import { Graph } from "../../../../../eval/graph/graph.js";
import type { SiteType } from "../../../../other/action/SiteType.js";
import { BaseGraphFunction } from "../BaseGraphFunction.js";
import type { GraphFunction } from "../GraphFunction.js";

/**
 * Recoordinate operator: no-op in current Java (body commented out).
 * @java game/functions/graph/operators/Recoordinate.java
 */
export class Recoordinate extends BaseGraphFunction {
  private readonly siteTypeA: SiteType | null | undefined;
  private readonly siteTypeB: SiteType | null | undefined;
  private readonly siteTypeC: SiteType | null | undefined;
  private readonly graphFn: GraphFunction;

  /** @java Recoordinate(@Opt SiteType siteTypeA, @Opt SiteType siteTypeB, @Opt SiteType siteTypeC, GraphFunction graph) */
  constructor(
    siteTypeA: SiteType | null | undefined,
    siteTypeB: SiteType | null | undefined,
    siteTypeC: SiteType | null | undefined,
    graph: GraphFunction,
  ) {
    super();
    this._dim = [];
    this.siteTypeA = siteTypeA;
    this.siteTypeB = siteTypeB;
    this.siteTypeC = siteTypeC;
    this.graphFn = graph;
  }

  /** @java Recoordinate.eval(Context, SiteType) — body entirely commented out in Java; just returns graph */
  public override eval(siteType: string): Graph {
    // @java Recoordinate.eval — commented-out body: just returns graph unchanged
    return this.graphFn.eval(siteType);
  }
}
