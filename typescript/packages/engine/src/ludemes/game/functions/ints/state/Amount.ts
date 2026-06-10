// @java Core/src/game/functions/ints/state/Amount.java

/**
 * Returns the amount (money/points pool) of a player.
 *
 * @java game/functions/ints/state/Amount.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import { BaseIntFunction } from "../BaseIntFunction.js";
import type { JavaIntFunction } from "../IntFunction.js";

const UNDEFINED = -1;

export class Amount extends BaseIntFunction {
  /** @java Amount.playerFn */
  private readonly playerFn: JavaIntFunction;

  /** @java Amount(@Or RoleType role, @Or game.util.moves.Player player) */
  public constructor(role: string | null, player: JavaIntFunction | null = null) {
    super();
    if (player !== null && typeof (player as { eval?: unknown }).eval === "function") {
      this.playerFn = player;
    } else {
      const r = role;
      this.playerFn = {
        eval: (ctx: Context): number => {
          if (r === "Mover") return ctx.state.mover;
          if (r === "Next") return (ctx.state.mover % ctx.game.numPlayers) + 1;
          if (r === "Prev") return ((ctx.state.mover - 2 + ctx.game.numPlayers) % ctx.game.numPlayers) + 1;
          if (r !== null && /^P\d+$/.test(r)) return Number(r.slice(1));
          return ctx.state.mover;
        },
      } as JavaIntFunction;
    }
  }

  /** @java Amount.eval(Context) — context.state().amount(player) */
  public override eval(context: Context): number {
    const player = this.playerFn.eval(context);
    if (player > 0 && player <= context.game.numPlayers) {
      const st = context.state as unknown as { amounts?: readonly number[]; amount?: (pid: number) => number };
      return st.amounts?.[player] ?? st.amount?.(player) ?? 0;
    }
    return UNDEFINED;
  }

  /** @java Amount.isStatic() */
  public isStatic(): boolean { return false; }
}
