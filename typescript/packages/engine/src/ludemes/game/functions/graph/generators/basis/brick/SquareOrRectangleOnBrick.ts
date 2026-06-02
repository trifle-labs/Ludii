/**
 * SquareOrRectangleOnBrick — faithful 1:1 port.
 * @java game/functions/graph/generators/basis/brick/SquareOrRectangleOnBrick.java
 *
 * Square or rectangular board on a running-bond brick tiling.
 * Delegates to genBrick from named-tilings.ts.
 */

import { Graph } from "../../../../../../../eval/graph/graph.js";
import { genBrick } from "../../../../../../../eval/graph/named-tilings.js";
import { Basis } from "../Basis.js";

/** @java game/functions/graph/generators/basis/brick/SquareOrRectangleOnBrick.java */
export class SquareOrRectangleOnBrick extends Basis {
  private readonly trim: boolean;

  public constructor(dimA: number, dimB?: number, trim = false) {
    super();
    this._dim = dimB !== undefined ? [dimA, dimB] : [dimA];
    this.trim = trim;
  }

  /** @java SquareOrRectangleOnBrick.eval(Context, SiteType) */
  public override eval(_siteType: string): Graph {
    const a = this._dim[0] ?? 3;
    const b = this._dim[1];
    const shape = b !== undefined ? "Rectangle" : undefined;
    return genBrick(shape, a, b, this.trim);
  }
}
