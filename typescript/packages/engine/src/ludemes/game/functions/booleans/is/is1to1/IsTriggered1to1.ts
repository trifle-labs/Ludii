// @java Core/src/game/functions/booleans/is/triggered/IsTriggered.java

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, IntFunction } from "../../../../../base.js";
import type { RoleTypeFull } from "../../../../types/play/RoleType.js";
import type { LudNode } from "@ludii/typescript-language";
import { isIdent, isString, type LudList } from "@ludii/typescript-language";

/**
 * (is Triggered "<event>" <roleOrPlayer>)
 * Checks if a player was triggered before (event string is cosmetic; only
 * the player bit is tested, matching Java's isTriggered(event, pid) behaviour).
 * @java game/functions/booleans/is/triggered/IsTriggered.java
 */
export class IsTriggered1to1 implements BooleanFunction {
  /** @java IsTriggered.playerId */
  private readonly playerId: IntFunction;

  /** @java IsTriggered.event */
  private readonly event: string;

  /**
   * @java IsTriggered(String event, @Or IntFunction indexPlayer, @Or RoleType role)
   */
  public constructor(event: string, indexPlayer: IntFunction | null, role: RoleTypeFull | null) {
    const numNonNull = (indexPlayer !== null ? 1 : 0) + (role !== null ? 1 : 0);
    if (numNonNull !== 1) {
      throw new Error("IsTriggered(): exactly one Or parameter must be non-null.");
    }

    this.playerId = indexPlayer ?? roleToIntFunction(role!);
    this.event = event;
  }

  /**
   * @java IsTriggered.eval(Context):
   *   context.active(pid) && context.state().isTriggered(event, pid)
   *   Event string ignored — only player bit tested (Java parity).
   */
  public eval(ctx: Context): boolean {
    const pid = this.playerId.eval(ctx);
    if (pid < 1) return false;
    // Java: context.active(pid) — player must be active
    const active = ctx.state.activePlayer(pid);
    if (!active) return false;
    // Java: state.isTriggered(event, pid) — tests bit (pid-1)
    void this.event;
    return ctx.state.isTriggered(pid);
  }
}

function eventFromPositional(positional: readonly LudNode[]): string {
  for (let index = 1; index < positional.length; index++) {
    const node = positional[index]!;
    if (isString(node)) return node.value;
  }
  return "";
}

/**
 * @java game.types.play.RoleType.toIntFunction(RoleType)
 */
function roleToIntFunction(role: RoleTypeFull): IntFunction {
  return {
    eval(ctx: Context): number {
      if (role === "Mover") return ctx.state.mover;
      if (role === "Next") return (ctx.state.mover % ctx.game.numPlayers) + 1;
      if (role === "Prev") return ((ctx.state.mover - 2 + ctx.game.numPlayers) % ctx.game.numPlayers) + 1;
      if (role === "Neutral" || role === "Shared") return 0;
      const player = /^P(\d+)$/.exec(role);
      if (player) return Number(player[1]);
      const team = /^Team(\d+)$/.exec(role);
      if (team) return Number(team[1]);
      return ctx.state.mover;
    },
  };
}
