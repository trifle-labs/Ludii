// @java Features/src/features/feature_sets/network/JITSPatterNetFeatureSet.java

/**
 * Implementation of Feature Set based on SPatterNets, with JIT (Just-In-Time)
 * construction of the SPatterNets.
 *
 * NOTE: for better JIT behaviour, we assume that every feature has either
 * the to or the from position as anchor.
 *
 * @java features/feature_sets/network/JITSPatterNetFeatureSet.java
 * @author Dennis Soemers
 */

import {
  BaseFeatureSet,
  ProactiveFeaturesKey,
  ReactiveFeaturesKey,
} from "../BaseFeatureSet.js";
import type {
  AspatialFeature,
  SpatialFeature,
  FeatureInstance,
  State,
  Move,
  Game,
  Context,
  BaseFootprint,
  TIntArrayList,
  ContainerState,
  ActiveFeaturesCache,
  MoveFeaturesKey,
} from "../BaseFeatureSet.js";
import { SPatterNet } from "./SPatterNet.js";
import { SPatterNetBitSet as BitSet } from "./SPatterNet.js";
import { BipartiteGraphFeatureInstanceSet } from "./BipartiteGraphFeatureInstanceSet.js";
import type { PropFeatureInstanceSet } from "./BipartiteGraphFeatureInstanceSet.js";

// Escape-hatch types

/** @java features.spatial.RelativeFeature */
type RelativeFeature = SpatialFeature & {
  fromPosition(): object | null;
  toPosition(): object | null;
};

/** @java features.spatial.Walk */
const Walk = null as unknown as { allGameRotations(game: Game): number[]; };

/** @java gnu.trove.list.array.TFloatArrayList */
type TFloatArrayList = { size(): number; getQuick(i: number): number; };

const TrialCtor = null as unknown as new (game: Game) => object;
const ContextCtor_ = null as unknown as new (game: Game, trial: object) => Context;
const ActiveFeaturesCacheFactory = null as unknown as { create(): ActiveFeaturesCache; };

// Map key helpers
function makeReactiveKey(key: ReactiveFeaturesKey): string {
  return `${key.playerIdx()},${key.lastFrom()},${key.lastTo()},${key.from()},${key.to()}`;
}

function makeProactiveKey(key: ProactiveFeaturesKey): string {
  return `${key.playerIdx()},${key.from()},${key.to()}`;
}

function makeMFKKey(key: MoveFeaturesKey): string {
  return `${key.playerIdx()},${key.lastFrom()},${key.lastTo()},${key.from()},${key.to()}`;
}

// Simple TIntArrayList
class SimpleTIntArrayList implements TIntArrayList {
  private data: number[] = [];
  size(): number { return this.data.length; }
  getQuick(i: number): number { return this.data[i]!; }
  add(v: number): void { this.data.push(v); }
  toArray(): number[] { return this.data.slice(); }
  contains(v: number): boolean { return this.data.includes(v); }
  iterator(): { hasNext(): boolean; next(): number } {
    let i = 0; const d = this.data;
    return { hasNext() { return i < d.length; }, next() { return d[i++]!; } };
  }
  sort(): void { this.data.sort((a, b) => a - b); }
}

function addAllToTInt(list: SimpleTIntArrayList, fastList: { toArray(): number[] }): void {
  for (const v of fastList.toArray()) list.add(v);
}

//-----------------------------------------------------------------------------

/**
 * Wrapper around a collection of maps from keys to SPatterNets or PropFeatureInstanceSets.
 *
 * @java features.feature_sets.network.JITSPatterNetFeatureSet.JITMap
 */
class JITMap {

  /** Map to prop-feature-instance-set representation */
  private readonly propInstanceSetMap: Map<string, PropFeatureInstanceSet> = new Map();

  /** Map to SPatterNet representation (without thresholding) */
  private readonly _spatterNetMap: Map<string, SPatterNet> = new Map();

  /** Map to SPatterNet representation (thresholded) */
  private readonly _spatterNetMapThresholded: Map<string, SPatterNet> = new Map();

  public constructor(private readonly featureSet: JITSPatterNetFeatureSet) {}

