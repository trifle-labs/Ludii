// @java Core/src/game/functions/booleans/is/player/IsMover.java

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, IntFunction } from "../../../../../base.js";
import type { RoleTypeFull } from "../../../../types/play/RoleType.js";
import type { LudNode } from "@ludii/typescript-language";
import { isIdent, type LudList } from "@ludii/typescript-language";

/**
 * (is Mover <who>)
 * Checks if the given player index equals the current mover.
 * @java game/functions/booleans/is/player/IsMover.java
 */
export class IsMover implements BooleanFunction {
  /** @java IsMover.who */
  private readonly who: IntFunction;

  /**
   * @java IsMover(@Or IntFunction who, @Or RoleType role)
   */
  public constructor(who: IntFunction | null, role: RoleTypeFull | null) {
    const numNonNull = (who != null ? 1 : 0) + (role != null ? 1 : 0);
    if (numNonNull !== 1) {
      throw new Error("Exactly one Or parameter must be non-null.");
    }

    this.who = role != null ? roleToIntFunction(role) : who!;
  }

  /** @java IsMover.eval(Context): who.eval(context) == context.state().mover() */
  public eval(ctx: Context): boolean {
    return this.who.eval(ctx) === ctx.state.mover;
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
      if (key === "next") return ctx.state.next;
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
