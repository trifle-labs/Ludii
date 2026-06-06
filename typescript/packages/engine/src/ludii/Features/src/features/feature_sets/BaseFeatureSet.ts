// @java Features/src/features/feature_sets/BaseFeatureSet.java

/**
 * Abstract class for Feature Sets (basically; things that can compute feature
 * vectors for game states + actions).
 *
 * @java features/feature_sets/BaseFeatureSet.java
 * @author Dennis Soemers
 */

import type { AspatialFeature } from "../aspatial/AspatialFeature.js";
export type { AspatialFeature };

/** @java other.state.State */
export type State = unknown;

/** @java other.move.Move */
export type Move = {
  isSwap(): boolean;
  isPass(): boolean;
  mover(): number;
};

/** @java game.Game */
export type Game = unknown;

// Escape-hatch types for not-yet-ported Java dependencies

/** @java features.spatial.SpatialFeature */
export type SpatialFeature = {
  spatialFeatureSetIndex(): number;
  setSpatialFeatureSetIndex(i: number): void;
  isReactive(): boolean;
  toString(): string;
  equals(other: SpatialFeature): boolean;
  instantiateFeature(
    game: Game,
    containerState: ContainerState,
    player: number,
    anchor: number,
    from: number,
    to: number,
    lastFrom: number,
    lastTo: number
  ): FeatureInstance[];
  pattern(): { allowedRotations(): TFloatArrayList | null };
  rotatedCopy(rotation: number): SpatialFeature;
  combineFeatures?(game: Game, a: FeatureInstance, b: FeatureInstance): SpatialFeature;
};

/** @java features.spatial.instances.FeatureInstance */
export type FeatureInstance = {
  feature(): SpatialFeature;
  lastFrom(): number;
  lastTo(): number;
  from(): number;
  to(): number;
  matches(state: State): boolean;
  anchorSite(): number;
  hasNoTests(): boolean;
  generalises(other: FeatureInstance): boolean;
  generateAtomicPropositions(): AtomicProposition[];
  mustEmpty(): ChunkSet | null;
  mustNotEmpty(): ChunkSet | null;
  mustWhoMask(): ChunkSet | null;
  mustNotWhoMask(): ChunkSet | null;
  mustWhatMask(): ChunkSet | null;
  mustNotWhatMask(): ChunkSet | null;
  mustWho(): ChunkSet | null;
  mustWhat(): ChunkSet | null;
  removeTests(ancestor: FeatureInstance): void;
  graphElementType(): GraphElementType;
};

/** @java features.spatial.instances.AtomicProposition */
export type AtomicProposition = {
  matches(state: State): boolean;
  graphElementType(): GraphElementType;
  stateVectorType(): StateVectorType;
  testedSite(): number;
  addMaskTo(chunkSet: ChunkSet | null): void;
  provesIfTrue(other: AtomicProposition, game: Game): boolean;
  disprovesIfTrue(other: AtomicProposition, game: Game): boolean;
  provesIfFalse(other: AtomicProposition, game: Game): boolean;
  disprovesIfFalse(other: AtomicProposition, game: Game): boolean;
};

/** @java util.graph.GraphElement.Type */
export type GraphElementType = "Cell" | "Vertex" | "Edge";

/** @java features.spatial.instances.AtomicProposition.StateVectorTypes */
export type StateVectorType = "Empty" | "Who" | "What";

/** @java main.collections.ChunkSet */
export type ChunkSet = {
  chunkSize(): number;
  or(other: ChunkSet): void;
  and(other: ChunkSet): void;
  andNot(other: ChunkSet): void;
  intersects(other: ChunkSet): boolean;
  matches(mask: ChunkSet, value: ChunkSet): boolean;
  clone(): ChunkSet;
};

/** @java other.state.container.ContainerState */
export type ContainerState = {
  emptyChunkSetCell(): ChunkSet | null;
  emptyChunkSetVertex(): ChunkSet | null;
  emptyChunkSetEdge(): ChunkSet | null;
  chunkSizeWhoCell(): number;
  chunkSizeWhoVertex(): number;
  chunkSizeWhoEdge(): number;
  chunkSizeWhatCell(): number;
  chunkSizeWhatVertex(): number;
  chunkSizeWhatEdge(): number;
};

