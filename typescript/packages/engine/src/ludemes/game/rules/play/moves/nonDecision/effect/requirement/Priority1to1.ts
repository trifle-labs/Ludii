// @java game/rules/play/moves/nonDecision/effect/requirement/Priority.java
//
// Live faithful class for the (priority ...) move-filter ludeme. The compile
// logic was relocated VERBATIM from the inline compiler1to1 `(priority)` handler
// into this registered class so the faithful per-ludeme class is the live engine
// (the registry lookup in compileMoves1to1 shadows the inline branch).

import type { Context } from "../../../../../../../../context.js";
import type { MovesFunction } from "../../../../../../../base.js";
import type { Move } from "../../../../../../../../move.js";
import { registerMoves1to1, type Compile1to1Env } from "../../../../../../../registry1to1.js";
import { parseArgs1to1, flattenMovesList } from "../../../../../../../../compiler1to1.js";
import { type LudList, type LudNode } from "@ludii/typescript-language";

/**
 * (priority { <moves1> <moves2> ... }) — returns the first sub-list that
 * generates at least one move.
 * @java game/rules/play/moves/nonDecision/effect/requirement/Priority.java
 */
export class Priority1to1 implements MovesFunction {
  private readonly list: readonly MovesFunction[];

  public constructor(list: readonly MovesFunction[]) {
    this.list = list;
  }

  public eval(ctx: Context): Move[] {
    for (const sub of this.list) {
      const moves = sub.eval(ctx);
      if (moves.length > 0) return moves;
    }
    return [];
  }
}

// @java Priority.java — compile factory: parse (priority { ... }) / (priority <moves1> <moves2>).
// Logic relocated VERBATIM from the inline compileMoves1to1Impl "priority" handler.
registerMoves1to1("priority", (node: LudNode, env: Compile1to1Env): MovesFunction => {
  const { positional } = parseArgs1to1((node as LudList).items);
  const subMoves = flattenMovesList(positional, env.equipment as Parameters<typeof flattenMovesList>[1]);
  return new Priority1to1(subMoves);
});
