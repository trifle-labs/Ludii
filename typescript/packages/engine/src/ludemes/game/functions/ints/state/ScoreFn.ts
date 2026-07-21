// @java Core/src/game/functions/ints/state/Score.java

/**
 * Returns the score of a player.
 *
 * @java game/functions/ints/state/Score.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import { BaseIntFunction } from "../BaseIntFunction.js";
import type { JavaIntFunction } from "../IntFunction.js";

export class Score extends BaseIntFunction {
  /** @java Score.playerFn */
  private readonly playerFn: JavaIntFunction;

  /** @java Score(@Or Player player, @Or RoleType role) */
  public constructor(player: JavaIntFunction | null, role: string | null = null) {
    super();
    if (player !== null && typeof (player as { eval?: unknown }).eval === "function") {
      this.playerFn = player;
    } else {
      const r = role ?? (player as unknown as string);
      this.playerFn = {
        eval: (ctx: Context): number => {
          if (r === "Mover") return ctx.state.mover;
          if (r === "Next") return (ctx.state.mover % ctx.game.numPlayers) + 1;
          if (r === "Prev") return ((ctx.state.mover - 2 + ctx.game.numPlayers) % ctx.game.numPlayers) + 1;
          if (typeof r === "string" && /^P\d+$/.test(r)) return Number(r.slice(1));
          return ctx.state.mover;
        },
      } as JavaIntFunction;
    }
  }

  /** @java Score.eval(Context) — context.score(playerFn.eval(context)) */
  public override eval(context: Context): number {
    const pid = this.playerFn.eval(context);
    return (context.state as unknown as { score(p: number): number }).score(pid);
  }

  /** @java Score.isStatic() */
  public isStatic(): boolean { return false; }
}
