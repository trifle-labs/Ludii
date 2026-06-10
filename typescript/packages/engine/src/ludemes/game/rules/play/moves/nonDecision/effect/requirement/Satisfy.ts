// @java game/rules/play/moves/nonDecision/effect/requirement/Satisfy.java
//
// Live faithful class for the (satisfy ...) move generator. The compile logic
// was relocated VERBATIM from the inline compiler1to1 `(satisfy)` handler into
// this registered class so the faithful per-ludeme class is the live engine (the
// registry lookup in compileMoves1to1 shadows the inline branch).
//
// Java parity: Satisfy runs a backtracking constraint-satisfaction search to
// generate all valid moves; in the 1:1 path it is a stub that returns an empty
// move list.

import type { Context } from "../../../../../../../../context.js";
import type { Move } from "../../../../../../../../move.js";
import type { MovesFunction } from "../../../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";

/**
 * (satisfy ...) — constraint-satisfaction puzzle move generator
 * (stub: returns empty move list).
 * @java game/rules/play/moves/nonDecision/effect/requirement/Satisfy.java
 */
export class Satisfy implements MovesFunction {
  public eval(_ctx: Context): Move[] { return []; }
}

// @java Satisfy.java — compile factory: (satisfy ...)
