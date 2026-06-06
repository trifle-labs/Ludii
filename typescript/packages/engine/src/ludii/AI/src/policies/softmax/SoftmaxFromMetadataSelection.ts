// @java AI/src/policies/softmax/SoftmaxFromMetadataSelection.java

import { SoftmaxPolicy } from "./SoftmaxPolicy.js";
import { SoftmaxPolicyLinear } from "./SoftmaxPolicyLinear.js";
import type { FVector, FastArrayList, Move, BaseFeatureSet, Game } from "../Policy.js";
import type { FeaturesMetadata, FeatureTrees } from "../Policy.js";

/** @java function_approx.LinearFunction */
interface LinearFunction {
  predict(fv: unknown): number;
  effectiveParams(): unknown;
}

/**
 * A Softmax Policy that can automatically initialise itself by
 * using the Selection features embedded in a game's metadata.
 *
 * @java policies/softmax/SoftmaxFromMetadataSelection.java
 * @author Dennis Soemers
 */
export class SoftmaxFromMetadataSelection extends SoftmaxPolicy {

  //-------------------------------------------------------------------------

  /** Softmax policy we wrap around; can change into a linear or decision tree based policy depending on metadata */
  private wrappedSoftmax: SoftmaxPolicy | null = null;

  //-------------------------------------------------------------------------

  /**
   * Constructor
   * @param epsilon Epsilon for epsilon-greedy feature-based playouts. 1 for uniform, 0 for always softmax
   * @java SoftmaxFromMetadataSelection(double)
   */
  public constructor(epsilon: number) {
    super();
    this.friendlyName = "Softmax Policy (Selection features from Game metadata)";
    this.epsilon = epsilon;
  }

  //-------------------------------------------------------------------------

  /**
   * @java SoftmaxFromMetadataSelection.initAI(Game, int)
   */
  public override initAI(game: unknown, playerID: number): void {
    try {
      const g = game as Game;
      const aiMeta = g.metadata().ai();
      const featuresMetadata: FeaturesMetadata | null = aiMeta.features();

      if (featuresMetadata !== null) {
        const featureSetsList: (BaseFeatureSet | null)[] = [];
        const linFuncs: (LinearFunction | null)[] = [];

        const wrapped = new SoftmaxPolicyLinear();
        (wrapped as unknown as { epsilon: number }).epsilon = this.epsilon;
        (wrapped as unknown as { playoutActionLimit: number }).playoutActionLimit = 200;
        this.wrappedSoftmax = wrapped;

        for (const featureSet of featuresMetadata.featureSets()) {
          const role = featureSet.role();
          const isShared = role.name() === "Shared";
          if (isShared)
            (wrapped as unknown as { addFeatureSetWeights: (...a: unknown[]) => void })
              .addFeatureSetWeights(0, featureSet.featureStrings(), featureSet.selectionWeights(), featureSetsList, linFuncs);
          else
            (wrapped as unknown as { addFeatureSetWeights: (...a: unknown[]) => void })
              .addFeatureSetWeights(role.owner(), featureSet.featureStrings(), featureSet.selectionWeights(), featureSetsList, linFuncs);
        }

        (wrapped as unknown as { featureSets: (BaseFeatureSet | null)[] }).featureSets = featureSetsList;
        (wrapped as unknown as { linearFunctions: (LinearFunction | null)[] }).linearFunctions = linFuncs;
      } else {
        // TODO no distinction between selection and playout here
        const featureTrees: FeatureTrees | null = aiMeta.trainedFeatureTrees();
        if (featureTrees !== null) {
          this.wrappedSoftmax = SoftmaxFromMetadataSelection._constructLogitTreePolicy(featureTrees, this.epsilon);
          (this.wrappedSoftmax as unknown as { playoutActionLimit: number }).playoutActionLimit = 200;
        }
      }

      if (this.wrappedSoftmax !== null) {
        this.wrappedSoftmax.initAI(game, playerID);
      }
    } catch (e) {
      const g = game as Game;
      console.error("Game = " + g.name());
      console.error(e);
    }

    super.initAI(game, playerID);
  }

  /**
   * @java SoftmaxFromMetadataSelection.supportsGame(Game)
   */
  public override supportsGame(game: unknown): boolean {
    const g = game as Game;
    if (g.metadata().ai() !== null) {
      const ai = g.metadata().ai();
      if (ai.features() !== null) {
        const featuresMetadata = ai.features()!;
        if (featuresMetadata.featureSets().length === 1 && featuresMetadata.featureSets()[0]!.role().name() === "Shared")
          return true;
        else
          return featuresMetadata.featureSets().length === g.players().count();
      } else if (ai.trainedFeatureTrees() !== null) {
        return true;
      } else {
        return false;
      }
    }
    return false;
  }

  //-------------------------------------------------------------------------

  /**
   * @return Our current wrapped softmax (linear or tree-based)
   * @java SoftmaxFromMetadataSelection.wrappedSoftmax()
   */
  public wrappedSoftmaxPolicy(): SoftmaxPolicy | null {
    return this.wrappedSoftmax;
  }

  //-------------------------------------------------------------------------

  /**
   * @java SoftmaxFromMetadataSelection.runPlayout(MCTS, Context)
   */
  public override runPlayout(mcts: unknown, context: unknown): unknown {
    return this.wrappedSoftmax!.runPlayout(mcts, context);
  }

  /**
   * @java SoftmaxFromMetadataSelection.playoutSupportsGame(Game)
   */
  public override playoutSupportsGame(game: unknown): boolean {
    return this.supportsGame(game);
  }

  /**
   * @java SoftmaxFromMetadataSelection.backpropFlags()
   */
  public override backpropFlags(): number {
    return 0;
  }

  /**
   * @java SoftmaxFromMetadataSelection.customise(String[])
   */
  public override customise(_inputs: string[]): void {
    console.error("customise() not implemented for SoftmaxFromMetadataSelection!");
  }

  /**
   * @java SoftmaxFromMetadataSelection.computeLogit(Context, Move)
   */
  public override computeLogit(context: unknown, move: Move): number {
    return this.wrappedSoftmax!.computeLogit(context, move);
  }

  /**
   * @java SoftmaxFromMetadataSelection.computeDistribution(Context, FastArrayList, boolean)
   */
  public override computeDistribution(context: unknown, actions: FastArrayList<Move>, thresholded: boolean): FVector {
    return this.wrappedSoftmax!.computeDistribution(context, actions, thresholded);
  }

  /**
   * @java SoftmaxFromMetadataSelection.selectAction(Game, Context, double, int, int)
   */
  public override selectAction(
    game: unknown,
    context: unknown,
    maxSeconds: number,
    maxIterations: number,
    maxDepth: number
  ): Move {
    return this.wrappedSoftmax!.selectAction(game, context, maxSeconds, maxIterations, maxDepth);
  }

  //-------------------------------------------------------------------------

  /**
   * Escape hatch for SoftmaxPolicyLogitTree.constructPolicy — not yet ported as dependency
   * @java SoftmaxPolicyLogitTree.constructPolicy(FeatureTrees, double)
   */
  private static _constructLogitTreePolicy(featureTrees: FeatureTrees, epsilon: number): SoftmaxPolicy {
    // Will be replaced when SoftmaxPolicyLogitTree is imported
    const { SoftmaxPolicyLogitTree } = require("./SoftmaxPolicyLogitTree.js") as typeof import("./SoftmaxPolicyLogitTree.js");
    return SoftmaxPolicyLogitTree.constructPolicy(featureTrees, epsilon);
  }

  //-------------------------------------------------------------------------
}
