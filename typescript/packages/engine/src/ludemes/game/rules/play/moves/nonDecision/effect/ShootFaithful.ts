// @java Core/src/game/rules/play/moves/nonDecision/effect/Shoot.java

import type { Then } from "./Then.js";
import type { From1to1 } from "../../../../../util/moves/From1to1.js";
import type { Piece1to1 } from "../../../../../util/moves/Piece1to1.js";
import type { To1to1 } from "../../../../../util/moves/To1to1.js";
import type { Between1to1 } from "../../../../../util/moves/Between1to1.js";
import { Shoot } from "./Shoot.js";
import { betweenCond, directionName, LAST_TO, pieceComponent, toCond } from "./EffectCtorAdapters.js";

export class ShootFaithful extends Shoot {
  public constructor(
    what: Piece1to1,
    from: From1to1 | null,
    dirn: string | null,
    between: Between1to1 | null,
    to: To1to1 | null,
    then: Then | null
  ) {
    super({
      startLocationFn: from?.locFn() ?? LAST_TO,
      dirnName: directionName(dirn),
      goRule: betweenCond(between, { eval: (ctx) => ctx.state.isEmptySite(ctx._evalBetween) }),
      toRule: toCond(to, { eval: (ctx) => ctx.state.isEmptySite(ctx._evalTo) }),
      pieceFn: pieceComponent(what),
      type: from?.siteType() ?? null,
      then,
    });
  }
}
