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
    // Java: return context.state().propositions().contains(propositionInt);
    const state = context.state as unknown as {
      propositions?: () => { contains?: (v: number) => boolean; has?: (v: number) => boolean };
    };
    const props = typeof state.propositions === "function" ? state.propositions() : null;
    if (props === null || props === undefined) {
      return false;
    }
    if (typeof props.contains === "function") {
      return props.contains(this.propositionInt);
    }
    if (typeof props.has === "function") {
      return props.has(this.propositionInt);
    }
    return false;
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
