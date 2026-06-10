// @java game/rules/play/moves/nonDecision/effect/Claim.java
//
// Live faithful class for the (claim ...) placement move. The compile logic was
// relocated VERBATIM from the inline compiler1to1 `(claim)` handler into this
// registered class so the faithful per-ludeme class is the live engine (the
// registry lookup in compileMoves1to1 shadows the inline branch).
//
// Java parity: Claim places a piece with ownership at the target sites.
// In the 1:1 path it is simplified as (move Add (to ...)).

import type { Context } from "../../../../../../../context.js";
import type { Move } from "../../../../../../../move.js";
import type { MovesFunction, RegionFunction } from "../../../../../../base.js";
import { isList, type LudNode, type LudList } from "@ludii/typescript-language";
import { Add } from "./Add.js";
import type { Then } from "./Then.js";
import type { Piece1to1 } from "../../../../../util/moves/Piece1to1.js";
import { To } from "../../../../../util/moves/To1to1.js";
import { pieceComponent, toRegion } from "./EffectCtorAdapters.js";

/**
 * (claim (to <region>) ...) — place a piece with ownership (simplified as Add).
 * @java game/rules/play/moves/nonDecision/effect/Claim.java
 */
export class Claim implements MovesFunction {
  private readonly inner: MovesFunction;

  public constructor(
    what: Piece1to1 | null,
    to: To,
    then: Then | null = null,
  ) {
    void then;
    const component = what?.components()?.[0] ?? pieceComponent(what);
    this.inner = new Add(
      toRegion(to),
      what === null ? null : { what: component, owner: -1, ...(what.state() ? { state: what.state()! } : {}) },
    );
  }

  public eval(ctx: Context): Move[] { return this.inner.eval(ctx); }
}

/** Fallback stub when no region can be compiled. */
const emptyMoves: MovesFunction = { eval(_ctx: Context): Move[] { return []; } };

// @java Claim.java — compile factory: (claim (to <region> ...) ...)
