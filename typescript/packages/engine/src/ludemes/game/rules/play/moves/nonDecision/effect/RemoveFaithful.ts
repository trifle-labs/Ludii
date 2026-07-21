// @java Core/src/game/rules/play/moves/nonDecision/effect/Remove.java

import type { IntFunction, RegionFunction } from "../../../../../../base.js";
import type { Then } from "./Then.js";
import { Remove } from "./Remove.js";

export class RemoveFaithful extends Remove {
  public constructor(
    type: string | null = null,
    locationFunction: IntFunction | null = null,
    regionFunction: RegionFunction | null = null,
    level: IntFunction | null = null,
    at: string | null = null,
    count: IntFunction | null = null,
    then: Then | null = null
  ) {
    super({ type, locationFn: locationFunction, regionFn: regionFunction, levelFn: level, when: at, countFn: count, then });
  }
}
