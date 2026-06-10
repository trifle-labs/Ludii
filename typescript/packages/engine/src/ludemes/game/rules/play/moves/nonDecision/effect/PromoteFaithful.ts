// @java Core/src/game/rules/play/moves/nonDecision/effect/Promote.java

import type { IntFunction } from "../../../../../../base.js";
import type { Then } from "./Then.js";
import type { Piece } from "../../../../../util/moves/Piece.js";
import type { Player } from "../../../../../util/moves/Player.js";
import { Promote } from "./Promote.js";
import { TO_ITER } from "./EffectCtorAdapters.js";

export class PromoteFaithful extends Promote {
  public constructor(
    type: string | null,
    locationFn: IntFunction | null,
    what: Piece,
    who: Player | null,
    role: string | null,
    then: Then | null
  ) {
    const owner = who?.index() ?? roleToIntFunction(role);
    super(locationFn ?? TO_ITER, what.nameComponents() ?? (what.nameComponent() ? [what.nameComponent()!] : null), what.component(), what.components(), owner, type, then);
  }
}

function roleToIntFunction(role: string | null): IntFunction | null {
  if (role === null) return null;
  if (role === "Mover") return { eval: (ctx) => ctx.state.mover };
  if (role === "Next") return { eval: (ctx) => (ctx.state.mover === 1 ? 2 : 1) };
  const m = /^P(\d+)$/.exec(role);
  if (m) return { eval: () => Number(m[1]) };
  return null;
}
