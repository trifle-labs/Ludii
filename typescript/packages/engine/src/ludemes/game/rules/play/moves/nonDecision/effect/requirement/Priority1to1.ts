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
import { flattenMovesList, attachThen } from "../../../../../../../../compiler1to1.js";
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

  public constructor(
    list: readonly MovesFunction[] | MovesFunction,
    list2: MovesFunction | null = null,
  ) {
    this.list = Array.isArray(list) ? list : (list2 === null ? [list] : [list, list2]);
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
