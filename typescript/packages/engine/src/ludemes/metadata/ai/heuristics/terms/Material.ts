// @java Core/src/metadata/ai/heuristics/terms/Material.java

import type { HeuristicTransformation } from "../transformations/HeuristicTransformation.js";
import type { Pair } from "../../misc/Pair.js";
import { HeuristicTerm } from "./HeuristicTerm.js";

/**
 * Defines a heuristic term based on the material that a player has on
 * the board and in their hand.
 *
 * @author Dennis Soemers
 */
export class Material extends HeuristicTerm {
  /** Array of names specified for piece types */
  private pieceWeightNames: string[];

  /**
   * Array of weights as specified in metadata. Will be used to initialise
   * a weight vector for a specific game when init() is called.
   */
  private _gameAgnosticWeightsArray: number[];

  /** If true, only count pieces on the main board (i.e., container 0) */
  private readonly boardOnly: boolean;

  // -------------------------------------------------------------------------

  /**
   * Constructor
   *
   * @param transformation An optional transformation to be applied to any
   * raw heuristic score outputs.
   * @param weight The weight for this term in a linear combination of multiple terms.
   * If not specified, a default weight of 1.0 is used.
   * @param pieceWeights Weights for different piece types. If no piece weights are
   * specified at all, all piece types are given an equal weight of 1.0. If piece
   * weights are only specified for some piece types, all other piece types get a
   * weight of 0.
   * @param boardOnly If true, only pieces that are on the game's main board are counted,
   * and pieces that are, for instance, in players' hands are excluded. False by default.
   *
   * @example (material pieceWeights:{ (pair "Pawn" 1.0) (pair "Bishop" 3.0) })
   */
  constructor(
    transformation: HeuristicTransformation | null = null,
    weight: number | null = null,
    pieceWeights: Pair[] | null = null,
    boardOnly: boolean | null = null,
  ) {
    super(transformation, weight);

    if (pieceWeights == null) {
      this.pieceWeightNames = [""];
      this._gameAgnosticWeightsArray = [1.0];
    } else {
      this.pieceWeightNames = pieceWeights.map((p) => p.key());
      this._gameAgnosticWeightsArray = pieceWeights.map((p) => p.floatVal());
    }

    this.boardOnly = boardOnly ?? false;
  }

  override copy(): Material {
    const m = new Material(
      this.transformation,
      this.weight,
      null,
      this.boardOnly,
    );
    m.pieceWeightNames = [...this.pieceWeightNames];
    m._gameAgnosticWeightsArray = [...this._gameAgnosticWeightsArray];
    return m;
  }

  // -------------------------------------------------------------------------

  override computeValue(_context: unknown, _player: number, _absWeightThreshold: number): number {
    // Runtime implementation requires full engine context — stub for metadata use.
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
  static isApplicableToGame(game: unknown): boolean {
    const g = game as { equipment?: () => { components?: () => unknown[] } };
    const comps = g.equipment?.()?.components?.() ?? [];
    return comps.length > 1;
  }

  override isApplicable(game: unknown): boolean {
    return Material.isApplicableToGame(game);
  }

  // -------------------------------------------------------------------------

  override toString(): string {
    let s = "(material";
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
      if (this.boardOnly) s += "\n    boardOnly:True\n";
    } else if (this.boardOnly) {
      s += " boardOnly:True";
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
      let haveRelevantPieces = false;
      for (let i = 0; i < this.pieceWeightNames.length; i++) {
        if (Math.abs(this.weight * this._gameAgnosticWeightsArray[i]!) >= threshold) {
          pieceWeightsSb += `        (pair "${this.pieceWeightNames[i]!}" ${this._gameAgnosticWeightsArray[i]!})\n`;
          haveRelevantPieces = true;
        }
      }
      if (!haveRelevantPieces) return null;

      let s = "(material";
      if (this.transformation != null) s += ` transformation:${this.transformation.toString()}`;
      if (this.weight !== 1) s += ` weight:${this.weight}`;
      s += " pieceWeights:{\n" + pieceWeightsSb + "    }";
      if (this.boardOnly) s += "\n    boardOnly:True\n";
      s += ")";
      return s;
    } else {
      if (Math.abs(this.weight) < threshold) return null;
      return this.toString();
    }
  }

  // -------------------------------------------------------------------------

  override merge(term: HeuristicTerm): void {
    const castTerm = term as Material;
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
    return "Sum of owned pieces.";
  }

  override toEnglishString(_context: unknown, playerIndex: number): string {
    const extraString = this.boardOnly ? " on the board" : "";
    let sb = "";
    const hasNamedWeights =
      this.pieceWeightNames.length > 1 ||
      (this.pieceWeightNames.length === 1 && (this.pieceWeightNames[0] ?? "").length > 0);

    if (hasNamedWeights) {
      for (let i = 0; i < this.pieceWeightNames.length; i++) {
        if (this._gameAgnosticWeightsArray[i]! !== 0) {
          const trailingNums = this.pieceWeightNames[i]!.replace(/\D+/g, "");
          if (
            trailingNums.length === 0 ||
            playerIndex < 0 ||
            parseInt(trailingNums, 10) === playerIndex
          ) {
            const baseName = this.pieceWeightNames[i]!.replace(/\d+$/, "");
            const dir = this._gameAgnosticWeightsArray[i]! > 0 ? "maximise" : "minimise";
            sb += `You should try to ${dir} the number of ${baseName}(s) you control`;
            sb += extraString + ` (weight: ${this._gameAgnosticWeightsArray[i]!})\n`;
          }
        }
      }
    } else {
      const dir = this.weight > 0 ? "maximise" : "minimise";
      sb += `You should try to ${dir} the number of piece(s) you control`;
      sb += extraString + ` (weight: ${this.weight})\n`;
    }
    return sb;
  }

  // -------------------------------------------------------------------------

  override gameAgnosticWeightsArray(): number[] {
    return this._gameAgnosticWeightsArray;
  }
}
