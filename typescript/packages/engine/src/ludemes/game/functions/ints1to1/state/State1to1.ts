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

// ---------------------------------------------------------------------------
// Mover
// ---------------------------------------------------------------------------
export class Mover implements IntFunction {
  /** @java game/functions/ints/state/Mover.java — eval: context.state().mover() */
  public eval(ctx: Context): number {
    return ctx.state.mover;
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
// Registration
// ---------------------------------------------------------------------------

