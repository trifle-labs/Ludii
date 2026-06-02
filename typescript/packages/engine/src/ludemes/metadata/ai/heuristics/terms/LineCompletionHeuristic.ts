// @java Core/src/metadata/ai/heuristics/terms/LineCompletionHeuristic.java

import type { HeuristicTransformation } from "../transformations/HeuristicTransformation.js";
import { HeuristicTerm } from "./HeuristicTerm.js";

/**
 * Defines a heuristic term based on the ability to complete lines.
 *
 * @author Dennis Soemers
 */
export class LineCompletionHeuristic extends HeuristicTerm {
  /** The target length for line completions. */
  private readonly targetLength: number | null;
  private readonly autoComputeTargetLength: boolean;

  /**
   * @param transformation An optional transformation to be applied to any
   * raw heuristic score outputs.
   * @param weight The weight for this term in a linear combination of multiple terms.
   * If not specified, a default weight of 1.0 is used.
   * @param targetLength The target length for line completions. If not specified,
   * will be auto-computed from game.
   *
   * @example (lineCompletionHeuristic targetLength:3)
   */
  constructor(
    transformation: HeuristicTransformation | null = null,
    weight: number | null = null,
    targetLength: number | null = null,
  ) {
    super(transformation, weight);
    this.targetLength = targetLength;
    this.autoComputeTargetLength = (targetLength == null);
  }

  override copy(): LineCompletionHeuristic {
    return new LineCompletionHeuristic(this.transformation, this.weight, this.targetLength);
  }

  override computeValue(_context: unknown, _player: number, _absWeightThreshold: number): number {
    return 0;
  }

  override computeStateFeatureVector(_context: unknown, _player: number): number[] {
    return [0];
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
    let s = "(lineCompletionHeuristic";
    if (this.transformation != null) s += ` transformation:${this.transformation.toString()}`;
    if (this.weight !== 1) s += ` weight:${this.weight}`;
    if (!this.autoComputeTargetLength && this.targetLength != null) {
      s += ` targetLength:${this.targetLength}`;
    }
    s += ")";
    return s;
  }

  override toStringThresholded(threshold: number): string | null {
    if (Math.abs(this.weight) < threshold) return null;
    return this.toString();
  }

  override description(): string {
    return "Ability to complete lines.";
  }

  override toEnglishString(_context: unknown, _playerIndex: number): string {
    const dir = this.weight > 0 ? "maximise" : "minimise";
    return `You should try to ${dir} your line completion potential (weight: ${this.weight})\n`;
  }
}
