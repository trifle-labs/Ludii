// @java Core/src/game/functions/booleans/is/string/IsProposed.java

/**
 * Returns true if that proposition is proposed.
 *
 * @java game/functions/booleans/is/string/IsProposed.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import { BaseBooleanFunction } from "../../BaseBooleanFunction.js";

/** Java parity: Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/**
 * Returns true if that proposition is proposed.
 *
 * @java game/functions/booleans/is/string/IsProposed.java
 */
export class IsProposed extends BaseBooleanFunction {
  /** @java IsProposed.proposition */
  private readonly proposition: string;

  /** @java IsProposed.propositionInt — int representation of the proposition */
  private propositionInt: number;

  /**
   * @param proposition Proposition being proposed.
   * @java IsProposed(String)
   */
  public constructor(proposition: string) {
    super();
    this.proposition = proposition;
    this.propositionInt = UNDEFINED;
  }

  /**
   * @java IsProposed.eval(Context)
   *
   * Returns true if context.state().propositions().contains(propositionInt).
   */
  public override eval(context: Context): boolean {
    // @java IsProposed.eval — state.propositions().contains(propositionInt).
    // The TS state stores proposition STRINGS (ActionPropose.apply pushes the
    // text; no preprocess pass exists to pre-register ints), so compare text.
    const props = (context.state as unknown as { propositions?: readonly string[] }).propositions;
    return Array.isArray(props) && props.includes(this.proposition);
  }

  /** @java IsProposed.isStatic() */
  public override isStatic(): boolean {
    return false;
  }

  /** @java IsProposed.gameFlags(Game) */
  public override gameFlags(_game: unknown): number {
    // Java: return GameType.Vote;
    return 0;
  }

  /** @java IsProposed.concepts(Game) */
  public override concepts(_game: unknown): Set<number> {
    return new Set<number>();
  }

  /** @java IsProposed.writesEvalContextRecursive() */
  public override writesEvalContextRecursive(): Set<number> {
    return new Set<number>();
  }

  /** @java IsProposed.readsEvalContextRecursive() */
  public override readsEvalContextRecursive(): Set<number> {
    return new Set<number>();
  }

  /** @java IsProposed.preprocess(Game) */
  public override preprocess(game: unknown): void {
    // Java: propositionInt = game.registerVoteString(proposition);
    const g = game as unknown as { registerVoteString?: (s: string) => number };
    if (typeof g.registerVoteString === "function") {
      this.propositionInt = g.registerVoteString(this.proposition);
    }
  }

  /** @java IsProposed.toString() */
  public override toString(): string {
    return "IsProposed()";
  }

  /** @java IsProposed.toEnglish(Game) */
  public override toEnglish(_game: unknown): string {
    return "The proposed is " + this.proposition;
  }
}
