// @java Core/src/metadata/ai/heuristics/Heuristics.java

import type { HeuristicTerm } from "./terms/HeuristicTerm.js";

/**
 * Defines a collection of heuristics, which can be used by Alpha-Beta agent in
 * Ludii for their heuristics state evaluations.
 *
 * @author Dennis Soemers
 */
export class Heuristics {
  /** Our array of heuristic terms */
  protected readonly heuristicTerms: HeuristicTerm[];

  // -------------------------------------------------------------------------

  /**
   * For a single heuristic term.
   *
   * @param term A single heuristic term.
   *
   * @example (heuristics (score))
   */
  constructor(term: HeuristicTerm | null);

  /**
   * For a collection of multiple heuristic terms.
   *
   * @param terms A sequence of multiple heuristic terms.
   *
   * @example (heuristics { (material) (mobilitySimple weight:0.01) })
   */
  constructor(terms: HeuristicTerm[] | null);

  constructor(termOrTerms: HeuristicTerm | HeuristicTerm[] | null) {
    if (termOrTerms == null) {
      this.heuristicTerms = [];
    } else if (Array.isArray(termOrTerms)) {
      this.heuristicTerms = termOrTerms;
    } else {
      this.heuristicTerms = [termOrTerms];
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Copy constructor (written as static method so it's not picked up by grammar)
   * @param other
   * @return Copy of heuristics
   */
  static copy(other: Heuristics | null): Heuristics | null {
    if (other == null) return null;
    return new Heuristics(other.heuristicTerms.map((t) => t.copy()));
  }

  // -------------------------------------------------------------------------

  /**
   * Computes heuristic value estimate for the given state
   * from the perspective of the given player.
   *
   * @param context
   * @param player
   * @param absWeightThreshold We skip terms with an absolute weight below this value
   *   (negative for no skipping)
   * @return Heuristic value estimate
   */
  computeValue(context: unknown, player: number, absWeightThreshold: number): number {
    let value = 0;
    for (const term of this.heuristicTerms) {
      const weight = term.getWeight();
      const absWeight = Math.abs(weight);
      if (absWeight >= absWeightThreshold) {
        let termOutput = term.computeValue(context, player, absWeightThreshold / absWeight);
        const transformation = term.getTransformation();
        if (transformation != null) {
          termOutput = transformation.transform(context, termOutput);
        }
        value += weight * termOutput;
      }
    }
    return value;
  }

  /**
   * Initialises all terms for given game.
   * @param game
   */
  init(game: unknown): void {
    for (const term of this.heuristicTerms) {
      term.init(game);
    }
  }

  // -------------------------------------------------------------------------

  /** @return Our array of Heuristic Terms */
  getHeuristicTerms(): HeuristicTerm[] {
    return this.heuristicTerms;
  }

  // -------------------------------------------------------------------------

  toString(): string {
    let sb = "(heuristics {\n";
    for (const term of this.heuristicTerms) {
      sb += "    " + term.toString() + "\n";
    }
    sb += "})\n";
    return sb;
  }

  /**
   * @param thresholdWeight
   * @return A string representation of these heuristics, with any terms
   * for which the absolute weight does not exceed the given threshold removed.
   */
  toStringThresholded(thresholdWeight: number): string {
    let sb = "(heuristics {\n";
    for (const term of this.heuristicTerms) {
      const termStr = term.toStringThresholded(thresholdWeight);
      if (termStr != null) {
        sb += "    " + termStr + "\n";
      }
    }
    sb += "})\n";
    return sb;
  }

  equals(o: unknown): boolean {
    if (o == null) return false;
    return (o as { toString?: () => string }).toString?.() === this.toString();
  }

  hashCode(): number {
    let h = 0;
    const str = this.toString();
    for (let i = 0; i < str.length; i++) {
      h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    }
    return h;
  }
}