  /**
   * @param key
   * @param state
   * @return PropFeatureInstanceSet for given key
   * @java JITMap.propFeatureInstanceSet(MoveFeaturesKey, State)
   */
  public propFeatureInstanceSet(key: MoveFeaturesKey, state: State): PropFeatureInstanceSet | null {
    const keyStr = makeMFKKey(key);
    let set = this.propInstanceSetMap.get(keyStr);

    const isKeyReactive = (key.lastFrom() >= 0 || key.lastTo() >= 0);

    if (set === undefined && !isKeyReactive) {
      const { proactiveBipartiteGraph, reactiveGraphs } = this.buildBipartiteGraphs(key, state);

      for (const [rKey, bipartite] of reactiveGraphs) {
        this.propInstanceSetMap.set(rKey, bipartite.toPropFeatureInstanceSet());
      }

      set = proactiveBipartiteGraph.toPropFeatureInstanceSet();
      const proactiveKey = new ProactiveFeaturesKey(key as ProactiveFeaturesKey);
      this.propInstanceSetMap.set(makeMFKKey(proactiveKey), set);
    }

    return set ?? null;
  }

  /**
   * @param key
   * @param state
   * @return SPatterNet for given key
   * @java JITMap.spatterNet(MoveFeaturesKey, State)
   */
  public spatterNet(key: MoveFeaturesKey, state: State): SPatterNet | null {
    const keyStr = makeMFKKey(key);
    let net = this._spatterNetMap.get(keyStr);

    const isKeyReactive = (key.lastFrom() >= 0 || key.lastTo() >= 0);

    if (net === undefined && !isKeyReactive) {
      const { proactiveBipartiteGraph, reactiveGraphs } = this.buildBipartiteGraphs(key, state);
      const game = this.featureSet.gameRef()?.deref()!;

      for (const [rKey, bipartite] of reactiveGraphs) {
        this._spatterNetMap.set(rKey,
          bipartite.toSPatterNet(this.featureSet.getNumSpatialFeatures(), new BitSet(), game, key.playerIdx())
        );
      }

      if (isKeyReactive) {
        net = this._spatterNetMap.get(keyStr) ?? undefined;
      } else {
        net = proactiveBipartiteGraph.toSPatterNet(this.featureSet.getNumSpatialFeatures(), new BitSet(), game, key.playerIdx());
        const proactiveKey = new ProactiveFeaturesKey(key as ProactiveFeaturesKey);
        this._spatterNetMap.set(makeMFKKey(proactiveKey), net);
      }
    }

    return net ?? null;
  }

  /**
   * @param key
   * @param state
   * @return SPatterNet (with thresholding) for given key
   * @java JITMap.spatterNetThresholded(MoveFeaturesKey, State)
   */
  public spatterNetThresholded(key: MoveFeaturesKey, state: State): SPatterNet | null {
    const keyStr = makeMFKKey(key);
    let net = this._spatterNetMapThresholded.get(keyStr);

    const isKeyReactive = (key.lastFrom() >= 0 || key.lastTo() >= 0);

    if (net === undefined && !isKeyReactive) {
      const { proactiveBipartiteGraph, reactiveGraphs } = this.buildBipartiteGraphs(key, state);
      const game = this.featureSet.gameRef()?.deref()!;
      const thresholded = this.featureSet.thresholdedFeatures ?? new BitSet();

      for (const [rKey, bipartite] of reactiveGraphs) {
        this._spatterNetMap.set(rKey,
          bipartite.toSPatterNet(this.featureSet.getNumSpatialFeatures(), new BitSet(), game, key.playerIdx())
        );
      }

      if (isKeyReactive) {
        net = this._spatterNetMapThresholded.get(keyStr) ?? undefined;
      } else {
        net = proactiveBipartiteGraph.toSPatterNet(this.featureSet.getNumSpatialFeatures(), thresholded, game, key.playerIdx());
        const proactiveKey = new ProactiveFeaturesKey(key as ProactiveFeaturesKey);
        this._spatterNetMapThresholded.set(makeMFKKey(proactiveKey), net);
      }
    }

    return net ?? null;
  }

