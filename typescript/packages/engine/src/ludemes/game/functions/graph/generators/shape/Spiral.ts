/**
 * @java Core/src/game/functions/graph/generators/shape/Spiral.java
 * Defines a board based on a spiral tiling (e.g. Mehen board).
 */

import { Graph } from "../../../../../../eval/graph/graph.js";
import { BaseGraphFunction } from "../../BaseGraphFunction.js";

/**
 * Spiral board generator.
 * @java game/functions/graph/generators/shape/Spiral.java
 */
export class Spiral extends BaseGraphFunction {
  private readonly numTurns: number;
  private readonly numSites: number;
  private readonly clockwise: boolean;

  /** @java Spiral(DimFunction turns, DimFunction sites, Boolean clockwise) */
  constructor(
    turns: number | { eval(): number },
    sites: number | { eval(): number },
    clockwise?: boolean,
  ) {
    super();
    // The ArgCompiler passes DimConstant objects (declared param type
    // DimFunction), not raw numbers — resolve them up front so arithmetic in
    // eval() is numeric (the same latent bug fixed in Wedge: a DimConstant in
    // a `+` string-concatenates). Mirrors Regular.construct.
    const toNum = (v: number | { eval(): number }): number =>
      typeof v === "number" ? v : v.eval();
    const turnsNum = toNum(turns);
    const sitesNum = toNum(sites);
    const cw = clockwise ?? true;
    this._dim = [turnsNum, sitesNum, cw ? 1 : 0];
    this.numTurns = turnsNum;
    this.numSites = sitesNum;
    this.clockwise = cw;
  }

  /** @java Spiral.eval(Context, SiteType) */
  public override eval(_siteType: string): Graph {
    const numTurns = this.numTurns;
    const numSites = this.numSites;
    const clockwise = this.clockwise;

    if (numSites > 1000)
      throw new Error(`${numSites} sites in spiral exceeds limit of 1000.`);

    const graph = new Graph();

    const b = 1;
    const x0 = 0;
    const y0 = 0;

    // Centre vertex (pivot)
    graph.addVertex(0, 0);

    const base = this.baseNumber(numTurns, numSites);

    const thetas = new Array<number>(4 * numSites).fill(0);
    let index = 1;

    let steps = base;
    for (let ring = 1; ring <= numTurns + 1; ring += 1) {
      const dTheta = (Math.PI * 2) / steps;
      let theta = Math.PI * 2 * ring;

      if (ring <= 2 || ring % 2 === 1) theta -= dTheta / 2;

      for (let step = 0; step < steps; step += 1) {
        thetas[index++] = theta;
        theta += dTheta;
      }
      if (ring <= 2) steps *= 2;
    }

    // Smoothing passes
    for (let vid = 2; vid < numSites; vid += 1)
      thetas[vid] = ((thetas[vid - 1] ?? 0) + (thetas[vid + 1] ?? 0)) / 2;
    for (let vid = 2; vid < numSites; vid += 1)
      thetas[vid] = ((thetas[vid - 1] ?? 0) + (thetas[vid + 1] ?? 0)) / 2;

    thetas[1] = (thetas[1] ?? 0) - 0.5 * ((thetas[2] ?? 0) - (thetas[1] ?? 0));

    for (let vid = 1; vid < numSites; vid += 1) {
      const theta = thetas[vid] ?? 0;
      const r = b * theta;
      const x = clockwise ? x0 - r * Math.cos(theta) : x0 + r * Math.cos(theta);
      const y = y0 + r * Math.sin(theta);
      graph.addVertex(x, y);
    }

    // Create edges (straight — tangent info omitted in TS Graph)
    for (let vid = 0; vid < graph.vertices.length - 1; vid += 1)
      graph.addEdge(vid, vid + 1);

    // Set pivot on all vertices
    const pivot = 0;
    for (const v of graph.vertices) graph.setPivot(v.id, pivot);

    return graph;
  }

  /** @java Spiral.baseNumber — find base ring size for given turns/sites. */
  private baseNumber(numTurns: number, numSites: number): number {
    for (let base = 1; base < numSites; base += 1) {
      let steps = base;
      let total = 1;
      for (let ring = 1; ring < numTurns; ring += 1) {
        total += steps;
        if (total > numSites) {
          if (ring <= numTurns) return base - 1;
          break;
        }
        if (ring <= 2) steps *= 2;
      }
    }
    return 0;
  }
}
