// @java AI/src/policies/ProportionalPolicyClassificationTree.java

import { Policy } from "./Policy.js";
import type { FVector, FastArrayList, Move, BaseFeatureSet, FeatureVector, Game } from "./Policy.js";
import { DecisionTreeNode } from "../decision_trees/classifiers/DecisionTreeNode.js";
import type { BaseFeatureSet as DTBaseFeatureSet, Feature as DTFeature, AspatialFeature as DTAspatialFeature, DecisionTreeNodeMetadata } from "../decision_trees/classifiers/DecisionTreeNode.js";

/**
 * A policy that uses a Classification Tree to compute probabilities per move.
 *
 * @java policies/ProportionalPolicyClassificationTree.java
 * @author Dennis Soemers
 */
export class ProportionalPolicyClassificationTree extends Policy {

  //-------------------------------------------------------------------------

  /**
   * Roots of decision trees that can output probability estimates (one per legal move).
   * If it contains only one root, it will be shared across all players.
   * Otherwise, it will contain one root per player.
   */
  protected decisionTreeRoots: (DecisionTreeNode | null)[] | null;

  /**
   * Feature Sets to use to generate feature vectors for state+action pairs.
   * If it contains only one feature set, it will be shared across all players.
   * Otherwise, it will contain one Feature Set per player.
   */
  protected featureSets: (BaseFeatureSet | null)[] | null;

  /**
   * If >= 0, we'll only actually use this policy in MCTS play-outs
   * for up to this many actions.
   */
  protected playoutActionLimit: number = -1;

  /** Auto-end playouts in a draw if they take more turns than this */
  protected playoutTurnLimit: number = -1;

  /** Epsilon for epsilon-greedy playouts */
  protected epsilon: number = 0.0;

  /** If true, we play greedily instead of sampling proportional to probabilities */
  protected greedy: boolean = false;

  //-------------------------------------------------------------------------

  /**
   * Default constructor. Will initialise important parts to null and break
   * down if used directly. Should customise() it first!
   * @java ProportionalPolicyClassificationTree()
   */
  public constructor();
  /**
   * Constructs a policy with classification tree(s) for probabilities
   * @java ProportionalPolicyClassificationTree(DecisionTreeNode[], BaseFeatureSet[])
   */
  public constructor(decisionTreeRoots: DecisionTreeNode[], featureSets: BaseFeatureSet[]);
  /**
   * Constructs a policy with classification tree(s) for probabilities,
   * and a limit on the number of play-out actions.
   * @java ProportionalPolicyClassificationTree(DecisionTreeNode[], BaseFeatureSet[], int)
   */
  public constructor(decisionTreeRoots: DecisionTreeNode[], featureSets: BaseFeatureSet[], playoutActionLimit: number);
  public constructor(
    decisionTreeRoots?: DecisionTreeNode[],
    featureSets?: BaseFeatureSet[],
    playoutActionLimit?: number
  ) {
    super();
    if (decisionTreeRoots !== undefined && featureSets !== undefined) {
      this.decisionTreeRoots = decisionTreeRoots.slice();
      this.featureSets = featureSets.slice();
      if (playoutActionLimit !== undefined) {
        this.playoutActionLimit = playoutActionLimit;
      }
    } else {
      this.decisionTreeRoots = null;
      this.featureSets = null;
    }
  }

  //-------------------------------------------------------------------------

  /**
   * Constructs a policy from a given set of feature trees as created
   * by the compiler, using classification trees.
   * @java ProportionalPolicyClassificationTree.constructPolicy(FeatureTrees, double)
   */
  public static constructPolicy(featureTrees: unknown, epsilon: number): ProportionalPolicyClassificationTree {
    const softmax = new ProportionalPolicyClassificationTree();

    const featureSetsList: (BaseFeatureSet | null)[] = [];
    const roots: (DecisionTreeNode | null)[] = [];

    const ft = featureTrees as {
      decisionTrees(): Array<{
        role(): { name(): string; owner(): number };
        root(): DecisionTreeNodeMetadata;
      }>
    };

    for (const classificationTree of ft.decisionTrees()) {
      const role = classificationTree.role();
      const isSharedOrNeutral = role.name() === "Shared" || role.name() === "Neutral";
      if (isSharedOrNeutral)
        ProportionalPolicyClassificationTree.addFeatureSetRoot(0, classificationTree.root(), featureSetsList, roots);
      else
        ProportionalPolicyClassificationTree.addFeatureSetRoot(role.owner(), classificationTree.root(), featureSetsList, roots);
    }

    softmax.featureSets = featureSetsList;
    softmax.decisionTreeRoots = roots;
    softmax.epsilon = epsilon;

    return softmax;
  }