  /**
   * Shared logic for building bipartite graphs (for all three JIT methods).
   */
  private buildBipartiteGraphs(
    key: MoveFeaturesKey,
    state: State
  ): {
    proactiveBipartiteGraph: BipartiteGraphFeatureInstanceSet;
    reactiveGraphs: Map<string, BipartiteGraphFeatureInstanceSet>;
  } {
    const proactiveBipartiteGraph = new BipartiteGraphFeatureInstanceSet();
    const reactiveGraphs: Map<string, BipartiteGraphFeatureInstanceSet> = new Map();
    const game = this.featureSet.gameRef()?.deref()!;

    for (const feature of this.featureSet.spatialFeaturesArr()) {
      const relFeature = feature as RelativeFeature;
      const newInstances: FeatureInstance[] = [];

      if (
        key.from() >= 0 &&
        relFeature.fromPosition() !== null &&
        ((key.to() >= 0) === (relFeature.toPosition() !== null))
      ) {
        newInstances.push(...feature.instantiateFeature(
          game,
          (state as unknown as { containerStates(): ContainerState[] }).containerStates()[0] as ContainerState,
          (state as unknown as { mover(): number }).mover(),
          key.from(),
          key.from(),
          key.to(),
          -1,
          -1
        ));
      }

      if (
        key.to() >= 0 &&
        relFeature.toPosition() !== null &&
        ((key.from() >= 0) === (relFeature.fromPosition() !== null))
      ) {
        newInstances.push(...feature.instantiateFeature(
          game,
          (state as unknown as { containerStates(): ContainerState[] }).containerStates()[0] as ContainerState,
          (state as unknown as { mover(): number }).mover(),
          key.to(),
          key.from(),
          key.to(),
          -1,
          -1
        ));
      }

      if (feature.isReactive()) {
        const reactiveKey = new ReactiveFeaturesKey();

        for (const instance of newInstances) {
          reactiveKey.resetData(key.playerIdx(), instance.lastFrom(), instance.lastTo(), key.from(), key.to());
          const rKeyStr = makeReactiveKey(reactiveKey);
          let bipartite = reactiveGraphs.get(rKeyStr);

          if (bipartite === undefined) {
            bipartite = new BipartiteGraphFeatureInstanceSet();
            reactiveGraphs.set(makeReactiveKey(new ReactiveFeaturesKey(reactiveKey)), bipartite);
          }

          bipartite.insertInstance(instance);
        }
      } else {
        for (const instance of newInstances) {
          proactiveBipartiteGraph.insertInstance(instance);
        }
      }
    }

    return { proactiveBipartiteGraph, reactiveGraphs };
  }

  /**
   * @return Map of SPatterNets
   * @java JITMap.spatterNetMap()
   */
  public spatterNetMap(): Map<string, SPatterNet> {
    return this._spatterNetMap;
  }

  /**
   * @return Map of SPatterNets (thresholded)
   * @java JITMap.spatterNetMapThresholded()
   */
  public spatterNetMapThresholded(): Map<string, SPatterNet> {
    return this._spatterNetMapThresholded;
  }
}

//-----------------------------------------------------------------------------

/**
 * Wrapper around a list of aspatial and spatial features for cache keying.
 *
 * @java features.feature_sets.network.JITSPatterNetFeatureSet.FeatureLists
 */
class FeatureLists {
  public readonly aspatialFeatures: AspatialFeature[];
  public readonly spatialFeatures: SpatialFeature[];

  public constructor(aspatialFeatures: AspatialFeature[], spatialFeatures: SpatialFeature[]) {
    this.aspatialFeatures = aspatialFeatures;
    this.spatialFeatures = spatialFeatures;
  }

  public hashCode(): number {
    let h = 17;
    for (const f of this.aspatialFeatures) h = (31 * h + ((f as unknown as { hashCode(): number } | null)?.hashCode() ?? 0)) | 0;
    for (const f of this.spatialFeatures) h = (31 * h + ((f as unknown as { hashCode(): number } | null)?.hashCode() ?? 0)) | 0;
    return h;
  }

  public equals(other: FeatureLists): boolean {
    if (this.aspatialFeatures.length !== other.aspatialFeatures.length) return false;
    if (this.spatialFeatures.length !== other.spatialFeatures.length) return false;
    for (let i = 0; i < this.aspatialFeatures.length; ++i) {
      if (this.aspatialFeatures[i] !== other.aspatialFeatures[i]) return false;
    }
    for (let i = 0; i < this.spatialFeatures.length; ++i) {
      if (!this.spatialFeatures[i]!.equals(other.spatialFeatures[i]!)) return false;
    }
    return true;
  }
}

//-----------------------------------------------------------------------------

/**
 * Implementation of Feature Set based on SPatterNets, with JIT construction.
 *
 * @java features.feature_sets.network.JITSPatterNetFeatureSet
 */
export class JITSPatterNetFeatureSet extends BaseFeatureSet {

