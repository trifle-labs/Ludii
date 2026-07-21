/**
 * @java Core/src/game/functions/graph/generators/shape/concentric/Concentric.java
 * Factory for concentric board generators. Dispatches to ConcentricRegular,
 * ConcentricCircle or ConcentricTarget based on arguments.
 */

import type { Graph } from "../../../../../../../eval/graph/graph.js";
import { Basis } from "../../basis/Basis.js";
import type { ConcentricShapeType } from "./ConcentricShapeType.js";
import { ConcentricCircle } from "./ConcentricCircle.js";
import { ConcentricRegular } from "./ConcentricRegular.js";
import { ConcentricTarget } from "./ConcentricTarget.js";
import type { GraphFunction } from "../../../GraphFunction.js";

type DimArg = number | { eval(): number };
type BooleanArg = boolean | { eval(context?: unknown): boolean };

/**
 * Concentric board factory — mirrors Java `Concentric.construct(...)`.
 * @java game/functions/graph/generators/shape/concentric/Concentric.java
 */
export class Concentric extends Basis {
  /** @java Concentric.eval — placeholder; real construction via construct() */
  public override eval(_siteType: string): Graph {
    // Should never be called directly; use construct() factory.
    throw new Error("Concentric.eval(): use Concentric.construct() instead.");
  }

  /**
   * Factory method mirroring Java's `Concentric.construct(...)`.
   * @java Concentric.construct(ConcentricShapeType, DimFunction sides, DimFunction[] cells, ...)
   */
  public static construct(args: {
    shape?: ConcentricShapeType;
    sides?: DimArg;
    cells?: DimArg[];
    rings?: DimArg;
    steps?: DimArg;
    midpoints?: BooleanArg;
    joinMidpoints?: BooleanArg;
    joinCorners?: BooleanArg;
    stagger?: BooleanArg;
  }): GraphFunction {
    const {
      shape,
      sides,
      cells,
      rings = 3,
      steps,
      midpoints = true,
      joinMidpoints = true,
      joinCorners = false,
      stagger = false,
    } = args;

    return constructConcentric(
      shape ?? null,
      sides ?? null,
      cells ?? null,
      rings,
      steps ?? null,
      midpoints,
      joinMidpoints,
      joinCorners,
      stagger,
    );
  }

  /**
   * @java Concentric.construct(ConcentricShapeType shape, @Name DimFunction sides,
   *   DimFunction[] cells, @Name DimFunction rings, @Name DimFunction steps,
   *   @Name BooleanFunction midpoints, @Name BooleanFunction joinMidpoints,
   *   @Name BooleanFunction joinCorners, @Name BooleanFunction stagger)
   *
   * ArgCompiler dispatches Java static construct() overloads to TS static
   * construct* methods by JS arity; this method deliberately has length 9.
   */
  public static constructConcentric(
    shape: ConcentricShapeType | null,
    sides: DimArg | null,
    cells: readonly DimArg[] | null,
    rings: DimArg | null,
    steps: DimArg | null,
    midpoints: BooleanArg | null,
    joinMidpoints: BooleanArg | null,
    joinCorners: BooleanArg | null,
    stagger: BooleanArg | null,
  ): GraphFunction {
    return constructConcentric(
      shape,
      sides,
      cells,
      rings,
      steps,
      midpoints,
      joinMidpoints,
      joinCorners,
      stagger,
    );
  }
}

function constructConcentric(
  shape: ConcentricShapeType | null,
  sides: DimArg | null,
  cells: readonly DimArg[] | null,
  rings: DimArg | null,
  steps: DimArg | null,
  midpoints: BooleanArg | null,
  joinMidpoints: BooleanArg | null,
  joinCorners: BooleanArg | null,
  stagger: BooleanArg | null,
): GraphFunction {
  let numNonNull = 0;
  if (sides != null) numNonNull += 1;
  if (cells != null) numNonNull += 1;

  if (numNonNull > 1)
    throw new Error("Only one of 'shape', 'sides' or 'cells' can be non-null.");

  const ringCount = rings == null ? null : dimValue(rings);
  const midpointValue = booleanValue(midpoints, true);
  const joinMidpointValue = booleanValue(joinMidpoints, true);
  const joinCornerValue = booleanValue(joinCorners, false);

  if (shape != null && ringCount != null) {
    if (shape === "Triangle") {
      return new ConcentricRegular(3, ringCount, midpointValue, joinMidpointValue, joinCornerValue);
    } else if (shape === "Square") {
      return new ConcentricRegular(4, ringCount, midpointValue, joinMidpointValue, joinCornerValue);
    } else if (shape === "Hexagon") {
      return new ConcentricRegular(6, ringCount, midpointValue, joinMidpointValue, joinCornerValue);
    } else if (shape === "Target") {
      if (steps != null) {
        const stepCount = dimValue(steps);
        const cellsPerRing = Array.from({ length: ringCount }, () => stepCount);
        return new ConcentricCircle(cellsPerRing, false);
      } else {
        return new ConcentricTarget(ringCount);
      }
    }
  }

  if (sides != null && ringCount != null) {
    return new ConcentricRegular(dimValue(sides), ringCount, midpointValue, joinMidpointValue, joinCornerValue);
  }

  if (cells != null) {
    return new ConcentricCircle(cells.map(dimValue), booleanValue(stagger, false));
  }

  throw new Error("Concentric board must specify sides, cells or rings.");
}

function dimValue(dim: DimArg): number {
  return typeof dim === "number" ? dim : dim.eval();
}

function booleanValue(value: BooleanArg | null, defaultValue: boolean): boolean {
  if (value == null) return defaultValue;
  return typeof value === "boolean" ? value : value.eval(undefined);
}
