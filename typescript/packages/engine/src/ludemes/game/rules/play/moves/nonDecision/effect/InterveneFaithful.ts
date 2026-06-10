// @java Core/src/game/rules/play/moves/nonDecision/effect/Intervene.java

import type { ThenLike } from "../../Moves.js";
import type { From } from "../../../../../util/moves/From1to1.js";
import type { To } from "../../../../../util/moves/To1to1.js";
import type { Between } from "../../../../../util/moves/Between1to1.js";
import { Intervene } from "./Intervene.js";
import { betweenRange, directionName, fromLoc, intConst, LAST_TO, toApplyEffect, toCond } from "./EffectCtorAdapters.js";

export class InterveneFaithful extends Intervene {
  public constructor(
    from: From | null,
    dirnChoice: string | null,
    between: Between | null,
    to: To | null,
    then: ThenLike | null
  ) {
    const range = betweenRange(between);
    super({
      startLocationFn: fromLoc(from, LAST_TO),
      dirnChoice: directionName(dirnChoice),
      limit: range?.maxFn ?? intConst(1),
      min: range?.minFn ?? intConst(1),
      targetRule: toCond(to),
      targetEffect: toApplyEffect(to) ?? { eval: () => [] },
      then,
    });
  }
}
