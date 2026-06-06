// @java AI/src/playout_move_selectors/FeaturesSoftmaxMoveSelector.java

/**
 * PlayoutMoveSelector for playouts which uses a softmax over actions with logits
 * computed by features.
 *
 * @java playout_move_selectors.FeaturesSoftmaxMoveSelector
 * @author Dennis Soemers
 */

import { FVector } from "../../../Common/src/main/collections/FVector.js";
import {
  PlayoutMoveSelector,
  type IsMoveReallyLegal,
  type IContext,
} from "../../../../ludemes/other/playout/PlayoutMoveSelector.js";
import type { IMove } from "../../../../ludemes/other/context/Context.js";

// ---------------------------------------------------------------------------
// Escape-hatch interfaces for not-yet-ported dependencies

/** @java features.FeatureVector */
interface FeatureVector {
  __featureVector: true;
}

/** @java features.WeightVector */
interface WeightVector {
  /** @java WeightVector.dot(FeatureVector) */
  dot(featureVector: FeatureVector): number;
}

/** @java features.feature_sets.BaseFeatureSet */
interface BaseFeatureSet {
  /** @java BaseFeatureSet.computeFeatureVectors(Context, FastArrayList<Move>, boolean) */
  computeFeatureVectors(context: IContext, maybeLegalMoves: IMove[], thresholded: boolean): FeatureVector[];
}

// ---------------------------------------------------------------------------

/**
 * PlayoutMoveSelector for playouts which uses a softmax over actions with logits
 * computed by features.
 *
 * @java playout_move_selectors.FeaturesSoftmaxMoveSelector
 */
export class FeaturesSoftmaxMoveSelector extends PlayoutMoveSelector {

  // -------------------------------------------------------------------------

  /** Feature sets (one per player, or just a shared one at index 0) */
  protected readonly featureSets: BaseFeatureSet[];

  /** Weight vectors (one per player, or just a shared one at index 0) */
  protected readonly weights: WeightVector[];

  /** Do we want to use thresholding to ignore low-weight features? */
  protected readonly thresholded: boolean;

  // -------------------------------------------------------------------------

  /**
   * Constructor
   * @param featureSets Feature sets (one per player, or just a shared one at index 0)
   * @param weights Weight vectors (one per player, or just a shared one at index 0)
   * @param thresholded Do we want to use thresholding to ignore low-weight features?
   * @java FeaturesSoftmaxMoveSelector(BaseFeatureSet[], WeightVector[], boolean)
   */
  public constructor(
    featureSets: BaseFeatureSet[],
    weights: WeightVector[],
    thresholded: boolean
  ) {
    super();
    this.featureSets = featureSets;
    this.weights = weights;
    this.thresholded = thresholded;
  }

  // -------------------------------------------------------------------------

  /**
   * @java FeaturesSoftmaxMoveSelector.selectMove(Context, FastArrayList<Move>, int, IsMoveReallyLegal)
   */
  public override selectMove(
    context: IContext,
    maybeLegalMoves: IMove[],
    p: number,
    isMoveReallyLegal: IsMoveReallyLegal
  ): IMove | null {
    let featureSet: BaseFeatureSet;
    let weightVector: WeightVector;
    if (this.featureSets.length === 1) {
      featureSet = this.featureSets[0]!;
      weightVector = this.weights[0]!;
    } else {
      featureSet = this.featureSets[p]!;
      weightVector = this.weights[p]!;
    }

    const featureVectors: FeatureVector[] = featureSet.computeFeatureVectors(context, maybeLegalMoves, this.thresholded);

    const logits = new Float32Array(featureVectors.length);

    for (let i = 0; i < featureVectors.length; ++i) {
      logits[i] = weightVector.dot(featureVectors[i]!);
    }

    const distribution = FVector.wrap(logits);
    distribution.softmax();

    let numLegalMoves = maybeLegalMoves.length;

    while (numLegalMoves > 0) {
      --numLegalMoves; // We're trying a move; if this one fails, it's actually not legal

      const n = distribution.sampleFromDistribution();
      const move = maybeLegalMoves[n]!;

      if (isMoveReallyLegal.checkMove(move)) {
        return move; // Only return this move if it's really legal
      } else {
        distribution.updateSoftmaxInvalidate(n); // Incrementally update the softmax, move n is invalid
      }
    }

    // No legal moves?
    return null;
  }

  // -------------------------------------------------------------------------
}
