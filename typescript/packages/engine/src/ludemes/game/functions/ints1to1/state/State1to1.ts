/**
 * State1to1.ts
 *
 * Faithful 1:1 ports of state int ludemes:
 *   Mover, Next, Prev, Score, Var, Counter
 *
 * @java game/functions/ints/state/Mover.java
 * @java game/functions/ints/state/Next.java
 * @java game/functions/ints/state/Prev.java
 * @java game/functions/ints/state/Score.java
 * @java game/functions/ints/state/Var.java
 * @java game/functions/ints/state/Counter.java
 */

import type { Context } from "../../../../../context.js";
import type { IntFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import type { LudList } from "@ludii/typescript-language";
import { isIdent, isString } from "@ludii/typescript-language";
import { registerInt1to1, type Compile1to1Env } from "../../../../registry1to1.js";
import { parseArgs1to1, compileInt1to1 } from "../../../../../compiler1to1.js";

// ---------------------------------------------------------------------------
// Mover
// ---------------------------------------------------------------------------
export class Mover1to1 implements IntFunction {
  /** @java game/functions/ints/state/Mover.java — eval: context.state().mover() */
  public eval(ctx: Context): number {
    return ctx.state.mover;
  }
}

// ---------------------------------------------------------------------------
// Next
// ---------------------------------------------------------------------------
export class Next1to1 implements IntFunction {
  /** @java game/functions/ints/state/Next.java — eval: (mover % numPlayers) + 1 */
  public eval(ctx: Context): number {
    return (ctx.state.mover % ctx.game.numPlayers) + 1;
  }
}

// ---------------------------------------------------------------------------
// Prev
// ---------------------------------------------------------------------------
export class Prev1to1 implements IntFunction {
  /** @java game/functions/ints/state/Prev.java — eval: ((mover - 2 + n) % n) + 1 */
  public eval(ctx: Context): number {
    const n = ctx.game.numPlayers;
    return ((ctx.state.mover - 2 + n) % n) + 1;
  }
}

// ---------------------------------------------------------------------------
// Score
// ---------------------------------------------------------------------------
export class Score1to1 implements IntFunction {
  private readonly playerFn: IntFunction;

  /** @java game/functions/ints/state/Score.java — eval: context.score(playerFn.eval(context)) */
  public constructor(playerFn: IntFunction) {
    this.playerFn = playerFn;
  }

  public eval(ctx: Context): number {
    const pid = this.playerFn.eval(ctx);
    return ctx.state.scores[pid] ?? 0;
  }
}

// ---------------------------------------------------------------------------
// Var
// ---------------------------------------------------------------------------
export class Var1to1 implements IntFunction {
  private readonly key: string | null;

  /**
   * @java game/functions/ints/state/Var.java
   * @param key Optional key string. If null, returns context.state().temp()
   */
  public constructor(key: string | null) {
    this.key = key;
  }

  /** @java game/functions/ints/state/Var.java — eval: key==null ? state.temp() : state.getValue(key) */
  public eval(ctx: Context): number {
    if (this.key === null) {
      // @java Var.java:45 — state.temp(). The single game-wide temp is emulated
      // in slot 0 (SetVar writes ActionSetTemp(0, value) → temps[0]).
      return ctx.state.temp(0);
    }
    // getValue(key) — stored in state.vars (written by ActionSetVar via state.withVar).
    // @java State.getValue(key) returns Constants.OFF (-1) when absent.
    return ctx.state.getVar(this.key);
  }
}

// ---------------------------------------------------------------------------
// Counter
// ---------------------------------------------------------------------------
export class Counter1to1 implements IntFunction {
  /** @java game/functions/ints/state/Counter.java — eval: context.state().counter() */
  public eval(ctx: Context): number {
    return ctx.state.counter ?? ctx.trial.moves.length;
  }
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

