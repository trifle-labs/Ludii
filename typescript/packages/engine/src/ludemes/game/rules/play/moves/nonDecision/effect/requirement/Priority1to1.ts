// @java game/rules/play/moves/nonDecision/effect/requirement/Priority.java
//
// Live faithful class for the (priority ...) move-filter ludeme. The compile
// logic was relocated VERBATIM from the inline compiler1to1 `(priority)` handler
// into this registered class so the faithful per-ludeme class is the live engine
// (the registry lookup in compileMoves1to1 shadows the inline branch).

import { isList } from "@ludii/typescript-language";
import type { Context } from "../../../../../../../../context.js";
import type { MovesFunction } from "../../../../../../../base.js";
import type { Move } from "../../../../../../../../move.js";
import { registerMoves1to1, type Compile1to1Env } from "../../../../../../../registry1to1.js";
import {
  parseArgs1to1,
  flattenMovesList,
  attachThen,
  headOf,
} from "../../../../../../../../compiler1to1.js";
import { type LudList, type LudNode } from "@ludii/typescript-language";

/**
 * (priority { <moves1> <moves2> ... }) — returns the first sub-list that
 * generates at least one move.
 * @java game/rules/play/moves/nonDecision/effect/requirement/Priority.java
 *
 * Java Priority extends Effect which holds a `then()` consequence. The
 * then-clause is appended to every move in the first non-empty list:
 *   if (then() != null) for (j) l.moves().get(j).then().add(then().moves());
 * The (then ...) child is therefore NOT a sub-move-generator and must be
 * separated from the sub-move list before flattenMovesList is called.
 * The then-consequence is handled via attachThen (same pattern as or/if).
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
// Excludes top-level (then ...) from the sub-move list (it is the Effect.then()
// consequence) and wraps the result via attachThen — mirrors Java Priority.eval().
registerMoves1to1("priority", (node: LudNode, env: Compile1to1Env): MovesFunction => {
  const { positional } = parseArgs1to1((node as LudList).items);
  // Separate (then ...) from sub-move generators — they are the Effect.then() clause.
  const nonThenPositional = positional.filter(p => !(isList(p) && headOf(p) === "then"));
  const subMoves = flattenMovesList(nonThenPositional, env.equipment as Parameters<typeof flattenMovesList>[1]);
  const base = new Priority1to1(subMoves);
  // Attach the (then ...) consequence, mirroring Java's Priority.eval() appending then-moves.
  return attachThen(base, positional, env.equipment as Parameters<typeof attachThen>[2]);
});