/** @java main.collections.FVector */
export type FVector = {
  get(i: number): number;
  dim(): number;
  range(from: number, to: number): FVector;
  equals(other: FVector): boolean;
  copy(): FVector;
  abs(): void;
};

/** @java features.WeightVector */
export type WeightVector = {
  allWeights(): FVector;
};

/** @java features.FeatureVector */
export type FeatureVector = {
  activeSpatialFeatureIndices(): TIntArrayList;
  aspatialFeatureValues(): FVector;
};

/** @java gnu.trove.list.array.TIntArrayList */
export type TIntArrayList = {
  size(): number;
  getQuick(i: number): number;
  add(v: number): void;
  toArray(): number[];
  contains(v: number): boolean;
  iterator(): TIntIterator;
  sort(): void;
};

/** @java gnu.trove.iterator.TIntIterator */
export type TIntIterator = {
  hasNext(): boolean;
  next(): number;
};

/** @java gnu.trove.list.array.TFloatArrayList */
export type TFloatArrayList = {
  size(): number;
  getQuick(i: number): number;
};

/** @java main.collections.FastArrayList */
export type FastArrayList<T> = {
  size(): number;
  get(i: number): T;
};

/** @java other.context.Context */
export type Context = {
  state(): { mover(): number; containerStates(): ContainerState[] };
  trial(): { lastMove(): Move };
};

/** @java features.spatial.cache.footprints.BaseFootprint */
export type BaseFootprint = {
  union(other: BaseFootprint): void;
};

/** @java features.spatial.cache.ActiveFeaturesCache */
export type ActiveFeaturesCache = {
  getCachedActiveFeatures(
    featureSet: BaseFeatureSet,
    state: State,
    from: number,
    to: number,
    player: number
  ): number[] | null;
  cache(state: State, from: number, to: number, indices: number[], player: number): void;
  close(): void;
};

/** @java features.spatial.FeatureUtils */
export type FeatureUtils = {
  fromPos(move: Move | null): number;
  toPos(move: Move | null): number;
};

// Escape hatch for FeatureUtils static methods
const FeatureUtilsImpl = null as unknown as FeatureUtils;

/**
 * Different implementations we have for evaluating feature sets.
 *
 * @java features.feature_sets.BaseFeatureSet.FeatureSetImplementations
 */
export enum FeatureSetImplementations {
  NAIVE = "NAIVE",
  TREE = "TREE",
  SPATTERNET = "SPATTERNET",
  JITSPATTERNET = "JITSPATTERNET",
}

/**
 * Abstract class for Feature Sets.
 *
 * @java features.feature_sets.BaseFeatureSet
 */
export abstract class BaseFeatureSet {

  //-------------------------------------------------------------------------

  /** Only spatial features with an absolute value greater than this are considered relevant for AI */
  public static readonly SPATIAL_FEATURE_WEIGHT_THRESHOLD: number = 0.001;

  /** Reference to game for which we currently have instantiated features */
  protected game: WeakRef<object> | null = null;

  /** Vector of feature weights for which we have last instantiated features */
  protected spatialFeatureInitWeights: FVector | null = null;

  //-------------------------------------------------------------------------

  /** Array of aspatial features */
  protected aspatialFeatures!: AspatialFeature[];

  /** Array of features */
  protected spatialFeatures!: SpatialFeature[];

  //-------------------------------------------------------------------------

  /**
   * @return The array of aspatial features contained in this feature set
   * @java BaseFeatureSet.aspatialFeatures()
   */
  public aspatialFeaturesArr(): AspatialFeature[] {
    return this.aspatialFeatures;
  }

  /**
   * @return The array of spatial features contained in this feature set
   * @java BaseFeatureSet.spatialFeatures()
   */
  public spatialFeaturesArr(): SpatialFeature[] {
    return this.spatialFeatures;
  }

  /**
   * @return The number of aspatial features in this feature set
   * @java BaseFeatureSet.getNumAspatialFeatures()
   */
  public getNumAspatialFeatures(): number {
    return this.aspatialFeatures.length;
  }

