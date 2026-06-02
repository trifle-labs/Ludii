/**
 * @java Core/src/game/functions/graph/generators/shape/concentric/ConcentricTarget.java
 * Defines a board formed by a set of concentric rings (target board, one site per cell).
 */

import { Graph } from "../../../../../../../eval/graph/graph.js";
import { Basis } from "../../basis/Basis.js";

/**
 * Target board: numRings concentric circular rings, each treated as a single cell.
 * @java game/functions/graph/generators/shape/concentric/ConcentricTarget.java
 */
export class ConcentricTarget extends Basis {
  private readonly numRings: number;

  /** @java ConcentricTarget(int rings) */
  constructor(rings: number) {
    super();
    this._dim = [rings];
    this.numRings = rings;
  }

  /** @java ConcentricTarget.eval(Context, SiteType) */
  public override eval(_siteType: string): Graph {
    const graph = new Graph();
    if (this.numRings < 1) return graph;

    // @java ConcentricTarget.eval — 8 steps per ring, arc = 2π/8, off = π/2
    const numSteps = 8;
    const arc = (2 * Math.PI) / numSteps;
    const off = Math.PI / 2;

    for (let ring = 0; ring < this.numRings; ring += 1) {
      const radius = ring + 1;
      const baseV = graph.vertices.length;

      // Create vertices around this ring
      for (let step = 0; step < numSteps; step += 1) {
        const x = radius * Math.cos(off + arc * step);
        const y = radius * Math.sin(off + arc * step);
        graph.addVertex(x, y);
      }

      // Create edges around this ring
      for (let va = baseV; va < graph.vertices.length; va += 1) {
        const vb = va < graph.vertices.length - 1 ? va + 1 : baseV;
        graph.addEdge(va, vb);
      }
    }

    graph.makeFaces();
    return graph;
  }
}
