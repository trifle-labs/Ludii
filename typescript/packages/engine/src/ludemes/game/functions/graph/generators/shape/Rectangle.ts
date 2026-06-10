/**
 * @java Core/src/game/functions/graph/generators/shape/Rectangle.java
 * Factory for rectangular boards — delegates to RectangleOnSquare.
 *
 * The Java Rectangle.construct() just calls new RectangleOnSquare(...). In the
 * 1:1 TS port we expose the same factory as a static helper. The class itself is
 * never instantiated (eval throws) — callers should use Rectangle.construct().
 */

import type { Graph } from "../../../../../../eval/graph/graph.js";
import { BaseGraphFunction } from "../../BaseGraphFunction.js";
import { RectangleOnSquare } from "../basis/square/RectangleOnSquare.js";
import type { GraphFunction } from "../../GraphFunction.js";
import type { DiagonalsType } from "../basis/square/DiagonalsType.js";

/**
 * Rectangle factory — mirrors Java `Rectangle.construct(dimA, dimB, diagonals)`.
 * @java game/functions/graph/generators/shape/Rectangle.java
 */
export class Rectangle extends BaseGraphFunction {
  /** Should not be instantiated; use `Rectangle.construct()`. */
  constructor() {
    super();
    this._dim = [];
  }

  /** @java Rectangle.eval — never called; construct() delegates to RectangleOnSquare */
  public override eval(_siteType: string): Graph {
    throw new Error("Rectangle.eval(): use Rectangle.construct() instead.");
  }

  /**
   * @java Rectangle.construct(DimFunction dimA, DimFunction dimB, DiagonalsType)
   */
  public static construct(
    rows: number | { eval(): number },
    columns?: number | { eval(): number } | null,
    diagonals?: DiagonalsType,
  ): GraphFunction {
    // @java Rectangle.construct(DimFunction dimA, @Opt DimFunction dimB, @Opt DiagonalsType)
    // Dims arrive as DimFunction/IntConstant objects from the compiler (Java reflection
    // passes DimFunctions); resolve to numbers like Square's dimNumber helper does.
    const dimNumber = (d: number | { eval(): number } | null | undefined): number | null =>
      d == null ? null : (typeof d === "number" ? d : d.eval());
    const r = dimNumber(rows)!;
    const c = dimNumber(columns) ?? r;
    return new RectangleOnSquare(r, c, diagonals ?? null);
  }
}