  /**
   * @return The number of spatial features in this feature set
   * @java BaseFeatureSet.getNumSpatialFeatures()
   */
  public getNumSpatialFeatures(): number {
    return this.spatialFeatures.length;
  }

  /**
   * @return Number of features in this feature set (spatial + aspatial features)
   * @java BaseFeatureSet.getNumFeatures()
   */
  public getNumFeatures(): number {
    return this.spatialFeatures.length + this.aspatialFeatures.length;
  }

  /**
   * @return Weak reference to game for which we last initialised
   * @java BaseFeatureSet.gameRef()
   */
  public gameRef(): WeakRef<object> | null {
    return this.game;
  }

  /**
   * Lets the feature set initialise itself for a given game, array of supported players, and vector of weights.
   * @java BaseFeatureSet.init(Game, int[], WeightVector)
   */
  public init(newGame: Game, supportedPlayers: number[], weights: WeightVector | null): void {
    let spatialOnlyWeights: FVector | null;

    if (weights === null)
      spatialOnlyWeights = null;
    else
      spatialOnlyWeights = weights.allWeights().range(
        this.aspatialFeatures.length,
        weights.allWeights().dim()
      );

    const currentGame = this.game?.deref() as Game | undefined;
    if ((currentGame as unknown) === (newGame as unknown)) {
      if (this.spatialFeatureInitWeights === null && spatialOnlyWeights === null)
        return;  // Nothing to do, already instantiated
      else if (this.spatialFeatureInitWeights !== null && this.spatialFeatureInitWeights.equals(spatialOnlyWeights!))
        return;  // Also nothing to do here
    }

    this.game = new WeakRef(newGame as object);

    if (spatialOnlyWeights === null)
      this.spatialFeatureInitWeights = null;
    else
      this.spatialFeatureInitWeights = spatialOnlyWeights;

    // Need to instantiate
    this.instantiateFeatures(supportedPlayers);
  }

  /**
   * Lets the feature set instantiate its features
   * @java BaseFeatureSet.instantiateFeatures(int[])
   */
  protected abstract instantiateFeatures(supportedPlayers: number[]): void;

  /**
   * Closes / cleans up cache of active features
   * @java BaseFeatureSet.closeCache()
   */
  public abstract closeCache(): void;

  /**
   * @java BaseFeatureSet.generateFootprint(State, int, int, int)
   */
  public abstract generateFootprint(
    state: State,
    from: number,
    to: number,
    player: number
  ): BaseFootprint;

  //-------------------------------------------------------------------------

  /**
   * @java BaseFeatureSet.computeSparseSpatialFeatureVector(Context, Move, boolean)
   */
  public computeSparseSpatialFeatureVector(
    context: Context,
    action: Move,
    thresholded: boolean
  ): TIntArrayList;

  /**
   * @java BaseFeatureSet.computeSparseSpatialFeatureVector(State, Move, Move, boolean)
   */
  public computeSparseSpatialFeatureVector(
    state: State,
    lastDecisionMove: Move,
    action: Move,
    thresholded: boolean
  ): TIntArrayList;

  public computeSparseSpatialFeatureVector(
    stateOrContext: State | Context,
    lastMoveOrAction: Move,
    actionOrThresholded: Move | boolean,
    thresholded?: boolean
  ): TIntArrayList {
    if (typeof actionOrThresholded === "boolean") {
      // computeSparseSpatialFeatureVector(Context, Move, boolean)
      const context = stateOrContext as Context;
      const action = lastMoveOrAction;
      const thresh = actionOrThresholded;
      return this.computeSparseSpatialFeatureVector(
        context.state() as unknown as State,
        context.trial().lastMove(),
        action,
        thresh
      );
    } else {
      // computeSparseSpatialFeatureVector(State, Move, Move, boolean)
      const state = stateOrContext as State;
      const lastDecisionMove = lastMoveOrAction;
      const action = actionOrThresholded;
      const thresh = thresholded!;

      const lastFrom = FeatureUtilsImpl.fromPos(lastDecisionMove);
      const lastTo = FeatureUtilsImpl.toPos(lastDecisionMove);
      const from = FeatureUtilsImpl.fromPos(action);
      const to = FeatureUtilsImpl.toPos(action);

      return this.getActiveSpatialFeatureIndices(
        state,
        lastFrom,
        lastTo,
        from,
        to,
        (action as Move).mover(),
        thresh
      );
    }
  }

