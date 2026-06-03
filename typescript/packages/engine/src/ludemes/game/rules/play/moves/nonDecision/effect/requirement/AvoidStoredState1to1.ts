// @java game/rules/play/moves/nonDecision/effect/requirement/AvoidStoredState.java
//
// Live faithful class for the (avoidStoredState ...) move filter. The compile
// logic was relocated VERBATIM from the inline compiler1to1 `(avoidstoredstate)`
// handler into this registered class so the faithful per-ludeme class is the
// live engine (the registry lookup in compileMoves1to1 shadows the inline branch).
//
// Java parity: AvoidStoredState filters moves that would repeat a stored state;
// in the 1:1 path this is simplified — it just passes through the sub-moves
// unchanged (state repetition detection not modelled at parity level).

import type { Context } from "../../../../../../../../context.js";
import type { Move } from "../../../../../../../../move.js";
import type { MovesFunction } from "../../../../../../../base.js";
import { registerMoves1to1, type Compile1to1Env } from "../../../../../../../registry1to1.js";
import { parseArgs1to1, compileMoves1to1 } from "../../../../../../../../compiler1to1.js";
import { isList, type LudNode, type LudList } from "@ludii/typescript-language";

/**
 * (avoidStoredState <moves>) — filter moves that would repeat a stored state.
 * Simplified: delegate to the sub-moves function unchanged.
 * @java game/rules/play/moves/nonDecision/effect/requirement/AvoidStoredState.java
 */
export class AvoidStoredState1to1 implements MovesFunction {
  private readonly subMoves: MovesFunction;

  public constructor(subMoves: MovesFunction) {
    this.subMoves = subMoves;
  }

  public eval(ctx: Context): Move[] { return this.subMoves.eval(ctx); }
}

/** Fallback stub when no sub-moves can be compiled. */
const emptyMoves: MovesFunction = { eval(_ctx: Context): Move[] { return []; } };

// @java AvoidStoredState.java — compile factory: (avoidStoredState <moves> ...)
registerMoves1to1("avoidstoredstate", (node: LudNode, env: Compile1to1Env): MovesFunction => {
  const { positional } = parseArgs1to1((node as LudList).items);
  const subMovesNode = positional[0];
  if (subMovesNode && isList(subMovesNode)) {
    try {
      const subFn = compileMoves1to1(subMovesNode, env.equipment as Parameters<typeof compileMoves1to1>[1]);
      return new AvoidStoredState1to1(subFn);
    } catch { /* fall through */ }
  }
  return emptyMoves;
});
