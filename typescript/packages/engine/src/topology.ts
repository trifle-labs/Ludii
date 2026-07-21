// @java Core/src/other/topology/Topology.java Topology
/**
 * Java parity:
 * - Core/src/game/util/graph/Topology.java — the graph layer that holds
 *   vertex / edge / cell collections and adjacency for a board.
 *
 * The TS port covers the flat rectangular case the engine actually
 * compiles to (FlatBoardGame). For Hex boards the existing HexGame
 * embeds its own adjacency; once those games converge on a shared
 * `Game` (task #85) we'll expand this module accordingly.
 */

import type { SiteType } from "./action/index.js";

export interface TopologyVertex {
  readonly index: number;
  readonly x: number;
  readonly y: number;
}

export interface TopologyEdge {
  readonly index: number;
  readonly a: number;
  readonly b: number;
}

export interface TopologyCell {
  readonly index: number;
  readonly x: number;
  readonly y: number;
}

/**
 * Flat rectangular board topology.
 *
 * Convention follows Java's `Topology`: vertex (0,0) is the bottom-left
 * corner. For a W×H board, vertex (x,y) has index `y * W + x`.
 *
 * Adjacency is 4-connected orthogonal by default; diagonal neighbours
 * are exposed via the explicit `diagonalNeighbours` accessor.
 */
export class FlatTopology {
  public readonly width: number;
  public readonly height: number;
  public readonly vertices: readonly TopologyVertex[];
  public readonly edges: readonly TopologyEdge[];
  public readonly cells: readonly TopologyCell[];

  public constructor(width: number, height: number) {
    if (!Number.isInteger(width) || width < 1) {
      throw new Error(`width must be a positive integer; got ${width}.`);
    }
    if (!Number.isInteger(height) || height < 1) {
      throw new Error(`height must be a positive integer; got ${height}.`);
    }
    this.width = width;
    this.height = height;

    const vertices: TopologyVertex[] = [];
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        vertices.push({ index: y * width + x, x, y });
      }
    }
    this.vertices = Object.freeze(vertices);

    const edges: TopologyEdge[] = [];
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const here = y * width + x;
        if (x + 1 < width) {
          edges.push({ index: edges.length, a: here, b: here + 1 });
        }
        if (y + 1 < height) {
          edges.push({ index: edges.length, a: here, b: here + width });
        }
      }
    }
    this.edges = Object.freeze(edges);

    // For a flat board cells coincide with vertices (one piece per
    // square). They are exposed separately to mirror the Java surface.
    this.cells = Object.freeze(
      vertices.map((v) => ({ index: v.index, x: v.x, y: v.y })),
    );
  }

  public size(type: SiteType): number {
    if (type === "Vertex") return this.vertices.length;
    if (type === "Edge") return this.edges.length;
    return this.cells.length;
  }

  public sites(type: SiteType): readonly number[] {
    const n = this.size(type);
    const out = new Array<number>(n);
    for (let i = 0; i < n; i += 1) out[i] = i;
    return out;
  }

  /** Orthogonal (4-connected) neighbours of a cell/vertex. */
  public orthogonalNeighbours(index: number): readonly number[] {
    const v = this.vertices[index];
    if (!v) return [];
    const { x, y } = v;
    const out: number[] = [];
    if (x > 0) out.push(index - 1);
    if (x + 1 < this.width) out.push(index + 1);
    if (y > 0) out.push(index - this.width);
    if (y + 1 < this.height) out.push(index + this.width);
    return out;
  }

  /** Diagonal (4 additional) neighbours of a cell/vertex. */
  public diagonalNeighbours(index: number): readonly number[] {
    const v = this.vertices[index];
    if (!v) return [];
    const { x, y } = v;
    const out: number[] = [];
    if (x > 0 && y > 0) out.push(index - this.width - 1);
    if (x + 1 < this.width && y > 0) out.push(index - this.width + 1);
    if (x > 0 && y + 1 < this.height) out.push(index + this.width - 1);
    if (x + 1 < this.width && y + 1 < this.height)
      out.push(index + this.width + 1);
    return out;
  }

  /** All 8-connected neighbours (orthogonal + diagonal). */
  public neighbours(index: number): readonly number[] {
    return [
      ...this.orthogonalNeighbours(index),
      ...this.diagonalNeighbours(index),
    ];
  }
}