  /**
   * @java BaseFeatureSet.computeSparseSpatialFeatureVectors(Context, FastArrayList, boolean)
   */
  public computeSparseSpatialFeatureVectors(
    context: Context,
    actions: FastArrayList<Move>,
    thresholded: boolean
  ): TIntArrayList[];

  /**
   * @java BaseFeatureSet.computeSparseSpatialFeatureVectors(State, Move, FastArrayList, boolean)
   */
  public computeSparseSpatialFeatureVectors(
    state: State,
    lastDecisionMove: Move,
    actions: FastArrayList<Move>,
    thresholded: boolean
  ): TIntArrayList[];

  public computeSparseSpatialFeatureVectors(
    stateOrContext: State | Context,
    lastMoveOrActions: Move | FastArrayList<Move>,
    actionsOrThresholded: FastArrayList<Move> | boolean,
    thresholded?: boolean
  ): TIntArrayList[] {
    if (typeof actionsOrThresholded === "boolean") {
      // computeSparseSpatialFeatureVectors(Context, FastArrayList, boolean)
      const context = stateOrContext as Context;
      const actions = lastMoveOrActions as FastArrayList<Move>;
      const thresh = actionsOrThresholded;
      return this.computeSparseSpatialFeatureVectors(
        context.state() as unknown as State,
        context.trial().lastMove(),
        actions,
        thresh
      );
    } else {
      // computeSparseSpatialFeatureVectors(State, Move, FastArrayList, boolean)
      const state = stateOrContext as State;
      const lastDecisionMove = lastMoveOrActions as Move;
      const actions = actionsOrThresholded as FastArrayList<Move>;
      const thresh = thresholded!;

      const sparseFeatureVectors: TIntArrayList[] = new Array(actions.size());

      for (let i = 0; i < actions.size(); ++i) {
        const action = actions.get(i);
        sparseFeatureVectors[i] = this.computeSparseSpatialFeatureVector(
          state,
          lastDecisionMove,
          action,
          thresh
        );
      }

      return sparseFeatureVectors;
    }
  }

  /**
   * @java BaseFeatureSet.computeActiveFeatures(Context, Move)
   */
  public computeActiveFeatures(context: Context, move: Move): (AspatialFeature | SpatialFeature)[] {
    const activeFeatures: (AspatialFeature | SpatialFeature)[] = [];

    const lastDecisionMove = context.trial().lastMove();
    const lastFrom = FeatureUtilsImpl.fromPos(lastDecisionMove);
    const lastTo = FeatureUtilsImpl.toPos(lastDecisionMove);
    const from = FeatureUtilsImpl.fromPos(move);
    const to = FeatureUtilsImpl.toPos(move);
    const activeSpatialFeatureIndices = this.getActiveSpatialFeatureIndices(
      context.state() as unknown as State,
      lastFrom,
      lastTo,
      from,
      to,
      move.mover(),
      false
    );

    for (let i = 0; i < activeSpatialFeatureIndices.size(); ++i) {
      const sf = this.spatialFeatures[activeSpatialFeatureIndices.getQuick(i)];
      if (sf !== undefined) activeFeatures.push(sf);
    }

    for (const feature of this.aspatialFeatures) {
      if (feature.featureVal(context.state() as unknown as State, move) !== 0.0)
        activeFeatures.push(feature);
    }

    return activeFeatures;
  }

  /**
   * @java BaseFeatureSet.computeFeatureVectors(Context, FastArrayList, boolean)
   */
  public computeFeatureVectors(
    context: Context,
    moves: FastArrayList<Move>,
    thresholded: boolean
  ): FeatureVector[];

  /**
   * @java BaseFeatureSet.computeFeatureVectors(State, Move, FastArrayList, boolean)
   */
  public computeFeatureVectors(
    state: State,
    lastMove: Move,
    moves: FastArrayList<Move>,
    thresholded: boolean
  ): FeatureVector[];

