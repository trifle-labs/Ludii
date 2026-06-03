// @java game/rules/play/moves/nonDecision/effect/state/MoveAgain.java
//
// Live faithful class for (moveAgain). Logic relocated verbatim from the inline
// compiler1to1 handler; registered so the class is the live engine.

import type { Context } from "../../../../../../../../context.js";
import type { MovesFunction } from "../../../../../../../base.js";
import { Move } from "../../../../../../../../move.js";
import { ActionSetNextPlayer } from "../../../../../../../../action/action-set-next-player.js";
import { registerMoves1to1, type Compile1to1Env } from "../../../../../../../registry1to1.js";
import type { LudNode } from "@ludii/typescript-language";

/**
 * (moveAgain) — emits a sentinel move carrying the same-player continuation.
 * Only meaningful inside a (then …) consequence.
 * @java game/rules/play/moves/nonDecision/effect/state/MoveAgain.java
 */
export class MoveAgain1to1 implements MovesFunction {
  public eval(ctx: Context): Move[] {
    const mover = ctx.state.mover;
    return [new Move({
      id: "moveAgain", label: "MoveAgain", siteIndices: [0], mover, placedOwner: mover,
      actions: [new ActionSetNextPlayer(mover)], moveAgain: true,
    })];
  }
}

registerMoves1to1("moveagain", (_node: LudNode, _env: Compile1to1Env): MovesFunction => new MoveAgain1to1());
