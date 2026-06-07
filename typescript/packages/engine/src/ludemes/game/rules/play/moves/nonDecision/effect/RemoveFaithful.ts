// @java Core/src/game/rules/play/moves/nonDecision/effect/Remove.java

import type { IntFunction, RegionFunction } from "../../../../../../base.js";
import type { Then } from "./Then.js";
import { Remove } from "./Remove.js";

export class RemoveFaithful extends Remove {
  public constructor(
    type: string | null,
    locationFunction: IntFunction | null,
    regionFunction: RegionFunction | null,
    level: IntFunction | null,
    at: string | null,
    count: IntFunction | null,
    then: Then | null
  ) {
    super({ type, locationFn: locationFunction, regionFn: regionFunction, levelFn: level, when: at, countFn: count, then });
  }
}