  public computeFeatureVectors(
    stateOrContext: State | Context,
    lastMoveOrMoves: Move | FastArrayList<Move>,
    movesOrThresholded: FastArrayList<Move> | boolean,
    thresholded?: boolean
  ): FeatureVector[] {
    if (typeof movesOrThresholded === "boolean") {
      // computeFeatureVectors(Context, FastArrayList, boolean)
      const context = stateOrContext as Context;
      const moves = lastMoveOrMoves as FastArrayList<Move>;
      const thresh = movesOrThresholded;
      const featureVectors: FeatureVector[] = new Array(moves.size());
      for (let i = 0; i < moves.size(); ++i) {
        featureVectors[i] = this.computeFeatureVector(context, moves.get(i), thresh);
      }
      return featureVectors;
    } else {
      // computeFeatureVectors(State, Move, FastArrayList, boolean)
      const state = stateOrContext as State;
      const lastMove = lastMoveOrMoves as Move;
      const moves = movesOrThresholded as FastArrayList<Move>;
      const thresh = thresholded!;

      const lastFrom = FeatureUtilsImpl.fromPos(lastMove);
      const lastTo = FeatureUtilsImpl.toPos(lastMove);

      const featureVectors: FeatureVector[] = new Array(moves.size());
      for (let i = 0; i < moves.size(); ++i) {
        const move = moves.get(i);
        const from = FeatureUtilsImpl.fromPos(move);
        const to = FeatureUtilsImpl.toPos(move);

        const activeSpatialFeatureIndices = this.getActiveSpatialFeatureIndices(
          state,
          lastFrom,
          lastTo,
          from,
          to,
          move.mover(),
          thresh
        );

        const aspatialFeatureValues: number[] = new Array(this.aspatialFeatures.length);
        for (let j = 0; j < this.aspatialFeatures.length; ++j) {
          aspatialFeatureValues[j] = this.aspatialFeatures[j]!.featureVal(state, move);
        }

        featureVectors[i] = this._makeFeatureVector(activeSpatialFeatureIndices, aspatialFeatureValues);
      }
      return featureVectors;
    }
  }

  /**
   * @java BaseFeatureSet.computeFeatureVector(Context, Move, boolean)
   */
  public computeFeatureVector(context: Context, move: Move, thresholded: boolean): FeatureVector {
    const lastDecisionMove = context.trial().lastMove();
    const lastFrom = FeatureUtilsImpl.fromPos(lastDecisionMove);
    const lastTo = FeatureUtilsImpl.toPos(lastDecisionMove);
    const from = FeatureUtilsImpl.fromPos(move);
    const to = FeatureUtilsImpl.toPos(move);
    const activeSpatialFeatureIndices = this.getActiveSpatialFeatureIndices(
      context.state() as unknown as State,
      lastFrom,
      lastTo,
      from,
      to,
      move.mover(),
      thresholded
    );

    const aspatialFeatureValues: number[] = new Array(this.aspatialFeatures.length);
    for (let i = 0; i < this.aspatialFeatures.length; ++i) {
      aspatialFeatureValues[i] = this.aspatialFeatures[i]!.featureVal(
        context.state() as unknown as State,
        move
      );
    }

    return this._makeFeatureVector(activeSpatialFeatureIndices, aspatialFeatureValues);
  }

  /** Helper to construct a FeatureVector escape hatch */
  private _makeFeatureVector(indices: TIntArrayList, aspatialValues: number[]): FeatureVector {
    return {
      activeSpatialFeatureIndices: () => indices,
      aspatialFeatureValues: () => ({
        get: (i: number) => aspatialValues[i],
        dim: () => aspatialValues.length,
        range: () => { throw new Error("not impl"); },
        equals: () => false,
        copy: () => { throw new Error("not impl"); },
        abs: () => {},
      } as FVector),
    };
  }

  //-------------------------------------------------------------------------

  /**
   * @java BaseFeatureSet.getActiveSpatialFeatureIndices(State, int, int, int, int, int, boolean)
   */
  public abstract getActiveSpatialFeatureIndices(
    state: State,
    lastFrom: number,
    lastTo: number,
    from: number,
    to: number,
    player: number,
    thresholded: boolean
  ): TIntArrayList;

