// @java Core/src/metadata/ai/heuristics/terms/NullHeuristic.java

import { HeuristicTerm } from "./HeuristicTerm.js";

/**
 * A heuristic term that always returns 0.
 *
 * @author Dennis Soemers
 */
export class NullHeuristic extends HeuristicTerm {
  /**
   * @example (nullHeuristic)
   */
  constructor() {
    super(null, null);
  }

  override copy(): NullHeuristic {
    return new NullHeuristic();
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

  /** @return True if heuristic of this type could be applicable to given game */
  static isApplicableToGame(_game: unknown): boolean {
    return true;
  }

  override isApplicable(_game: unknown): boolean {
    return true;
  }

  override toString(): string {
    return "(nullHeuristic)";
  }

  override toStringThresholded(_threshold: number): string | null {
    return "(nullHeuristic)";
  }

  override description(): string {
    return "Always returns 0.";
  }

  override toEnglishString(_context: unknown, _playerIndex: number): string {
    return "This heuristic always returns 0.\n";
  }
}
