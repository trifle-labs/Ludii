// @java Core/src/game/functions/booleans/is/player/IsPrev.java

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, IntFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { type LudList } from "@ludii/typescript-language";
import { compileInt1to1, parseArgs1to1 } from "../../../../../../compiler1to1.js";
import { registerBool1to1, type Compile1to1Env } from "../../../../../registry1to1.js";

/**
 * (is Prev <who>)
 * Checks if the given player index equals the previous mover.
 * prev = ((mover - 2 + numPlayers) % numPlayers) + 1
 * @java game/functions/booleans/is/player/IsPrev.java
 */
export class IsPrev1to1 implements BooleanFunction {
  /** @java IsPrev.who */
  private readonly who: IntFunction;

  public constructor(who: IntFunction) {
    this.who = who;
  }

  /**
   * @java game/functions/booleans/is/player/IsPrev.java — eval(Context):
   *   who.eval(context) == context.state().prev()
   *
   * `state().prev()` is the ACTUAL player who made the previous move (the last
   * move in the trial), NOT the cyclic predecessor (mover-1). After a moveAgain
   * the same player moves again, so prev == mover — this is the "SameTurn"
   * idiom (`(is Prev Mover)`) that gates Morris mill-removal turns. Using the
   * cyclic predecessor instead makes `(is Prev Mover)` permanently false.
   *
   * In a (then ...) consequence context, the current move has already been
   * appended to trial.moves so that (last To)/(last From) resolve correctly.
   * We therefore look at moves[last-1] (ply before the current move) rather
   * than moves[last] (the current move itself).
   * @java Then.java — evaluates in post-move context; context.prev() reads
   * state.prev which is the mover of the ply BEFORE the current one.
   */
  public eval(ctx: Context): boolean {
    const moves = ctx.trial.moves;
    if (moves.length === 0) return false;
    // When in a then-consequence context (_thenContextDepth > 0), the current
    // move has been added to the trial — the "previous" mover is moves[last-1].
    const inThen = (ctx as unknown as { _thenContextDepth?: number })._thenContextDepth ?? 0;
    const prevIdx = inThen > 0 ? moves.length - 2 : moves.length - 1;
    if (prevIdx < 0) return false;
    const prev = moves[prevIdx]!.mover;
    return this.who.eval(ctx) === prev;
  }
}

registerBool1to1("is:prev", (node: LudNode, _env: Compile1to1Env): BooleanFunction => {
  const { positional } = parseArgs1to1((node as LudList).items);
  const whoNode = positional[1];
  if (!whoNode) {
    return { eval(_ctx: Context): boolean { return false; } };
  }
  const who = compileInt1to1(whoNode);
  return new IsPrev1to1(who);
});
