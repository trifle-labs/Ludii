// @java game/rules/play/moves/nonDecision/effect/state/AddScore.java
//
// Live faithful class for the (addScore ...) move effect. The compile logic was
// relocated VERBATIM from the inline compiler1to1 `(addscore)` handler into this
// registered class so the faithful per-ludeme class is the live engine (the
// registry lookup in compileMoves1to1 shadows the inline branch).
//
// Java parity: AddScore modifies a player's score; in the 1:1 path it is a stub
// that returns an empty move list.

import type { Context } from "../../../../../../../../context.js";
import type { Move } from "../../../../../../../../move.js";
import type { MovesFunction } from "../../../../../../../base.js";
import { registerMoves1to1, type Compile1to1Env } from "../../../../../../../registry1to1.js";
import type { LudNode } from "@ludii/typescript-language";

/**
 * (addScore ...) — add score as a move (stub: returns empty move list).
 * @java game/rules/play/moves/nonDecision/effect/state/AddScore.java
 */
export class AddScore1to1 implements MovesFunction {
  public eval(_ctx: Context): Move[] { return []; }
}

// @java AddScore.java — compile factory: (addScore ...)
registerMoves1to1("addscore", (_node: LudNode, _env: Compile1to1Env): MovesFunction => {
  return new AddScore1to1();
});
