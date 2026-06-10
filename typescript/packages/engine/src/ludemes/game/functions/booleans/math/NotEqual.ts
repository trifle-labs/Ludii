// @java Core/src/game/functions/booleans/math/NotEqual.java

import type { Context } from "../../../../../context.js";
import type { BooleanFunction, IntFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { type LudList } from "@ludii/typescript-language";

/**
 * (!= <intA> <intB>)
 * @java game/functions/booleans/math/NotEqual.java  (alias "!=")
 */
export class NotEqual implements BooleanFunction {
  /** @java NotEqual.valueA */
  private readonly valueA: IntFunction;
  /** @java NotEqual.valueB */
  private readonly valueB: IntFunction;

  /** @java NotEqual(IntFunction valueA, @Or IntFunction valueB, @Or RoleType roleB) */
  public constructor(valueA: IntFunction, valueB: IntFunction | null = null, roleB: string | null = null) {
    this.valueA = valueA;
    // @java NotEqual.java — valueB = (valueB != null) ? valueB : RoleType.toIntFunction(roleB)
    this.valueB = valueB !== null ? valueB : roleToIntFunction(roleB ?? "Neutral");
  }

  /** @java NotEqual.eval(Context): valueA.eval(context) != valueB.eval(context) */
  public eval(ctx: Context): boolean {
    return this.valueA.eval(ctx) !== this.valueB.eval(ctx);
  }
}

/** @java game/types/play/RoleType.java — RoleType.toIntFunction(role) */
function roleToIntFunction(role: string): IntFunction {
  if (/^P\d+$/.test(role)) { const v = Number(role.slice(1)); return { eval: () => v }; }
  if (role === "Neutral" || role === "Shared") return { eval: () => 0 };
  return {
    eval: (ctx: Context): number => {
      const numPlayers = (ctx.game as unknown as { numPlayers: number }).numPlayers;
      if (role === "Mover") return ctx.state.mover;
      if (role === "Next") return (ctx.state.mover % numPlayers) + 1;
      if (role === "Prev") return ((ctx.state.mover - 2 + numPlayers) % numPlayers) + 1;
      if (role === "Player") return (ctx as Context & { _evalPlayer?: number })._evalPlayer ?? ctx.state.mover;
      return 0;
    },
  };
}
