/**
 * Square — factory / dispatch class for square-tiling boards.
 * @java game/functions/graph/generators/basis/square/Square.java
 *
 * Square.construct dispatches to RectangleOnSquare or DiamondOnSquare
 * depending on the SquareShapeType.
 */

import type { GraphFunction } from "../../../GraphFunction.js";
import type { DimFunction } from "../../../../dim/DimFunction.js";
import type { Poly } from "../../../../../util/graph/Poly.js";
import { RectangleOnSquare } from "./RectangleOnSquare.js";
import { DiamondOnSquare } from "./DiamondOnSquare.js";
import { CustomOnSquare } from "./CustomOnSquare.js";
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

  /**
   * @java Square.construct(SquareShapeType, DimFunction, DiagonalsType, Boolean)
   */
  public static constructShape(
    shape: SquareShapeType | null,
    dim: DimFunction | number,
    diagonals: DiagonalsType | null,
    pyramidal: boolean | null,
  ): GraphFunction {
    return constructSquareShape(shape, dim, diagonals, pyramidal, true);
  }

  /**
   * @java Square.construct(Poly, DimFunction[], DiagonalsType)
   */
  public static constructCustom(
    poly: Poly | null,
    sides: ReadonlyArray<DimFunction | number> | null,
    diagonals: DiagonalsType | null,
  ): GraphFunction {
    let numNonNull = 0;
    if (poly !== null) numNonNull += 1;
    if (sides !== null) numNonNull += 1;

    if (numNonNull > 1)
      throw new Error("Exactly one array parameter must be non-null.");

    if (poly !== null) return new CustomOnSquare(poly.polygon(), diagonals);
    if (sides !== null) return new CustomOnSquare(sides, diagonals);

    throw new Error("Exactly one array parameter must be non-null.");
  }
}

/**
 * @java Square.construct(SquareShapeType, DimFunction, DiagonalsType, Boolean)
 * Dispatches to the appropriate helper class.
 */
export function constructSquare(
  shape: SquareShapeType | null,
  dim: DimFunction | number,
  diagonals: DiagonalsType | null = null,
  pyramidal = false,
): GraphFunction {
  return constructSquareShape(shape, dim, diagonals, pyramidal, false);
}

function constructSquareShape(
  shape: SquareShapeType | null,
  dim: DimFunction | number,
  diagonals: DiagonalsType | null,
  pyramidal: boolean | null,
  enforceOr: boolean,
): GraphFunction {
  if (enforceOr) {
    let numNonNull = 0;
    if (diagonals !== null) numNonNull += 1;
    if (pyramidal !== null) numNonNull += 1;

    if (numNonNull > 1)
      throw new Error("Only one of 'diagonals' and 'pyramidal' can be true.");
  }

  const dimValue = dimNumber(dim);
  const st = shape ?? "Square";
  switch (st) {
    case "Square":
      return new RectangleOnSquare(dimValue, dimValue, diagonals, pyramidal ?? false);
    case "Limping":
      return new RectangleOnSquare(dimValue, dimValue + 1, diagonals, pyramidal ?? false);
    case "Diamond":
      return new DiamondOnSquare(dimValue, diagonals);
    default:
      throw new Error(`Shape ${st} not supported for square tiling.`);
  }
}

function dimNumber(dim: DimFunction | number): number {
  return typeof dim === "number" ? dim : dim.eval();
}
