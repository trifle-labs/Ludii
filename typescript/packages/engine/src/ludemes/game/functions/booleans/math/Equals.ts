// @java Core/src/game/functions/booleans/math/Equals.java

import type { Context } from "../../../../../context.js";
import type { BooleanFunction, IntFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { type LudList } from "@ludii/typescript-language";

/**
 * (= <intA> <intB>)
 * @java game/functions/booleans/math/Equals.java  (alias "=")
 */
export class Equals implements BooleanFunction {
  /** @java Equals.valueA */
  private readonly valueA: IntFunction;
  /** @java Equals.valueB */
  private readonly valueB: IntFunction;

  /** @java Equals(IntFunction valueA, @Or IntFunction valueB, @Or RoleType roleB) */
  public constructor(valueA: IntFunction, valueB: IntFunction | null = null, roleB: string | null = null) {
    this.valueA = valueA;
    // @java Equals.java:78 — valueB = (valueB != null) ? valueB : RoleType.toIntFunction(roleB)
    this.valueB = valueB !== null ? valueB : roleToIntFunction(roleB ?? "Neutral");
  }

  /** @java Equals.eval(Context): valueA.eval(context) == valueB.eval(context) */
  public eval(ctx: Context): boolean {
    // @java Equals has TWO overloads: Equals(IntFunction, IntFunction) numeric equality
    // and Equals(RegionFunction, RegionFunction) unordered SET equality. The reflection
    // compiler duck-types region args into the int slots, so detect array (region)
    // results at eval time and compare as sets — `number[] === number[]` is always false,
    // which made (= (sites Occupied by:Mover) <region>) (FillWin: Aralzaa/Azteka/Bajr/
    // Grasshopper) never fire and the game never end.
    const a = (this.valueA as { eval(c: Context): number | readonly number[] }).eval(ctx);
    const b = (this.valueB as { eval(c: Context): number | readonly number[] }).eval(ctx);
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      const setB = new Set<number>(b as readonly number[]);
      for (const x of a as readonly number[]) if (!setB.has(x)) return false;
      return true;
    }
    return a === b;
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
