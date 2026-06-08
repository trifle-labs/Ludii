/**
 * Hex — dispatch class for hexagonal-tiling boards.
 * @java game/functions/graph/generators/basis/hex/Hex.java
 */

import type { GraphFunction } from "../../../GraphFunction.js";
import { Graph } from "../../../../../../../eval/graph/graph.js";
import { DimConstant } from "../../../../dim/DimConstant.js";
import type { DimFunction } from "../../../../dim/DimFunction.js";
import type { Poly } from "../../../../../util/graph/Poly.js";
import { Basis } from "../Basis.js";
import { HexagonOnHex } from "./HexagonOnHex.js";
import { RectangleOnHex } from "./RectangleOnHex.js";
import { DiamondOnHex } from "./DiamondOnHex.js";
import { TriangleOnHex } from "./TriangleOnHex.js";
import { StarOnHex } from "./StarOnHex.js";
import { CustomOnHex } from "./CustomOnHex.js";
import type { HexShapeType } from "./HexShapeType.js";

/** @java Hex — null placeholder (use construct instead). */
export class Hex extends Basis {
  public override eval(_siteType: string): Graph {
    return new Graph(); // null placeholder @java Hex.eval
  }

  /**
   * @java Hex.construct(HexShapeType, DimFunction, DimFunction)
   */
  public static constructShape(
    shape: HexShapeType | null,
    dimA: DimFunction | number,
    dimB: DimFunction | number | null,
  ): GraphFunction {
    return constructHex(shape, dimA, dimB);
  }

  /**
   * @java Hex.construct(Poly, DimFunction[])
   */
  public static constructCustom(
    poly: Poly | null,
    sides: ReadonlyArray<DimFunction | number> | null,
  ): GraphFunction {
    let numNonNull = 0;
    if (poly !== null) numNonNull += 1;
    if (sides !== null) numNonNull += 1;

    if (numNonNull > 1)
      throw new Error("Exactly one array parameter must be non-null.");

    if (poly !== null) return new CustomOnHex(poly.polygon());
    if (sides !== null) return new CustomOnHex(sides.map(dimFunction));

    throw new Error("Exactly one array parameter must be non-null.");
  }
}

/**
 * @java Hex.construct(HexShapeType, DimFunction, DimFunction)
 * Dispatches to the appropriate hex generator.
 */
export function constructHex(
  shape: HexShapeType | null,
  dimA: DimFunction | number,
  dimB?: DimFunction | number | null,
): GraphFunction {
  const dimAValue = dimNumber(dimA);
  const dimBValue = dimB == null ? null : dimNumber(dimB);
  const st = shape ?? "Hexagon";
  switch (st) {
    case "Hexagon":
      if (dimB != null) return new CustomOnHex([dimFunction(dimA), dimFunction(dimB)]);
      return new HexagonOnHex(dimAValue);
    case "Triangle":
      return new TriangleOnHex(dimAValue);
    case "Diamond":
      return new DiamondOnHex(dimAValue, null);
    case "Prism":
      return new DiamondOnHex(dimAValue, dimBValue ?? dimAValue);
    case "Star":
      return new StarOnHex(dimAValue);
    case "Limping":
      return new CustomOnHex([dimFunction(dimA), new DimConstant(dimAValue + 1)]);
    case "Square":
      return new RectangleOnHex(dimAValue, dimAValue);
    case "Rectangle":
      return new RectangleOnHex(dimAValue, dimBValue ?? dimAValue);
    default:
      throw new Error(`Shape ${st} not supported for hex tiling.`);
  }
}

function dimNumber(dim: DimFunction | number): number {
  return typeof dim === "number" ? dim : dim.eval();
}

function dimFunction(dim: DimFunction | number): DimFunction {
  return typeof dim === "number" ? new DimConstant(dim) : dim;
}
