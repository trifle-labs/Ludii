/**
 * Basis — abstract base for all tiling-basis GraphFunction generators.
 * @java game/functions/graph/generators/basis/Basis.java
 */

import { BaseGraphFunction } from "../../BaseGraphFunction.js";
import type { Graph } from "../../../../../../eval/graph/graph.js";

/** @java game/functions/graph/generators/basis/Basis.java */
export abstract class Basis extends BaseGraphFunction {
  /** @java Basis.eval(Context, SiteType) — implemented by concrete subclasses */
  public abstract override eval(siteType: string): Graph;
}
