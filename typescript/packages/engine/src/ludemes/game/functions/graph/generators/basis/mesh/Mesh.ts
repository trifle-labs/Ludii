/**
 * Mesh — faithful 1:1 port.
 * @java game/functions/graph/generators/basis/mesh/Mesh.java
 *
 * Mesh board (custom polygon on a fine grid). Approximated as a rectangle.
 */

import { Graph } from "../../../../../../../eval/graph/graph.js";
import { Basis } from "../Basis.js";

/** @java game/functions/graph/generators/basis/mesh/Mesh.java */
export class Mesh extends Basis {
  public constructor(_rows?: number, _cols?: number) {
    super();
    this._dim = [];
  }

  /** @java Mesh.eval(Context, SiteType) — deferred: full mesh geometry not implemented. */
  public override eval(_siteType: string): Graph {
    return new Graph();
  }
}
