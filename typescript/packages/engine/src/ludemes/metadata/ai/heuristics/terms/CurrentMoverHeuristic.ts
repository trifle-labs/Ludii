// @java Core/src/metadata/ai/heuristics/terms/CurrentMoverHeuristic.java

import type { HeuristicTransformation } from "../transformations/HeuristicTransformation.js";
import { HeuristicTerm } from "./HeuristicTerm.js";

/**
 * Defines a heuristic term that returns 1 if the player is the current mover,
 * and 0 otherwise.
 *
 * @author Dennis Soemers
 */
export class CurrentMoverHeuristic extends HeuristicTerm {
  /**
   * @param transformation An optional transformation to be applied to any
   * raw heuristic score outputs.
   * @param weight The weight for this term in a linear combination of multiple terms.
   * If not specified, a default weight of 1.0 is used.
   *
   * @example (currentMoverHeuristic weight:1.0)
   */
  constructor(
    transformation: HeuristicTransformation | null = null,
    weight: number | null = null,
  ) {
    super(transformation, weight);
  }

  override copy(): CurrentMoverHeuristic {
    return new CurrentMoverHeuristic(this.transformation, this.weight);
  }

  override computeValue(context: unknown, player: number, _absWeightThreshold: number): number {
    // Java: return (context.state().mover() == player) ? 1.f : 0.f
    const ctx = context as { state?: () => { mover?: () => number } };
    return ctx.state?.()?.mover?.() === player ? 1 : 0;
  }

  override computeStateFeatureVector(context: unknown, player: number): number[] {
    return [this.computeValue(context, player, -1)];
  }

  override paramsVector(): null {
    return null;
  }

  static isApplicableToGame(_game: unknown): boolean {
    return true;
  }

  override isApplicable(_game: unknown): boolean {
    return true;
  }

  override toString(): string {
    let s = "(currentMoverHeuristic";
    if (this.transformation != null) s += ` transformation:${this.transformation.toString()}`;
    if (this.weight !== 1) s += ` weight:${this.weight}`;
    s += ")";
    return s;
  }

  override toStringThresholded(threshold: number): string | null {
    if (Math.abs(this.weight) < threshold) return null;
    return this.toString();
  }

  override description(): string {
    return "Returns 1 if the player is the current mover, 0 otherwise.";
  }

  override toEnglishString(_context: unknown, _playerIndex: number): string {
    return `Bonus for being the current mover (weight: ${this.weight})\n`;
  }
}
