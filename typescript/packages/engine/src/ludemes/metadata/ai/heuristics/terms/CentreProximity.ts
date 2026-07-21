// @java Core/src/metadata/ai/heuristics/terms/CentreProximity.java

import type { HeuristicTransformation } from "../transformations/HeuristicTransformation.js";
import type { Pair } from "../../misc/Pair.js";
import { HeuristicTerm } from "./HeuristicTerm.js";

/**
 * Defines a heuristic term based on the proximity of pieces to the centre of
 * a game's board.
 *
 * @author Dennis Soemers
 */
export class CentreProximity extends HeuristicTerm {
  /** Array of names specified for piece types */
  private pieceWeightNames: string[];

  /**
   * Array of weights as specified in metadata. Will be used to initialise
   * a weight vector for a specific game when init() is called.
   */
  private _gameAgnosticWeightsArray: number[];

  // -------------------------------------------------------------------------

  /**
   * Constructor
   *
   * @param transformation An optional transformation to be applied to any
   * raw heuristic score outputs.
   * @param weight The weight for this term in a linear combination of multiple terms.
   * If not specified, a default weight of 1.0 is used.
   * @param pieceWeights Weights for different piece types. If no piece weights are
   * specified at all, all piece types are given an equal weight of 1.0.
   *
   * @example (centreProximity pieceWeights:{ (pair "Queen" 1.0) (pair "King" -1.0) })
   */
  constructor(
    transformation: HeuristicTransformation | null = null,
    weight: number | null = null,
    pieceWeights: Pair[] | null = null,
  ) {
    super(transformation, weight);

    if (pieceWeights == null) {
      this.pieceWeightNames = [""];
      this._gameAgnosticWeightsArray = [1.0];
    } else {
      this.pieceWeightNames = pieceWeights.map((p) => p.key());
      this._gameAgnosticWeightsArray = pieceWeights.map((p) => p.floatVal());
    }
  }

  override copy(): CentreProximity {
    const c = new CentreProximity(this.transformation, this.weight, null);
    c.pieceWeightNames = [...this.pieceWeightNames];
    c._gameAgnosticWeightsArray = [...this._gameAgnosticWeightsArray];
    return c;
  }

  // -------------------------------------------------------------------------

  override computeValue(_context: unknown, _player: number, _absWeightThreshold: number): number {
    return 0;
  }

  override computeStateFeatureVector(_context: unknown, _player: number): number[] {
    return [];
  }

  override paramsVector(): null {
    return null;
  }

  // -------------------------------------------------------------------------

  /** @return True if heuristic of this type could be applicable to given game */
  static isApplicableToGame(_game: unknown): boolean {
    return true;
  }

  override isApplicable(_game: unknown): boolean {
    return true;
  }

  // -------------------------------------------------------------------------

  override toString(): string {
    let s = "(centreProximity";
    if (this.transformation != null) s += ` transformation:${this.transformation.toString()}`;
    if (this.weight !== 1) s += ` weight:${this.weight}`;
    const hasNamedWeights =
      this.pieceWeightNames.length > 1 ||
      (this.pieceWeightNames.length === 1 && (this.pieceWeightNames[0] ?? "").length > 0);
    if (hasNamedWeights) {
      s += " pieceWeights:{\n";
      for (let i = 0; i < this.pieceWeightNames.length; i++) {
        s += `        (pair "${this.pieceWeightNames[i]!}" ${this._gameAgnosticWeightsArray[i]!})\n`;
      }
      s += "    }";
    }
    s += ")";
    return s;
  }

  override toStringThresholded(threshold: number): string | null {
    const hasNamedWeights =
      this.pieceWeightNames.length > 1 ||
      (this.pieceWeightNames.length === 1 && (this.pieceWeightNames[0] ?? "").length > 0);
    if (hasNamedWeights) {
      let pieceWeightsSb = "";
      let haveRelevant = false;
      for (let i = 0; i < this.pieceWeightNames.length; i++) {
        if (Math.abs(this.weight * this._gameAgnosticWeightsArray[i]!) >= threshold) {
          pieceWeightsSb += `        (pair "${this.pieceWeightNames[i]!}" ${this._gameAgnosticWeightsArray[i]!})\n`;
          haveRelevant = true;
        }
      }
      if (!haveRelevant) return null;
      let s = "(centreProximity";
      if (this.transformation != null) s += ` transformation:${this.transformation.toString()}`;
      if (this.weight !== 1) s += ` weight:${this.weight}`;
      s += " pieceWeights:{\n" + pieceWeightsSb + "    })";
      return s;
    } else {
      if (Math.abs(this.weight) < threshold) return null;
      return this.toString();
    }
  }

  // -------------------------------------------------------------------------

  override merge(term: HeuristicTerm): void {
    const castTerm = term as CentreProximity;
    for (let i = 0; i < this.pieceWeightNames.length; i++) {
      for (let j = 0; j < castTerm.pieceWeightNames.length; j++) {
        if (this.pieceWeightNames[i]! === castTerm.pieceWeightNames[j]!) {
          this._gameAgnosticWeightsArray[i]! +=
            castTerm._gameAgnosticWeightsArray[j]! * (castTerm.weight / this.weight);
        }
      }
    }
  }

  override simplify(): void {
    if (Math.abs(this.weight - 1) > 1e-6) {
      for (let i = 0; i < this._gameAgnosticWeightsArray.length; i++) {
        this._gameAgnosticWeightsArray[i]! *= this.weight;
      }
      this.setWeight(1);
    }
  }

  override maxAbsWeight(): number {
    let maxW = Math.abs(this.weight);
    for (const f of this._gameAgnosticWeightsArray) maxW = Math.max(maxW, Math.abs(f));
    return maxW;
  }

  // -------------------------------------------------------------------------

  override description(): string {
    return "Proximity of pieces to the centre of the board.";
  }

  override toEnglishString(_context: unknown, _playerIndex: number): string {
    const dir = this.weight > 0 ? "move towards" : "move away from";
    return `You should try to ${dir} the centre of the board (weight: ${this.weight})\n`;
  }

  override gameAgnosticWeightsArray(): number[] {
    return this._gameAgnosticWeightsArray;
  }
}
