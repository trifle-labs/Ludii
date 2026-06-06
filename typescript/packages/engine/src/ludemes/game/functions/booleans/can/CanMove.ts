// @java Core/src/game/functions/booleans/can/CanMove.java

import type { Context } from "../../../../../context.js";
import { BaseBooleanFunction } from "../BaseBooleanFunction.js";
import { Moves } from "../../../rules/play/moves/Moves.js";

/**
 * Checks if a list of moves is not empty.
 *
 * @java game/functions/booleans/can/CanMove.java
 * @author Eric.Piette
 */
export class CanMove extends BaseBooleanFunction {
  /** @java CanMove.moves */
  private readonly moves: Moves;

  /**
   * @param moves The list of moves.
   * @java CanMove(Moves)
   */
  public constructor(moves: Moves) {
    super();
    this.moves = moves;
  }

  /**
   * @java CanMove.eval(Context)
   *
   * Returns true if the moves list is not empty.
   * If the game requiresVisited, saves/restores the visited sites around the check.
   */
  public override eval(context: Context): boolean {
    // Java: if (context.game().requiresVisited()) { ... }
    const requiresVisited = (context.game as unknown as { requiresVisited?(): boolean }).requiresVisited;
    if (typeof requiresVisited === "function" && requiresVisited.call(context.game)) {
      const trialAny = context.trial as unknown as { lastMove?(): { fromNonDecision?(): number; toNonDecision?(): number } | undefined };
      const lastMove = trialAny.lastMove?.();
      const from = lastMove?.fromNonDecision?.() ?? -1;
      const to = lastMove?.toNonDecision?.() ?? -1;
      // Java: state.visit(from); state.visit(to);
      const stateAny = context.state as unknown as {
        visit?(site: number): void;
        unvisit?(site: number): void;
      };
      stateAny.visit?.(from);
      stateAny.visit?.(to);
      const canMove = this.moves.canMove(context);
      stateAny.unvisit?.(from);
      stateAny.unvisit?.(to);
      return canMove;
    }
    return this.moves.canMove(context);
  }

  /** @java CanMove.isStatic() */
  public override isStatic(): boolean {
    return this.moves.isStatic();
  }

  /** @java CanMove.gameFlags(Game) */
  public override gameFlags(_game: unknown): number {
    return this.moves.gameFlags();
  }

  /** @java CanMove.preprocess(Game) */
  public override preprocess(_game: unknown): void {
    this.moves.preprocess();
  }

  /** @java CanMove.missingRequirement(Game) */
  public override missingRequirement(game: unknown): boolean {
    return (this.moves as unknown as { missingRequirement?(g: unknown): boolean }).missingRequirement?.(game) ?? false;
  }

  /** @java CanMove.willCrash(Game) */
  public override willCrash(game: unknown): boolean {
    return (this.moves as unknown as { willCrash?(g: unknown): boolean }).willCrash?.(game) ?? false;
  }

  /** @java CanMove.toEnglish(Game) */
  public override toEnglish(game: unknown): string {
    const en = (this.moves as unknown as { toEnglish?(g: unknown): string }).toEnglish?.(game);
    if (en !== undefined) return `can move ${en}`;
    return "can move";
  }
}
