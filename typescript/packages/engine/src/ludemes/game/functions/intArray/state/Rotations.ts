// @java Core/src/game/functions/intArray/state/Rotations.java

/**
 * Returns the list of rotation indices according to a tiling type.
 *
 * @java game/functions/intArray/state/Rotations.java
 *
 * Java parity: Rotations holds one-or-more AbsoluteDirection values and
 * eval() converts each to a rotation index using:
 *   rotation = DirectionFacing.index() / (numSupportedDirections / numEdges)
 * then deduplicates and returns them as an int[].
 *
 * TS parity: The TS engine's Context does not expose a topology() / numEdges()
 * surface on the lightweight context.ts Context. The full topology is available
 * via the other/context/Context.ts path, but that type is not used by these
 * ludeme classes. This port stores the direction names faithfully and resolves
 * rotation indices on a best-effort basis: for standard orthogonal boards
 * (4 edges / 4 orthogonal directions) each AbsoluteDirection maps to index 0–3
 * using the compass order N=0, E=1, S=2, W=3, NE=0, SE=1, SW=2, NW=3.
 * When the topology is available as an any-typed object, the Java path is taken
 * exactly.
 */

import type { Context } from "../../../../../context.js";
import type { EvalScratch } from "../../../../base.js";
import { BaseIntArrayFunction } from "../BaseIntArrayFunction.js";

/**
 * Standard compass-direction index table for 4-edge tilings.
 * Java: AbsoluteDirection.convert(dir).index() / ratio
 * where ratio = supportedDirections.size() / numEdges.
 *
 * For square boards (4 edges, 4 orthogonal = ratio 1):
 *   N→0, E→1, S→2, W→3
 * For hex boards (6 edges, 6 directions = ratio 1):
 *   E→0, NE→1, NW→2, W→3, SW→4, SE→5  (Java hex order)
 *
 * When the full topology is not available we fall back to the square-board
 * indices; this is correct for the vast majority of games that use
 * (rotations Orthogonal) on a square board.
 */
const SQUARE_INDEX: Readonly<Record<string, number>> = {
  N:          0,
  E:          1,
  S:          2,
  W:          3,
  NE:         0,
  SE:         1,
  SW:         2,
  NW:         3,
  Orthogonal: -1, // multi-direction — expanded below
  Diagonal:   -1,
  Adjacent:   -1,
};

/** Orthogonal expansion for square board: N, E, S, W → indices 0,1,2,3 */
const ORTHOGONAL_SQUARE = [0, 1, 2, 3] as const;
/** Diagonal expansion for square board: NE, SE, SW, NW → indices 0,1,2,3 */
const DIAGONAL_SQUARE   = [0, 1, 2, 3] as const;
/** Adjacent expansion for square board: all 4 orthogonal + 4 diagonal */
const ADJACENT_SQUARE   = [0, 1, 2, 3] as const;

/**
 * @java game.functions.intArray.state.Rotations
 */
export class Rotations extends BaseIntArrayFunction {
  /** @java Rotations — final AbsoluteDirection[] directionsOfRotation */
  private readonly directionsOfRotation: string[];

  /** @java Rotations — private int[] precomputedDirection */
  private precomputedDirection: number[] | null = null;

  /**
   * @java Rotations(AbsoluteDirection|AbsoluteDirection[])
   * @param directionsOfRotation One or more AbsoluteDirection names.
   */
  public constructor(directionsOfRotation: string | string[]) {
    super();
    this.directionsOfRotation = Array.isArray(directionsOfRotation)
      ? directionsOfRotation
      : [directionsOfRotation];
  }

  /**
   * @java Rotations.eval(Context)
   *
   * Returns the unique rotation indices for the specified directions.
   * When a precomputed result is available it is returned directly (isStatic).
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    if (this.precomputedDirection !== null) return this.precomputedDirection;

    // Attempt to use the full topology if available (other/context/Context path).
    const ctxAny = ctx as unknown as Record<string, unknown>;
    const topology = typeof ctxAny["topology"] === "function"
      ? (ctxAny["topology"] as () => unknown)()
      : null;

    const result: number[] = [];

    if (topology !== null) {
      // Full topology path — mirrors Java exactly.
      const topo = topology as {
        numEdges(): number;
        supportedDirections(type: string): Array<{ index(): number; toAbsolute(): string }>;
      };
      const board = typeof ctxAny["board"] === "function"
        ? (ctxAny["board"] as () => unknown)()
        : null;
      const defaultSite = board !== null
        ? (board as { defaultSite(): string }).defaultSite()
        : "Cell";

      const numEdges = topo.numEdges();
      const supportedSize = topo.supportedDirections(defaultSite).length;
      const ratio = numEdges > 0 ? supportedSize / numEdges : 1;

      for (const absDir of this.directionsOfRotation) {
        // Try direct AbsoluteDirection → DirectionFacing conversion.
        const directFacing = this._convertToFacing(absDir);
        if (directFacing !== null) {
          const rotation = Math.floor(directFacing / ratio);
          if (!result.includes(rotation)) result.push(rotation);
        } else {
          // Multi-direction: expand to set of facing directions.
          const relation = this._toRelation(absDir);
          if (relation === null) continue;
          const facings = topo.supportedDirections(relation);
          for (const facing of facings) {
            const rotation = Math.floor(facing.index() / ratio);
            if (!result.includes(rotation)) result.push(rotation);
          }
        }
      }
    } else {
      // Fallback: square-board heuristic.
      for (const absDir of this.directionsOfRotation) {
        const upper = absDir.toUpperCase();
        if (upper === "ORTHOGONAL") {
          for (const r of ORTHOGONAL_SQUARE) {
            if (!result.includes(r)) result.push(r);
          }
        } else if (upper === "DIAGONAL") {
          for (const r of DIAGONAL_SQUARE) {
            if (!result.includes(r)) result.push(r);
          }
        } else if (upper === "ADJACENT" || upper === "ALL") {
          for (const r of ADJACENT_SQUARE) {
            if (!result.includes(r)) result.push(r);
          }
        } else {
          const idx = SQUARE_INDEX[upper] ?? SQUARE_INDEX[absDir];
          if (idx !== undefined && idx >= 0 && !result.includes(idx)) {
            result.push(idx);
          }
        }
      }
    }

    return result;
  }

  /**
   * Precompute when static.
   * @java Rotations.preprocess(Game)
   */
  public preprocess(ctx: Context & EvalScratch): void {
    this.precomputedDirection = this.eval(ctx);
  }

  /**
   * @java AbsoluteDirection.convert(AbsoluteDirection) — returns numeric index
   * when the direction has a single DirectionFacing equivalent, else null.
   */
  private _convertToFacing(dir: string): number | null {
    const map: Readonly<Record<string, number>> = {
      N: 0, NE: 1, E: 2, SE: 3, S: 4, SW: 5, W: 6, NW: 7,
    };
    return map[dir] ?? null;
  }

  /** @java AbsoluteDirection.converToRelationType — maps to a RelationType name. */
  private _toRelation(dir: string): string | null {
    const map: Readonly<Record<string, string>> = {
      Orthogonal: "Orthogonal",
      Diagonal:   "Diagonal",
      Adjacent:   "Adjacent",
      All:        "All",
    };
    return map[dir] ?? null;
  }

  public override toString(): string {
    return "Rotations";
  }
}
