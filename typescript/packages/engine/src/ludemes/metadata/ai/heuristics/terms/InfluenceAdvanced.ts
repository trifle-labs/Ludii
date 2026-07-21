// @java Core/src/metadata/ai/heuristics/terms/InfluenceAdvanced.java

import type { HeuristicTransformation } from "../transformations/HeuristicTransformation.js";
import { HeuristicTerm } from "./HeuristicTerm.js";

/**
 * Defines an advanced heuristic term based on influence (weighted by distance
 * from pieces).
 *
 * @author Dennis Soemers
 */
export class InfluenceAdvanced extends HeuristicTerm {
  /**
   * @param transformation An optional transformation to be applied to any
   * raw heuristic score outputs.
   * @param weight The weight for this term in a linear combination of multiple terms.
   * If not specified, a default weight of 1.0 is used.
   *
   * @example (influenceAdvanced weight:0.5)
   */
  constructor(
    transformation: HeuristicTransformation | null = null,
    weight: number | null = null,
  ) {
    super(transformation, weight);
  }

  override copy(): InfluenceAdvanced {
    return new InfluenceAdvanced(this.transformation, this.weight);
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
    let s = "(influenceAdvanced";
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
    return "Advanced influence measure weighted by distance from pieces.";
  }

  override toEnglishString(_context: unknown, _playerIndex: number): string {
    const dir = this.weight > 0 ? "maximise" : "minimise";
    return `You should try to ${dir} your advanced influence on the board (weight: ${this.weight})\n`;
  }
}
