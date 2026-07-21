/**
 * @java Core/src/game/functions/graph/generators/shape/concentric/ConcentricRegular.java
 * Defines a regular polygonal concentric board (Morris/Merels style).
 */

import { Graph } from "../../../../../../../eval/graph/graph.js";
import { Basis } from "../../basis/Basis.js";

/**
 * Concentric regular polygon board (e.g. Nine Men's Morris = Square, rings=3).
 * @java game/functions/graph/generators/shape/concentric/ConcentricRegular.java
 */
export class ConcentricRegular extends Basis {
  private readonly numSides: number;
  private readonly numRings: number;
  private readonly midpoints: boolean;
  private readonly joinMidpoints: boolean;
  private readonly joinCorners: boolean;

  /** @java ConcentricRegular(int sides, int rings, ...) */
  constructor(
    sides: number,
    rings: number,
    midpoints: boolean,
    joinMidpoints: boolean,
    joinCorners: boolean,
  ) {
    super();
    this._dim = [sides, rings];
    this.numSides = sides;
    this.numRings = rings;
    this.midpoints = midpoints;
    this.joinMidpoints = joinMidpoints;
    this.joinCorners = joinCorners;
  }

  /** @java ConcentricRegular.eval(Context, SiteType) */
  public override eval(siteType: string): Graph {
    if (this.numSides < 3)
      throw new Error("Concentric board shape must have at least three sides.");

    const graph = new Graph();
    if (this.numRings < 1) return graph;

    const arc = (2 * Math.PI) / this.numSides;
    // starting theta: offset by arc/2 for even-sided polygons
    const ref = Math.PI / 2 + (this.numSides % 2 === 0 ? arc / 2 : 0);

    // Create vertices and edges along each ring
    let baseV = 0;
    for (let ring = 0; ring < this.numRings; ring += 1) {
      const radius = 1 + ring * (this.numSides === 3 ? 2 : 1);

      for (let side = 0; side < this.numSides; side += 1) {
        const xa = radius * Math.cos(ref + arc * side);
        const ya = radius * Math.sin(ref + arc * side);
        const xc = radius * Math.cos(ref + arc * (side + 1));
        const yc = radius * Math.sin(ref + arc * (side + 1));
        const xb = (xa + xc) / 2;
        const yb = (ya + yc) / 2;

        graph.addVertex(xa, ya);
        if (this.midpoints) graph.addVertex(xb, yb);
      }

      // Create edges along this ring
      for (let v = baseV; v < graph.vertices.length; v += 1) {
        const vv = v < graph.vertices.length - 1 ? v + 1 : baseV;
        graph.addEdge(v, vv);
      }

      baseV = graph.vertices.length;
    }

    // Create edges between rings
    if ((this.midpoints && this.joinMidpoints) || this.joinCorners) {
      const edgesPerSide = this.midpoints ? 2 : 1;
      const edgesPerRing = this.numSides * edgesPerSide;

      for (let ring = 0; ring < this.numRings - 1; ring += 1) {
        for (let side = 0; side < this.numSides; side += 1) {
          if (this.joinCorners) {
            const v = ring * edgesPerRing + side * edgesPerSide;
            const vv = v + edgesPerRing;
            graph.addEdge(v, vv);
          }
          if (this.joinMidpoints) {
            const v = ring * edgesPerRing + side * edgesPerSide + 1;
            const vv = v + edgesPerRing;
            graph.addEdge(v, vv);
          }
        }
      }
    }

    graph.reorder();
    if (siteType === "Cell") graph.makeFaces();

    return graph;
  }
}
