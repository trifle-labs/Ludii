/**
 * Or1to1.ts
 *
 * @java game/rules/play/moves/nonDecision/operators/logical/Or.java
 *
 * Union of sub-move lists (the player chooses one of the moves from the union).
 *
 * Java eval (lines 146-160):
 *   final Moves moves = new BaseMoves(super.then());
 *   for (int i = 0; i < list.length; ++i)
 *     moves.moves().addAll(list[i].eval(context).moves());
 *   if (then() != null)
 *     for (int j = 0; j < moves.moves().size(); j++)
 *       moves.moves().get(j).then().add(then().moves());
 *   return moves;
 *
 * Registered via registerMoves1to1("or", ...) — logic relocated VERBATIM
 * from the inline compileMoves1to1Impl handler (shadows the inline branch).
 */

import type { Context } from "../../../../../../../../context.js";
import type { Move } from "../../../../../../../../move.js";
import type { MovesFunction } from "../../../../../../../base.js";
import { Operator1to1 } from "../../operator/Operator1to1.js";
import { registerMoves1to1, type Compile1to1Env } from "../../../../../../../registry1to1.js";
import { parseArgs1to1, flattenMovesList, attachThen, headOf } from "../../../../../../../../compiler1to1.js";
import { type LudList, type LudNode, isList } from "@ludii/typescript-language";

/**
 * @java game/rules/play/moves/nonDecision/operators/logical/Or.java
 *
 * Union of sub-move-lists. eval() concatenates all sub-lists in order,
 * giving the player a choice among all resulting moves.
 *
 * Java:
 *   public final class Or extends Operator
 *   final Moves[] list;
 */
export class Or1to1 extends Operator1to1 {
  /**
   * Sub-move-generators. @java Or.list
   */
  private readonly list: readonly MovesFunction[];

  /**
   * @java game/rules/play/moves/nonDecision/operators/logical/Or.java — constructor(Moves[], Then)
   * @param list Array of sub-move-generators whose moves are unioned.
   */
  public constructor(list: readonly MovesFunction[]) {
    super();
    this.list = list;
  }

  /**
   * @java game/rules/play/moves/nonDecision/operators/logical/Or.java — eval(Context)
   *
   * Java lines 146-160:
   *   for (int i = 0; i < list.length; ++i)
   *     moves.moves().addAll(list[i].eval(context).moves());
   */
  public override eval(ctx: Context): Move[] {
    const result: Move[] = [];
    for (const sub of this.list) {
      const subMoves = sub.eval(ctx);
      for (const m of subMoves) result.push(m);
    }
    return result;
  }
}

// @java Or.java — compile factory: parse (or { ... }) / (or <moves1> <moves2>).
// Java Or.eval (lines 155-157) adds the then() consequence to every generated move:
//   if (then() != null) for (j) moves.get(j).then().add(then().moves());
// The (then ...) must NOT appear as a sub-move-generator — filter it out first,
// then wrap via attachThen so it fires as an after-consequence on every move.
// @java game/rules/play/moves/nonDecision/operators/logical/Or.java — eval(Context):155-157
registerMoves1to1("or", (node: LudNode, env: Compile1to1Env): MovesFunction => {
  const { positional } = parseArgs1to1((node as LudList).items);
  // Exclude (then ...) nodes — they are afterConsequences, not sub-generators.
  const nonThenPositional = positional.filter(
    (p): p is LudNode => !(isList(p as LudNode) && headOf(p as LudNode) === "then"),
  );
  const equip = env.equipment as Parameters<typeof flattenMovesList>[1];
  const subMoves = flattenMovesList(nonThenPositional, equip);
  return attachThen(new Or1to1(subMoves), positional, equip);
});
