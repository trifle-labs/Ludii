// @java Core/src/game/rules/play/moves/nonDecision/operators/logical/AllCombinations.java

/**
 * Generates all combinations (i.e. the cross product) between two lists of moves.
 *
 * @java game/rules/play/moves/nonDecision/operators/logical/AllCombinations.java
 *
 * Java: public final class AllCombinations extends Operator
 *   - listA: Moves — first list to cross
 *   - listB: Moves — second list to cross
 *   - eval: for each (m1, m2) pair, create a combined Move merging action lists
 */

import type { Context } from "../../../../../../../../context.js";
import { Move } from "../../../../../../../../move.js";
import type { MovesFunction } from "../../../../../../../base.js";
import { NonDecision } from "../../NonDecision.js";
import type { ThenLike } from "../../../Moves.js";


/**
 * Cross-product move generator: for each move in listA and each move in listB,
 * produces a combined move merging the action sequences.
 *
 * @java game/rules/play/moves/nonDecision/operators/logical/AllCombinations.java
 */
export class AllCombinations extends NonDecision {
  /**
   * First sub-move-generator. @java AllCombinations.listA
   */
  private readonly listA: MovesFunction;

  /**
   * Second sub-move-generator. @java AllCombinations.listB
   */
  private readonly listB: MovesFunction;

  // -------------------------------------------------------------------------

  /**
   * @java game/rules/play/moves/nonDecision/operators/logical/AllCombinations.java — constructor(Moves, Moves, Then)
   * @param listA First move list.
   * @param listB Second move list.
   * @param then  The moves applied after that move is applied.
   */
  public constructor(
    listA: MovesFunction,
    listB: MovesFunction,
    then: ThenLike | null = null,
  ) {
    super(then);
    this.listA = listA;
    this.listB = listB;
  }

  // -------------------------------------------------------------------------

  /**
   * @java game/rules/play/moves/nonDecision/operators/logical/AllCombinations.java — eval(Context)
   *
   * Java lines 56-82:
   *   final FastArrayList<Move> ev1 = listA.eval(context).moves();
   *   final FastArrayList<Move> ev2 = listB.eval(context).moves();
   *   for (final Move m1 : ev1) {
   *     for (final Move m2 : ev2) {
   *       final Move newMove = new Move(m1, m2);   // merge action lists
   *       if (then() != null) newMove.then().add(then().moves());
   *       moves.moves().add(newMove);
   *     }
   *   }
   */
  public override eval(ctx: Context): Move[] {
    const ev1 = this.listA.eval(ctx);
    const ev2 = this.listB.eval(ctx);
    const result: Move[] = [];

    for (const m1 of ev1) {
      for (const m2 of ev2) {
        // @java new Move(m1, m2) — merges action lists of m1 and m2 into one compound move.
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

  // -------------------------------------------------------------------------

  /**
   * @java AllCombinations.gameFlags(Game)
   */
  public override gameFlags(): number {
    const aFlags = this.listA instanceof NonDecision ? (this.listA as NonDecision).gameFlags() : 0;
    const bFlags = this.listB instanceof NonDecision ? (this.listB as NonDecision).gameFlags() : 0;
    return aFlags | bFlags | super.gameFlags();
  }

  /**
   * @java AllCombinations.isStatic()
   */
  public override isStatic(): boolean {
    const aStatic = this.listA instanceof NonDecision
      ? (this.listA as NonDecision).isStatic()
      : false;
    const bStatic = this.listB instanceof NonDecision
      ? (this.listB as NonDecision).isStatic()
      : false;
    return aStatic && bStatic;
  }

  /**
   * @java AllCombinations.preprocess(Game)
   */
  public override preprocess(): void {
    super.preprocess();
    if (this.listA instanceof NonDecision) (this.listA as NonDecision).preprocess();
    if (this.listB instanceof NonDecision) (this.listB as NonDecision).preprocess();
  }

  /**
   * @java AllCombinations.toEnglish(Game)
   */
  public toEnglish(): string {
    const aStr = this.listA instanceof AllCombinations
      ? (this.listA as AllCombinations).toEnglish()
      : "moves";
    const bStr = this.listB instanceof AllCombinations
      ? (this.listB as AllCombinations).toEnglish()
      : "moves";
    return `${aStr}, then ${bStr}`;
  }
}
