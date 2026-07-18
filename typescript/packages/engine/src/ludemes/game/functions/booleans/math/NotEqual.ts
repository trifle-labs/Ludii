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
    // @java NotEqual has TWO overloads, same as Equals (Equals.ts): a plain
    // IntFunction/IntFunction numeric form and a RegionFunction/RegionFunction
    // unordered SET form. The reflection compiler duck-types region args into
    // the int slots, so `number[] !== number[]` is a REFERENCE comparison that
    // is always true (two distinct array instances), which made
    // (!= (sites ...) (sites ...)) region-inequality checks unconditionally
    // report "not equal" even for identical sets — e.g. an (all Different)/
    // territory-adjacency guard built on (!= Region Region) never rejected the
    // supposedly-equal case (Sibling: WINNER_MISMATCH @60). Mirror Equals.ts's
    // Array.isArray + set-comparison fix and negate the result.
    const a = (this.valueA as { eval(c: Context): number | readonly number[] }).eval(ctx);
    const b = (this.valueB as { eval(c: Context): number | readonly number[] }).eval(ctx);
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return true;
      const setB = new Set<number>(b as readonly number[]);
      for (const x of a as readonly number[]) if (!setB.has(x)) return true;
      return false;
    }
    return a !== b;
  }
}

/** @java game/types/play/RoleType.java — RoleType.toIntFunction(role) */
function roleToIntFunction(role: string): IntFunction {
  if (/^P\d+$/.test(role)) { const v = Number(role.slice(1)); return { eval: () => v }; }
  if (role === "Neutral") return { eval: () => 0 };
  // @java Id.java:117 (also :161) — RoleType.Shared has owner Constants.NOBODY
  // (not > 0), so RoleType.toIntFunction (RoleType.java:190-196) resolves it
  // dynamically via `new Id(null, Shared)`, whose eval() returns numPlayers+1
  // — NOT 0. Grouping Shared with Neutral here made (!= (who at:X) Shared)
  // spuriously false whenever X was an empty/unowned site (who()==0), which
  // incorrectly blocked slide/step moves onto empty squares for pieces using
  // a "not a Shared-owned piece" guard (e.g. Qi Guo Xiangxi's "NotaKing"
  // macro on General/Deputy General/Officer).
  if (role === "Shared") {
    return { eval: (ctx: Context): number => (ctx.game as unknown as { numPlayers: number }).numPlayers + 1 };
  }
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
