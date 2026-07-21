// @java AI/src/training/feature_discovery/FeatureSetExpander.java

/**
 * Interface for an object that can create expanded versions of feature sets.
 *
 * @java training/feature_discovery/FeatureSetExpander.java
 * @author Dennis Soemers
 */

// Escape-hatch types for not-yet-ported Java dependencies

/** @java features.feature_sets.BaseFeatureSet */
export type BaseFeatureSet = {
  getNumSpatialFeatures(): number;
  spatialFeatures(): SpatialFeature[];
  getActiveSpatialFeatureInstances(
    state: unknown,
    lastFromPos: number,
    lastToPos: number,
    fromPos: number,
    toPos: number,
    mover: number
  ): FeatureInstance[];
  createExpandedFeatureSet(game: Game, feature: SpatialFeature): BaseFeatureSet | null;
  getNumAspatialFeatures(): number;
};

/** @java features.spatial.SpatialFeature */
export type SpatialFeature = {
  spatialFeatureSetIndex(): number;
  isReactive(): boolean;
  toString(): string;
  equals(other: SpatialFeature): boolean;
  hashCode(): number;
};

/** @java features.spatial.SpatialFeature.combineFeatures */
export type SpatialFeatureCombinerT = {
  combineFeatures(game: Game, a: FeatureInstance, b: FeatureInstance): SpatialFeature;
};

/** @java features.spatial.instances.FeatureInstance */
export type FeatureInstance = {
  feature(): SpatialFeature;
  rotation(): number;
  reflection(): number;
  anchorSite(): number;
  equals(other: FeatureInstance): boolean;
};

/** @java game.Game */
export type Game = {
  name(): string;
};

/** @java training.ExperienceSample */
export type ExperienceSample = {
  generateFeatureVectors(featureSet: BaseFeatureSet): FeatureVector[];
  gameState(): { mover(): number };
  expertDistribution(): unknown;
  lastFromPos(): number;
  lastToPos(): number;
  moves(): FastArrayList<Move>;
  winningMoves(): BitSet;
  losingMoves(): BitSet;
  antiDefeatingMoves(): BitSet;
};

/** @java features.FeatureVector */
export type FeatureVector = {
  activeSpatialFeatureIndices(): TIntArrayList;
  aspatialFeatureValues(): FVector;
};

/** @java policies.softmax.SoftmaxPolicyLinear */
export type SoftmaxPolicyLinear = {
  computeDistribution(featureVectors: FeatureVector[], mover: number): FVector;
};

/** @java main.collections.FVector */
export type FVector = {
  get(i: number): number;
  set(i: number, v: number): void;
  copy(): FVector;
  abs(): void;
  sum(): number;
  min(): number;
  max(): number;
  softmax(temp: number): void;
  normalise(): void;
  sampleFromDistribution(): number;
  updateSoftmaxInvalidate(idx: number): void;
  dim(): number;
  sign(): void;
};

/** @java main.collections.FastArrayList */
export type FastArrayList<T> = {
  size(): number;
  get(i: number): T;
};

/** @java other.move.Move */
export type Move = {
  mover(): number;
};

/** @java gnu.trove.list.array.TIntArrayList */
export type TIntArrayList = {
  sort(): void;
  size(): number;
  getQuick(i: number): number;
  add(v: number): void;
  isEmpty(): boolean;
};

/** @java gnu.trove.list.array.TDoubleArrayList */
export type TDoubleArrayList = {
  getQuick(i: number): number;
  size(): number;
  add(v: number): void;
};

/** @java java.util.BitSet */
export type BitSet = {
  nextSetBit(from: number): number;
  get(i: number): boolean;
};

/** @java training.expert_iteration.params.FeatureDiscoveryParams */
export type FeatureDiscoveryParams = {
  criticalValueCorrConf: number;
};

/** @java training.expert_iteration.params.ObjectiveParams */
export type ObjectiveParams = Record<string, unknown>;

/** @java utils.experiments.InterruptableExperiment */
export type InterruptableExperiment = {
  logLine(writer: PrintWriter, msg: string): void;
};

/** @java java.io.PrintWriter */
export type PrintWriter = {
  println(s: string): void;
};

/**
 * Wrapper class for a pair of combined feature instances and a score.
 *
 * @java training.feature_discovery.FeatureSetExpander.ScoredFeatureInstancePair
 */
