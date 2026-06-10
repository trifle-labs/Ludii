// @java game/rules/play/moves/nonDecision/effect/Pass.java
//
// Live faithful class for (pass) / (move Pass). Logic relocated verbatim from
// the inline compiler1to1 handler; registered so the class is the live engine.

import type { Context } from "../../../../../../../context.js";
import type { MovesFunction } from "../../../../../../base.js";
import { Move } from "../../../../../../../move.js";
import { ActionPass } from "../../../../../../../action/action-pass.js";
import { applyPostStateThen } from "./Then.js";

/**
 * (pass) — an explicit pass move.
 * @java game/rules/play/moves/nonDecision/effect/Pass.java
 */
export class Pass implements MovesFunction {
  /** @java Pass(Then then) — super(then); the consequence rides every pass. */
  private readonly thenClause: unknown;

  public constructor(then: unknown = null) {
    this.thenClause = then ?? null;
  }

  public eval(ctx: Context): Move[] {
    const mover = ctx.state.mover;
    const move = new Move({
      id: "pass",
      label: "Pass",
      siteIndices: [],
      mover,
      placedOwner: mover,
      actions: [new ActionPass()],
    });
    // @java Pass.eval — `if (then() != null) move.then().add(then().moves())`;
    // Ashtapada: (move Pass (then (if (= (count Pips) 3) (moveAgain)))) grants
    // the re-throw even when the player cannot move.
    if (this.thenClause != null) {
      return [applyPostStateThen(this.thenClause, ctx, move)];
    }
    return [move];
  }
}
