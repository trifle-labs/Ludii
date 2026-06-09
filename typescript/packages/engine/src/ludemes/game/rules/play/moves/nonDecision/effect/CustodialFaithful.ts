// @java Core/src/game/rules/play/moves/nonDecision/effect/Custodial.java

import type { ThenLike } from "../../Moves.js";
import type { Context } from "../../../../../../../context.js";
import type { IntFunction } from "../../../../../../base.js";
import type { From1to1 } from "../../../../../util/moves/From1to1.js";
import type { To1to1 } from "../../../../../util/moves/To1to1.js";
import type { Between1to1 } from "../../../../../util/moves/Between1to1.js";
import { Custodial } from "./Custodial.js";
import { IsEnemy1to1 } from "../../../../../functions/booleans/is/player1to1/IsEnemy1to1.js";
import { IsFriend1to1 } from "../../../../../functions/booleans/is/player1to1/IsFriend1to1.js";
import { Who1to1 } from "../../../../../functions/ints1to1/board/Board1to1.js";
import { Remove } from "./Remove.js";
import { BETWEEN_ITER, betweenCond, betweenEffect, betweenRange, directionName, fromLoc, intConst, LAST_TO, normaliseFriendAtPlaceholder, toCond, TO_ITER } from "./EffectCtorAdapters.js";

export class CustodialFaithful extends Custodial {
  public constructor(
    from: From1to1 | null = null,
    dirnChoice: string | null = null,
    between: Between1to1 | null = null,
    to: To1to1 | null = null,
    then: ThenLike | null = null
  ) {
    const range = betweenRange(between);
    const startLocationFn = preferEvalToForLastTo(fromLoc(from, LAST_TO));
    super({
      startLocationFn,
      dirnChoice: directionName(dirnChoice),
      minimum: range?.minFn ?? intConst(0),
      limit: range?.maxFn ?? intConst(1000),
      targetRule: betweenCond(between, new IsEnemy1to1(new Who1to1(BETWEEN_ITER), null)),
      friendRule: normaliseFriendAtPlaceholder(toCond(to, new IsFriend1to1(new Who1to1(TO_ITER), null))),
      targetEffect: betweenEffect(between) ?? new Remove({ locationFn: BETWEEN_ITER }),
      then,
    });
  }
}

function preferEvalToForLastTo(locationFn: IntFunction): IntFunction {
  if (locationFn !== LAST_TO && locationFn.constructor?.name !== "LastTo") return locationFn;
  return {
    eval(ctx: Context): number {
      return ctx._evalTo >= 0 ? ctx._evalTo : LAST_TO.eval(ctx);
    },
  };
}
