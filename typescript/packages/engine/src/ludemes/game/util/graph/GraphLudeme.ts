// @java Core/src/game/util/graph/Graph.java (the ludeme-compilable ctor surface)

/**
 * `(graph vertices:{…} edges:{…})` — a literal graph as a GraphFunction.
 * Java's game.util.graph.Graph extends BaseGraphFunction; this is its
 * ludeme-construction surface (the full graph data structure lives in
 * eval/graph/graph.ts).
 *
 * @java game/util/graph/Graph.java — Graph(Float[][] vertices, Integer[][] edges)
 */

import { Graph } from "../../../../eval/graph/graph.js";

type Pair = readonly [number, number];

function pairs(value: unknown, what: string): Pair[] {
  if (!Array.isArray(value)) return [];
  return value.map((p) => {
    if (!Array.isArray(p) || p.length < 2) throw new Error(`(graph …): bad ${what}`);
    return [Number(p[0]), Number(p[1])] as const;
  });
}

export class GraphLudeme {
  /** @java Graph.vertices (construction input) */
  private readonly vertices: Pair[];
  /** @java Graph.edges (construction input) */
  private readonly edges: Pair[];

  /** @java Graph(Float[][] vertices, @Opt Integer[][] edges) */
  public constructor(vertices: unknown, edges: unknown = null) {
    this.vertices = pairs(vertices, "vertex");
    this.edges = pairs(edges, "edge");
  }

  /** @java BaseGraphFunction.eval — build the literal graph (vertices + edges + faces). */
  public eval(_siteType: string): Graph {
    const graph = new Graph();
    for (const [x, y] of this.vertices) graph.addVertex(x, y);
    for (const [a, b] of this.edges) graph.addEdge(a, b);
    graph.makeFaces();
    return graph;
  }

  public dim(): number[] { return []; }
}
