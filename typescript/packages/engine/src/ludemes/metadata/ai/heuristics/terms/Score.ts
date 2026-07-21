// @java Core/src/metadata/ai/heuristics/terms/Score.java

import type { HeuristicTransformation } from "../transformations/HeuristicTransformation.js";
import { HeuristicTerm } from "./HeuristicTerm.js";

/**
 * Defines a heuristic term based on a Player's score in a game.
 *
 * @author Dennis Soemers
 */
export class Score extends HeuristicTerm {
  /**
   * Constructor
   *
   * @param transformation An optional transformation to be applied to any
   * raw heuristic score outputs.
   * @param weight The weight for this term in a linear combination of multiple terms.
   * If not specified, a default weight of 1.0 is used.
   *
   * @example (score)
   */
  constructor(
    transformation: HeuristicTransformation | null = null,
    weight: number | null = null,
  ) {
    super(transformation, weight);
  }

  override copy(): Score {
    return new Score(this.transformation, this.weight);
  }

  // -------------------------------------------------------------------------

  override computeValue(context: unknown, player: number, _absWeightThreshold: number): number {
    // Java: if (context.game().requiresScore()) return context.score(player);
    const ctx = context as { game?: () => { requiresScore?: () => boolean }; score?: (p: number) => number };
    if (ctx.game?.()?.requiresScore?.()) {
      return ctx.score?.(player) ?? 0;
    }
    return 0;
  }

  override computeStateFeatureVector(context: unknown, player: number): number[] {
    return [this.computeValue(context, player, -1)];
  }

  override paramsVector(): null {
    return null;
  }

  // -------------------------------------------------------------------------

  /** @return True if heuristic of this type could be applicable to given game */
  static isApplicableToGame(game: unknown): boolean {
    return (game as { requiresScore?: () => boolean })?.requiresScore?.() ?? false;
  }

  override isApplicable(game: unknown): boolean {
    return Score.isApplicableToGame(game);
  }

  // -------------------------------------------------------------------------

  override toString(): string {
    let s = "(score";
    if (this.transformation != null) s += ` transformation:${this.transformation.toString()}`;
    if (this.weight !== 1) s += ` weight:${this.weight}`;
    s += ")";
    return s;
  }

  override toStringThresholded(threshold: number): string | null {
    if (Math.abs(this.weight) >= threshold) {
      return this.toString();
    }
    return null;
  }

  // -------------------------------------------------------------------------

  override description(): string {
    return "Score variable of game state corresponding to player.";
  }

  override toEnglishString(_context: unknown, _playerIndex: number): string {
    const dir = this.weight > 0 ? "maximise" : "minimise";
    return `You should try to ${dir} your score (weight: ${this.weight})\n`;
  }
}