export class ScoredFeatureInstancePair {
  /** @java ScoredFeatureInstancePair.pair */
  public readonly pair: CombinableFeatureInstancePair;
  /** @java ScoredFeatureInstancePair.score */
  public readonly score: number;

  /**
   * @java ScoredFeatureInstancePair(CombinableFeatureInstancePair, double)
   */
  public constructor(pair: CombinableFeatureInstancePair, score: number) {
    this.pair = pair;
    this.score = score;
  }
}

// Escape hatch for SpatialFeature.combineFeatures static method
const SpatialFeatureCombiner = null as unknown as SpatialFeatureCombinerT;

/**
 * Wrapper class for two feature instances that could be combined, with
 * hashCode() and equals() implementations that should be invariant to
 * small differences in instantiations.
 *
 * @java training.feature_discovery.FeatureSetExpander.CombinableFeatureInstancePair
 */
export class CombinableFeatureInstancePair {
  /** @java CombinableFeatureInstancePair.a */
  public readonly a: FeatureInstance;
  /** @java CombinableFeatureInstancePair.b */
  public readonly b: FeatureInstance;
  /** @java CombinableFeatureInstancePair.combinedFeature */
  public readonly combinedFeature: SpatialFeature;
  /** @java CombinableFeatureInstancePair.cachedHash */
  private cachedHash: number = -2147483648; // Integer.MIN_VALUE

  /**
   * @java CombinableFeatureInstancePair(Game, FeatureInstance, FeatureInstance)
   */
  public constructor(game: Game, a: FeatureInstance, b: FeatureInstance) {
    this.a = a;
    this.b = b;

    if (a === b) {
      this.combinedFeature = a.feature();
    } else {
      if (a.feature().spatialFeatureSetIndex() < b.feature().spatialFeatureSetIndex()) {
        this.combinedFeature = SpatialFeatureCombiner.combineFeatures(game, a, b);
      } else if (b.feature().spatialFeatureSetIndex() < a.feature().spatialFeatureSetIndex()) {
        this.combinedFeature = SpatialFeatureCombiner.combineFeatures(game, b, a);
      } else {
        if (a.reflection() > b.reflection()) {
          this.combinedFeature = SpatialFeatureCombiner.combineFeatures(game, a, b);
        } else if (b.reflection() > a.reflection()) {
          this.combinedFeature = SpatialFeatureCombiner.combineFeatures(game, b, a);
        } else {
          if (a.rotation() < b.rotation()) {
            this.combinedFeature = SpatialFeatureCombiner.combineFeatures(game, a, b);
          } else if (b.rotation() < a.rotation()) {
            this.combinedFeature = SpatialFeatureCombiner.combineFeatures(game, b, a);
          } else {
            if (a.anchorSite() < b.anchorSite()) {
              this.combinedFeature = SpatialFeatureCombiner.combineFeatures(game, a, b);
            } else if (b.anchorSite() < a.anchorSite()) {
              this.combinedFeature = SpatialFeatureCombiner.combineFeatures(game, b, a);
            } else {
              this.combinedFeature = SpatialFeatureCombiner.combineFeatures(game, a, b);
            }
          }
        }
      }
    }
  }

  /** @java CombinableFeatureInstancePair.equals(Object) */
  public equals(other: CombinableFeatureInstancePair): boolean {
    return this.combinedFeature.equals(other.combinedFeature);
  }

  /** @java CombinableFeatureInstancePair.hashCode() */
  public hashCode(): number {
    if (this.cachedHash === -2147483648) {
      this.cachedHash = this.combinedFeature.hashCode();
    }
    return this.cachedHash;
  }

  /** @java CombinableFeatureInstancePair.toString() */
  public toString(): string {
    return `${String(this.combinedFeature)} (from ${String(this.a)} and ${String(this.b)})`;
  }
}

/**
 * Interface for an object that can create expanded versions of feature sets.
 *
 * @java training.feature_discovery.FeatureSetExpander
 */
export interface FeatureSetExpander {
  /**
   * @java FeatureSetExpander.expandFeatureSet(...)
   */
  expandFeatureSet(
    batch: ExperienceSample[],
    featureSet: BaseFeatureSet,
    policy: SoftmaxPolicyLinear,
    game: Game,
    featureDiscoveryMaxNumFeatureInstances: number,
    objectiveParams: ObjectiveParams,
    featureDiscoveryParams: FeatureDiscoveryParams,
    featureActiveRatios: TDoubleArrayList,
    logWriter: PrintWriter,
    experiment: InterruptableExperiment
  ): BaseFeatureSet | null;
}
