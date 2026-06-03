/**
 * Brick — dispatch class for brick-tiling boards.
 * @java game/functions/graph/generators/basis/brick/Brick.java
 *
 * Delegates to genBrick from named-tilings.ts.
 */

import type { GraphFunction } from "../../../GraphFunction.js";
import { Graph } from "../../../../../../../eval/graph/graph.js";
import { genBrick } from "../../../../../../../eval/graph/named-tilings.js";
import { Basis } from "../Basis.js";
import { SquareOrRectangleOnBrick } from "./SquareOrRectangleOnBrick.js";
import { DiamondOrPrismOnBrick } from "./DiamondOrPrismOnBrick.js";
import { SpiralOnBrick } from "./SpiralOnBrick.js";
import type { BrickShapeType } from "./BrickShapeType.js";

/** @java Brick — null placeholder (use constructBrick instead). */
export class Brick extends Basis {
  public override eval(_siteType: string): Graph {
    return new Graph(); // null placeholder @java Brick.eval
  }
}

/**
 * @java Brick.construct(BrickShapeType, DimFunction, DimFunction, Boolean)
 */
export function constructBrick(
  shape: BrickShapeType | null,
  dimA: number,
  dimB?: number,
  trim = false,
): GraphFunction {
  const st = shape ?? (dimB !== undefined && dimB !== dimA ? "Rectangle" : "Square");
  switch (st) {
    case "Square":
    case "Rectangle":
      return new SquareOrRectangleOnBrick(dimA, dimB, trim);
    case "Limping":
      return { eval: (_s: string) => genBrick("Limping", dimA, dimB, trim), dim: () => [dimA] };
    case "Diamond":
      return new DiamondOrPrismOnBrick(dimA, undefined, trim);
    case "Prism":
      return new DiamondOrPrismOnBrick(dimA, dimB ?? dimA, trim);
    case "Spiral":
      return new SpiralOnBrick(dimA);
    default:
      throw new Error(`Shape ${st} not supported for Brick tiling.`);
  }
}
