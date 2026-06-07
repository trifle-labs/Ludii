// @java Core/src/game/rules/play/moves/nonDecision/effect/Slide.java

import type { Then } from "./Then.js";
import type { From1to1 } from "../../../../../util/moves/From1to1.js";
import type { To1to1 } from "../../../../../util/moves/To1to1.js";
import type { Between1to1 } from "../../../../../util/moves/Between1to1.js";
import { Slide } from "./Slide.js";
import {
  betweenCond,
  betweenEffect,
  betweenRange,
  directionName,
  fromCond,
  fromLevel,
  fromLoc,
  intConst,
  toApplyEffect,
  toCond,
} from "./EffectCtorAdapters.js";
import type { DirectionArg } from "./EffectCtorAdapters.js";

export class SlideFaithful extends Slide {
  public constructor(
    from: From1to1 | null,
    track: string | null,
    directions: DirectionArg,
    between: Between1to1 | null,
    to: To1to1 | null,
    stack: boolean | null,
    then: Then | null
  ) {
    const range = betweenRange(between);
    super({
      startLocationFn: fromLoc(from),
      levelFromFn: fromLevel(from),
      fromCondition: fromCond(from),
      limit: range?.maxFn ?? intConst(1000),
      minFn: range?.minFn ?? intConst(-2),
      goRule: betweenCond(between, { eval: (ctx) => ctx.state.isEmptySite(ctx._evalBetween) }),
      stopRule: to?.condFn() ?? null,
      toRule: to === null ? null : toCond(to),
      letFn: between?.trailFn() ?? null,
      betweenEffect: betweenEffect(between),
      sideEffect: toApplyEffect(to),
      dirnName: directionName(typeof directions === "string" ? directions : null),
      trackName: track,
      stack: stack ?? false,
      then,
    });
  }
}
