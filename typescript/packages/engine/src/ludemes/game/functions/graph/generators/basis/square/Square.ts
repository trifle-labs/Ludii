/**
 * Square — factory / dispatch class for square-tiling boards.
 * @java game/functions/graph/generators/basis/square/Square.java
 *
 * Square.construct dispatches to RectangleOnSquare or DiamondOnSquare
 * depending on the SquareShapeType.
 */

import type { GraphFunction } from "../../../GraphFunction.js";
import { RectangleOnSquare } from "./RectangleOnSquare.js";
import { DiamondOnSquare } from "./DiamondOnSquare.js";
import type { SquareShapeType } from "./SquareShapeType.js";
import type { DiagonalsType } from "./DiagonalsType.js";
import { Graph } from "../../../../../../../eval/graph/graph.js";
import { Basis } from "../Basis.js";

/** @java game/functions/graph/generators/basis/square/Square.java */
export class Square extends Basis {
  /** @java Square.eval(Context, SiteType) — null placeholder; use construct. */
  public override eval(_siteType: string): Graph {
    return new Graph(); // null placeholder
  }
}

/**
 * @java Square.construct(SquareShapeType, DimFunction, DiagonalsType, Boolean)
 * Dispatches to the appropriate helper class.
 */
export function constructSquare(
  shape: SquareShapeType | null,
  dim: number,
  diagonals: DiagonalsType | null = null,
  pyramidal = false,
): GraphFunction {
  const st = shape ?? "Square";
  switch (st) {
    case "Square":
      return new RectangleOnSquare(dim, dim, diagonals, pyramidal);
    case "Limping":
      return new RectangleOnSquare(dim, dim + 1, diagonals, pyramidal);
    case "Diamond":
      return new DiamondOnSquare(dim, diagonals);
    default:
      throw new Error(`Shape ${st} not supported for square tiling.`);
  }
}
