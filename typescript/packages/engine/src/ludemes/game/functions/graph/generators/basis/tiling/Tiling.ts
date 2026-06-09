/**
 * Tiling — dispatch class for named Archimedean tiling boards.
 * @java game/functions/graph/generators/basis/tiling/Tiling.java
 */

import type { GraphFunction } from "../../../GraphFunction.js";
import type { DimFunction } from "../../../../dim/DimFunction.js";
import type { Poly } from "../../../../../util/graph/Poly.js";
import { Graph } from "../../../../../../../eval/graph/graph.js";
import { Basis } from "../Basis.js";
import { buildNamedTiling } from "../../../../../../../eval/graph/named-tilings.js";
import type { TilingType } from "./TilingType.js";
import { CustomOn33344 } from "./tiling33344/CustomOn33344.js";
import { CustomOn3464 } from "./tiling3464/CustomOn3464.js";
import { CustomOn3636 } from "./tiling3636/CustomOn3636.js";
import { CustomOn488 } from "./tiling488/CustomOn488.js";

/** @java Tiling — null placeholder (use constructTiling instead). */
export class Tiling extends Basis {
  public override eval(_siteType: string): Graph {
    return new Graph(); // null placeholder @java Tiling.eval
  }

  /**
   * @java Tiling.construct(TilingType, Poly, DimFunction[])
   */
  public static constructCustom(
    tiling: TilingType,
    poly: Poly | null,
    sides: ReadonlyArray<DimFunction | number> | null,
  ): GraphFunction {
    let numNonNull = 0;
    if (poly !== null) numNonNull += 1;
    if (sides !== null) numNonNull += 1;
    if (numNonNull !== 1)
      throw new Error("Exactly one array parameter must be non-null.");

    switch (tiling) {
      case "T33344": return poly !== null ? new CustomOn33344(poly.polygon()) : new CustomOn33344(sides! as never);
      case "T3464": return poly !== null ? new CustomOn3464(poly.polygon()) : new CustomOn3464(sides! as never);
      case "T3636": return poly !== null ? new CustomOn3636(poly.polygon()) : new CustomOn3636(sides! as never);
      case "T488": return poly !== null ? new CustomOn488(poly.polygon()) : new CustomOn488(sides! as never);
      default:
        throw new Error(`Custom tiling ${tiling} not supported.`);
    }
  }

  /**
   * @java Tiling.construct(TilingType, Poly, DimFunction[])
   */
  public static constructCustomSingle(
    tiling: TilingType,
    polyOrSides: Poly | ReadonlyArray<DimFunction | number>,
  ): GraphFunction {
    if (isPoly(polyOrSides)) return this.constructCustom(tiling, polyOrSides, null);
    if (!Array.isArray(polyOrSides)) throw new Error("Expected Poly or DimFunction[].");
    return this.constructCustom(tiling, null, polyOrSides);
  }

  /**
   * @java Tiling.construct(TilingType, DimFunction, DimFunction)
   */
  public static constructDimensions(
    tiling: TilingType,
    dimA: DimFunction | number,
    dimB: DimFunction | number | null,
  ): GraphFunction {
    return constructTiling(tiling, dimNumber(dimA), dimNumberOrUndefined(dimB));
  }

  /**
   * @java Tiling.construct(TilingType, DimFunction, DimFunction)
   */
  public static constructDimension(
    tiling: TilingType,
    dimA: DimFunction | number,
  ): GraphFunction {
    return constructTiling(tiling, dimNumber(dimA));
  }
}

/**
 * @java Tiling.construct(TilingType, DimFunction, DimFunction)
 * Delegates to buildNamedTiling from named-tilings.ts.
 */
export function constructTiling(
  tiling: TilingType,
  dimA: number,
  dimB?: number,
): GraphFunction {
  // Delegate to the existing named-tilings implementation
  const g = buildNamedTiling(tiling, dimA, dimB);
  if (!g) throw new Error(`Tiling ${tiling} not supported.`);
  // Wrap in a simple GraphFunction
  return {
    eval: (_siteType: string) => g,
    dim: () => dimB !== undefined ? [dimA, dimB] : [dimA],
  };
}

function dimNumber(dim: DimFunction | number): number {
  return typeof dim === "number" ? dim : dim.eval();
}

function dimNumberOrUndefined(dim: DimFunction | number | null): number | undefined {
  return dim === null ? undefined : dimNumber(dim);
}

function isPoly(value: unknown): value is Poly {
  return typeof value === "object" && value !== null && typeof (value as { polygon?: unknown }).polygon === "function";
}
