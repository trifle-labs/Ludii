/**
 * GraphFunction interface — faithful 1:1 port.
 * @java game/functions/graph/GraphFunction.java
 *
 * A GraphFunction builds and returns a planar Graph given a play site type.
 * siteType: "Cell" | "Vertex" | "Edge"
 */

import type { Graph } from "../../../../eval/graph/graph.js";

/** @java game/functions/graph/GraphFunction.java */
export interface GraphFunction {
  /** @java GraphFunction.eval(Context, SiteType) */
  eval(siteType: string): Graph;
  /** @java GraphFunction.dim() */
  dim(): number[];
}
