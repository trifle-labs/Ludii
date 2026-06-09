// @java Core/src/game/rules/play/moves/nonDecision/effect/Step.java

import type { ThenLike } from "../../Moves.js";
import type { From1to1 } from "../../../../../util/moves/From1to1.js";
import type { To1to1 } from "../../../../../util/moves/To1to1.js";
import { Step } from "./Step.js";
import { directionsFunction, fromCond, fromLevel, fromLoc, fromRegion, toApplyEffect, toCond } from "./EffectCtorAdapters.js";
import type { DirectionArg } from "./EffectCtorAdapters.js";

export class StepFaithful extends Step {
  // @Opt-tail defaults: the Java Step ctor has from/directions/stack/then as @Opt; giving
  // them (and `to`) defaults makes Function.length report 0 required params, so the
  // ArgCompiler arity gate (args.length < ctor.length) admits the faithful instantiation
  // instead of falling back to the bespoke registry's makeStep (which dropped directions).
  public constructor(
    from: From1to1 | null = null,
    directions: DirectionArg = null,
    to: To1to1 | null = null,
    stack: boolean | null = null,
    then: ThenLike | null = null
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
