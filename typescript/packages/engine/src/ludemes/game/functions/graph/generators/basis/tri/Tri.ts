/**
 * Tri — dispatch class for triangular-tiling boards.
 * @java game/functions/graph/generators/basis/tri/Tri.java
 */

import type { GraphFunction } from "../../../GraphFunction.js";
import { Graph } from "../../../../../../../eval/graph/graph.js";
import type { DimFunction } from "../../../../dim/DimFunction.js";
import { DimConstant } from "../../../../dim/DimConstant.js";
import type { Poly } from "../../../../../util/graph/Poly.js";
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

  /**
   * @java Tri.construct(TriShapeType, DimFunction, DimFunction)
   */
  public static constructShape(
    shape: TriShapeType | null,
    dimA: DimFunction | number,
    dimB: DimFunction | number | null,
  ): GraphFunction {
    return constructTri(shape, dimNumber(dimA), dimNumberOrUndefined(dimB));
  }

  /**
   * @java Tri.construct(TriShapeType, DimFunction, DimFunction)
   */
  public static constructShapeDimension(
    shape: TriShapeType | null,
    dimA: DimFunction | number,
  ): GraphFunction {
    return constructTri(shape, dimNumber(dimA));
  }

  /**
   * @java Tri.construct(TriShapeType, DimFunction, DimFunction)
   */
  public static constructDimensions(
    dimA: DimFunction | number,
    dimB: DimFunction | number | null,
  ): GraphFunction {
    return constructTri(null, dimNumber(dimA), dimNumberOrUndefined(dimB));
  }

  /**
   * @java Tri.construct(TriShapeType, DimFunction, DimFunction)
   */
  public static constructDimension(dimA: DimFunction | number): GraphFunction {
    return constructTri(null, dimNumber(dimA));
  }

  /**
   * @java Tri.construct(Poly, DimFunction[])
   */
  public static constructCustom(
    poly: Poly | null,
    sides: ReadonlyArray<DimFunction | number> | null,
  ): GraphFunction {
    let numNonNull = 0;
    if (poly !== null) numNonNull += 1;
    if (sides !== null) numNonNull += 1;
    if (numNonNull !== 1)
      throw new Error("Exactly one array parameter must be non-null.");

    if (poly !== null) return new CustomOnTri(poly.polygon());
    return new CustomOnTri(sides! as never);
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
      return new CustomOnTri([new DimConstant(dimA), new DimConstant(dimA + 1)]);
    default:
      throw new Error(`Shape ${st} not supported for tri tiling.`);
  }
}

function dimNumber(dim: DimFunction | number): number {
  return typeof dim === "number" ? dim : dim.eval();
}

function dimNumberOrUndefined(dim: DimFunction | number | null): number | undefined {
  return dim === null ? undefined : dimNumber(dim);
}
