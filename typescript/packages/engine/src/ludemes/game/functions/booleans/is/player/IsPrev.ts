// @java Core/src/game/functions/booleans/is/player/IsPrev.java

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, IntFunction } from "../../../../../base.js";
import type { RoleTypeFull } from "../../../../types/play/RoleType.js";
import type { LudNode } from "@ludii/typescript-language";
import { isIdent, type LudList } from "@ludii/typescript-language";

/**
 * (is Prev <who>)
 * Checks if the given player index equals the previous mover.
 * prev = ((mover - 2 + numPlayers) % numPlayers) + 1
 * @java game/functions/booleans/is/player/IsPrev.java
 */
export class IsPrev implements BooleanFunction {
  /** @java IsPrev.who */
  private readonly who: IntFunction;

  /**
   * @java IsPrev(@Or IntFunction who, @Or RoleType role)
   */
  public constructor(who: IntFunction | null, role: RoleTypeFull | null) {
    this.who = role != null ? roleToIntFunction(role) : who!;
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
    // @java IsPrev.java — who.eval(context) == context.state().prev().
    // state.prev is the REAL maintained channel (@java State.setPrev in
    // Game.apply, ported Update 149) — stamped AFTER the end-rules evaluate,
    // so during an end-eval (NoMoves(Next) temp context) it still holds the
    // PREVIOUS turn's mover. The old trial-derived read returned the just-
    // applied move's mover there, flipping "SameTurn" true inside
    // (no Moves Next) and ending Dama (Italy) mid-chain (WM at ply 10).
    const prev = (ctx.state as unknown as { prev?: number }).prev ?? 0;
    if (prev <= 0) {
      // Pre-first-advance fallback (start rules / ply 0 then-contexts).
      const moves = ctx.trial.moves;
      if (moves.length === 0) return false;
      const inThen = (ctx as unknown as { _thenContextDepth?: number })._thenContextDepth ?? 0;
      const prevIdx = inThen > 0 ? moves.length - 2 : moves.length - 1;
      if (prevIdx < 0) return false;
      return this.who.eval(ctx) === moves[prevIdx]!.mover;
    }
    return this.who.eval(ctx) === prev;
  }
}

/**
 * @java game.types.play.RoleType.toIntFunction(RoleType)
 */
function roleToIntFunction(role: RoleTypeFull): IntFunction {
  const key = role.toLowerCase();
  return {
    eval(ctx: Context): number {
      if (key === "mover") return ctx.state.mover;
      // @java Game.java:3209-3216 — Java re-populates state.next with the
      // cyclic successor of the new mover after EVERY apply, so "Next" is
      // never 0 between moves. The TS port clears next to 0 after consuming
      // it (the SetNextPlayer override channel), so mirror Java by falling
      // back to the rotational successor — the established idiom used by
      // NoPieces/NoMoves/Result/ForEachPiece. Epoxy's (then (if (is Prev
      // Next) (moveAgain) ...)) read next=0, never fired moveAgain, and the
      // mover advanced a turn early (ply-3 divergence).
      if (key === "next") {
        return (ctx.state.next ?? 0) > 0
          ? ctx.state.next
          : (ctx.state.mover % ctx.game.numPlayers) + 1;
      }
      if (key === "prev") return previousMover(ctx);
      if (key === "player") return ctx._evalPlayer ?? ctx.state.mover;
      if (key === "neutral") return 0;
      if (key === "shared" || key === "all" || key === "each") return ctx.game.numPlayers + 1;
      const player = /^p(\d+)$/.exec(key);
      if (player) return Number(player[1]);
      const team = /^team(\d+)$/.exec(key);
      if (team) return Number(team[1]);
      return -1;
    },
  };
}

function previousMover(ctx: Context): number {
  const moves = ctx.trial.moves;
  if (moves.length === 0) return -1;
  const inThen = (ctx as unknown as { _thenContextDepth?: number })._thenContextDepth ?? 0;
  const prevIdx = inThen > 0 ? moves.length - 2 : moves.length - 1;
  return prevIdx >= 0 ? moves[prevIdx]!.mover : -1;
}
