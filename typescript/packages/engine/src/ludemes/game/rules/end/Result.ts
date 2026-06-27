/**
 * @java game/rules/end/Result.java Result
 *
 * Data holder for end-game result: who wins/loses/draws.
 *
 * Java parity: Result holds a RoleType (who) and a ResultType (Win/Loss/Draw).
 * Used by If end rules to express the outcome when the condition fires.
 */

import type { Context } from "../../../../context.js";
import type { RoleTypeFull } from "../../types/play/RoleType.js";
import type { ResultTypeFull } from "../../types/play/ResultType.js";

export class Result {
  public readonly who: RoleTypeFull;
  public readonly result: ResultTypeFull;

  /** @java game/rules/end/Result.java — public Result(RoleType who, ResultType result) */
  public constructor(who: RoleTypeFull, result: ResultTypeFull) {
    this.who = who;
    this.result = result;
  }

  /**
   * Resolve `who` to a concrete 1-based player index.
   *
   * @java game/functions/ints/board/Id.java — eval(Context)
   * Java uses `context.state().next()` for RoleType.Next, NOT the rotational
   * `(mover % numPlayers) + 1`. The `state.next` is set by ActionSetNextPlayer
   * (from `(then (moveAgain))`) to schedule the same player to move again.
   * When `state.next > 0`, Next = that player; otherwise rotational next.
   *
   * @param ctx         The evaluation context (for state.next and state.mover)
   * @param numPlayers  Number of players in the game
   */
  public resolveWho(mover: number, numPlayers: number, ctx?: Context): number {
    switch (this.who) {
      case "Mover": return mover;
      case "Next": {
        // @java game/functions/ints/board/Id.java:122 — case Next: return context.state().next()
        // Java uses state.next(), which reflects ActionSetNextPlayer(mover) from (then (moveAgain)).
        // When state.next > 0, use it; otherwise fall back to rotational next.
        const stateNext = ctx?.state?.next ?? 0;
        return stateNext > 0 ? stateNext : (mover % numPlayers) + 1;
      }
      case "All":   return 0;
      default: {
        // @java RoleType — (result Pn Win) names a specific player; resolve Pn for
        // ALL n, not just P1/P2. The old switch stopped at P2, so (result P3 Win) /
        // (result P4 Win) fell through to `mover` and the wrong player won 4-player
        // races (Aime: recWinner=3 but TS returned mover=4).
        const pm = /^P(\d+)$/.exec(this.who);
        if (pm) return Number(pm[1]);
        return mover;
      }
    }
  }
}