  /**
   * @java BaseFeatureSet.getActiveSpatialFeatureInstances(State, int, int, int, int, int)
   */
  public abstract getActiveSpatialFeatureInstances(
    state: State,
    lastFrom: number,
    lastTo: number,
    from: number,
    to: number,
    player: number
  ): FeatureInstance[];

  //-------------------------------------------------------------------------

  /**
   * @java BaseFeatureSet.createExpandedFeatureSet(Game, SpatialFeature)
   */
  public abstract createExpandedFeatureSet(
    targetGame: Game,
    newFeature: SpatialFeature
  ): BaseFeatureSet | null;

  /**
   * @java BaseFeatureSet.createExpandedFeatureSet(Game, List<SpatialFeature>)
   */
  public createExpandedFeatureSetFromList(
    targetGame: Game,
    newFeatures: SpatialFeature[]
  ): BaseFeatureSet {
    let featureSet: BaseFeatureSet = this;

    for (const feature of newFeatures) {
      const expanded = featureSet.createExpandedFeatureSet(targetGame, feature);
      if (expanded !== null) {
        featureSet = expanded;
      }
    }

    return featureSet;
  }

  //-------------------------------------------------------------------------

  /**
   * @java BaseFeatureSet.findFeatureIndexForString(String)
   */
  public findFeatureIndexForString(s: string): number {
    for (let i = 0; i < this.aspatialFeatures.length; ++i) {
      if (this.aspatialFeatures[i]!.toString() === s)
        return i;
    }

    for (let i = 0; i < this.spatialFeatures.length; ++i) {
      if (this.spatialFeatures[i]!.toString() === s)
        return i;
    }

    return -1;
  }

  //-------------------------------------------------------------------------

  /**
   * Writes the feature set to a file (no-op in TS context)
   * @java BaseFeatureSet.toFile(String)
   */
  public toFile(_filepath: string): void {
    // No-op: file I/O not available in this context
  }

  public toString(): string {
    const sb: string[] = [];
    for (const feature of this.aspatialFeatures) {
      sb.push(feature.toString() + "\n");
    }
    for (const feature of this.spatialFeatures) {
      sb.push(feature.toString() + "\n");
    }
    return sb.join("");
  }

  //-------------------------------------------------------------------------

  //-------------------------------------------------------------------------

  /**
   * Interface for move features keys (either proactive or reactive)
   *
   * @java features.feature_sets.BaseFeatureSet.MoveFeaturesKey
   */
  // (expressed as abstract class or interface below)

  //-------------------------------------------------------------------------
}

/**
 * Interface for move features keys (either proactive or reactive)
 *
 * @java features.feature_sets.BaseFeatureSet.MoveFeaturesKey
 */
export interface MoveFeaturesKey {
  /** @return Player index for the key */
  playerIdx(): number;

  /** @return From position for the key */
  from(): number;

  /** @return To position for the key */
  to(): number;

  /** @return Last from position for the key */
  lastFrom(): number;

  /** @return Last to position for the key */
  lastTo(): number;
}

/**
 * Small class for objects used as keys in HashMaps related to proactive features.
 *
 * @java features.feature_sets.BaseFeatureSet.ProactiveFeaturesKey
 */
export class ProactiveFeaturesKey implements MoveFeaturesKey {
  //--------------------------------------------------------------------------

  /** Player index */
  private _playerIdx: number = -1;

  /** from-position */
  private _from: number = -1;

  /** to-position */
  private _to: number = -1;

  /** Cached hash code */
  private cachedHashCode: number = -1;

  //--------------------------------------------------------------------------

  /**
   * Default constructor
   * @java ProactiveFeaturesKey()
   */
  public constructor();

  /**
   * Copy constructor
   * @java ProactiveFeaturesKey(ProactiveFeaturesKey)
   */
  public constructor(other: ProactiveFeaturesKey);

  public constructor(other?: ProactiveFeaturesKey) {
    if (other !== undefined) {
      this.resetData(other._playerIdx, other._from, other._to);
    }
  }

