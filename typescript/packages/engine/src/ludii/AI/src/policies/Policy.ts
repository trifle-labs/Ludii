// @java AI/src/policies/Policy.java

/**
 * A policy is something that can compute distributions over actions in a given
 * state (presumably using some form of function approximation).
 *
 * Policies should also implement the methods required to function as
 * Play-out strategies for MCTS or function as a full AI agent.
 *
 * @java policies/Policy.java
 * @author Dennis Soemers
 */

// Escape-hatch interfaces for not-yet-ported dependencies

/** @java main.collections.FVector */
export interface FVector {
  dim(): number;
  get(i: number): number;
  set(i: number, v: number): void;
  addToEntry(i: number, v: number): void;
  softmax(temperature?: number): void;
  normalise(): void;
  argMaxRand(): number;
  sampleFromDistribution(): number;
  append(v: number): FVector;
}

/** @java main.collections.FVector (static) */
export interface FVectorStatic {
  wrap(arr: number[] | Float32Array): FVector;
}

/** @java main.collections.FastArrayList */
export interface FastArrayList<T> {
  size(): number;
  get(i: number): T;
  toArray(arr?: T[]): T[];
  [Symbol.iterator](): Iterator<T>;
}

/** @java other.move.Move */
export interface Move {
  mover(): number;
  toTrialFormat(context: unknown): string;
}

/** @java other.context.Context */
export interface Context {
  state(): { mover(): number };
  game(): { playout(context: unknown, list: unknown, time: number, sel: unknown, limit: number, turnLimit: number, rand: unknown): unknown; moves(ctx: unknown): { moves(): FastArrayList<Move> } };
}

/** @java other.trial.Trial */
export interface Trial {
  over(): boolean;
  ranking(): number[];
}

/** @java game.Game */
export interface Game {
  name(): string;
  players(): { count(): number };
  moves(ctx: unknown): { moves(): FastArrayList<Move> };
  metadata(): {
    ai(): {
      features(): FeaturesMetadata | null;
      trainedFeatureTrees(): FeatureTrees | null;
      agent(): AgentMetadata | null;
    }
  };
  isAlternatingMoveGame(): boolean;
}

/** @java metadata.ai.features.Features */
export interface FeaturesMetadata {
  featureSets(): FeatureSetMetadata[];
}

/** @java metadata.ai.features.FeatureSet */
export interface FeatureSetMetadata {
  role(): RoleTypeMetadata;
  featureStrings(): string[];
  selectionWeights(): number[];
  playoutWeights(): number[];
}

/** @java game.types.play.RoleType */
export interface RoleTypeMetadata {
  owner(): number;
  name(): string;
}

/** @java metadata.ai.features.trees.FeatureTrees */
export interface FeatureTrees {
  decisionTrees(): DecisionTreeMetadata[];
  logitTrees(): LogitTreeMetadata[];
}

/** @java metadata.ai.features.trees.classifiers.DecisionTree */
export interface DecisionTreeMetadata {
  role(): RoleTypeMetadata;
  root(): DecisionTreeNodeMetadata;
}

/** @java metadata.ai.features.trees.logits.LogitTree */
export interface LogitTreeMetadata {
  role(): RoleTypeMetadata;
  root(): LogitTreeNodeMetadataBase;
}

/** @java metadata.ai.features.trees.classifiers.DecisionTreeNode */
export interface DecisionTreeNodeMetadata {
  collectFeatureStrings(out: Set<string>): void;
}

/** @java metadata.ai.features.trees.logits.LogitNode */
export interface LogitTreeNodeMetadataBase {
  collectFeatureStrings(out: Set<string>): void;
}

/** @java metadata.ai.agents.Agent */
export interface AgentMetadata {
  __agent: true;
}

/** @java other.playout.PlayoutMoveSelector */
export interface PlayoutMoveSelector {
  __playoutMoveSelector: true;
}

/** @java search.mcts.MCTS */
export interface MCTS {
  __mcts: true;
}

/** @java features.feature_sets.BaseFeatureSet */
export interface BaseFeatureSet {
  computeFeatureVectors(context: unknown, actions: FastArrayList<Move>, thresholded: boolean): FeatureVector[];
  computeFeatureVector(context: unknown, move: Move, thresholded: boolean): FeatureVector;
  init(game: unknown, players: number[], params: unknown): void;
  closeCache(): void;
  getNumSpatialFeatures(): number;
  getNumAspatialFeatures(): number;
  findFeatureIndexForString(s: string): number;
  aspatialFeatures(): unknown[];
  spatialFeatures(): unknown[];
  featureSetFile(): string;
}

/** @java features.FeatureVector */
export interface FeatureVector {
  aspatialFeatureValues(): FVector;
  activeSpatialFeatureIndices(): { size(): number; getQuick(j: number): number };
}

/** @java other.AI */
export abstract class AI {
  /** @java AI.friendlyName */
  protected friendlyName: string = "";

  /**
   * @java AI.initAI(Game, int)
   */
  public initAI(_game: unknown, _playerID: number): void {
    // base implementation — do nothing
  }

  /**
   * @java AI.closeAI()
   */
  public closeAI(): void {
    // base implementation — do nothing
  }

  /**
   * @java AI.supportsGame(Game)
   */
  public supportsGame(_game: unknown): boolean {
    return true;
  }

  /**
   * @java AI.selectAction(Game, Context, double, int, int)
   */
  public abstract selectAction(
    game: unknown,
    context: unknown,
    maxSeconds: number,
    maxIterations: number,
    maxDepth: number
  ): Move;
}

/**
 * A policy is something that can compute distributions over actions in a given
 * state (presumably using some form of function approximation).
 *
 * @java policies.Policy
 */
export abstract class Policy extends AI {

  //-------------------------------------------------------------------------

  /**
   * @param context
   * @param actions
   * @param thresholded
   * @return Probability distribution over the given list of actions in the given state.
   * @java Policy.computeDistribution(Context, FastArrayList, boolean)
   */
  public abstract computeDistribution(
    context: unknown,
    actions: FastArrayList<Move>,
    thresholded: boolean
  ): FVector;

  //-------------------------------------------------------------------------

  /**
   * @param context
   * @param move
   * @return Logit for a single move in a single state
   * @java Policy.computeLogit(Context, Move)
   */
  public abstract computeLogit(context: unknown, move: Move): number;

  //-------------------------------------------------------------------------

  /**
   * Run a play-out using this policy.
   * @java PlayoutStrategy.runPlayout(MCTS, Context)
   */
  public abstract runPlayout(mcts: unknown, context: unknown): unknown;

  /**
   * @java PlayoutStrategy.playoutSupportsGame(Game)
   */
  public abstract playoutSupportsGame(game: unknown): boolean;

  /**
   * @java PlayoutStrategy.backpropFlags()
   */
  public abstract backpropFlags(): number;

  /**
   * Customise this policy from an array of string inputs.
   * @java AI.customise(String[])
   */
  public abstract customise(inputs: string[]): void;

  //-------------------------------------------------------------------------
}
