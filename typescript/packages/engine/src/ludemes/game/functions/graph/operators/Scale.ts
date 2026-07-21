/**
 * @java Core/src/game/functions/graph/operators/Scale.java
 * Scales a graph by the specified amount in x, y (and optionally z).
 */

import { Graph } from "../../../../../eval/graph/graph.js";
import { BaseGraphFunction } from "../BaseGraphFunction.js";
import type { GraphFunction } from "../GraphFunction.js";
import type { FloatFunction } from "../../../../base.js";

type FloatArg = FloatFunction | number;

/**
 * Scale operator: scale vertex coordinates about the origin.
 * @java game/functions/graph/operators/Scale.java
 */
export class Scale extends BaseGraphFunction {
  private readonly scaleXFn: FloatArg;
  private readonly scaleYFn: FloatArg | null | undefined;
  private readonly scaleZFn: FloatArg | null | undefined;
  private readonly graphFn: GraphFunction;

  /** @java Scale(FloatFunction scaleX, FloatFunction scaleY, FloatFunction scaleZ, GraphFunction graph) */
  constructor(
    scaleX: FloatArg,
    scaleY: FloatArg | null | undefined,
    scaleZ: FloatArg | null | undefined,
    graph: GraphFunction,
  ) {
    super();
    this._dim = [];
    this.scaleXFn = scaleX;
    this.scaleYFn = scaleY;
    this.scaleZFn = scaleZ;
    this.graphFn = graph;
  }

  /** @java Scale.eval(Context, SiteType) */
  public override eval(siteType: string): Graph {
    const graph = this.graphFn.eval(siteType);
    if (graph.vertices.length === 0) return graph;

    const sx = evalFloatFn(this.scaleXFn);
    const sy = this.scaleYFn == null ? sx : evalFloatFn(this.scaleYFn);
    void (this.scaleZFn == null ? 1 : evalFloatFn(this.scaleZFn));

    // @java Graph.scale(sx, sy, sz) — mutates vertices in place; TS uses immutable transform
    return graph.withTransformedCoordinates((x, y) => [x * sx, y * sy]);
  }
}

function evalFloatFn(fn: FloatArg): number {
  if (typeof fn === "number") return fn;
  return fn.eval({} as Parameters<FloatFunction["eval"]>[0]);
}
