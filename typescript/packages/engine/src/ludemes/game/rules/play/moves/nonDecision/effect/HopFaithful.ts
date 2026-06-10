// @java Core/src/game/rules/play/moves/nonDecision/effect/Hop.java

import type { ThenLike } from "../../Moves.js";
import type { From } from "../../../../../util/moves/From1to1.js";
import type { To } from "../../../../../util/moves/To1to1.js";
import type { Between } from "../../../../../util/moves/Between1to1.js";
import { Hop } from "./Hop.js";
import {
  betweenCond,
  betweenEffect,
  betweenRange,
  directionsFunction,
  fromCond,
  fromLoc,
  intConst,
  toApplyCondition,
  toApplyEffect,
  toCond,
} from "./EffectCtorAdapters.js";
import type { DirectionArg } from "./EffectCtorAdapters.js";

export class HopFaithful extends Hop {
  public constructor(
    from: From | null = null,
    directions: DirectionArg = null,
    between: Between | null = null,
    to: To | null = null,
    stack: boolean | null = null,
    then: ThenLike | null = null
  ) {
    const range = betweenRange(between);
    super({
      startLocationFn: fromLoc(from),
      dirnChoice: directionsFunction(directions),
      goRule: toCond(to),
      hurdleRule: betweenCond(between),
      stopRule: toApplyCondition(to),
      stopEffect: toApplyEffect(to),
      maxDistanceFromHurdleFn: between?.beforeFn() ?? intConst(0),
      minLengthHurdleFn: range?.minFn ?? intConst(1),
      maxLengthHurdleFn: range?.maxFn ?? intConst(1),
      maxDistanceHurdleToFn: between?.afterFn() ?? intConst(0),
      sideEffect: betweenEffect(between),
      fromCondition: fromCond(from),
      stack: stack ?? false,
      then,
    });
  }
}
