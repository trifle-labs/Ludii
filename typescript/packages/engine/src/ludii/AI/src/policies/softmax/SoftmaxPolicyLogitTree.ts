// @java AI/src/policies/softmax/SoftmaxPolicyLogitTree.java

import { SoftmaxPolicy } from "./SoftmaxPolicy.js";
import { LogitTreeNode } from "../../decision_trees/logits/LogitTreeNode.js";
import type { FeatureVector as LogitFeatureVector, BaseFeatureSet as LogitBaseFeatureSet, Feature as LogitFeature, AspatialFeature as LogitAspatialFeature, SpatialFeature as LogitSpatialFeature, LogitNodeMetadata } from "../../decision_trees/logits/LogitTreeNode.js";
import type {
  FVector,
  FastArrayList,
  Move,
  BaseFeatureSet,
  FeatureVector,
  Game,
  FeatureTrees,
  LogitTreeNodeMetadataBase,
} from "../Policy.js";
import { ExperimentFileUtils } from "../../utils/ExperimentFileUtils.js";

/** @java decision_trees.logits.LogitTreeNode (re-exported for use) */
export type { LogitTreeNode };

/**
 * A policy that uses a Logit (Regression) Tree to compute logits per move,
 * and then a probability distribution over those moves using a softmax.
 *
 * @java policies/softmax/SoftmaxPolicyLogitTree.java
 * @author Dennis Soemers
 */
export class SoftmaxPolicyLogitTree extends SoftmaxPolicy {

  //-------------------------------------------------------------------------

  /**
   * Roots of regression trees that can output logits (one per legal move).
   * If it contains only one root, it will be shared across all players.
   * Otherwise, it will contain one root per player.
   */
  protected regressionTreeRoots: (LogitTreeNode | null)[] | null;

  /**
   * Feature Sets to use to generate feature vectors for state+action pairs.
   * If it contains only one feature set, it will be shared across all players.
   * Otherwise, it will contain one Feature Set per player.
   */
  protected featureSets: (BaseFeatureSet | null)[] | null;

  /** Temperature for distribution */
  protected temperature: number = 1.0;

  /** Do we want to play greedily? */
  protected greedy: boolean = false;

  //-------------------------------------------------------------------------

  /**
   * Default constructor. Will initialise important parts to null and break
   * down if used directly. Should customise() it first!
   * @java SoftmaxPolicyLogitTree()
   */
  public constructor();
  /**
   * Constructs a softmax policy with regression tree(s) for logits
   * @java SoftmaxPolicyLogitTree(LogitTreeNode[], BaseFeatureSet[])
   */
  public constructor(regressionTreeRoots: LogitTreeNode[], featureSets: BaseFeatureSet[]);
  /**
   * Constructs a softmax policy with regression tree(s) for logits,
   * and a limit on the number of play-out actions.
   * @java SoftmaxPolicyLogitTree(LogitTreeNode[], BaseFeatureSet[], int)
   */
  public constructor(regressionTreeRoots: LogitTreeNode[], featureSets: BaseFeatureSet[], playoutActionLimit: number);
  public constructor(
    regressionTreeRoots?: LogitTreeNode[],
    featureSets?: BaseFeatureSet[],
    playoutActionLimit?: number
  ) {
    super();
    if (regressionTreeRoots !== undefined && featureSets !== undefined) {
      this.regressionTreeRoots = regressionTreeRoots.slice();
      this.featureSets = featureSets.slice();
      if (playoutActionLimit !== undefined) {
        this.playoutActionLimit = playoutActionLimit;
      }
    } else {
      this.regressionTreeRoots = null;
      this.featureSets = null;
    }
  }

  //-------------------------------------------------------------------------

