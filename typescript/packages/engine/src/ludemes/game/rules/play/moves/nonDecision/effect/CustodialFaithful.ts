// @java Core/src/game/rules/play/moves/nonDecision/effect/Custodial.java

import type { ThenLike } from "../../Moves.js";
import type { From1to1 } from "../../../../../util/moves/From1to1.js";
import type { To1to1 } from "../../../../../util/moves/To1to1.js";
import type { Between1to1 } from "../../../../../util/moves/Between1to1.js";
import { Custodial } from "./Custodial.js";
import { betweenCond, betweenEffect, betweenRange, directionName, fromLoc, intConst, LAST_TO, toCond } from "./EffectCtorAdapters.js";

export class CustodialFaithful extends Custodial {
  public constructor(
    from: From1to1 | null,
    dirnChoice: string | null,
    between: Between1to1 | null,
    to: To1to1 | null,
    then: ThenLike | null
  ) {
    const range = betweenRange(between);
    super({
      startLocationFn: fromLoc(from, LAST_TO),
      dirnChoice: directionName(dirnChoice),
      minimum: range?.minFn ?? intConst(0),
      limit: range?.maxFn ?? intConst(1000),
      targetRule: betweenCond(between),
      friendRule: toCond(to),
      targetEffect: betweenEffect(between) ?? { eval: () => [] },
      then,
    });
  }
}
