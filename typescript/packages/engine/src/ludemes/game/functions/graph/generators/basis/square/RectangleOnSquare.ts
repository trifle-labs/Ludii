/**
 * RectangleOnSquare — faithful 1:1 port.
 * @java game/functions/graph/generators/basis/square/RectangleOnSquare.java
 *
 * Defines a rectangular board on a square grid.
 */

import { Graph } from "../../../../../../../eval/graph/graph.js";
import { Basis } from "../Basis.js";
import type { DiagonalsType } from "./DiagonalsType.js";

/** @java game/functions/graph/generators/basis/square/RectangleOnSquare.java */
export class RectangleOnSquare extends Basis {
  private readonly diagonals: DiagonalsType | null;
  private readonly pyramidal: boolean;

  /**
   * @java RectangleOnSquare(DimFunction rows, DimFunction columns, DiagonalsType, Boolean)
   * @param rows      Number of rows (dim[0]).
   * @param columns   Number of columns (dim[1]).
   * @param diagonals Diagonal edge style, or null.
   * @param pyramidal Whether to build a pyramidal stack.
   */
  public constructor(
    rows: number,
    columns: number,
    diagonals: DiagonalsType | null = null,
    pyramidal = false,
  ) {
    super();
    this._dim = [rows, columns];
    this.diagonals = diagonals;
    this.pyramidal = pyramidal;
  }

  /** @java RectangleOnSquare.eval(Context, SiteType) */
  public override eval(siteType: string): Graph {
    const graph = new Graph();

    // Add 1 if playing on the cells, as the number of cells in each
    // direction is 1 less than the number of vertices.
    // @java RectangleOnSquare.eval:71-72
    const rows = (this._dim[0] ?? 1) + (siteType === "Cell" ? 1 : 0);
    const cols = (this._dim[1] ?? 1) + (siteType === "Cell" ? 1 : 0);

    // Create vertices @java lines 75-80
    for (let row = 0; row < rows; row += 1)
      for (let col = 0; col < cols; col += 1)
        graph.addVertex(col, row);

    // Create edges: only half of Square.steps (2 of 4 dirs) to avoid duplicates
    // @java lines 82-100  Square.steps.length / 2 = 2, indices 0 and 1
    const STEPS = [[1, 0], [0, 1]] as const; // @java Square.steps[0..1]
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const vA = graph.findVertex(col, row);
        for (const [dr, dc] of STEPS) {
          const rr = row + dr;
          const cc = col + dc;
          if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) continue;
          const vB = graph.findVertex(cc, rr);
          if (vA >= 0 && vB >= 0) graph.addEdge(vA, vB);
        }
      }
    }

    // @java RectangleOnSquare.eval:105-133 — pyramidal stacking: layers
    // 1..rows-1 of shrinking (rows-layer x cols-layer) grids at
    // (layer*0.5 + col, layer*0.5 + row, layer/sqrt(2)); 3-D unit edges via
    // makeEdges() (each layer vertex touches its 4 base supports and its
    // in-layer neighbours). Span/Spire/Shibumi-family boards.
    if (this.pyramidal) {
      const dz = 1.0 / Math.sqrt(2);
      const layers = rows;
      for (let layer = 1; layer < layers; layer += 1) {
        const offX = layer * 0.5;
        const offY = layer * 0.5;
        const offZ = layer * dz;
        for (let row = 0; row < rows - layer; row += 1) {
          for (let col = 0; col < cols - layer; col += 1) {
            graph.findOrAddVertex3D(offX + col, offY + row, offZ);
          }
        }
      }
      graph.makeEdges();
    }

    // Handle diagonals @java line 134
    if (this.diagonals !== null) {
      handleDiagonals(graph, 0, rows, 0, cols, this.diagonals);
    }

    // makeFaces @java line 137
    graph.makeFaces();
    graph.reorder();

    return graph;
  }
}

/**
 * @java Square.handleDiagonals — add diagonal edges according to DiagonalsType.
 * fromRow/toRow/fromCol/toCol are exclusive upper bounds (Java-style loop).
 */
