// @java Core/src/other/move/MoveUtilities.java MoveUtilities
/**
 * Helper functions for dealing with the complexity of moves.
 *
 * Faithful 1:1 transliteration of other.move.MoveUtilities.
 *
 * @author mrraow and Dennis Soemers  (Java original)
 */

import { LudiiMove } from "./LudiiMove.js";

// Minimal opaque types for the live-engine types we don't need here.
export type MinimalContext  = unknown;
export type MinimalMoves    = { eval(ctx: MinimalContext): { moves(): LudiiMove[] }; then(): MinimalMoves | null };
export type MinimalMovesRef = MinimalMoves | null;

/**
 * Utility class — do not construct.
 * @java other.move.MoveUtilities
 */
export class MoveUtilities {
  /** Utility class — private constructor. */
  private constructor() { /* no-op */ }

  // -------------------------------------------------------------------------

  /**
   * Chain a series of rules into a single call, adding results to ourActions.
   * Safe to call even if nextRule or currentAction is null/undefined.
   * Result is cross-product of currentAction and generated list from nextRule,
   * but we add currentAction alone if the generated list is empty.
   *
   * @java MoveUtilities#chainRuleCrossProduct
   */
  static chainRuleCrossProduct(
    context:       MinimalContext,
    ourActions:    { moves(): LudiiMove[] },
    nextRule:      MinimalMovesRef,
    currentAction: LudiiMove | null,
    _prepend:      boolean,
  ): void {
    // 0. Sanity check / cleaner code
    if (nextRule === null) {
      if (currentAction !== null) ourActions.moves().push(currentAction);
      return;
    }

    // 1. Get the list
    const generated = (nextRule as MinimalMoves).eval(context);

    // 2. Generate the cross product
    if (currentAction === null) {
      ourActions.moves().push(...generated.moves());
    } else {
      // generated.moves() should be empty if currentAction is non-null
      ourActions.moves().push(currentAction);
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Chain a rule with a single action, returning a compound move.
   *
   * @java MoveUtilities#chainRuleWithAction
   */
  static chainRuleWithAction(
    context:       MinimalContext,
    nextRule:      MinimalMovesRef,
    currentAction: LudiiMove | null,
    prepend:       boolean,
    decision:      boolean,
  ): LudiiMove | null {
    // 0. Sanity check
    if (nextRule === null) return currentAction;

    // 1. Get the list
    const generated = (nextRule as MinimalMoves).eval(context);

    if (generated.moves().length === 0) return currentAction;

    if (generated.moves().length > 1) {
      if (!decision) {
        for (const m of generated.moves()) {
          m.setDecision(false);
        }
      }

      if (prepend) {
        // prepend generated to currentAction
        if (currentAction !== null) {
          const all = [...generated.moves().map(m => m.actions()).flat(), ...currentAction.actions()];
          return new LudiiMove(all);
        }
        const all = generated.moves().map(m => m.actions()).flat();
        return new LudiiMove(all);
      } else {
        if (currentAction !== null) {
          const all = [...currentAction.actions(), ...generated.moves().map(m => m.actions()).flat()];
          return new LudiiMove(all);
        }
        const all = generated.moves().map(m => m.actions()).flat();
        return new LudiiMove(all);
      }
    }

    const m = generated.moves()[0]!;
    if (!decision) m.setDecision(false);

    if (currentAction === null) return m;

    if (prepend) {
      const all = [...m.actions(), ...currentAction.actions()];
      return new LudiiMove(all);
    } else {
      const all = [...currentAction.actions(), ...m.actions()];
      return new LudiiMove(all);
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Sets relevant data from the generating Moves ludeme for each generated move.
   *
   * @java MoveUtilities#setGeneratedMovesData(FastArrayList, Moves)
   */
  static setGeneratedMovesData(
    moves: LudiiMove[],
    generatingLudeme: MinimalMoves,
  ): void {
    const cons = generatingLudeme.then();
    if (cons !== null) {
      for (const m of moves) {
        m.then().push(cons);
        m.setMovesLudeme(generatingLudeme);
      }
    } else {
      for (const m of moves) {
        m.setMovesLudeme(generatingLudeme);
      }
    }
  }

  /**
   * Sets relevant data and also overrides mover.
   *
   * @java MoveUtilities#setGeneratedMovesData(FastArrayList, Moves, int)
   */
  static setGeneratedMovesDataWithMover(
    moves: LudiiMove[],
    generatingLudeme: MinimalMoves,
    mover: number,
  ): void {
    const cons = generatingLudeme.then();
    if (cons !== null) {
      for (const m of moves) {
        m.then().push(cons);
        m.setMovesLudeme(generatingLudeme);
        m.setMover(mover);
      }
    } else {
      for (const m of moves) {
        m.setMovesLudeme(generatingLudeme);
        m.setMover(mover);
      }
    }
  }
}
