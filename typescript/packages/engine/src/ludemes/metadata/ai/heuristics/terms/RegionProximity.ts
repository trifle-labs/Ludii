// @java Core/src/metadata/ai/heuristics/terms/RegionProximity.java

import type { HeuristicTransformation } from "../transformations/HeuristicTransformation.js";
import type { Pair } from "../../misc/Pair.js";
import { HeuristicTerm } from "./HeuristicTerm.js";

/**
 * Defines a heuristic term based on the proximity of pieces to a specific
 * named region.
 *
 * @author Dennis Soemers
 */
export class RegionProximity extends HeuristicTerm {
  private pieceWeightNames: string[];
  private _gameAgnosticWeightsArray: number[];

  /** Index of the region to which we wish to compute proximity. */
  private readonly regionIndex: number;

  /**
   * @param transformation An optional transformation to be applied to any
   * raw heuristic score outputs.
   * @param weight The weight for this term in a linear combination of multiple terms.
   * If not specified, a default weight of 1.0 is used.
   * @param region Index of the region to which we wish to compute proximity.
   * @param pieceWeights Weights for different piece types.
   *
   * @example (regionProximity weight:-1.0 region:0)
   */
  constructor(
    transformation: HeuristicTransformation | null = null,
    weight: number | null = null,
    region: number = 0,
    pieceWeights: Pair[] | null = null,
  ) {
    super(transformation, weight);
    this.regionIndex = region;
    if (pieceWeights == null) {
      this.pieceWeightNames = [""];
      this._gameAgnosticWeightsArray = [1.0];
    } else {
      this.pieceWeightNames = pieceWeights.map((p) => p.key());
      this._gameAgnosticWeightsArray = pieceWeights.map((p) => p.floatVal());
    }
  }

  override copy(): RegionProximity {
    const c = new RegionProximity(this.transformation, this.weight, this.regionIndex, null);
    c.pieceWeightNames = [...this.pieceWeightNames];
    c._gameAgnosticWeightsArray = [...this._gameAgnosticWeightsArray];
    return c;
  }

  /** @return The region index */
  region(): number {
    return this.regionIndex;
  }

  override computeValue(_context: unknown, _player: number, _absWeightThreshold: number): number {
    return 0;
  }

  override computeStateFeatureVector(_context: unknown, _player: number): number[] {
    return [];
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
    let s = "(regionProximity";
    if (this.transformation != null) s += ` transformation:${this.transformation.toString()}`;
    if (this.weight !== 1) s += ` weight:${this.weight}`;
    s += ` region:${this.regionIndex}`;
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
    if (Math.abs(this.weight) < threshold) return null;
    return this.toString();
  }

  override canBeMerged(term: HeuristicTerm): boolean {
    if (!(term instanceof RegionProximity)) return false;
    return this.regionIndex === (term as RegionProximity).regionIndex;
  }

  override merge(term: HeuristicTerm): void {
    const castTerm = term as RegionProximity;
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

  override description(): string {
    return "Proximity of pieces to a specific region.";
  }

  override toEnglishString(_context: unknown, _playerIndex: number): string {
    const dir = this.weight > 0 ? "move towards" : "move away from";
    return `You should try to ${dir} region ${this.regionIndex} (weight: ${this.weight})\n`;
  }

  override gameAgnosticWeightsArray(): number[] {
    return this._gameAgnosticWeightsArray;
  }
}
