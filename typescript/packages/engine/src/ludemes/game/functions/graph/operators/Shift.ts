/**
 * @java Core/src/game/functions/graph/operators/Shift.java
 * Translates a graph by the specified dx, dy (and optionally dz).
 */

import { Graph } from "../../../../../eval/graph/graph.js";
import { BaseGraphFunction } from "../BaseGraphFunction.js";
import type { GraphFunction } from "../GraphFunction.js";
import type { FloatFunction } from "../../../../base.js";

type FloatArg = FloatFunction | number;

/**
 * Shift operator: translate graph vertices.
 * @java game/functions/graph/operators/Shift.java
 */
export class Shift extends BaseGraphFunction {
  private readonly dxFn: FloatArg;
  private readonly dyFn: FloatArg;
  private readonly dzFn: FloatArg | null | undefined;
  private readonly graphFn: GraphFunction;

  /** @java Shift(FloatFunction dx, FloatFunction dy, FloatFunction dz, GraphFunction graph) */
  constructor(dx: FloatArg, dy: FloatArg, dz: FloatArg | null | undefined, graph: GraphFunction) {
    super();
    this._dim = [];
    this.dxFn = dx;
    this.dyFn = dy;
    this.dzFn = dz;
    this.graphFn = graph;
  }

  /** @java Shift.eval(Context, SiteType) */
  public override eval(siteType: string): Graph {
    const graph = this.graphFn.eval(siteType);
    if (graph.vertices.length === 0) return graph;

    const dx = evalFloatArg(this.dxFn);
    const dy = evalFloatArg(this.dyFn);
    void (this.dzFn === null || this.dzFn === undefined ? 0 : evalFloatArg(this.dzFn));

    // @java Graph.translate(dx, dy, dz)
    return graph.withTransformedCoordinates((x, y) => [x + dx, y + dy]);
  }
}

function evalFloatArg(fn: FloatArg): number {
  if (typeof fn === "number") return fn;
  return fn.eval({} as Parameters<FloatFunction["eval"]>[0]);
}
