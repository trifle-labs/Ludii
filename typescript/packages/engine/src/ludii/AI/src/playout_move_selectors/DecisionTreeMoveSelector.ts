// @java AI/src/playout_move_selectors/DecisionTreeMoveSelector.java

/**
 * PlayoutMoveSelector for playouts which uses a distribution over actions
 * computed by move-classification feature trees.
 *
 * @java playout_move_selectors.DecisionTreeMoveSelector
 * @author Dennis Soemers
 */

import { FVector } from "../../../Common/src/main/collections/FVector.js";
import {
  PlayoutMoveSelector,
  type IsMoveReallyLegal,
  type IContext,
} from "../../../../ludemes/other/playout/PlayoutMoveSelector.js";
import type { IMove } from "../../../../ludemes/other/context/Context.js";
import type { DecisionTreeNode, FeatureVector } from "../decision_trees/classifiers/DecisionTreeNode.js";

// ---------------------------------------------------------------------------
// Escape-hatch interfaces for not-yet-ported dependencies

/** @java features.feature_sets.BaseFeatureSet */
interface BaseFeatureSet {
  /** @java BaseFeatureSet.computeFeatureVectors(Context, FastArrayList<Move>, boolean) */
  computeFeatureVectors(context: IContext, maybeLegalMoves: IMove[], thresholded: boolean): FeatureVector[];
}

// ---------------------------------------------------------------------------

/**
 * PlayoutMoveSelector for playouts which uses a distribution over actions
 * computed by move-classification feature trees.
 *
 * @java playout_move_selectors.DecisionTreeMoveSelector
 */
export class DecisionTreeMoveSelector extends PlayoutMoveSelector {

  // -------------------------------------------------------------------------

  /** Feature sets (one per player, or just a shared one at index 0) */
  protected readonly featureSets: BaseFeatureSet[];

  /** Classification tree root nodes (one per player, or just a shared one at index 0) */
  protected readonly rootNodes: DecisionTreeNode[];

  /** Do we want to play greedily? */
  protected readonly greedy: boolean;

  // -------------------------------------------------------------------------

  /**
   * Constructor
   * @param featureSets Feature sets (one per player, or just a shared one at index 0)
   * @param rootNodes Classification tree root nodes (one per player, or just a shared one at index 0)
   * @param greedy Do we want to play greedily?
   * @java DecisionTreeMoveSelector(BaseFeatureSet[], DecisionTreeNode[], boolean)
   */
  public constructor(
    featureSets: BaseFeatureSet[],
    rootNodes: DecisionTreeNode[],
    greedy: boolean
  ) {
    super();
    this.featureSets = featureSets;
    this.rootNodes = rootNodes;
    this.greedy = greedy;
  }

  // -------------------------------------------------------------------------

  /**
   * @java DecisionTreeMoveSelector.selectMove(Context, FastArrayList<Move>, int, IsMoveReallyLegal)
   */
  public override selectMove(
    context: IContext,
    maybeLegalMoves: IMove[],
    p: number,
    isMoveReallyLegal: IsMoveReallyLegal
  ): IMove | null {
    let featureSet: BaseFeatureSet;
    let rootNode: DecisionTreeNode;
    if (this.featureSets.length === 1) {
      featureSet = this.featureSets[0]!;
      rootNode = this.rootNodes[0]!;
    } else {
      featureSet = this.featureSets[p]!;
      rootNode = this.rootNodes[p]!;
    }

    const featureVectors: FeatureVector[] = featureSet.computeFeatureVectors(context, maybeLegalMoves, false);

    const unnormalisedProbs = new Float32Array(featureVectors.length);

    for (let i = 0; i < featureVectors.length; ++i) {
      unnormalisedProbs[i] = rootNode.predict(featureVectors[i]!);
    }

    const distribution = FVector.wrap(unnormalisedProbs);
    distribution.normalise();

    let numLegalMoves = maybeLegalMoves.length;

    while (numLegalMoves > 0) {
      --numLegalMoves; // We're trying a move; if this one fails, it's actually not legal

      const n = this.greedy ? distribution.argMaxRand() : distribution.sampleFromDistribution();
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
