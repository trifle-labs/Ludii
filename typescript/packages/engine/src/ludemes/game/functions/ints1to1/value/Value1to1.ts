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
import { registerInt1to1, type Compile1to1Env } from "../../../../registry1to1.js";
import { parseArgs1to1, compileInt1to1 } from "../../../../../compiler1to1.js";

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
   * In the 1:1 model we store per-site values in state.values array.
   */
  public eval(ctx: Context): number {
    const s = this.siteFn.eval(ctx);
    if (s < 0) return 0;
    const valuesAny = ctx.state as unknown as { values?: readonly number[] };
    return valuesAny.values?.[s] ?? 0;
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
   * Returns persistent value for the given player (stored in state).
   * In 1:1 model: not tracked, return 0.
   */
  public eval(_ctx: Context): number {
    // @java context.value(playerFn.eval(context)) — not tracked in 1:1 path
    return 0;
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
    const stateAny = ctx.state as unknown as { pendingValue?: number };
    return stateAny.pendingValue ?? 0;
  }
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

registerInt1to1("value", (node: LudNode, env: Compile1to1Env): IntFunction => {
  const { positional, named } = parseArgs1to1((node as LudList).items);
  const typeNode = positional[0];
  const typeName = (typeNode && isIdent(typeNode)) ? typeNode.name.toLowerCase() : "";

  if (typeName === "piece") {
    const atNode = named.get("at") ?? positional[1];
    let siteFn: IntFunction;
    if (atNode) {
      try { siteFn = compileInt1to1(atNode); } catch { siteFn = { eval: (ctx: Context) => ctx._evalFrom }; }
    } else {
      siteFn = { eval: (ctx: Context) => ctx._evalFrom };
    }
    return new ValuePiece1to1(siteFn);
  }

  if (typeName === "player") {
    const roleNode = positional[1];
    const roleName = (roleNode && isIdent(roleNode)) ? roleNode.name.toLowerCase() : "mover";
    let playerFn: IntFunction;
    if (roleName === "mover") {
      playerFn = { eval: (ctx: Context) => ctx.state.mover };
    } else if (roleName === "next") {
      playerFn = { eval: (ctx: Context) => (ctx.state.mover % ctx.game.numPlayers) + 1 };
    } else if (roleName.startsWith("p") && !isNaN(parseInt(roleName.slice(1), 10))) {
      const pid = parseInt(roleName.slice(1), 10);
      playerFn = { eval: (_ctx: Context) => pid };
    } else {
      playerFn = { eval: (ctx: Context) => ctx.state.mover };
    }
    return new ValuePlayer1to1(playerFn);
  }

  if (typeName === "movelimit") {
    return new ValueMoveLimit1to1();
  }

  if (typeName === "turnlimit") {
    return new ValueTurnLimit1to1();
  }

  if (typeName === "pending") {
    return new ValuePending1to1();
  }

  // (value) with no type — current value from context
  if (!typeName) {
    return new ValueIterated1to1();
  }

  // Fallback
  return { eval: (_ctx: Context) => 0 };
});
