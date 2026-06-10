/**
 * Append1to1.ts
 *
 * @java game/rules/play/moves/nonDecision/operators/logical/Append.java
 *
 * Appends a list of moves to each move in a list — combining all sub-moves
 * into one compound move (a Move composed of multiple sub-actions).
 *
 * Java eval (lines 53-77):
 *   final FastArrayList<Move> evaluated = list.eval(context).moves();
 *   for (final Move m : evaluated) m.setDecision(true);
 *   if (evaluated.size() == 0) return moves;   // empty → no output, then NOT applied
 *   final Move newMove = new Move(evaluated);  // merge all actions into ONE compound Move
 *   newMove.setMover(context.state().mover());
 *   moves.moves().add(newMove);
 *   if (then() != null) newMove.then().add(then().moves());
 *   return moves;
 *
 * Key semantic: (append <list> [(then <consequence>)]):
 *   1. Evaluates <list> only
 *   2. If <list> empty → return [] (then is NOT applied)
 *   3. Merges ALL result moves' actions into ONE compound Move
 *   4. Attaches then as a consequence
 *
 * The previous (wrong) TS approximation treated every positional as a parallel
 * sub-generator and unioned outputs, wrongly including `(then ...)` as a
 * standalone move generator. This produced 132 SetScore-only moves in MacBeth's
 * Playing phase instead of the correct custodial+consequence compound moves.
 */

import { Context } from "../../../../../../../../context.js";
import { Move } from "../../../../../../../../move.js";
import type { MovesFunction } from "../../../../../../../base.js";
import { Operator1to1 } from "../../operator/Operator1to1.js";
import { registerMoves1to1, type Compile1to1Env } from "../../../../../../../registry1to1.js";
import {
  parseArgs1to1,
  compileMoves1to1,
  headOf,
} from "../../../../../../../../compiler1to1.js";
import { isList, type LudList, type LudNode } from "@ludii/typescript-language";

/**
 * @java game/rules/play/moves/nonDecision/operators/logical/Append.java
 *
 * Faithful compound-move builder: merges all sub-moves from `list` into
 * a single compound Move, then attaches `then` as a consequence.
 *
 * Java:
 *   public final class Append extends Operator
 *   private final Moves list;
 */
export class Append1to1 extends Operator1to1 {
  /**
   * The sub-move generator whose moves are collected. @java Append.list
   */
  private readonly list: MovesFunction;

  /**
   * Optional then-consequence generator. @java Append extends Operator (super.then())
   */
  private readonly thenFn: MovesFunction | null;

  /**
   * @java game/rules/play/moves/nonDecision/operators/logical/Append.java — constructor(NonDecision, Then)
   * @param list The sub-moves to collect and merge.
   * @param thenFn Optional then-consequence generator.
   */
  public constructor(list: MovesFunction, thenFn: MovesFunction | null = null) {
    super();
    this.list = list;
    this.thenFn = thenFn;
  }

  /**
   * @java game/rules/play/moves/nonDecision/operators/logical/Append.java — eval(Context)
   *
   * Java lines 53-77:
   *   evaluated = list.eval(context).moves()
   *   for m in evaluated: m.setDecision(true)
   *   if empty → return empty (then NOT applied)
   *   newMove = new Move(evaluated)   // compound: merges all actions
   *   newMove.setMover(mover)
   *   if then != null: newMove.then().add(then.moves())
   *   return [newMove]
   */
  public override eval(ctx: Context): Move[] {
    // Step 1: evaluate the list sub-generator
    const evaluated = this.list.eval(ctx);
    // Step 2: if empty, return empty (then is NOT applied — Java parity)
    if (evaluated.length === 0) return [];
    // Step 3: merge all sub-moves' actions into one compound Move
    // @java new Move(evaluated) — concatenates all action lists
    const mover = ctx.state.mover;
    const first = evaluated[0]!;
    const mergedActions: Move["actions"][number][] = [];
    for (const sm of evaluated) {
      for (const a of sm.actions) mergedActions.push(a);
    }
    const mergedSiteIndices = evaluated.flatMap(sm => [...sm.siteIndices]);
    const compound = new Move({
      id: `append:${mover}:${first.id}`,
      label: `Append(${first.label})`,
      siteIndices: mergedSiteIndices.length > 0 ? mergedSiteIndices : [0],
      mover,
      placedOwner: first.placedOwner,
      actions: mergedActions,
      decisionIndex: first.decisionIndex,
      fromSite: first.fromSite,
      toSite: first.toSite,
    });
    // Step 4: apply then-consequence if present
    // @java newMove.then().add(then().moves())
    if (this.thenFn) {
      try {
        const postState = compound.applyTo(ctx.state, ctx.rng);
        const postTrial = ctx.trial.withMove(compound, false, -1);
        const postCtx = new Context(ctx.game, postState, postTrial, ctx.rng);
        (postCtx as unknown as { _evalFrom?: number })._evalFrom = compound.from();
        (postCtx as unknown as { _evalTo?: number })._evalTo = compound.to();
        const thenMoves = this.thenFn.eval(postCtx);
        const extraActions = thenMoves.flatMap(tm => [...tm.actions]);
        const moveAgain = thenMoves.some(tm => tm.moveAgain);
        if (extraActions.length > 0 || moveAgain) {
          return [compound.withConsequence(extraActions, moveAgain)];
        }
      } catch { /* fall through to returning compound without then */ }
    }
    return [compound];
  }
}

// @java Append.java — compile factory: parse (append <list> [(then <consequence>)]).
// Faithful Java semantics: list is the ONLY sub-generator; (then ...) is a consequence,
// not a parallel sub-generator. If the list produces 0 moves, return []. Otherwise
// merge all sub-move actions into ONE compound Move and attach then.