  /**
   * Constructs a softmax policy from a given set of feature trees as created
   * by the compiler, using the Selection weights.
   * @java SoftmaxPolicyLogitTree.constructPolicy(FeatureTrees, double)
   */
  public static constructPolicy(featureTrees: FeatureTrees, epsilon: number): SoftmaxPolicyLogitTree {
    const softmax = new SoftmaxPolicyLogitTree();

    const featureSetsList: (BaseFeatureSet | null)[] = [];
    const roots: (LogitTreeNode | null)[] = [];

    for (const logitTree of featureTrees.logitTrees()) {
      const role = logitTree.role();
      const isSharedOrNeutral = role.name() === "Shared" || role.name() === "Neutral";
      if (isSharedOrNeutral)
        SoftmaxPolicyLogitTree.addFeatureSetRoot(0, logitTree.root() as unknown as LogitNodeMetadata, featureSetsList, roots);
      else
        SoftmaxPolicyLogitTree.addFeatureSetRoot(role.owner(), logitTree.root() as unknown as LogitNodeMetadata, featureSetsList, roots);
    }

    softmax.featureSets = featureSetsList;
    softmax.regressionTreeRoots = roots;
    softmax.epsilon = epsilon;

    return softmax;
  }

  //-------------------------------------------------------------------------

  /**
   * @java SoftmaxPolicyLogitTree.computeDistribution(Context, FastArrayList, boolean)
   */
  public override computeDistribution(
    context: unknown,
    actions: FastArrayList<Move>,
    thresholded: boolean
  ): FVector {
    const ctx = context as { state(): { mover(): number } };
    const featureSet = this.featureSets!.length === 1
      ? this.featureSets![0]!
      : this.featureSets![ctx.state().mover()]!;

    return this.computeDistributionFromVectors(
      featureSet.computeFeatureVectors(context, actions, thresholded),
      ctx.state().mover()
    );
  }

  /**
   * @java SoftmaxPolicyLogitTree.computeLogit(Context, Move)
   */
  public override computeLogit(context: unknown, move: Move): number {
    const ctx = context as { state(): { mover(): number } };
    const featureSet = this.featureSets!.length === 1
      ? this.featureSets![0]!
      : this.featureSets![ctx.state().mover()]!;

    const regressionTreeRoot = this.regressionTreeRoots!.length === 1
      ? this.regressionTreeRoots![0]!
      : this.regressionTreeRoots![ctx.state().mover()]!;

    return regressionTreeRoot.predict(
      featureSet.computeFeatureVector(context, move, true) as unknown as LogitFeatureVector
    );
  }

  /**
   * @param featureVectors
   * @param player
   * @return Probability distribution over actions implied by a list of sparse feature vectors
   * @java SoftmaxPolicyLogitTree.computeDistribution(FeatureVector[], int)
   */
  public computeDistributionFromVectors(
    featureVectors: FeatureVector[],
    player: number
  ): FVector {
    const logits: number[] = new Array(featureVectors.length);
    const regressionTreeRoot = this.regressionTreeRoots!.length === 1
      ? this.regressionTreeRoots![0]!
      : this.regressionTreeRoots![player]!;

    for (let i = 0; i < featureVectors.length; ++i) {
      logits[i] = regressionTreeRoot.predict(featureVectors[i]! as unknown as LogitFeatureVector);
    }

    const distribution = SoftmaxPolicyLogitTree._fVectorWrap(logits);
    distribution.softmax(this.temperature);

    return distribution;
  }

  //-------------------------------------------------------------------------

  /**
   * @java SoftmaxPolicyLogitTree.runPlayout(MCTS, Context)
   */
  public override runPlayout(_mcts: unknown, context: unknown): unknown {
    const playoutMoveSelector = this._makePlayoutMoveSelector();
    const ctx = context as { game(): { playout: (...args: unknown[]) => unknown } };

    return ctx.game().playout(
      context,
      null,
      1.0,
      playoutMoveSelector,
      this.playoutActionLimit,
      this.playoutTurnLimit,
      Math.random
    );
  }

  private _makePlayoutMoveSelector(): unknown {
    if (this.epsilon < 1.0) {
      if (this.epsilon <= 0.0) {
        return SoftmaxPolicyLogitTree._newLogitTreeMoveSelector(
          this.featureSets!, this.regressionTreeRoots!, this.greedy, this.temperature
        );
      } else {
        return SoftmaxPolicyLogitTree._newEpsilonGreedyWrapper(
          SoftmaxPolicyLogitTree._newLogitTreeMoveSelector(
            this.featureSets!, this.regressionTreeRoots!, this.greedy, this.temperature
          ),
          this.epsilon
        );
      }
    } else {
      return null;
    }
  }

