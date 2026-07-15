// @java Core/src/game/rules/play/moves/nonDecision/effect/FromTo.java

import type { BooleanFunction, IntFunction } from "../../../../../../base.js";
import type { Then } from "./Then.js";
import type { From } from "../../../../../util/moves/From.js";
import type { To } from "../../../../../util/moves/To.js";
import { FromTo } from "./FromTo.js";
import { FALSE_FN, fromCond, fromLevel, fromLoc, fromRegion, toApplyCondition, toApplyEffect, toLoc, toRotations } from "./EffectCtorAdapters.js";

export class FromToFaithful extends FromTo {
  public constructor(
    from: From,
    to: To,
    count: IntFunction | null,
    copy: BooleanFunction | null,
    stack: boolean | null,
    mover: string | null,
    then: Then | null
  ) {
    void mover;
    super({
      locFrom: fromLoc(from),
      declaredFromType: from?.type?.() ?? null,
      declaredToType: to?.type?.() ?? null,
      levelFrom: fromLevel(from),
      countFn: count,
      locTo: toLoc(to),
      levelTo: to.levelFn(),
      // @java FromTo.java:150 — rotationTo = to.rotations().
      rotations: toRotations(to),
      regionFrom: fromRegion(from),
      regionTo: to.regionFn(),
      fromCondition: fromCond(from),
      moveRule: to.condFn(),
      captureRule: toApplyCondition(to),
      captureEffect: toApplyEffect(to),
      stack: stack ?? false,
      copy: copy ?? FALSE_FN,
      then,
    });
  }
}
