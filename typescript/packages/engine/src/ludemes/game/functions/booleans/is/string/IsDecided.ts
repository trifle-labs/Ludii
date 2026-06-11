// @java Core/src/game/functions/booleans/is/string/IsDecided.java

/**
 * Returns true if that decision was made.
 *
 * @java game/functions/booleans/is/string/IsDecided.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import { BaseBooleanFunction } from "../../BaseBooleanFunction.js";

/** Java parity: Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/**
 * Returns true if that decision was made.
 *
 * @java game/functions/booleans/is/string/IsDecided.java
 */
export class IsDecided extends BaseBooleanFunction {
  /** @java IsDecided.decision */
  private readonly decision: string;

  /** @java IsDecided.decisionInt — int representation of the decision */
  private decisionInt: number;

  /**
   * @param decision Decision to be decided.
   * @java IsDecided(String)
   */
  public constructor(decision: string) {
    super();
    this.decision = decision;
    this.decisionInt = UNDEFINED;
  }

  /**
   * @java IsDecided.eval(Context)
   *
   * Returns true if context.state().isDecided() == decisionInt.
   */
  public override eval(context: Context): boolean {
    // @java IsDecided.eval — context.state().isDecided() == decisionInt.
    // The compiler runs no preprocess pass, so register the vote string
    // LAZILY here (Game.registerVoteString returns a >= 0 index). Without
    // this the decisionInt stayed UNDEFINED(-1) and matched the default
    // isDecided()=-1, firing every mancala agree-to-end rule on move 1.
    if (this.decisionInt === UNDEFINED) {
      const g = context.game as unknown as { registerVoteString?: (s: string) => number };
      if (typeof g.registerVoteString === "function") {
        this.decisionInt = g.registerVoteString(this.decision);
      }
    }
    // @java State.isDecided defaults to Constants.UNDEFINED until a vote
    // resolves; an absent accessor means no decision has been made.
    const state = context.state as unknown as { isDecided?: () => number };
    const decided = typeof state.isDecided === "function" ? state.isDecided() : UNDEFINED;
    return decided === this.decisionInt;
  }

  /** @java IsDecided.isStatic() */
  public override isStatic(): boolean {
    return false;
  }

  /** @java IsDecided.gameFlags(Game) */
  public override gameFlags(_game: unknown): number {
    // Java: return GameType.Vote;
    // GameType.Vote is a BigInt in TS — return 0 as number for the base interface
    return 0;
  }

  /** @java IsDecided.concepts(Game) */
  public override concepts(_game: unknown): Set<number> {
    return new Set<number>();
  }

  /** @java IsDecided.writesEvalContextRecursive() */
  public override writesEvalContextRecursive(): Set<number> {
    return new Set<number>();
  }

  /** @java IsDecided.readsEvalContextRecursive() */
  public override readsEvalContextRecursive(): Set<number> {
    return new Set<number>();
  }

  /** @java IsDecided.preprocess(Game) */
  public override preprocess(game: unknown): void {
    // Java: decisionInt = game.registerVoteString(decision);
    const g = game as unknown as { registerVoteString?: (s: string) => number };
    if (typeof g.registerVoteString === "function") {
      this.decisionInt = g.registerVoteString(this.decision);
    }
  }

  /** @java IsDecided.toString() */
  public override toString(): string {
    return "IsDecided()";
  }

  /** @java IsDecided.toEnglish(Game) */
  public override toEnglish(_game: unknown): string {
    return this.decision + " has been made";
  }
}
