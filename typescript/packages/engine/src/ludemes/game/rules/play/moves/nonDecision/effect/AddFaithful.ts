// @java Core/src/game/rules/play/moves/nonDecision/effect/Add.java

import type { IntFunction, RegionFunction } from "../../../../../../base.js";
import type { Piece1to1 } from "../../../../../util/moves/Piece1to1.js";
import type { To1to1 } from "../../../../../util/moves/To1to1.js";
import type { Then } from "./Then.js";
import { Add } from "./Add.js";
import { pieceComponent, toRegion } from "./EffectCtorAdapters.js";

export class AddFaithful extends Add {
  public constructor(
    what: Piece1to1 | null,
    to: To1to1,
    count: IntFunction | null,
    stack: boolean | null,
    then: Then | null
  ) {
    void count;
    void stack;
    void then;
    const region: RegionFunction = toRegion(to);
    const pieceFn = what === null ? null : { what: pieceComponent(what), owner: -1, ...(what.state() ? { state: what.state()! } : {}) };
    super(region, pieceFn);
  }
}
