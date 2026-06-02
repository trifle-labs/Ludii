/**
 * AllCombinations1to1.ts
 *
 * @java game/rules/play/moves/nonDecision/operators/logical/AllCombinations.java
 *
 * Generates all combinations (cross-product) between two lists of moves.
 * Each resulting move merges one move from listA with one from listB.
 *
 * Java eval (lines 56-82):
 *   final FastArrayList<Move> ev1 = listA.eval(context).moves();
 *   final FastArrayList<Move> ev2 = listB.eval(context).moves();
 *   for (final Move m1 : ev1) {
 *     for (final Move m2 : ev2) {
 *       final Move newMove = new Move(m1, m2);   // merge action lists
 *       if (then() != null) newMove.then().add(then().moves());
 *       moves.moves().add(newMove);
 *     }
 *   }
 *
 * TS approximation: for each (m1, m2) pair, produce a merged Move that
 * combines the action lists of both. The TS Move class supports merging
 * via concatenated actions arrays.
 *
 * NOTE: NOT registered — the inline compileMoves1to1Impl handles
 * "allCombinations" (via the "allcombinations" lowercased key).
 * This is a faithful coverage class.
 */

import type { Context } from "../../../../../../../../context.js";
import { Move } from "../../../../../../../../move.js";
import type { MovesFunction } from "../../../../../../../base.js";
import { Operator1to1 } from "../../operator/Operator1to1.js";

/**
 * @java game/rules/play/moves/nonDecision/operators/logical/AllCombinations.java
 *
 * Cross-product of two sub-move-lists.
 *
 * Java:
 *   public final class AllCombinations extends Operator
 *   private final Moves listA;
 *   private final Moves listB;
 */
export class AllCombinations1to1 extends Operator1to1 {
  /**
   * First sub-move-generator. @java AllCombinations.listA
   */
  private readonly listA: MovesFunction;

  /**
   * Second sub-move-generator. @java AllCombinations.listB
   */
  private readonly listB: MovesFunction;

  /**
   * @java game/rules/play/moves/nonDecision/operators/logical/AllCombinations.java — constructor(Moves, Moves, Then)
   * @param listA First move list.
   * @param listB Second move list.
   */
  public constructor(listA: MovesFunction, listB: MovesFunction) {
    super();
    this.listA = listA;
    this.listB = listB;
  }

  /**
   * @java game/rules/play/moves/nonDecision/operators/logical/AllCombinations.java — eval(Context)
   *
   * Java lines 56-82:
   *   ev1 = listA.eval(context).moves()
   *   ev2 = listB.eval(context).moves()
   *   for m1 in ev1: for m2 in ev2:
   *     newMove = new Move(m1, m2)   // merge action-lists
   *     moves.add(newMove)
   *
   * TS: produce combined moves by merging actions arrays of m1 and m2.
   * @java AllCombinations.java — new Move(m1, m2) merges the two action sequences.
   */
  public override eval(ctx: Context): Move[] {
    const ev1 = this.listA.eval(ctx);
    const ev2 = this.listB.eval(ctx);
    const result: Move[] = [];

    for (const m1 of ev1) {
      for (const m2 of ev2) {
        // @java new Move(m1, m2) — merges action lists of m1 and m2 into one compound move.
        // TS parity: combine actions, use m1's mover, merge site indices.
        const combined = new Move({
          id: `allcomb:${m1.id}+${m2.id}`,
          label: `AllCombinations(${m1.label},${m2.label})`,
          siteIndices: [...m1.siteIndices, ...m2.siteIndices],
          mover: m1.mover,
          placedOwner: m1.placedOwner,
          actions: [...m1.actions, ...m2.actions],
        });
        result.push(combined);
      }
    }

    return result;
  }
}
