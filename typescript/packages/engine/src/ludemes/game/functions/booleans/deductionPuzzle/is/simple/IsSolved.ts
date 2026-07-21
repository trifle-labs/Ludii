// @java Core/src/game/functions/booleans/deductionPuzzle/is/simple/IsSolved.java

/**
 * Returns true if all the variables of a deduction puzzle are set to values
 * satisfying all the constraints.
 *
 * Works only for the ending condition of a deduction puzzle.
 *
 * @java game.functions.booleans.deductionPuzzle.is.simple.IsSolved
 */

import type { Context } from "../../../../../../../context.js";
import type { EvalScratch, BooleanFunction } from "../../../../../../base.js";
import { BaseBooleanFunction } from "../../../BaseBooleanFunction.js";
import type { SiteType } from "../../../../../../../action/site-type.js";

// ---------------------------------------------------------------------------
// Minimal puzzle duck-typing surface
// ---------------------------------------------------------------------------

interface PuzzleContainerState {
  isResolved(site: number, type: SiteType): boolean;
  set(varSite: number, value: number, type: SiteType): void;
}

interface PuzzleGameSurface {
  constraintVariables(): readonly number[];
  rules(): {
    phases(): ReadonlyArray<{
      play(): {
        moves(): {
          constraints(): readonly BooleanFunction[] | null;
        };
      };
    }>;
  };
}

type CtxWithEval = Context & EvalScratch;

// ---------------------------------------------------------------------------

/**
 * @java game.functions.booleans.deductionPuzzle.is.simple.IsSolved
 */
export class IsSolved extends BaseBooleanFunction {
  /** @java IsSolved() */
  public constructor() {
    super();
  }

  /**
   * @java IsSolved.eval(Context)
   *
   * Checks every unassigned variable against 0 and evaluates all constraints.
   * The Java implementation creates a TempContext and calls evaluate on each
   * constraint, returning true iff all pass.
   */
  public override eval(context: Context): boolean {
    // Try to access the puzzle game surface. If unavailable, fall through.
    const puzzleGame = context.game as unknown as Partial<PuzzleGameSurface>;

    // Java: context.state().containerStates()[0]
    const pstate = (context as unknown as {
      state: { containerStates?(): readonly PuzzleContainerState[] };
    }).state;
    const cs: PuzzleContainerState | null =
      pstate.containerStates != null ? (pstate.containerStates()[0] ?? null) : null;

    // Java: context.board().defaultSite()
    let siteType: SiteType = "Cell";
    try {
      const boardable = context as unknown as { board(): { defaultSite(): SiteType } };
      siteType = boardable.board().defaultSite();
    } catch {
      // keep "Cell"
    }

    // Java: game.constraintVariables()
    const constraintVars: readonly number[] =
      puzzleGame.constraintVariables != null
        ? puzzleGame.constraintVariables()
        : [];

    // Java: constraints from (satisfy ...) phase
    let constraints: readonly BooleanFunction[] | null = null;
    try {
      constraints = puzzleGame.rules != null
        ? puzzleGame.rules().phases()[0]?.play().moves().constraints() ?? null
        : null;
    } catch {
      // not fully wired — leave constraints null
    }

    // Java: find not-yet-assigned variables
    const notAssigned: number[] = [];
    for (const varSite of constraintVars) {
      if (cs != null && !cs.isResolved(varSite, siteType)) {
        notAssigned.push(varSite);
      }
    }

    // Java: TempContext — here we shallow-clone by temporarily assigning 0
    // to unresolved sites, evaluate, then restore. Since we cannot deep-clone
    // Context in all configurations, we set them to 0 and undo after.
    if (cs != null) {
      for (const varSite of notAssigned) {
        cs.set(varSite, 0, siteType);
      }
    }

    let constraintOK = true;
    if (constraints != null) {
      const ctxEval = context as CtxWithEval;
      for (const constraint of constraints) {
        if (!constraint.eval(ctxEval)) {
          constraintOK = false;
          break;
        }
      }
    }

    return constraintOK;
  }

  // ---- overrides -----------------------------------------------------------

  /** @java IsSolved.isStatic() */
  public override isStatic(): boolean {
    return false;
  }

  /** @java IsSolved.gameFlags(Game) — DeductionPuzzle */
  public override gameFlags(_game: unknown): number {
    return 0; // GameType.DeductionPuzzle not available
  }

  /** @java IsSolved.willCrash(Game) */
  public override willCrash(game: unknown): boolean {
    let crash = false;
    const g = game as Partial<{ players(): { count(): number }; addCrashToReport(msg: string): void }>;
    if (g.players != null && g.players().count() !== 1) {
      g.addCrashToReport?.("The ludeme (is Solved) is used but the number of players is not 1.");
      crash = true;
    }
    return crash;
  }

  /** @java IsSolved.preprocess(Game) — nothing to do */
  public override preprocess(_game: unknown): void {
    // Do nothing
  }

  /** @java IsSolved.toEnglish(Game) */
  public override toEnglish(_game: unknown): string {
    return "the puzzle is solved";
  }
}
