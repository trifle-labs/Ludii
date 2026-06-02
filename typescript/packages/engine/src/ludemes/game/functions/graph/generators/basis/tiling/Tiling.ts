/**
 * Tiling — dispatch class for named Archimedean tiling boards.
 * @java game/functions/graph/generators/basis/tiling/Tiling.java
 */

import type { GraphFunction } from "../../../GraphFunction.js";
import { Graph } from "../../../../../../../eval/graph/graph.js";
import { Basis } from "../Basis.js";
import { buildNamedTiling } from "../../../../../../../eval/graph/named-tilings.js";
import type { TilingType } from "./TilingType.js";

/** @java Tiling — null placeholder (use constructTiling instead). */
export class Tiling extends Basis {
  public override eval(_siteType: string): Graph {
    return new Graph(); // null placeholder @java Tiling.eval
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
