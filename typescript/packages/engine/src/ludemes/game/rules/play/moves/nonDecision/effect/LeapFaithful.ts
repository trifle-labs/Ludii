// @java Core/src/game/rules/play/moves/nonDecision/effect/Leap.java

import type { BooleanFunction, RegionFunction } from "../../../../../../base.js";
import { Sites } from "../../../../../functions/region/sites/Sites.js";
import type { Then } from "./Then.js";
import type { From } from "../../../../../util/moves/From.js";
import type { To } from "../../../../../util/moves/To.js";
import { Leap } from "./Leap.js";
import { FALSE_FN, fromCond, fromLoc, toApplyEffect, toCond } from "./EffectCtorAdapters.js";

export class LeapFaithful extends Leap {
  public constructor(
    from: From | null,
    walk: RegionFunction | unknown[][],
    forward: BooleanFunction | null,
    rotations: BooleanFunction | null,
    to: To,
    then: Then | null
  ) {
    // @java Leap.java:98 — this.walk = Sites.construct(null, startLocationFn,
    // walk, rotations): a raw StepType[][] becomes a SitesWalk anchored at the
    // from-site (KnightWalk {{F F R F} {F F L F}} with all rotations).
    const walkRegion: RegionFunction = isRegionFunction(walk)
      ? walk
      : Sites.constructWalk(null, fromLoc(from), walk as unknown[][], rotations);
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
