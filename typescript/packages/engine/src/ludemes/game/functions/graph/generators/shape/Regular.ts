/**
 * @java Core/src/game/functions/graph/generators/shape/Regular.java
 * Defines a regular polygon (or star polygon) as a graph.
 */

import { Graph } from "../../../../../../eval/graph/graph.js";
import { BaseGraphFunction } from "../../BaseGraphFunction.js";
import type { ShapeStarType } from "./ShapeStarType.js";

/**
 * Regular polygon (or star) generator.
 * @java game/functions/graph/generators/shape/Regular.java
 */
export class Regular extends BaseGraphFunction {
  private readonly numSides: number;
  private readonly isStar: boolean;

  /** @java Regular(ShapeStarType star, DimFunction numSides) */
  constructor(numSides: number, star?: ShapeStarType) {
    super();
    this._dim = [numSides];
    this.numSides = numSides;
    this.isStar = star != null;
  }

  /** @java Regular.eval(Context, SiteType) */
  public override eval(siteType: string): Graph {
    const n = this.numSides;
    const r = n / (2 * Math.PI);
    const graph = new Graph();

    const offset = n === 4 ? Math.PI / 4 : Math.PI / 2;

    for (let i = 0; i < n; i += 1) {
      const theta = offset + (i / n) * 2 * Math.PI;
      graph.addVertex(r * Math.cos(theta), r * Math.sin(theta));
    }

    if (this.isStar) {
      // Star: connect each vertex to the one (n-1)/2 steps away
      for (let i = 0; i < n; i += 1)
        graph.addEdge(i, (i + Math.floor((n - 1) / 2)) % n);
    } else {
      // Simple polygon
      for (let i = 0; i < n; i += 1)
        graph.addEdge(i, (i + 1) % n);
    }

    if (siteType === "Cell") graph.makeFaces();
    graph.reorder();

    return graph;
  }
}