  //-------------------------------------------------------------------------

  /**
   * If set to true, we allow for the use of a Feature Set cache.
   * @java JITSPatterNetFeatureSet.ALLOW_FEATURE_SET_CACHE
   */
  public static ALLOW_FEATURE_SET_CACHE: boolean = false;

  /** Cache of feature set objects */
  protected static readonly featureSetsCache: Map<string, JITSPatterNetFeatureSet> = new Map();

  //-------------------------------------------------------------------------

  /** JIT map (mix of proactive and reactive keys) */
  protected jitMap: JITMap | null = null;

  /** Cache with indices of active proactive features previously computed */
  protected activeProactiveFeaturesCache: ActiveFeaturesCache | null = null;

  /** Bitset of features that should be thresholded based on their absolute weights */
  public thresholdedFeatures: BitSet | null = null;

  //-------------------------------------------------------------------------

  /**
   * Clear the entire cache of feature set objects.
   * @java JITSPatterNetFeatureSet.clearFeatureSetCache()
   */
  public static clearFeatureSetCache(): void {
    JITSPatterNetFeatureSet.featureSetsCache.clear();
  }

  /**
   * Construct feature set from list of features.
   * @java JITSPatterNetFeatureSet.construct(List<Feature>)
   */
  public static constructFromFeatures(features: (AspatialFeature | SpatialFeature)[]): JITSPatterNetFeatureSet {
    const aspatials: AspatialFeature[] = [];
    const spatials: SpatialFeature[] = [];

    for (const f of features) {
      if ((f as AspatialFeature).featureVal !== undefined)
        aspatials.push(f as AspatialFeature);
      else
        spatials.push(f as SpatialFeature);
    }

    return JITSPatterNetFeatureSet.construct(aspatials, spatials);
  }

  /**
   * Construct feature set from lists of features.
   * @java JITSPatterNetFeatureSet.construct(List<AspatialFeature>, List<SpatialFeature>)
   */
  public static construct(
    aspatialFeatures: AspatialFeature[],
    spatialFeatures: SpatialFeature[]
  ): JITSPatterNetFeatureSet {
    if (JITSPatterNetFeatureSet.ALLOW_FEATURE_SET_CACHE) {
      const key = new FeatureLists(aspatialFeatures, spatialFeatures);
      const keyStr = String(key.hashCode());
      const cached = JITSPatterNetFeatureSet.featureSetsCache.get(keyStr);

      if (cached !== undefined) return cached;

      const newSet = new JITSPatterNetFeatureSet(aspatialFeatures, spatialFeatures);
      JITSPatterNetFeatureSet.featureSetsCache.set(keyStr, newSet);
      return newSet;
    }

    return new JITSPatterNetFeatureSet(aspatialFeatures, spatialFeatures);
  }

  /**
   * Loads a feature set from a given filename.
   * @java JITSPatterNetFeatureSet.construct(String)
   */
  public static constructFromFile(_filename: string): JITSPatterNetFeatureSet {
    // File I/O not available in TS context; return empty
    return new JITSPatterNetFeatureSet([], []);
  }

  /**
   * Private constructor.
   * @java JITSPatterNetFeatureSet(List<AspatialFeature>, List<SpatialFeature>)
   */
  private constructor(
    aspatialFeatures: AspatialFeature[],
    spatialFeatures: SpatialFeature[]
  ) {
    super();
    this.spatialFeatures = new Array(spatialFeatures.length);
    for (let i = 0; i < this.spatialFeatures.length; ++i) {
      this.spatialFeatures[i] = spatialFeatures[i]!;
      this.spatialFeatures[i]!.setSpatialFeatureSetIndex(i);
    }
    this.aspatialFeatures = aspatialFeatures.slice();
    this.jitMap = null;
  }

  //-------------------------------------------------------------------------

