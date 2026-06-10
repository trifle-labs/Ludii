// @java Core/src/game/rules/play/moves/nonDecision/effect/Shoot.java

import type { Then } from "./Then.js";
import type { From } from "../../../../../util/moves/From1to1.js";
import type { Piece1to1 } from "../../../../../util/moves/Piece1to1.js";
import type { To } from "../../../../../util/moves/To1to1.js";
import type { Between } from "../../../../../util/moves/Between1to1.js";
import { Shoot } from "./Shoot.js";
import { betweenCond, directionName, LAST_TO, pieceComponent, toCond } from "./EffectCtorAdapters.js";

export class ShootFaithful extends Shoot {
  // Java order: Shoot(what, @Opt from, @Opt dirn, @Opt between, @Opt to, @Opt then).
  // Defaults on the optional tail keep Function.length at 1, matching Java's
  // single required `what` argument for the ArgCompiler arity gate.
  public constructor(
    what: Piece1to1,
    from: From | null = null,
    dirn: string | null = null,
    between: Between | null = null,
    to: To | null = null,
    then: Then | null = null
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