  //--------------------------------------------------------------------------

  /**
   * Resets the data in this object and recomputes cached hash code
   * @java ProactiveFeaturesKey.resetData(int, int, int)
   */
  public resetData(p: number, f: number, t: number): void {
    this._playerIdx = p;
    this._from = f;
    this._to = t;

    // Create and cache hash code
    const prime = 31;
    let result = 17;
    result = (prime * result + f) | 0;
    result = (prime * result + p) | 0;
    result = (prime * result + t) | 0;
    this.cachedHashCode = result;
  }

  //--------------------------------------------------------------------------

  public playerIdx(): number { return this._playerIdx; }
  public from(): number { return this._from; }
  public to(): number { return this._to; }
  public lastFrom(): number { return -1; }
  public lastTo(): number { return -1; }

  //--------------------------------------------------------------------------

  public hashCode(): number {
    return this.cachedHashCode;
  }

  public equals(obj: ProactiveFeaturesKey): boolean {
    if (this === obj) return true;
    return (
      this._playerIdx === obj._playerIdx &&
      this._from === obj._from &&
      this._to === obj._to
    );
  }

  public toString(): string {
    return `[ProactiveFeaturesKey: ${this._playerIdx}, ${this._from}, ${this._to}]`;
  }

  //--------------------------------------------------------------------------
}

/**
 * Small class for objects used as keys in HashMaps related to reactive features.
 *
 * @java features.feature_sets.BaseFeatureSet.ReactiveFeaturesKey
 */
export class ReactiveFeaturesKey implements MoveFeaturesKey {
  //--------------------------------------------------------------------------

  /** Player index */
  private _playerIdx: number = -1;

  /** Last from-position */
  private _lastFrom: number = -1;

  /** Last to-position */
  private _lastTo: number = -1;

  /** from-position */
  private _from: number = -1;

  /** to-position */
  private _to: number = -1;

  /** Cached hash code */
  private cachedHashCode: number = -1;

  //--------------------------------------------------------------------------

  /**
   * Default constructor
   * @java ReactiveFeaturesKey()
   */
  public constructor();

  /**
   * Copy constructor
   * @java ReactiveFeaturesKey(ReactiveFeaturesKey)
   */
  public constructor(other: ReactiveFeaturesKey);

  public constructor(other?: ReactiveFeaturesKey) {
    if (other !== undefined) {
      this.resetData(other._playerIdx, other._lastFrom, other._lastTo, other._from, other._to);
    }
  }

  //--------------------------------------------------------------------------

  /**
   * Resets the data in this object and recomputes cached hash code
   * @java ReactiveFeaturesKey.resetData(int, int, int, int, int)
   */
  public resetData(p: number, lastF: number, lastT: number, f: number, t: number): void {
    this._playerIdx = p;
    this._lastFrom = lastF;
    this._lastTo = lastT;
    this._from = f;
    this._to = t;

    // Create and cache hash code
    const prime = 31;
    let result = 17;
    result = (prime * result + f) | 0;
    result = (prime * result + lastF) | 0;
    result = (prime * result + lastT) | 0;
    result = (prime * result + p) | 0;
    result = (prime * result + t) | 0;
    this.cachedHashCode = result;
  }

  //--------------------------------------------------------------------------

  public playerIdx(): number { return this._playerIdx; }
  public from(): number { return this._from; }
  public to(): number { return this._to; }
  public lastFrom(): number { return this._lastFrom; }
  public lastTo(): number { return this._lastTo; }

  //--------------------------------------------------------------------------

  public hashCode(): number {
    return this.cachedHashCode;
  }

  public equals(obj: ReactiveFeaturesKey): boolean {
    if (this === obj) return true;
    return (
      this._playerIdx === obj._playerIdx &&
      this._lastFrom === obj._lastFrom &&
      this._lastTo === obj._lastTo &&
      this._from === obj._from &&
      this._to === obj._to
    );
  }

  public toString(): string {
    return `[ReactiveFeaturesKey: ${this._playerIdx}, ${this._from}, ${this._to}, ${this._lastFrom}, ${this._lastTo}]`;
  }

  //--------------------------------------------------------------------------
}
