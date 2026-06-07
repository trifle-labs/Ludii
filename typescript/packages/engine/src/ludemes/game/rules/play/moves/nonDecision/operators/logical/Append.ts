// @java Core/src/game/rules/play/moves/nonDecision/operators/logical/Append.java

/**
 * Appends a list of moves to each move in a list — combining all sub-moves
 * into one compound move (a Move composed of multiple sub-actions).
 *
 * @java game/rules/play/moves/nonDecision/operators/logical/Append.java
 *
 * Java: public final class Append extends Operator
 *   - list: Moves — the sub-moves to collect
 *   - eval: collects all sub-moves into a single compound Move
 */

import type { Context } from "../../../../../../../../context.js";
import { Move } from "../../../../../../../../move.js";
import { NonDecision } from "../../NonDecision.js";
import type { ThenLike } from "../../../Moves.js";

/**
 * Appends sub-move-lists into a single compound move.
 *
 * @java game/rules/play/moves/nonDecision/operators/logical/Append.java
 */
export class Append extends NonDecision {
  /**
   * The list of moves to append. @java Append.list
   */
  private readonly list: NonDecision;

  // -------------------------------------------------------------------------

  /**
   * @java game/rules/play/moves/nonDecision/operators/logical/Append.java — constructor(NonDecision, Then)
   * @param list The moves to merge.
   * @param then The moves applied after that move is applied.
   */
  public constructor(
    list: NonDecision,
    then?: ThenLike | null,
  ) {
    super(then ?? null);
    this.list = list;
  }

  // -------------------------------------------------------------------------

  /**
   * @java game/rules/play/moves/nonDecision/operators/logical/Append.java — eval(Context)
   *
   * Java lines 52-77:
   *   final Moves moves = new BaseMoves(super.then());
   *   final FastArrayList<Move> evaluated = list.eval(context).moves();
   *   for (final Move m : evaluated) m.setDecision(true);
   *   if (evaluated.size() == 0) return moves;
   *   final Move newMove = new Move(evaluated);
   *   newMove.setMover(context.state().mover());
   *   moves.moves().add(newMove);
   *   if (then() != null) newMove.then().add(then().moves());
   *   // Store the Moves in the computed moves.
   *   for (int j = 0; j < moves.moves().size(); j++)
   *     moves.moves().get(j).setMovesLudeme(this);
   *   return moves;
   *
   * TS approximation: collect all sub-moves' actions into a single compound Move.
   * Java's new Move(FastArrayList<Move>) constructor concatenates all sub-moves
   * into one compound move — we replicate that by merging all actions.
   */
  public override eval(ctx: Context): Move[] {
    // @java Append: final FastArrayList<Move> evaluated = list.eval(context).moves();
    const evaluated = this.list.eval(ctx);

    // @java if (evaluated.size() == 0) return moves;
    if (evaluated.length === 0) return [];

    const mover = (ctx as { state?: { mover?: number } }).state?.mover ?? 0;

    // @java new Move(evaluated) — creates a compound move from the list
    // TS parity: merge all actions from all sub-moves into one compound Move,
    // using the first sub-move's from/to and the overall mover.
    const firstMove = evaluated[0]!;
    const allSiteIndices: number[] = [];
    const allActions: import("../../../../../../../../action/index.js").Action[] = [];
    for (const m of evaluated) {
      for (const s of m.siteIndices) allSiteIndices.push(s);
      for (const a of m.actions) allActions.push(a);
    }

    const newMove = new Move({
      id: `append:${mover}:${firstMove.id}`,
      label: `Append(${firstMove.label})`,
      siteIndices: allSiteIndices,
      mover,
      placedOwner: mover,
      actions: allActions,
    });

    return [newMove];
  }

  // -------------------------------------------------------------------------

  /**
   * @java Append.isStatic()
   */
  public override isStatic(): boolean {
    const superStatic = super.isStatic();
    const listStatic = this.list instanceof NonDecision
      ? (this.list as NonDecision).isStatic()
      : false;
    return superStatic && listStatic;
  }

  /**
   * @java Append.preprocess(Game)
   */
  public override preprocess(): void {
    super.preprocess();
    if (this.list instanceof NonDecision) (this.list as NonDecision).preprocess();
  }

  /**
   * @java Append.toEnglish(Game)
   */
  public toEnglish(): string {
    const text = this.list instanceof Append
      ? (this.list as Append).toEnglish()
      : "moves";
    const thenText = this.then() != null ? `, then ${this.then()!.toString()}` : "";
    return text + thenText;
  }
}