export function handleDiagonals(
  graph: Graph,
  fromRow: number,
  toRow: number,
  fromCol: number,
  toCol: number,
  diagonals: DiagonalsType,
): void {
  if (diagonals === "Implied" || diagonals === null) return;

  if (diagonals === "Alternating") {
    // @java DiagonalsType.Alternating
    for (let r = fromRow; r <= toRow; r += 1)
      for (let c = fromCol; c <= toCol; c += 1) {
        const vA = graph.findVertex(c, r);
        const vB = graph.findVertex(c, r + 1);
        const vC = graph.findVertex(c + 1, r + 1);
        const vD = graph.findVertex(c + 1, r);
        if (vA < 0 || vB < 0 || vC < 0 || vD < 0) continue;
        if ((r + c) % 2 === 0) graph.addEdge(vA, vC);
        else graph.addEdge(vB, vD);
      }
  } else if (diagonals === "Solid") {
    // @java DiagonalsType.Solid — central vertex + 4 spokes
    for (let r = fromRow; r <= toRow; r += 1)
      for (let c = fromCol; c <= toCol; c += 1) {
        const vA = graph.findVertex(c, r);
        const vB = graph.findVertex(c, r + 1);
        const vC = graph.findVertex(c + 1, r + 1);
        const vD = graph.findVertex(c + 1, r);
        if (vA < 0 || vB < 0 || vC < 0 || vD < 0) continue;
        const vX = graph.addVertex(c + 0.5, r + 0.5);
        graph.addEdge(vA, vX);
        graph.addEdge(vB, vX);
        graph.addEdge(vC, vX);
        graph.addEdge(vD, vX);
      }
  } else if (diagonals === "SolidNoSplit") {
    // @java DiagonalsType.SolidNoSplit — two crossing diagonals
    for (let r = fromRow; r <= toRow; r += 1)
      for (let c = fromCol; c <= toCol; c += 1) {
        const vA = graph.findVertex(c, r);
        const vB = graph.findVertex(c, r + 1);
        const vC = graph.findVertex(c + 1, r + 1);
        const vD = graph.findVertex(c + 1, r);
        if (vA < 0 || vB < 0 || vC < 0 || vD < 0) continue;
        graph.addEdge(vA, vC);
        graph.addEdge(vB, vD);
      }
  } else if (diagonals === "Concentric") {
    // @java DiagonalsType.Concentric
    const midRow = Math.floor((toRow + fromRow) / 2);
    const midCol = Math.floor((toCol + fromCol) / 2);
    for (let r = fromRow; r <= toRow; r += 1)
      for (let c = fromCol; c <= toCol; c += 1) {
        const vA = graph.findVertex(c, r);
        const vB = graph.findVertex(c, r + 1);
        const vC = graph.findVertex(c + 1, r + 1);
        const vD = graph.findVertex(c + 1, r);
        if (vA < 0 || vB < 0 || vC < 0 || vD < 0) continue;
        if ((r < midRow && c < midCol) || (r >= midRow && c >= midCol))
          graph.addEdge(vB, vD);
        else
          graph.addEdge(vA, vC);
      }
  } else if (diagonals === "Radiating") {
    // @java DiagonalsType.Radiating — diagonals from centre outward
    const dsteps: readonly (readonly [number, number])[] = [
      [1, 1], [1, -1], [-1, -1], [-1, 1],
    ];
    const midRow = Math.floor((toRow + fromRow) / 2);
    const midCol = Math.floor((toCol + fromCol) / 2);
    const numSteps = Math.max(Math.floor((toRow - fromRow) / 2), Math.floor((toCol - fromCol) / 2)) + 1;
    for (let n = 0; n < numSteps; n += 1)
      for (const [d0, d1] of dsteps) {
        const vA = graph.findVertex(midRow + n * d0, midCol + n * d1);
        const vB = graph.findVertex(midRow + (n + 1) * d0, midCol + (n + 1) * d1);
        if (vA >= 0 && vB >= 0) graph.addEdge(vA, vB);
      }
  }
}
