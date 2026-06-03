// @java Core/src/game/rules/play/moves/nonDecision/effect/take/Take.java

/**
 * Factory ludeme that dispatches to TakeDomino or TakeControl.
 *
 * @java game/rules/play/moves/nonDecision/effect/take/Take.java
 *
 * Java parity:
 *   Take is a pure factory — its two static `construct()` overloads
 *   return TakeDomino or TakeControl respectively.
 *   The private constructor and direct eval() throw UnsupportedOperationException.
 *
 * NOTE: coverage-only transliteration; not registered in the 1:1 moves registry.
 */

import type { Context } from "../../../../../../../../context.js";
import type { Move } from "../../../../../../../../move.js";
import type { MovesFunction } from "../../../../../../../base.js";
import type { IntFunction, RegionFunction } from "../../../../../../../base.js";
import { TakeDomino } from "./simple/TakeDomino.js";
import { TakeControl } from "./control/TakeControl.js";

/** @java game/types/play/RoleType.java — minimal subset */
export type RoleType = string;

/** @java game/types/board/SiteType.java — minimal subset */
export type SiteType = "Cell" | "Edge" | "Vertex";

/**
 * Enum for simple take types.
 * @java game/rules/play/moves/nonDecision/effect/take/TakeSimpleType.java
 */
export enum TakeSimpleType {
  Domino = "Domino",
}

/**
 * Enum for take-control types.
 * @java game/rules/play/moves/nonDecision/effect/take/TakeControlType.java
 */
export enum TakeControlType {
  Control = "Control",
}

/**
 * @java game/rules/play/moves/nonDecision/effect/take/Take.java
 *
 * Factory class — cannot be instantiated directly; use the static construct() methods.
 *
 * Java parity:
 *   public final class Take extends Effect
 *   private Take() { super(null); }
 *   eval(Context): throws UnsupportedOperationException
 */
export class Take implements MovesFunction {
  // Private constructor matches Java — use static factory methods.
  private constructor() {}

  /**
   * @java Take.construct(TakeSimpleType, Then)
   *
   * Factory for simple take types (currently only Domino).
   */
  public static constructSimple(
    takeType: TakeSimpleType,
    thenMoves: MovesFunction | null = null,
  ): MovesFunction {
    switch (takeType) {
      case TakeSimpleType.Domino:
        return new TakeDomino(thenMoves);
      default:
        throw new Error(`Take(): A TakeSimpleType is not implemented: ${takeType}`);
    }
  }

  /**
   * @java Take.construct(TakeControlType, RoleType, IntFunction, RoleType, IntFunction, IntFunction, RegionFunction, SiteType, Then)
   *
   * Factory for take-control types.
   */
  public static constructControl(
    takeType: TakeControlType,
    ofRole: RoleType | null,
    ofFn: IntFunction | null,
    byRole: RoleType | null,
    byFn: IntFunction | null,
    atFn: IntFunction | null,
    toRegion: RegionFunction | null,
    type: SiteType | null,
    thenMoves: MovesFunction | null = null,
  ): MovesFunction {
    switch (takeType) {
      case TakeControlType.Control:
        return new TakeControl(ofRole, ofFn, byRole, byFn, atFn, toRegion, type, thenMoves);
      default:
        throw new Error(`Take(): A TakeControlType is not implemented: ${takeType}`);
    }
  }

  /**
   * @java Take.eval(Context) — should never be called directly.
   */
  public eval(_ctx: Context): Move[] {
    throw new Error("Take.eval(): Should never be called directly.");
  }
}
