import type { Context } from "../../../../../../../context.js";
import type { BooleanFunction, DirectionsFunction, IntFunction, MovesFunction, RegionFunction } from "../../../../../../base.js";
import { IntConstant } from "../../../../../functions/ints/IntConstant.js";
import { LastTo } from "../../../../../functions/ints/last/LastTo.js";
import { AndBool } from "../../../../../functions/booleans/math/AndBool.js";
import { OrBool } from "../../../../../functions/booleans/math/OrBool.js";
import { IsFriend } from "../../../../../functions/booleans/is/player/IsFriend.js";
import { Who } from "../../../../../functions/ints/state/Who.js";
import type { JavaIntFunction } from "../../../../../functions/ints/IntFunction.js";
import type { From } from "../../../../../util/moves/From.js";
import type { Piece } from "../../../../../util/moves/Piece.js";
import type { To } from "../../../../../util/moves/To.js";
import type { Between, RangeLike } from "../../../../../util/moves/Between.js";

export type DirectionArg = string | DirectionsFunction | { directionsFunctions?: () => DirectionsFunction } | null;

export const TRUE_FN: BooleanFunction = { eval: () => true };
export const FALSE_FN: BooleanFunction = { eval: () => false };
export const FROM_ITER: IntFunction = { eval: (ctx: Context) => ctx._evalFrom };
export const TO_ITER: IntFunction = { eval: (ctx: Context) => ctx._evalTo };
export const BETWEEN_ITER: IntFunction = { eval: (ctx: Context) => ctx._evalBetween };
export const LAST_TO: IntFunction = new LastTo();
export const ADJACENT_DIRS: DirectionsFunction = { eval: () => ["Adjacent"] };

export function intConst(value: number): IntFunction {
  return new IntConstant(value);
}

export function directionsFunction(direction: DirectionArg): DirectionsFunction {
  if (direction === null) return ADJACENT_DIRS;
  if (typeof direction === "string") return { eval: () => [direction] };
  const maybeProvider = direction as { directionsFunctions?: () => DirectionsFunction };
  if (typeof maybeProvider.directionsFunctions === "function") return maybeProvider.directionsFunctions();
  return direction as DirectionsFunction;
}

export function directionName(direction: string | DirectionsFunction | null): string {
  if (direction === null) return "Adjacent";
  if (typeof direction === "string") return direction;
  return "Adjacent";
}

export function fromLoc(from: From | null, fallback: IntFunction = FROM_ITER): IntFunction {
  return from?.locFn() ?? fallback;
}

export function fromRegion(from: From | null): RegionFunction | null {
  return from?.regionFn() ?? null;
}

export function fromLevel(from: From | null): IntFunction | null {
  return from?.levelFn() ?? null;
}

export function fromCond(from: From | null): BooleanFunction | null {
  return from?.condFn() ?? null;
}

export function toLoc(to: To | null, fallback: IntFunction = TO_ITER): IntFunction {
  return to?.locFn() ?? fallback;
}

export function toRegion(to: To | null): RegionFunction {
  const region = to?.regionFn() ?? null;
  if (region !== null) return region;
  const loc = toLoc(to);
  return { eval: (ctx) => [loc.eval(ctx)] };
}

export function toCond(to: To | null, fallback: BooleanFunction = TRUE_FN): BooleanFunction {
  return to?.condFn() ?? fallback;
}

export function normaliseFriendAtPlaceholder(rule: BooleanFunction): BooleanFunction {
  return rewriteFriendPlaceholder(rule, new IsFriend(new Who(null, TO_ITER as unknown as JavaIntFunction), null));
}

export function toEffect(to: To | null): MovesFunction | null {
  return to?.effectFn() ?? null;
}

export function toApplyEffect(to: To | null): MovesFunction | null {
  return to?.effectFn()?.effectMoves() ?? null;
}

export function toApplyCondition(to: To | null): BooleanFunction | null {
  return to?.effectFn()?.condition() ?? null;
}

export function betweenRange(between: Between | null): RangeLike | null {
  return between?.range() ?? null;
}

export function betweenCond(between: Between | null, fallback: BooleanFunction = TRUE_FN): BooleanFunction {
  return between?.condition() ?? fallback;
}

export function betweenEffect(between: Between | null): MovesFunction | null {
  return between?.effectFn() ?? null;
}

export function pieceComponent(piece: Piece | null): IntFunction {
  const component = piece?.component() ?? null;
  if (component !== null) return component;

  const name = piece?.nameComponent() ?? null;
  if (name !== null) {
    const owner = ownerSuffix(name);
    const baseName = name.replace(/\d+$/, "").toLowerCase();
    return {
      eval: (ctx: Context) => {
        const pieces = (ctx.game as unknown as { equipment?: { pieces?: Array<{ name: string; owner: number; index: number }> } })
          .equipment?.pieces ?? [];
        const exact = pieces.find((p) => `${p.name}${p.owner}`.toLowerCase() === name.toLowerCase());
        const byBase = pieces.find((p) => p.name.toLowerCase() === baseName && (owner === null || p.owner === owner));
        return exact?.index ?? byBase?.index ?? (owner ?? ctx.state.mover);
      },
    };
  }

  return { eval: (ctx: Context) => ctx.state.mover };
}

export function pieceComponents(piece: Piece | null): IntFunction[] | null {
  return piece?.components() ?? null;
}

function ownerSuffix(name: string): number | null {
  const match = name.match(/\d+$/);
  return match ? Number(match[0]) : null;
}

function rewriteFriendPlaceholder(rule: BooleanFunction, friendRule: BooleanFunction): BooleanFunction {
  // ArgCompiler currently mis-resolves the built-in "IsFriendAt" define as
  // unconstrained IsSolved in some generated `to` clauses; Java expects Friend.
  if (rule.constructor?.name === "IsSolved") return friendRule;

  const maybeList = (rule as unknown as { list?: readonly BooleanFunction[] }).list;
  if (Array.isArray(maybeList)) {
    const rewritten = maybeList.map((child) => rewriteFriendPlaceholder(child, friendRule));
    if (rule.constructor?.name === "OrBool") return new OrBool(rewritten);
    if (rule.constructor?.name === "AndBool") return new AndBool(rewritten);
  }

  return rule;
}