  //-------------------------------------------------------------------------

  /**
   * @java ProportionalPolicyClassificationTree.computeDistribution(Context, FastArrayList, boolean)
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
   * @param featureVectors
   * @param player
   * @return Probability distribution over actions implied by a list of sparse feature vectors
   * @java ProportionalPolicyClassificationTree.computeDistribution(FeatureVector[], int)
   */
  public computeDistributionFromVectors(
    featureVectors: FeatureVector[],
    player: number
  ): FVector {
    const logits: number[] = new Array(featureVectors.length);
    const decisionTreeRoot = this.decisionTreeRoots!.length === 1
      ? this.decisionTreeRoots![0]!
      : this.decisionTreeRoots![player]!;

    for (let i = 0; i < featureVectors.length; ++i) {
      logits[i] = decisionTreeRoot.predict(featureVectors[i]! as unknown as import("../decision_trees/classifiers/DecisionTreeNode.js").FeatureVector);
    }

    const distribution = ProportionalPolicyClassificationTree._fVectorWrap(logits);
    distribution.normalise();

    return distribution;
  }

  /**
   * @java ProportionalPolicyClassificationTree.computeLogit(Context, Move)
   */
  public override computeLogit(context: unknown, move: Move): number {
    const ctx = context as { state(): { mover(): number } };
    const decisionTreeRoot = this.decisionTreeRoots!.length === 1
      ? this.decisionTreeRoots![0]!
      : this.decisionTreeRoots![ctx.state().mover()]!;

    const featureSet = this.featureSets!.length === 1
      ? this.featureSets![0]!
      : this.featureSets![ctx.state().mover()]!;

    return decisionTreeRoot.predict(
      featureSet.computeFeatureVector(context, move, true) as unknown as import("../decision_trees/classifiers/DecisionTreeNode.js").FeatureVector
    );
  }

  //-------------------------------------------------------------------------

  /**
   * @java ProportionalPolicyClassificationTree.runPlayout(MCTS, Context)
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
        return ProportionalPolicyClassificationTree._newDecisionTreeMoveSelector(
          this.featureSets!, this.decisionTreeRoots!, this.greedy
        );
      } else {
        return ProportionalPolicyClassificationTree._newEpsilonGreedyWrapper(
          ProportionalPolicyClassificationTree._newDecisionTreeMoveSelector(
            this.featureSets!, this.decisionTreeRoots!, this.greedy
          ),
          this.epsilon
        );
      }
    } else {
      return null;
    }
  }

  /**
   * @java ProportionalPolicyClassificationTree.playoutSupportsGame(Game)
   */
  public override playoutSupportsGame(game: unknown): boolean {
    return this.supportsGame(game);
  }

  /**
   * @java ProportionalPolicyClassificationTree.backpropFlags()
   */
  public override backpropFlags(): number {
    return 0;
  }

  /**
   * @java ProportionalPolicyClassificationTree.customise(String[])
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
      }
    }

    if (policyTreesFilepath !== null) {
      const featureSetsList: (BaseFeatureSet | null)[] = [];
      const roots: (DecisionTreeNode | null)[] = [];

      // Compiler not available in TypeScript — escape hatch
      console.error("ProportionalPolicyClassificationTree.customise(): policytrees= loading via compiler not supported in TypeScript");

      this.featureSets = featureSetsList;
      this.decisionTreeRoots = roots;
    } else {
      console.error("Cannot construct Proportional Policy Classification Tree from: " + inputs.toString());
    }
  }

  //-------------------------------------------------------------------------

  /**
   * @java ProportionalPolicyClassificationTree.selectAction(Game, Context, double, int, int)
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

    if (this.greedy) {
      return actions.moves().get(distribution.argMaxRand());
    } else {
      return actions.moves().get(distribution.sampleFromDistribution());
    }
  }

  //-------------------------------------------------------------------------

  /**
   * @java ProportionalPolicyClassificationTree.initAI(Game, int)
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
   * @java ProportionalPolicyClassificationTree.closeAI()
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
   * @java ProportionalPolicyClassificationTree.featureSets()
   */
  public featureSetsArr(): (BaseFeatureSet | null)[] | null {
    return this.featureSets;
  }

