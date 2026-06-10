// @java game/rules/play/moves/nonDecision/effect/Pass.java
//
// Live faithful class for (pass) / (move Pass). Logic relocated verbatim from
// the inline compiler1to1 handler; registered so the class is the live engine.

import type { Context } from "../../../../../../../context.js";
import type { MovesFunction } from "../../../../../../base.js";
import { Move } from "../../../../../../../move.js";
import { ActionPass } from "../../../../../../../action/action-pass.js";
import type { LudNode } from "@ludii/typescript-language";

/**
 * (pass) — an explicit pass move.
 * @java game/rules/play/moves/nonDecision/effect/Pass.java
 */
export class Pass1to1 implements MovesFunction {
  public eval(ctx: Context): Move[] {
    const mover = ctx.state.mover;
    return [new Move({
      id: "pass",
      label: "Pass",
      siteIndices: [],
      mover,
      placedOwner: mover,
      actions: [new ActionPass()],
    })];
  }
}

