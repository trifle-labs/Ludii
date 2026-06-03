// @java game/rules/play/moves/nonDecision/effect/state/forget/Forget.java
//
// Live faithful class for the (forget ...) move effect. The compile logic was
// relocated VERBATIM from the inline compiler1to1 `(forget)` handler into this
// registered class so the faithful per-ludeme class is the live engine (the
// registry lookup in compileMoves1to1 shadows the inline branch).
//
// Java parity: Forget removes a remembered value from state; in the 1:1 path
// it is a stub that returns an empty move list.

import type { Context } from "../../../../../../../../../context.js";
import type { Move } from "../../../../../../../../../move.js";
import type { MovesFunction } from "../../../../../../../../base.js";
import { registerMoves1to1, type Compile1to1Env } from "../../../../../../../../registry1to1.js";
import type { LudNode } from "@ludii/typescript-language";

/**
 * (forget ...) — forget a remembered value (stub: returns empty move list).
 * @java game/rules/play/moves/nonDecision/effect/state/forget/Forget.java
 */
export class Forget1to1 implements MovesFunction {
  public eval(_ctx: Context): Move[] { return []; }
}

// @java Forget.java — compile factory: (forget ...)
registerMoves1to1("forget", (_node: LudNode, _env: Compile1to1Env): MovesFunction => {
  return new Forget1to1();
});
