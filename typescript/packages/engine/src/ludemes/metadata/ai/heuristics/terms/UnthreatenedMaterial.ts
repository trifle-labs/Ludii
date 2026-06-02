// @java Core/src/metadata/ai/heuristics/terms/UnthreatenedMaterial.java

import type { HeuristicTransformation } from "../transformations/HeuristicTransformation.js";
import type { Pair } from "../../misc/Pair.js";
import { HeuristicTerm } from "./HeuristicTerm.js";

/**
 * Defines a heuristic term based on the material that a player has on the
 * board and in their hand that is NOT threatened by the opponent.
 *
 * @author Dennis Soemers
 */
export class UnthreatenedMaterial extends HeuristicTerm {
  private pieceWeightNames: string[];
  private _gameAgnosticWeightsArray: number[];

  /**
   * @param transformation An optional transformation to be applied to any
   * raw heuristic score outputs.
   * @param weight The weight for this term in a linear combination of multiple terms.
   * If not specified, a default weight of 1.0 is used.
   * @param pieceWeights Weights for different piece types.
   *
   * @example (unthreatenedMaterial pieceWeights:{ (pair "Pawn" 1.0) (pair "Bishop" 3.0) })
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

  override copy(): UnthreatenedMaterial {
    const c = new UnthreatenedMaterial(this.transformation, this.weight, null);
    c.pieceWeightNames = [...this.pieceWeightNames];
    c._gameAgnosticWeightsArray = [...this._gameAgnosticWeightsArray];
    return c;
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

  static isApplicableToGame(game: unknown): boolean {
    const g = game as { equipment?: () => { components?: () => unknown[] } };
    const comps = g.equipment?.()?.components?.() ?? [];
    return comps.length > 1;
  }

  override isApplicable(game: unknown): boolean {
    return UnthreatenedMaterial.isApplicableToGame(game);
  }

  override toString(): string {
    let s = "(unthreatenedMaterial";
    if (this.transformation != null) s += ` transformation:${this.transformation.toString()}`;
    if (this.weight !== 1) s += ` weight:${this.weight}`;
    const hasNamedWeights =
      this.pieceWeightNames.length > 1 ||
      (this.pieceWeightNames.length === 1 && (this.pieceWeightNames[0] ?? "").length > 0);
    if (hasNamedWeights) {
      s += " pieceWeights:{\n";
      for (let i = 0; i < this.pieceWeightNames.length; i++) {
        if (this._gameAgnosticWeightsArray[i]! !== 0) {
          s += `        (pair "${this.pieceWeightNames[i]!}" ${this._gameAgnosticWeightsArray[i]!})\n`;
        }
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
      let sb = "";
      let haveRelevant = false;
      for (let i = 0; i < this.pieceWeightNames.length; i++) {
        if (Math.abs(this.weight * this._gameAgnosticWeightsArray[i]!) >= threshold) {
          sb += `        (pair "${this.pieceWeightNames[i]!}" ${this._gameAgnosticWeightsArray[i]!})\n`;
          haveRelevant = true;
        }
      }
      if (!haveRelevant) return null;
      let s = "(unthreatenedMaterial";
      if (this.transformation != null) s += ` transformation:${this.transformation.toString()}`;
      if (this.weight !== 1) s += ` weight:${this.weight}`;
      s += " pieceWeights:{\n" + sb + "    })";
      return s;
    } else {
      if (Math.abs(this.weight) < threshold) return null;
      return this.toString();
    }
  }

  override merge(term: HeuristicTerm): void {
    const castTerm = term as UnthreatenedMaterial;
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
    return "Sum of owned pieces not threatened by opponent.";
  }

  override toEnglishString(_context: unknown, _playerIndex: number): string {
    const dir = this.weight > 0 ? "maximise" : "minimise";
    return `You should try to ${dir} the number of unthreatened pieces you control (weight: ${this.weight})\n`;
  }

  override gameAgnosticWeightsArray(): number[] {
    return this._gameAgnosticWeightsArray;
  }
}