  /**
   * @java JITSPatterNetFeatureSet.instantiateFeatures(int[])
   */
  protected override instantiateFeatures(supportedPlayers: number[]): void {
    this.activeProactiveFeaturesCache = ActiveFeaturesCacheFactory.create();

    this.thresholdedFeatures = new BitSet();
    if (this.spatialFeatureInitWeights !== null) {
      for (let i = this.spatialFeatures.length - 1; i >= 0; --i) {
        if (Math.abs(this.spatialFeatureInitWeights.get(i)) < BaseFeatureSet.SPATIAL_FEATURE_WEIGHT_THRESHOLD)
          this.thresholdedFeatures.set(i);
      }
    }

    this.jitMap = new JITMap(this);

    // JIT warm-up using short dummy trials
    const game = this.game?.deref()!;
    const trial = new TrialCtor(game);
    const jitContext = new ContextCtor_(game, trial);

    for (let i = 0; i < 3; ++i) {
      (game as unknown as { start(ctx: Context): void }).start(jitContext);

      for (let j = 0; j < 10; ++j) {
        if ((jitContext.trial() as unknown as { over(): boolean }).over()) break;

        const moves = (game as unknown as { moves(ctx: Context): { moves(): Move[] } }).moves(jitContext).moves();
        for (const move of moves) {
          const mover = move.mover();
          if (supportedPlayers.includes(mover)) {
            const thresholding = (this.spatialFeatureInitWeights !== null);
            this.computeFeatureVector(jitContext, move, thresholding);
          }
        }

        (jitContext as unknown as { model(): { startNewStep(ctx: Context, ais: null, sec: number): void } })
          .model().startNewStep(jitContext, null, 0.1);
      }
    }
  }

  /**
   * @java JITSPatterNetFeatureSet.closeCache()
   */
  public override closeCache(): void {
    this.activeProactiveFeaturesCache?.close();
  }

  //-------------------------------------------------------------------------

  /**
   * @java JITSPatterNetFeatureSet.getActiveSpatialFeatureIndices(State, int, int, int, int, int, boolean)
   */
  public override getActiveSpatialFeatureIndices(
    state: State,
    lastFrom: number,
    lastTo: number,
    from: number,
    to: number,
    player: number,
    thresholded: boolean
  ): TIntArrayList {
    const featureIndices = new SimpleTIntArrayList();

    const froms = from >= 0 ? [-1, from] : [-1];
    const tos = to >= 0 ? [-1, to] : [-1];
    const lastFroms = lastFrom >= 0 ? [-1, lastFrom] : [-1];
    const lastTos = lastTo >= 0 ? [-1, lastTo] : [-1];

    let cachedActiveFeatureIndices: number[] | null = null;
    if (thresholded) {
      cachedActiveFeatureIndices = this.activeProactiveFeaturesCache!.getCachedActiveFeatures(
        this, state, from, to, player
      );
    }

    if (cachedActiveFeatureIndices !== null) {
      for (const v of cachedActiveFeatureIndices) featureIndices.add(v);
    } else {
      const key = new ProactiveFeaturesKey();

      for (const fromPos of froms) {
        for (const toPos of tos) {
          if (toPos >= 0 || fromPos >= 0) {
            key.resetData(player, fromPos, toPos);
            const set = thresholded
              ? this.jitMap!.spatterNetThresholded(key, state)
              : this.jitMap!.spatterNet(key, state);
            if (set !== null) addAllToTInt(featureIndices, set.getActiveFeatures(state));
          }
        }
      }

      if (thresholded && featureIndices.size() > 0) {
        this.activeProactiveFeaturesCache!.cache(state, from, to, featureIndices.toArray(), player);
      }
    }

    const reactiveKey = new ReactiveFeaturesKey();

    for (const lastFromPos of lastFroms) {
      for (const lastToPos of lastTos) {
        if (lastToPos >= 0 || lastFromPos >= 0) {
          for (const fromPos of froms) {
            for (const toPos of tos) {
              if (toPos >= 0 || fromPos >= 0) {
                reactiveKey.resetData(player, lastFromPos, lastToPos, fromPos, toPos);
                const set = this.jitMap!.spatterNet(reactiveKey, state);
                if (set !== null) addAllToTInt(featureIndices, set.getActiveFeatures(state));
              }
            }
          }
        }
      }
    }

    return featureIndices as unknown as TIntArrayList;
  }