  /**
   * @java SoftmaxPolicyLogitTree.playoutSupportsGame(Game)
   */
  public override playoutSupportsGame(game: unknown): boolean {
    return this.supportsGame(game);
  }

  /**
   * @java SoftmaxPolicyLogitTree.backpropFlags()
   */
  public override backpropFlags(): number {
    return 0;
  }

  /**
   * @java SoftmaxPolicyLogitTree.customise(String[])
   */
  public override customise(inputs: string[]): void {
    let policyTreesFilepath: string | null = null;

    for (let i = 1; i < inputs.length; ++i) {
      const input = inputs[i]!;

      if (input.toLowerCase().startsWith("policytrees=")) {
        policyTreesFilepath = input.substring("policytrees=".length);
      } else if (input.toLowerCase().startsWith("playoutactionlimit=")) {
        this.playoutActionLimit = parseInt(input.substring("playoutactionlimit=".length), 10);
      } else if (input.toLowerCase().startsWith("playoutturnlimit=")) {
        this.playoutTurnLimit = parseInt(input.substring("playoutturnlimit=".length), 10);
      } else if (input.toLowerCase().startsWith("friendly_name=")) {
        this.friendlyName = input.substring("friendly_name=".length);
      } else if (input.toLowerCase().startsWith("epsilon=")) {
        this.epsilon = parseFloat(input.substring("epsilon=".length));
      } else if (input.toLowerCase().startsWith("greedy=")) {
        this.greedy = input.substring("greedy=".length).toLowerCase() === "true";
      } else if (input.toLowerCase().startsWith("temperature=")) {
        this.temperature = parseFloat(input.substring("temperature=".length));
      }
    }

    if (policyTreesFilepath !== null) {
      const featureSetsList: (BaseFeatureSet | null)[] = [];
      const roots: (LogitTreeNode | null)[] = [];

      // Compiler not available in TypeScript — escape hatch
      console.error("SoftmaxPolicyLogitTree.customise(): policytrees= loading via compiler not supported in TypeScript");

      this.featureSets = featureSetsList;
      this.regressionTreeRoots = roots;
    } else {
      console.error("Cannot construct Softmax Policy Logit Tree from: " + inputs.toString());
    }
  }

  //-------------------------------------------------------------------------

  /**
   * @java SoftmaxPolicyLogitTree.selectAction(Game, Context, double, int, int)
   */
  public override selectAction(
    game: unknown,
    context: unknown,
    _maxSeconds: number,
    _maxIterations: number,
    _maxDepth: number
  ): Move {
    const g = game as Game;
    const ctx = context as { state(): { mover(): number } };
    const actions = g.moves(context);

    const featureSet = this.featureSets!.length === 1
      ? this.featureSets![0]!
      : this.featureSets![ctx.state().mover()]!;

    const distribution = this.computeDistributionFromVectors(
      featureSet.computeFeatureVectors(context, actions.moves(), true),
      ctx.state().mover()
    );

    if (this.greedy)
      return actions.moves().get(distribution.argMaxRand());
    else
      return actions.moves().get(distribution.sampleFromDistribution());
  }

  //-------------------------------------------------------------------------

  /**
   * @java SoftmaxPolicyLogitTree.initAI(Game, int)
   */
  public override initAI(game: unknown, _playerID: number): void {
    const g = game as Game;
    if (this.featureSets!.length === 1) {
      const supportedPlayers: number[] = new Array(g.players().count());
      for (let i = 0; i < supportedPlayers.length; ++i) {
        supportedPlayers[i] = i + 1;
      }
      this.featureSets![0]!.init(game, supportedPlayers, null);
    } else {
      for (let i = 1; i < this.featureSets!.length; ++i) {
        this.featureSets![i]!.init(game, [i], null);
      }
    }
  }

