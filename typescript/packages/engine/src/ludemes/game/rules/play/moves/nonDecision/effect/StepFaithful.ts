// @java Core/src/game/rules/play/moves/nonDecision/effect/Step.java

import type { ThenLike } from "../../Moves.js";
import type { From1to1 } from "../../../../../util/moves/From1to1.js";
import type { To1to1 } from "../../../../../util/moves/To1to1.js";
import { Step } from "./Step.js";
import { directionsFunction, fromCond, fromLevel, fromLoc, fromRegion, toApplyEffect, toCond } from "./EffectCtorAdapters.js";
import type { DirectionArg } from "./EffectCtorAdapters.js";

export class StepFaithful extends Step {
  public constructor(
    from: From1to1 | null,
    directions: DirectionArg,
    to: To1to1,
    stack: boolean | null,
    then: ThenLike | null
  ) {
    super({
      startLocationFn: fromLoc(from),
      fromCondition: fromCond(from),
      startRegionFn: fromRegion(from),
      levelFromFn: fromLevel(from),
      rule: toCond(to),
      sideEffect: toApplyEffect(to),
      stack: stack ?? false,
      dirnChoice: directionsFunction(directions),
      then,
    });
  }
}
