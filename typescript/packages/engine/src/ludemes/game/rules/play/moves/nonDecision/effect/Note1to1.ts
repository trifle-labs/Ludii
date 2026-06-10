// @java game/rules/play/moves/nonDecision/effect/Note.java
//
// Live faithful class for the (note ...) move effect. The compile logic was
// relocated VERBATIM from the inline compiler1to1 `(note)` handler into this
// registered class so the faithful per-ludeme class is the live engine (the
// registry lookup in compileMoves1to1 shadows the inline branch).
//
// Java parity: Note generates ActionNote moves; in the 1:1 path it is a stub
// that returns an empty move list (ActionNote not modelled at parity level).

import type { Context } from "../../../../../../../context.js";
import type { Move } from "../../../../../../../move.js";
import type { MovesFunction } from "../../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";

/**
 * (note ...) — make a note to a player (stub: returns empty move list).
 * @java game/rules/play/moves/nonDecision/effect/Note.java
 */
export class Note1to1 implements MovesFunction {
  public eval(_ctx: Context): Move[] { return []; }
}

// @java Note.java — compile factory: (note ...)
