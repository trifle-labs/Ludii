/**
 * Value1to1.ts
 *
 * Faithful 1:1 ports of value int ludemes:
 *   ValuePiece, ValuePlayer, ValueIterated, ValueMoveLimit, ValueTurnLimit,
 *   ValuePending, ValueRandom
 *
 * @java game/functions/ints/value/piece/ValuePiece.java
 * @java game/functions/ints/value/player/ValuePlayer.java
 * @java game/functions/ints/value/iterated/ValueIterated.java
 * @java game/functions/ints/value/simple/ValueMoveLimit.java
 * @java game/functions/ints/value/simple/ValueTurnLimit.java
 * @java game/functions/ints/value/simple/ValuePending.java
 */

import type { Context } from "../../../../../context.js";
import type { IntFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import type { LudList } from "@ludii/typescript-language";
import { isIdent } from "@ludii/typescript-language";

// ---------------------------------------------------------------------------
// ValuePiece  (value stored on piece at site)
// ---------------------------------------------------------------------------
export class ValuePiece1to1 implements IntFunction {
  private readonly siteFn: IntFunction;

  public constructor(siteFn: IntFunction) {
    this.siteFn = siteFn;
  }

  /**
   * @java game/functions/ints/value/piece/ValuePiece.java — eval
   * Returns value stored on the component at the given site.
   * In the 1:1 model we store per-site values in state.valueAt (via state.valueAtSite()).
   * @java ContainerStateStacks.value(site, type) — returns valueStack[site]
   */
  public eval(ctx: Context): number {
    const s = this.siteFn.eval(ctx);
    if (s < 0) return 0;
    return ctx.state.valueAtSite(s);
  }
}

// ---------------------------------------------------------------------------
// ValuePlayer  (persistent value for a player)
// ---------------------------------------------------------------------------
export class ValuePlayer1to1 implements IntFunction {
  private readonly playerFn: IntFunction;

  public constructor(playerFn: IntFunction) {
    this.playerFn = playerFn;
  }

  /**
   * @java game/functions/ints/value/player/ValuePlayer.java — eval
   * Returns persistent value for the given player (stored in state.valuesPlayer).
   * @java State.java — value(playerIndex) returns valuesPlayer[pid].
   */
  public eval(ctx: Context): number {
    const pid = this.playerFn.eval(ctx);
    // valuePlayer returns -1 (UNDEFINED) when unset; Java treats UNDEFINED as -1.
    return ctx.state.valuePlayer(pid);
  }
}

// ---------------------------------------------------------------------------
// ValueIterated  (current forEach value)
// ---------------------------------------------------------------------------
export class ValueIterated1to1 implements IntFunction {
  /**
   * @java game/functions/ints/value/iterated/ValueIterated.java — eval: context.value()
   */
  public eval(ctx: Context): number {
    return ctx._evalValue ?? 0;
  }
}

// ---------------------------------------------------------------------------
// ValueMoveLimit
// ---------------------------------------------------------------------------
export class ValueMoveLimit1to1 implements IntFunction {
  /** @java game/functions/ints/value/simple/ValueMoveLimit.java — eval: game.rules().phases()[phase].play().moves().moveLimit() */
  public eval(ctx: Context): number {
    const gameAny = ctx.game as unknown as { _moveLimit?: number };
    return gameAny._moveLimit ?? 0;
  }
}

// ---------------------------------------------------------------------------
// ValueTurnLimit
// ---------------------------------------------------------------------------
export class ValueTurnLimit1to1 implements IntFunction {
  /** @java game/functions/ints/value/simple/ValueTurnLimit.java — eval: game.rules().phases()[phase].turnLimit() */
  public eval(ctx: Context): number {
    const gameAny = ctx.game as unknown as { _turnLimit?: number };
    return gameAny._turnLimit ?? 0;
  }
}

// ---------------------------------------------------------------------------
// ValuePending
// ---------------------------------------------------------------------------
export class ValuePending1to1 implements IntFunction {
  /** @java game/functions/ints/value/simple/ValuePending.java — eval: context.state().pendingValue() */
  public eval(ctx: Context): number {
    // Java State.pendingValue() returns the first pending value added via
    // ActionSetPending. In the 1:1 TS model, pending is stored as a Set<number>;
    // return the first element. @java Core/src/other/state/State.java — pendingValue()
    const pending = ctx.state.pending;
    if (pending && pending.size > 0) {
      return pending.values().next().value ?? 0;
    }
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