  //-------------------------------------------------------------------------

  /**
   * @param lines
   * @return A classification tree policy constructed from a given array of input lines
   * @java ProportionalPolicyClassificationTree.fromLines(String[])
   */
  public static fromLines(lines: string[]): ProportionalPolicyClassificationTree {
    const policy = new ProportionalPolicyClassificationTree();
    policy.customise(lines);
    return policy;
  }

  //-------------------------------------------------------------------------

  /**
   * Helper method that adds a Feature Set and a Decision Tree Root for the
   * given player index.
   * @java ProportionalPolicyClassificationTree.addFeatureSetRoot(int, DecisionTreeNode, List, List)
   */
  protected static addFeatureSetRoot(
    playerIdx: number,
    rootNode: DecisionTreeNodeMetadata,
    outFeatureSets: (BaseFeatureSet | null)[],
    outRoots: (DecisionTreeNode | null)[]
  ): void {
    while (outFeatureSets.length <= playerIdx) {
      outFeatureSets.push(null);
    }
    while (outRoots.length <= playerIdx) {
      outRoots.push(null);
    }

    const aspatialFeatures: DTAspatialFeature[] = [];
    const spatialFeatures: DTFeature[] = [];

    const featureStrings = new Set<string>();
    (rootNode as unknown as { collectFeatureStrings(s: Set<string>): void }).collectFeatureStrings(featureStrings);

    for (const featureString of featureStrings) {
      const feature = ProportionalPolicyClassificationTree._featureFromString(featureString);
      if (ProportionalPolicyClassificationTree._isAspatial(feature)) {
        aspatialFeatures.push(feature as unknown as DTAspatialFeature);
      } else {
        spatialFeatures.push(feature as unknown as DTFeature);
      }
    }

    const featureSet = ProportionalPolicyClassificationTree._constructJITSPatterNet(aspatialFeatures, spatialFeatures);
    outFeatureSets[playerIdx] = featureSet as unknown as BaseFeatureSet;
    outRoots[playerIdx] = DecisionTreeNode.fromMetadataNode(rootNode, featureSet);
  }

  //-------------------------------------------------------------------------
  // Escape-hatch factory stubs

  /** @java FVector.wrap(float[]) */
  private static _fVectorWrap(arr: number[]): FVector {
    return arr as unknown as FVector;
  }

  /** @java Feature.fromString(String) */
  private static _featureFromString(_s: string): DTFeature {
    return {} as unknown as DTFeature;
  }

  /** @java feature instanceof AspatialFeature */
  private static _isAspatial(_f: DTFeature): boolean {
    return false; // escape hatch
  }

  /** @java JITSPatterNetFeatureSet.construct(List<AspatialFeature>, List<SpatialFeature>) */
  private static _constructJITSPatterNet(
    _aspatial: DTAspatialFeature[],
    _spatial: DTFeature[]
  ): DTBaseFeatureSet {
    return {} as unknown as DTBaseFeatureSet;
  }

  /** @java new DecisionTreeMoveSelector(BaseFeatureSet[], DecisionTreeNode[], boolean) */
  private static _newDecisionTreeMoveSelector(
    _featureSets: unknown[],
    _roots: unknown[],
    _greedy: boolean
  ): unknown {
    return {} as unknown;
  }

  /** @java new EpsilonGreedyWrapper(PlayoutMoveSelector, double) */
  private static _newEpsilonGreedyWrapper(_inner: unknown, _epsilon: number): unknown {
    return {} as unknown;
  }

  //-------------------------------------------------------------------------
}
