/**
 * Hex — dispatch class for hexagonal-tiling boards.
 * @java game/functions/graph/generators/basis/hex/Hex.java
 */

import type { GraphFunction } from "../../../GraphFunction.js";
import { Graph } from "../../../../../../../eval/graph/graph.js";
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
}

/**
 * @java Hex.construct(HexShapeType, DimFunction, DimFunction)
 * Dispatches to the appropriate hex generator.
 */
export function constructHex(
  shape: HexShapeType | null,
  dimA: number,
  dimB?: number,
): GraphFunction {
  const st = shape ?? "Hexagon";
  switch (st) {
    case "Hexagon":
      if (dimB !== undefined) return new CustomOnHex([dimA, dimB]);
      return new HexagonOnHex(dimA);
    case "Triangle":
      return new TriangleOnHex(dimA);
    case "Diamond":
      return new DiamondOnHex(dimA, null);
    case "Prism":
      return new DiamondOnHex(dimA, dimB ?? dimA);
    case "Star":
      return new StarOnHex(dimA);
    case "Limping":
      return new CustomOnHex([dimA, dimA + 1]);
    case "Square":
      return new RectangleOnHex(dimA, dimA);
    case "Rectangle":
      return new RectangleOnHex(dimA, dimB ?? dimA);
    default:
      throw new Error(`Shape ${st} not supported for hex tiling.`);
  }
}