  /**
   * @java JITSPatterNetFeatureSet.getActiveSpatialFeatureInstances(State, int, int, int, int, int)
   */
  public override getActiveSpatialFeatureInstances(
    state: State,
    lastFrom: number,
    lastTo: number,
    from: number,
    to: number,
    player: number
  ): FeatureInstance[] {
    const instances: FeatureInstance[] = [];

    const froms = from >= 0 ? [-1, from] : [-1];
    const tos = to >= 0 ? [-1, to] : [-1];
    const lastFroms = lastFrom >= 0 ? [-1, lastFrom] : [-1];
    const lastTos = lastTo >= 0 ? [-1, lastTo] : [-1];

    const key = new ProactiveFeaturesKey();
    for (const fromPos of froms) {
      for (const toPos of tos) {
        if (toPos >= 0 || fromPos >= 0) {
          key.resetData(player, fromPos, toPos);
          const set = this.jitMap!.propFeatureInstanceSet(key, state);
          if (set !== null) instances.push(...set.getActiveInstances(state));
        }
      }
    }

    const reactiveKey = new ReactiveFeaturesKey();

    for (const lastFromPos of lastFroms) {
      for (const lastToPos of lastTos) {
        if (lastToPos >= 0 || lastFromPos >= 0) {
          for (const fromPos of froms) {
            for (const toPos of tos) {
              if (toPos >= 0 || fromPos >= 0) {
                reactiveKey.resetData(player, lastFromPos, lastToPos, fromPos, toPos);
                const set = this.jitMap!.propFeatureInstanceSet(reactiveKey, state);
                if (set !== null) instances.push(...set.getActiveInstances(state));
              }
            }
          }
        }
      }
    }

    return instances;
  }

  //-------------------------------------------------------------------------

  /**
   * @java JITSPatterNetFeatureSet.generateFootprint(State, int, int, int)
   */
  public override generateFootprint(
    state: State,
    from: number,
    to: number,
    player: number
  ): BaseFootprint {
    const container = (state as unknown as { containerStates(): ContainerState[] }).containerStates()[0]!;

    const key = new ProactiveFeaturesKey();
    key.resetData(player, from, to);
    let set = this.jitMap!.spatterNetThresholded(key, state);

    if (set === null) {
      set = new SPatterNet([], [], [], [], [], [], new BitSet(), [], [], [], []);
    }

    const footprint = set.generateFootprint(container);

    if (from >= 0) {
      key.resetData(player, from, -1);
      const fromSet = this.jitMap!.spatterNetThresholded(key, state);
      if (fromSet !== null) footprint.union(fromSet.generateFootprint(container));

      key.resetData(player, -1, to);
      const toSet = this.jitMap!.spatterNetThresholded(key, state);
      if (toSet !== null) footprint.union(toSet.generateFootprint(container));
    }

    return footprint;
  }

  //-------------------------------------------------------------------------

  /**
   * @java JITSPatterNetFeatureSet.createExpandedFeatureSet(Game, SpatialFeature)
   */
  public override createExpandedFeatureSet(
    targetGame: Game,
    newFeature: SpatialFeature
  ): JITSPatterNetFeatureSet | null {
    let featureAlreadyExists = false;

    for (const oldFeature of this.spatialFeatures) {
      if (newFeature.equals(oldFeature)) {
        featureAlreadyExists = true;
        break;
      }

      let allowedRotations: TFloatArrayList | null = newFeature.pattern().allowedRotations();
      if (allowedRotations === null) {
        const rots = Walk.allGameRotations(targetGame);
        allowedRotations = { size: () => rots.length, getQuick: (i: number) => rots[i]! };
      }

      const allowedRotationsNN = allowedRotations;
      for (let i = 0; i < allowedRotationsNN.size(); ++i) {
        const rotatedCopy = newFeature.rotatedCopy(allowedRotationsNN.getQuick(i));
        if (rotatedCopy.equals(oldFeature)) {
          featureAlreadyExists = true;
          break;
        }
      }

      if (featureAlreadyExists) break;
    }

    if (!featureAlreadyExists) {
      const newFeatureList: SpatialFeature[] = [...this.spatialFeatures, newFeature];
      return new JITSPatterNetFeatureSet(this.aspatialFeatures.slice(), newFeatureList);
    }

    return null;
  }

  //-------------------------------------------------------------------------

  /**
   * @return Map of SPatterNets for reactive as well as proactive features
   * @java JITSPatterNetFeatureSet.spatterNetMap()
   */
  public spatterNetMap(): Map<string, SPatterNet> | null {
    return this.jitMap?.spatterNetMap() ?? null;
  }

  /**
   * @return Map of SPatterNets for reactive as well as proactive features (thresholded)
   * @java JITSPatterNetFeatureSet.spatterNetMapThresholded()
   */
  public spatterNetMapThresholded(): Map<string, SPatterNet> | null {
    return this.jitMap?.spatterNetMapThresholded() ?? null;
  }

  //-------------------------------------------------------------------------
}
