// @java Player/src/app/utils/TrialUtil.java

// ---------------------------------------------------------------------------
// Escape-hatch types for Context/Move shapes used here.
// The Java classes use other.context.Context / other.move.Move.
// ---------------------------------------------------------------------------

/**
 * Minimal move shape used by TrialUtil.
 * @java other.move.Move
 */
interface MoveShape {
  containsNextInstance(): boolean;
}

/**
 * Minimal trial shape used by TrialUtil.
 * @java other.trial.Trial
 */
interface TrialShape {
  numMoves(): number;
  numInitialPlacementMoves(): number;
  generateCompleteMovesList(): MoveShape[];
}

/**
 * Minimal context shape used by TrialUtil.
 * @java other.context.Context
 */
interface ContextShape {
  trial(): TrialShape;
  currentInstanceContext(): ContextShape;
  isAMatch(): boolean;
}

/**
 * Minimal Manager shape that exposes undone moves and a ref context.
 * @java manager.Manager
 */
interface ManagerShape {
  undoneMoves(): { [Symbol.iterator](): Iterator<MoveShape> };
  ref(): { context(): ContextShape };
}

// ---------------------------------------------------------------------------

/**
 * Functions to help with Trials.
 *
 * @java app.utils.TrialUtil
 * @author Matthew.Stephenson
 */
export class TrialUtil {

  // ---------------------------------------------------------------------------

  /**
   * Returns the index of the start of the current trial, within the complete
   * game trial (used for matches).
   *
   * @java TrialUtil.getInstanceStartIndex(Context)
   */
  public static getInstanceStartIndex(context: ContextShape): number {
    const numInitialPlacementMoves =
      context.currentInstanceContext().trial().numInitialPlacementMoves();
    const startIndex =
      context.trial().numMoves() -
      context.currentInstanceContext().trial().numMoves() +
      numInitialPlacementMoves;
    return startIndex;
  }

  // ---------------------------------------------------------------------------

  /**
   * Returns the index of the end of the current trial, within the complete
   * game trial (used for matches).
   *
   * @java TrialUtil.getInstanceEndIndex(Manager, Context)
   */
  public static getInstanceEndIndex(manager: ManagerShape, context: ContextShape): number {
    const allMoves: MoveShape[] = manager.ref().context().trial().generateCompleteMovesList();
    // Append undone moves (manager.undoneMoves() mirrors Java's list append)
    for (const m of manager.undoneMoves()) {
      allMoves.push(m);
    }

    if (context.isAMatch()) {
      let endOfInstance = context.trial().numMoves();
      while (endOfInstance < allMoves.length) {
        if (allMoves[endOfInstance]!.containsNextInstance()) break;
        endOfInstance++;
      }
      return endOfInstance;
    }

    return allMoves.length;
  }

  // ---------------------------------------------------------------------------
}