  /**
   * @java SoftmaxPolicyLogitTree.closeAI()
   */
  public override closeAI(): void {
    if (this.featureSets === null) return;

    if (this.featureSets.length === 1) {
      this.featureSets[0]?.closeCache();
    } else {
      for (let i = 1; i < this.featureSets.length; ++i) {
        this.featureSets[i]?.closeCache();
      }
    }
  }

  //-------------------------------------------------------------------------

  /**
   * @return Feature Sets used by this policy
   * @java SoftmaxPolicyLogitTree.featureSets()
   */
  public featureSetsArr(): (BaseFeatureSet | null)[] | null {
    return this.featureSets;
  }

  //-------------------------------------------------------------------------

  /**
   * @param lines
   * @return A softmax logit tree policy constructed from a given array of input lines
   * @java SoftmaxPolicyLogitTree.fromLines(String[])
   */
  public static fromLines(lines: string[]): SoftmaxPolicyLogitTree {
    const policy = new SoftmaxPolicyLogitTree();
    policy.customise(lines);
    return policy;
  }

  //-------------------------------------------------------------------------

  /**
   * Helper method that adds a Feature Set and a regression tree root for the
   * given player index
   * @java SoftmaxPolicyLogitTree.addFeatureSetRoot(int, LogitNode, List, List)
   */
  protected static addFeatureSetRoot(
    playerIdx: number,
    rootNode: LogitNodeMetadata,
    outFeatureSets: (BaseFeatureSet | null)[],
    outRoots: (LogitTreeNode | null)[]
  ): void {
    while (outFeatureSets.length <= playerIdx) {
      outFeatureSets.push(null);
    }
    while (outRoots.length <= playerIdx) {
      outRoots.push(null);
    }

    const aspatialFeatures: LogitAspatialFeature[] = [];
    const spatialFeatures: LogitSpatialFeature[] = [];

    const featureStrings = new Set<string>();
    (rootNode as unknown as { collectFeatureStrings(s: Set<string>): void }).collectFeatureStrings(featureStrings);

    for (const featureString of featureStrings) {
      const feature = SoftmaxPolicyLogitTree._featureFromString(featureString);
      if (SoftmaxPolicyLogitTree._isAspatial(feature)) {
        aspatialFeatures.push(feature as unknown as LogitAspatialFeature);
      } else {
        spatialFeatures.push(feature as unknown as LogitSpatialFeature);
      }
    }

    const featureSet = SoftmaxPolicyLogitTree._constructFeatureSet(aspatialFeatures, spatialFeatures);
    outFeatureSets[playerIdx] = featureSet as unknown as BaseFeatureSet;
    outRoots[playerIdx] = LogitTreeNode.fromMetadataNode(rootNode, featureSet);
  }

  //-------------------------------------------------------------------------
  // Escape-hatch factory stubs

  /** @java FVector.wrap(float[]) */
  private static _fVectorWrap(arr: number[]): FVector {
    return arr as unknown as FVector;
  }

  /** @java Feature.fromString(String) */
  private static _featureFromString(_s: string): LogitFeature {
    return {} as unknown as LogitFeature;
  }

  /** @java feature instanceof AspatialFeature */
  private static _isAspatial(_f: LogitFeature): boolean {
    return false; // escape hatch
  }

  /** @java JITSPatterNetFeatureSet.construct(List, List) */
  private static _constructFeatureSet(
    _aspatial: LogitAspatialFeature[],
    _spatial: LogitSpatialFeature[]
  ): LogitBaseFeatureSet {
    return {} as unknown as LogitBaseFeatureSet;
  }

  /** @java new LogitTreeMoveSelector(BaseFeatureSet[], LogitTreeNode[], boolean, double) */
  private static _newLogitTreeMoveSelector(
    _featureSets: unknown[],
    _roots: unknown[],
    _greedy: boolean,
    _temperature: number
  ): unknown {
    return {} as unknown;
  }

  /** @java new EpsilonGreedyWrapper(PlayoutMoveSelector, double) */
  private static _newEpsilonGreedyWrapper(_inner: unknown, _epsilon: number): unknown {
    return {} as unknown;
  }

  //-------------------------------------------------------------------------
}
