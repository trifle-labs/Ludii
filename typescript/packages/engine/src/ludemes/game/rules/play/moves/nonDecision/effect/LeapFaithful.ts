// @java Core/src/game/rules/play/moves/nonDecision/effect/Leap.java

import type { BooleanFunction, RegionFunction } from "../../../../../../base.js";
import type { Then } from "./Then.js";
import type { From1to1 } from "../../../../../util/moves/From1to1.js";
import type { To1to1 } from "../../../../../util/moves/To1to1.js";
import { Leap } from "./Leap.js";
import { FALSE_FN, fromCond, fromLoc, toApplyEffect, toCond } from "./EffectCtorAdapters.js";

export class LeapFaithful extends Leap {
  public constructor(
    from: From1to1 | null,
    walk: RegionFunction | unknown[][],
    forward: BooleanFunction | null,
    rotations: BooleanFunction | null,
    to: To1to1,
    then: Then | null
  ) {
    void rotations;
    const walkRegion: RegionFunction = isRegionFunction(walk) ? walk : { eval: () => [] };
    super({
      startLocationFn: fromLoc(from),
      fromCondition: fromCond(from),
      walk: walkRegion,
      forward: forward ?? FALSE_FN,
      goRule: toCond(to),
      sideEffect: toApplyEffect(to),
      then,
    });
  }
}

function isRegionFunction(value: unknown): value is RegionFunction {
  return typeof (value as { eval?: unknown }).eval === "function";
}
