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
    sides?: number;
    cells?: number[];
    rings?: number;
    steps?: number;
    midpoints?: boolean;
    joinMidpoints?: boolean;
    joinCorners?: boolean;
    stagger?: boolean;
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

    if (shape != null && rings != null) {
      if (shape === "Triangle") {
        return new ConcentricRegular(3, rings, midpoints, joinMidpoints, joinCorners);
      } else if (shape === "Square") {
        return new ConcentricRegular(4, rings, midpoints, joinMidpoints, joinCorners);
      } else if (shape === "Hexagon") {
        return new ConcentricRegular(6, rings, midpoints, joinMidpoints, joinCorners);
      } else if (shape === "Target") {
        if (steps != null) {
          const cellsPerRing = Array.from({ length: rings }, () => steps);
          return new ConcentricCircle(cellsPerRing, false);
        } else {
          return new ConcentricTarget(rings);
        }
      }
    }

    if (sides != null && rings != null) {
      return new ConcentricRegular(sides, rings, midpoints, joinMidpoints, joinCorners);
    }

    if (cells != null) {
      return new ConcentricCircle(cells, stagger);
    }

    throw new Error("Concentric.construct(): must specify shape, sides or cells.");
  }
}
