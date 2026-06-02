/**
 * Tri — dispatch class for triangular-tiling boards.
 * @java game/functions/graph/generators/basis/tri/Tri.java
 */

import type { GraphFunction } from "../../../GraphFunction.js";
import { Graph } from "../../../../../../../eval/graph/graph.js";
import { Basis } from "../Basis.js";
import { TriangleOnTri } from "./TriangleOnTri.js";
import { HexagonOnTri } from "./HexagonOnTri.js";
import { RectangleOnTri } from "./RectangleOnTri.js";
import { DiamondOnTri } from "./DiamondOnTri.js";
import { StarOnTri } from "./StarOnTri.js";
import { CustomOnTri } from "./CustomOnTri.js";
import type { TriShapeType } from "./TriShapeType.js";

/** @java Tri — null placeholder (use constructTri instead). */
export class Tri extends Basis {
  public override eval(_siteType: string): Graph {
    return new Graph(); // null placeholder @java Tri.eval
  }
}

/**
 * @java Tri.construct(TriShapeType, DimFunction, DimFunction)
 */
export function constructTri(
  shape: TriShapeType | null,
  dimA: number,
  dimB?: number,
): GraphFunction {
  const st = shape ?? "Triangle";
  switch (st) {
    case "Hexagon":
      return new HexagonOnTri(dimA);
    case "Triangle":
      return new TriangleOnTri(dimA);
    case "Diamond":
      return new DiamondOnTri(dimA, null);
    case "Prism":
      return new DiamondOnTri(dimA, dimB ?? dimA);
    case "Square":
      return new RectangleOnTri(dimA, dimA);
    case "Rectangle":
      return new RectangleOnTri(dimA, dimB ?? dimA);
    case "Star":
      return new StarOnTri(dimA);
    case "Limping":
      return new CustomOnTri([dimA, dimA + 1]);
    default:
      throw new Error(`Shape ${st} not supported for tri tiling.`);
  }
}
