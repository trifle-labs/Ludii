// @java Core/src/metadata/ai/heuristics/terms/Intercept.java

import type { HeuristicTransformation } from "../transformations/HeuristicTransformation.js";
import type { Pair } from "../../misc/Pair.js";
import { HeuristicTerm } from "./HeuristicTerm.js";

/** Valid role-type keys for player weights in Intercept */
export type PlayerRoleKey = string; // e.g. "P1", "P2", ...

/**
 * Defines an intercept term for heuristic-based value functions, with one
 * weight per player.
 *
 * @author Dennis Soemers
 */
export class Intercept extends HeuristicTerm {
  /** Array of role strings for each player entry */
  private players: string[];

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
   * @param playerWeights Weights for different players. Players for which no
   * weights are specified are given a weight of 0.0. Player names must be
   * one of the following: "P1", "P2", ..., "P16".
   *
   * @example (intercept playerWeights:{ (pair "P1" 1.0) (pair "P2" 0.5) })
   */
  constructor(
    transformation: HeuristicTransformation | null = null,
    playerWeights: Pair[] = [],
  ) {
    super(transformation, 1.0);
    this.players = playerWeights.map((p) => p.key());
    this._gameAgnosticWeightsArray = playerWeights.map((p) => p.floatVal());
  }

  override copy(): Intercept {
    const c = new Intercept(this.transformation, []);
    c.players = [...this.players];
    c._gameAgnosticWeightsArray = [...this._gameAgnosticWeightsArray];
    return c;
  }

  // -------------------------------------------------------------------------

  override computeValue(_context: unknown, _player: number, _absWeightThreshold: number): number {
    // Minimal stub; full impl requires playerWeightsVector built from game
    return 0;
  }

  override computeStateFeatureVector(_context: unknown, _player: number): number[] {
    return [];
  }

  override paramsVector(): null {
    return null;
  }

  // -------------------------------------------------------------------------

  static isApplicableToGame(_game: unknown): boolean {
    return true;
  }

  override isApplicable(_game: unknown): boolean {
    return true;
  }

  // -------------------------------------------------------------------------

  override toString(): string {
    let s = "(intercept";
    if (this.transformation != null) s += ` transformation:${this.transformation.toString()}`;
    if (this.players.length > 0) {
      s += " playerWeights:{\n";
      for (let i = 0; i < this.players.length; i++) {
        s += `        (pair "${this.players[i]!}" ${this._gameAgnosticWeightsArray[i]!})\n`;
      }
      s += "    }";
    }
    s += ")";
    return s;
  }

  override toStringThresholded(threshold: number): string | null {
    let sb = "";
    let haveRelevant = false;
    for (let i = 0; i < this.players.length; i++) {
      if (Math.abs(this._gameAgnosticWeightsArray[i]!) >= threshold) {
        sb += `        (pair "${this.players[i]!}" ${this._gameAgnosticWeightsArray[i]!})\n`;
        haveRelevant = true;
      }
    }
    if (!haveRelevant) return null;
    let s = "(intercept";
    if (this.transformation != null) s += ` transformation:${this.transformation.toString()}`;
    s += " playerWeights:{\n" + sb + "    })";
    return s;
  }

  // -------------------------------------------------------------------------

  override merge(term: HeuristicTerm): void {
    const castTerm = term as Intercept;
    for (let i = 0; i < this.players.length; i++) {
      for (let j = 0; j < castTerm.players.length; j++) {
        if (this.players[i]! === castTerm.players[j]!) {
          this._gameAgnosticWeightsArray[i]! += castTerm._gameAgnosticWeightsArray[j]!;
        }
      }
    }
  }

  override simplify(): void {
    // weights fully absorbed; nothing to simplify
  }

  override maxAbsWeight(): number {
    let maxW = Math.abs(this.weight);
    for (const f of this._gameAgnosticWeightsArray) maxW = Math.max(maxW, Math.abs(f));
    return maxW;
  }

  override description(): string {
    return "Intercept term with per-player weights.";
  }

  override toEnglishString(_context: unknown, _playerIndex: number): string {
    return `Intercept bias (weight: ${this.weight})\n`;
  }

  override gameAgnosticWeightsArray(): number[] {
    return this._gameAgnosticWeightsArray;
  }
}
