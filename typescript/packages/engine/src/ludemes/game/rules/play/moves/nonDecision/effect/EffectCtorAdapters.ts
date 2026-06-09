import type { Context } from "../../../../../../../context.js";
import type { BooleanFunction, DirectionsFunction, IntFunction, MovesFunction, RegionFunction } from "../../../../../../base.js";
import { IntConstant } from "../../../../../functions/ints/IntConstant.js";
import { LastTo } from "../../../../../functions/ints/last/LastTo.js";
import type { From1to1 } from "../../../../../util/moves/From1to1.js";
import type { Piece1to1 } from "../../../../../util/moves/Piece1to1.js";
import type { To1to1 } from "../../../../../util/moves/To1to1.js";
import type { Between1to1, RangeLike } from "../../../../../util/moves/Between1to1.js";

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

export function fromLoc(from: From1to1 | null, fallback: IntFunction = FROM_ITER): IntFunction {
  return from?.locFn() ?? fallback;
}

export function fromRegion(from: From1to1 | null): RegionFunction | null {
  return from?.regionFn() ?? null;
}

export function fromLevel(from: From1to1 | null): IntFunction | null {
  return from?.levelFn() ?? null;
}

export function fromCond(from: From1to1 | null): BooleanFunction | null {
  return from?.condFn() ?? null;
}

export function toLoc(to: To1to1 | null, fallback: IntFunction = TO_ITER): IntFunction {
  return to?.locFn() ?? fallback;
}

export function toRegion(to: To1to1 | null): RegionFunction {
  const region = to?.regionFn() ?? null;
  if (region !== null) return region;
  const loc = toLoc(to);
  return { eval: (ctx) => [loc.eval(ctx)] };
}

export function toCond(to: To1to1 | null, fallback: BooleanFunction = TRUE_FN): BooleanFunction {
  return to?.condFn() ?? fallback;
}

export function toEffect(to: To1to1 | null): MovesFunction | null {
  return to?.effectFn() ?? null;
}

export function toApplyEffect(to: To1to1 | null): MovesFunction | null {
  return to?.effectFn()?.effectMoves() ?? null;
}

export function toApplyCondition(to: To1to1 | null): BooleanFunction | null {
  return to?.effectFn()?.condition() ?? null;
}

export function betweenRange(between: Between1to1 | null): RangeLike | null {
  return between?.range() ?? null;
}

export function betweenCond(between: Between1to1 | null, fallback: BooleanFunction = TRUE_FN): BooleanFunction {
  return between?.condition() ?? fallback;
}

export function betweenEffect(between: Between1to1 | null): MovesFunction | null {
  return between?.effectFn() ?? null;
}

export function pieceComponent(piece: Piece1to1 | null): IntFunction {
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

export function pieceComponents(piece: Piece1to1 | null): IntFunction[] | null {
  return piece?.components() ?? null;
}

function ownerSuffix(name: string): number | null {
  const match = name.match(/\d+$/);
  return match ? Number(match[0]) : null;
}
