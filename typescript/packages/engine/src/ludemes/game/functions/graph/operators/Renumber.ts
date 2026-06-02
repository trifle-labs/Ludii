/**
 * @java Core/src/game/functions/graph/operators/Renumber.java
 * Renumbers (reorders) the vertices/edges/cells of a graph by position.
 */

import { Graph } from "../../../../../eval/graph/graph.js";
import { BaseGraphFunction } from "../BaseGraphFunction.js";
import type { GraphFunction } from "../GraphFunction.js";

/** Partial Java SiteType ordinals for the types flag: Vertex=0, Edge=1, Cell=2 */
type SiteTypeRenumber = "Vertex" | "Edge" | "Cell";

/**
 * Renumber operator: reorder graph elements bottom-to-top, left-to-right.
 * @java game/functions/graph/operators/Renumber.java
 */
export class Renumber extends BaseGraphFunction {
  private readonly siteTypes: SiteTypeRenumber[];
  private readonly graphFn: GraphFunction;

  /**
   * @java Renumber(SiteType siteTypeA, SiteType siteTypeB, SiteType siteTypeC, GraphFunction graph)
   * If no site types are given, renumber all (Vertex+Edge+Cell).
   */
  constructor(graphFn: GraphFunction, siteTypes?: SiteTypeRenumber[]) {
    super();
    this._dim = [];
    this.graphFn = graphFn;
    this.siteTypes = siteTypes ?? [];
  }

  /** @java Renumber.eval(Context, SiteType) */
  public override eval(siteType: string): Graph {
    const graph = this.graphFn.eval(siteType);
    if (graph.vertices.length === 0) return graph;

    // @java Renumber.eval — if no site types given, reorder everything
    if (this.siteTypes.length === 0) {
      graph.reorder();
      return graph;
    }

    // Otherwise reorder only the specified element types
    // Java SiteType ordinals: Vertex=0, Edge=1, Cell=2
    // graph.reorder() handles all; graph.reorderFaces() for Cell only
    const doVertex = this.siteTypes.includes("Vertex");
    const doCell = this.siteTypes.includes("Cell");

    if (doVertex) graph.reorder();      // reorder() reorders all incl edges
    else if (doCell) graph.reorderFaces(); // only face renumbering

    return graph;
  }
}
