// @java Core/src/game/rules/play/moves/nonDecision/effect/Custodial.java

import type { ThenLike } from "../../Moves.js";
import type { Context } from "../../../../../../../context.js";
import type { IntFunction } from "../../../../../../base.js";
import type { From } from "../../../../../util/moves/From.js";
import type { To } from "../../../../../util/moves/To.js";
import type { Between } from "../../../../../util/moves/Between.js";
import { Custodial } from "./Custodial.js";
import { IsEnemy } from "../../../../../functions/booleans/is/player/IsEnemy.js";
import { IsFriend } from "../../../../../functions/booleans/is/player/IsFriend.js";
import { Who } from "../../../../../functions/ints/state/Who.js";
import type { JavaIntFunction } from "../../../../../functions/ints/IntFunction.js";
import { Remove } from "./Remove.js";
import { BETWEEN_ITER, betweenCond, betweenEffect, betweenRange, directionName, fromLoc, intConst, LAST_TO, normaliseFriendAtPlaceholder, toCond, TO_ITER } from "./EffectCtorAdapters.js";

export class CustodialFaithful extends Custodial {
  public constructor(
    from: From | null = null,
    dirnChoice: string | null = null,
    between: Between | null = null,
    to: To | null = null,
    then: ThenLike | null = null
  ) {
    const range = betweenRange(between);
    const startLocationFn = preferEvalToForLastTo(fromLoc(from, LAST_TO));
    super({
      startLocationFn,
      dirnChoice: directionName(dirnChoice),
      minimum: range?.minFn ?? intConst(0),
      limit: range?.maxFn ?? intConst(1000),
      targetRule: betweenCond(between, new IsEnemy(new Who(null, BETWEEN_ITER as unknown as JavaIntFunction), null)),
      friendRule: normaliseFriendAtPlaceholder(toCond(to, new IsFriend(new Who(null, TO_ITER as unknown as JavaIntFunction), null))),
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
