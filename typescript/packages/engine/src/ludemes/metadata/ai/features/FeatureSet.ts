// @java Core/src/metadata/ai/features/FeatureSet.java

import type { RoleType } from "../RoleType.js";
import type { Pair } from "../misc/Pair.js";

/**
 * Defines a single feature set, which may be applicable to either a
 * single specific player in a game, or to all players in a game.
 *
 * @remarks Use All for feature sets that are applicable to all players
 * in a game, or P1, P2, etc. for feature sets that are
 * applicable only to individual players.
 *
 * @author Dennis Soemers
 */
export class FeatureSet {
  /** Role (should either be All, or a specific Player) */
  protected readonly role: RoleType;

  /** Array of strings describing features */
  protected readonly featureStrings: string[];

  /** Array of weights (one per feature) for Selection */
  protected readonly selectionWeights: number[] | null;

  /** Array of weights (one per feature) for Playouts */
  protected readonly playoutWeights: number[] | null;

  /** Array of weights (one per feature) for TSPG objective */
  protected readonly tspgWeights: number[] | null;

  // -------------------------------------------------------------------------

  /**
   * For a single collection of features and weights for one role.
   *
   * @param role The Player (P1, P2, etc.) for which the feature set should apply,
   * or All if it is applicable to all players in a game.
   * @param features Complete list of all features and weights for this feature set.
   *
   * @example (featureSet All { (pair "rel:to=<{}>:pat=<els=[-{}]>" 1.0) })
   */
  constructor(role: RoleType, features: Pair[]);

  /**
   * For distinct sets of features and weights for Selection, Playout, and
   * TSPG purposes, for a single role.
   *
   * @param role The Player (P1, P2, etc.) for which the feature set should apply.
   * @param selectionFeatures Complete list for MCTS Selection phase.
   * @param playoutFeatures Complete list for MCTS Playout phase.
   * @param tspgFeatures Complete list trained with TSPG objective.
   *
   * @example (featureSet P1 selectionFeatures:{ (pair "rel:to=<{}>:pat=<els=[-{}]>" 1.0) } playoutFeatures:{ (pair "rel:to=<{}>:pat=<els=[-{}]>" 2.0) })
   */
  constructor(
    role: RoleType,
    selectionFeatures: Pair[] | null,
    playoutFeatures: Pair[] | null,
    tspgFeatures: Pair[] | null,
  );

  constructor(
    role: RoleType,
    featuresOrSelection: Pair[] | null,
    playoutFeatures?: Pair[] | null,
    tspgFeatures?: Pair[] | null,
  ) {
    this.role = role;

    if (playoutFeatures === undefined && tspgFeatures === undefined) {
      // Single-array constructor
      const features = featuresOrSelection ?? [];
      this.featureStrings = features.map((p) => p.key());
      this.selectionWeights = features.map((p) => p.floatVal());
      this.playoutWeights = null;
      this.tspgWeights = null;
      return;
    }

    // Multi-array constructor
    const selectionFeatures = featuresOrSelection;
    const pf = playoutFeatures ?? null;
    const tf = tspgFeatures ?? null;

    if (selectionFeatures == null && pf == null && tf == null) {
      throw new Error("At least one of selectionFeatures, playoutFeatures and tspgFeatures must be specified!");
    }

    // Determine feature strings from whichever array is provided first
    // (all arrays share the same feature strings)
    const sourceArray: Pair[] = selectionFeatures ?? pf ?? (tf as Pair[]);
    this.featureStrings = sourceArray.map((p) => p.key());

    this.selectionWeights = selectionFeatures != null
      ? selectionFeatures.map((p) => p.floatVal())
      : null;

    this.playoutWeights = pf != null
      ? pf.map((p) => p.floatVal())
      : null;

    this.tspgWeights = tf != null
      ? tf.map((p) => p.floatVal())
      : null;
  }

  // -------------------------------------------------------------------------

  /** @return Role for this feature set */
  getRole(): RoleType {
    return this.role;
  }

  /** @return Array of strings describing features */
  getFeatureStrings(): string[] {
    return this.featureStrings;
  }

  /**
   * @return Array of weights for Selection (falls back to playout or TSPG weights)
   */
  getSelectionWeights(): number[] | null {
    if (this.selectionWeights != null) return this.selectionWeights;
    if (this.playoutWeights != null) return this.playoutWeights;
    return this.tspgWeights;
  }

  /**
   * @return Array of weights for Playout (falls back to selection or TSPG weights)
   */
  getPlayoutWeights(): number[] | null {
    if (this.playoutWeights != null) return this.playoutWeights;
    if (this.selectionWeights != null) return this.selectionWeights;
    return this.tspgWeights;
  }

  // -------------------------------------------------------------------------

  toString(): string {
    let sb = `    (featureSet ${this.role} `;

    if (this.selectionWeights != null) {
      const sw = this.selectionWeights;
      sb += "selectionFeatures:{\n";
      for (let i = 0; i < this.featureStrings.length; i++) {
        sb += `        (pair "${this.featureStrings[i]!.trim()}" ${sw[i]!})\n`;
      }
      sb += "    }\n";
    }

    if (this.playoutWeights != null) {
      const pw = this.playoutWeights;
      sb += "playoutWeights:{\n";
      for (let i = 0; i < this.featureStrings.length; i++) {
        sb += `        (pair "${this.featureStrings[i]!.trim()}" ${pw[i]!})\n`;
      }
      sb += "    }\n";
    }

    if (this.tspgWeights != null) {
      const tw = this.tspgWeights;
      sb += "tspgWeights:{\n";
      for (let i = 0; i < this.featureStrings.length; i++) {
        sb += `        (pair "${this.featureStrings[i]!.trim()}" ${tw[i]!})\n`;
      }
      sb += "    }\n";
    }

    sb += "    )\n";
    return sb;
  }

  /**
   * @param threshold
   * @return A string representation of these features, retaining only those for
   * which the absolute weights exceed the given threshold.
   */
  toStringThresholded(threshold: number): string {
    let sb = `    (featureSet ${this.role} `;

    if (this.selectionWeights != null) {
      const sw = this.selectionWeights;
      sb += "selectionFeatures:{\n";
      for (let i = 0; i < this.featureStrings.length; i++) {
        if (Math.abs(sw[i]!) >= threshold) {
          sb += `        (pair "${this.featureStrings[i]!.trim()}" ${sw[i]!})\n`;
        }
      }
      sb += "    }\n";
    }

    if (this.playoutWeights != null) {
      const pw = this.playoutWeights;
      sb += "playoutWeights:{\n";
      for (let i = 0; i < this.featureStrings.length; i++) {
        if (Math.abs(pw[i]!) >= threshold) {
          sb += `        (pair "${this.featureStrings[i]!.trim()}" ${pw[i]!})\n`;
        }
      }
      sb += "    }\n";
    }

    if (this.tspgWeights != null) {
      const tw = this.tspgWeights;
      sb += "tspgWeights:{\n";
      for (let i = 0; i < this.featureStrings.length; i++) {
        if (Math.abs(tw[i]!) >= threshold) {
          sb += `        (pair "${this.featureStrings[i]!.trim()}" ${tw[i]!})\n`;
        }
      }
      sb += "    }\n";
    }

    sb += "    )\n";
    return sb;
  }
}
