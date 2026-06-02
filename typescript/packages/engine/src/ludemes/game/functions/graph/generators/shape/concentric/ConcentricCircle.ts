/**
 * @java Core/src/game/functions/graph/generators/shape/concentric/ConcentricCircle.java
 * Defines a circular (wheel) concentric board with specified cells per ring.
 */

import { Graph } from "../../../../../../../eval/graph/graph.js";
import { Basis } from "../../basis/Basis.js";

interface Sample {
  x: number;
  y: number;
  theta: number;
}

/** Euclidean distance between two 2D points. */
function dist2(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

/**
 * Circular/wheel concentric board with `cellsPerRing` cells per ring.
 * @java game/functions/graph/generators/shape/concentric/ConcentricCircle.java
 */
export class ConcentricCircle extends Basis {
  private readonly cellsPerRing: number[];
  private readonly stagger: boolean;

  /** @java ConcentricCircle(int[] cellsPerRing, BooleanFunction stagger) */
  constructor(cellsPerRing: number[], stagger: boolean) {
    super();
    this._dim = [...cellsPerRing];
    this.cellsPerRing = cellsPerRing;
    this.stagger = stagger;
  }

  /** @java ConcentricCircle.eval(Context, SiteType) */
  public override eval(siteType: string): Graph {
    const graph = new Graph();
    if (siteType === "Cell") {
      this.generateForCells(graph);
    } else {
      this.generateForVertices(graph);
    }
    return graph;
  }

  // @java ConcentricCircle.generateForCells
  private generateForCells(graph: Graph): void {
    const numRings = this.cellsPerRing.length;
    if (numRings < 1) return;

    graph.addVertex(0, 0); // pivot centre vertex
    const pivot = 0;

    const tolerance = 0.001;
    const ref = Math.PI / 2; // orient to start at top

    // samples[ring] = list of { x, y, theta }
    const samples: Sample[][] = Array.from({ length: numRings + 1 }, () => []);

    for (let ring = 0; ring < numRings; ring += 1) {
      const cellsThisRing = Math.abs(this.cellsPerRing[ring] ?? 0);
      const rI = Math.max(0, ring - 0.5);
      const rO = ring + 0.5;
      const ringOffset =
        this.stagger && ring % 2 === 1
          ? (2 * Math.PI) / cellsThisRing / 2
          : 0;
      if (cellsThisRing < 2) continue;

      for (let step = 0; step < cellsThisRing; step += 1) {
        let theta = ref + ringOffset - (2 * Math.PI * step) / cellsThisRing;
        while (theta < -Math.PI) theta += 2 * Math.PI;
        while (theta > Math.PI) theta -= 2 * Math.PI;

        const ix = rI * Math.cos(theta);
        const iy = rI * Math.sin(theta);
        const ox = rO * Math.cos(theta);
        const oy = rO * Math.sin(theta);

        (samples[ring] as Sample[]).push({ x: ix, y: iy, theta });
        (samples[ring + 1] as Sample[]).push({ x: ox, y: oy, theta });
      }
    }

    // Order samples by angle within each ring
    for (let ring = 0; ring <= numRings; ring += 1)
      (samples[ring] as Sample[]).sort((a, b) => a.theta - b.theta);

    // Remove duplicate samples
    for (let ring = 0; ring <= numRings; ring += 1) {
      const rs = samples[ring] as Sample[];
      for (let n = rs.length - 1; n > 0; n -= 1) {
        const sA = rs[n] as Sample;
        const sB = rs[(n + rs.length - 1) % rs.length] as Sample;
        if (dist2(sA.x, sA.y, sB.x, sB.y) < tolerance) rs.splice(n, 1);
      }
    }

    // Create vertices
    for (let ring = 0; ring <= numRings; ring += 1)
      for (const s of samples[ring] as Sample[])
        graph.addVertex(s.x, s.y);

    // Create concentric edges around rings (curved arcs — straight in TS Graph)
    for (let ring = 0; ring <= numRings; ring += 1) {
      const rs = samples[ring] as Sample[];
      const ringSize = rs.length;
      if (ringSize < 2) continue;
      for (let n = 0; n < ringSize; n += 1) {
        const sA = rs[n] as Sample;
        const sB = rs[(n + 1) % ringSize] as Sample;
        const vA = graph.findVertex(sA.x, sA.y);
        const vB = graph.findVertex(sB.x, sB.y);
        if (vA >= 0 && vB >= 0 && vA !== vB) graph.addEdge(vA, vB);
      }
    }

    // Create perpendicular edges between rings
    for (let ring = 0; ring < numRings; ring += 1) {
      const cellsThisRing = Math.abs(this.cellsPerRing[ring] ?? 0);
      if (cellsThisRing < 2) continue;
      const rI = Math.max(0, ring - 0.5);
      const rO = ring + 0.5;
      const ringOffset =
        this.stagger && ring % 2 === 1
          ? (2 * Math.PI) / cellsThisRing / 2
          : 0;

      for (let step = 0; step < cellsThisRing; step += 1) {
        const theta = ref + ringOffset - (2 * Math.PI * step) / cellsThisRing;
        const ix = rI * Math.cos(theta);
        const iy = rI * Math.sin(theta);
        const ox = rO * Math.cos(theta);
        const oy = rO * Math.sin(theta);
        const vA = graph.addVertex(ix, iy);
        const vB = graph.addVertex(ox, oy);
        if (vA !== vB) graph.addEdge(vA, vB);
      }
    }

    // Set pivot
    for (const v of graph.vertices) graph.setPivot(v.id, pivot);

    graph.makeFaces();
  }

  // @java ConcentricCircle.generateForVertices
  private generateForVertices(graph: Graph): void {
    if (this.cellsPerRing.length === 0) return;

    if (this.cellsPerRing.length === 1) {
      this.simplePolygon(graph);
      return;
    }

    // Build vertsPerRing: prepend a 0 if first ring > 1 (no pivot cell)
    let vertsPerRing: number[];
    if (Math.abs(this.cellsPerRing[0] ?? 0) > 1) {
      vertsPerRing = [0, ...this.cellsPerRing];
    } else {
      vertsPerRing = [...this.cellsPerRing];
    }

    const noPivot = vertsPerRing[0] === 0;
    const numRings = vertsPerRing.length;
    if (numRings < 1) return;

    const ref = Math.PI / 2;
    const tolerance = 0.1;
    const samples: Sample[][] = Array.from({ length: numRings }, () => []);

    for (let ring = 0; ring < numRings; ring += 1) {
      const vertsThisRing = Math.abs(vertsPerRing[ring] ?? 0);
      const r = ring;
      const ringOffset =
        this.stagger && ring % 2 === 1
          ? (2 * Math.PI) / vertsThisRing / 2
          : 0;

      for (let step = 0; step < vertsThisRing; step += 1) {
        const theta =
          ref + ringOffset - (2 * Math.PI * step) / vertsThisRing;
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);
        (samples[ring] as Sample[]).push({ x, y, theta });
      }
    }

    // Order samples by angle (skip ring 0)
    for (let ring = 1; ring < numRings; ring += 1)
      (samples[ring] as Sample[]).sort((a, b) => a.theta - b.theta);

    // Remove duplicate samples (ring 1+)
    for (let ring = 1; ring < numRings; ring += 1) {
      const rs = samples[ring] as Sample[];
      for (let n = rs.length - 1; n > 0; n -= 1) {
        const sA = rs[n] as Sample;
        const sB = rs[(n + rs.length - 1) % rs.length] as Sample;
        if (dist2(sA.x, sA.y, sB.x, sB.y) < tolerance) rs.splice(n, 1);
      }
    }

    // Create vertices
    for (let ring = 0; ring < numRings; ring += 1)
      for (const s of samples[ring] as Sample[])
        graph.addVertex(s.x, s.y);

    // Create concentric edges around rings (curved arcs — straight in TS)
    for (let ring = 1; ring < numRings; ring += 1) {
      const vpr = vertsPerRing[ring] ?? 0;
      if (vpr < 2) continue;
      const rs = samples[ring] as Sample[];
      const ringSize = rs.length;
      if (ringSize < 2) continue;
      for (let n = 0; n < ringSize; n += 1) {
        const sA = rs[n] as Sample;
        const sB = rs[(n + 1) % ringSize] as Sample;
        const vA = graph.findVertex(sA.x, sA.y);
        const vB = graph.findVertex(sB.x, sB.y);
        if (vA >= 0 && vB >= 0 && vA !== vB) graph.addEdge(vA, vB);
      }
    }

    // Create perpendicular edges between rings
    for (let ring = 0; ring < numRings - 1; ring += 1) {
      for (const s of samples[ring] as Sample[]) {
        const vA = graph.findVertex(s.x, s.y);
        if (vA < 0) continue;

        if (ring === 0) {
          // Join to all vertices on ring 1
          for (const sB of samples[1] as Sample[]) {
            const vB = graph.findVertex(sB.x, sB.y);
            if (vB >= 0) graph.addEdge(vA, vB);
          }
        } else {
          const ratio = (ring + 1) / ring;
          const xB = s.x * ratio;
          const yB = s.y * ratio;
          const vB = graph.findVertex(xB, yB);
          if (vB >= 0) {
            graph.addEdge(vA, vB);
            if (noPivot) graph.setPivot(vB, vA); // inner is pivot of outer
          }
        }
      }
    }

    // Set pivot when centre vertex exists
    if ((vertsPerRing[0] ?? 0) !== 0) {
      const pivot = graph.findVertex(0, 0);
      if (pivot >= 0) {
        for (const v of graph.vertices) graph.setPivot(v.id, pivot);
      }
    }
  }

  // @java ConcentricCircle.simplePolygon
  private simplePolygon(graph: Graph): void {
    const numSides = this.cellsPerRing[0] ?? 3;
    const r = numSides / (2 * Math.PI);
    const offset = numSides === 4 ? Math.PI / 4 : Math.PI / 2;

    for (let n = 0; n < numSides; n += 1) {
      const theta = offset + (n / numSides) * 2 * Math.PI;
      graph.addVertex(r * Math.cos(theta), r * Math.sin(theta));
    }

    for (let n = 0; n < numSides; n += 1)
      graph.addEdge(n, (n + 1) % numSides);

    graph.reorder();
  }
}
